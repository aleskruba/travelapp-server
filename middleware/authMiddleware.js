
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');
const { promisify } = require('util');
const { redisClient } = require('../redis.js')



redisClient.on('error', (err) => {
    console.error('Redis error:', err);
});
  
const getAsync = promisify(redisClient.get).bind(redisClient);


const verifySession = async (req, res, next) => {

    try {
      const sessionId = req.cookies.sessionID;

  
      if (!sessionId) {
        return res.status(401).json({ error: 'No session found' });
      }
  
      // Retrieve session data from Redis
      const sessionData = await getAsync(`session:${sessionId}`);
  
      if (!sessionData) {
        return res.status(401).json({ error: 'Session expired or not found' });
      }
  
      // Parse session data
      const session = JSON.parse(sessionData);
      req.user = session;
   

      next();
    } catch (error) {
      console.error('Error retrieving session:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };

const checkAlreadyLoggedIn = async (req, res, next) => {
    try {
        const sessionId = req.cookies.sessionID;

        if (sessionId) {
            // Check if the session ID exists in Redis
            const sessionData = await getAsync(`session:${sessionId}`);

            if (sessionData) {
                // User is already logged in
                return res.status(403).json({ error: 'User already logged in' });
            }
        }

        // Proceed to the next middleware or route handler if no session found
        next();
    } catch (error) {
        console.error('Error checking session:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


async function verifyUser(req, res, next) {
    const { email } = req.body;
    try {
        const existingUser = await prisma.user.findUnique({
            where: { email: email }
        });

        if (existingUser) {
           
            const resetToken = crypto.randomBytes(20).toString('hex');
            const reset_token_hash	 = crypto.createHash("sha256").update(resetToken).digest('hex');
           
            const reset_token_expires_at = Date.now() + 3600000;

            existingUser.reset_token_hash = reset_token_hash
            existingUser.reset_token_expires_at = reset_token_expires_at

            const resetUrl =` http://localhost:3000/resetpassword?token=${resetToken}`

            req.reset_token_hash = reset_token_hash;
            req.reset_token_expires_at = reset_token_expires_at;
            req.resetUrl = resetUrl;
            req.email = email;
            next();
        } else {
            console.log('User not found in the database');
            return res.status(404).send({ error: "Email nenalezen" });
        }
    } catch (error) {
        console.error('Authentication Error:', error);
        return res.status(500).send({ error: "Authentication Error" });
    }
}

const isAdmin = (req, res, next) => {
    // Ensure user is authenticated with verifySession
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }
  
    // Check if user has isAdmin privileges
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied: Admins only' });
    }
  
    next(); // Proceed if the user is an admin
  };

  
module.exports = {verifySession,checkAlreadyLoggedIn,verifyUser,isAdmin};