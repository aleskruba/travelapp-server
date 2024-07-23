
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');
const redis = require('redis');
const { promisify } = require('util');

let redisClient = redis.createClient({
  // host: '127.0.0.1',
  host:'red-cq0mg1iju9rs73avmd4g', 
  port: 6379,
});



/* if (process.env.NODE_ENV === 'production') {
    redisClient = redis.createClient(process.env.REDIS_URL);
} else {
    redisClient = redis.createClient(process.env.REDIS_URL_DEVELOPMENT);
} */

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


module.exports = {verifySession,checkAlreadyLoggedIn,verifyUser};