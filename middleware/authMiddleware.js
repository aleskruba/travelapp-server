
const dotenv = require('dotenv');
const redis = require('redis');
const { promisify } = require('util');

let redisClient = redis.createClient({
    //host: '127.0.0.1',
    host: 'redis://red-cq0mg1iju9rs73avmd4g',
    port: 6379,
});



if (process.env.NODE_ENV === 'production') {
    redisClient = redis.createClient(process.env.REDIS_URL);
} else {
    redisClient = redis.createClient(process.env.REDIS_URL_DEVELOPMENT);
}

redisClient.on('error', (err) => {
    console.error('Redis error:', err);
});
  
const getAsync = promisify(redisClient.get).bind(redisClient);


const verifySession = async (req, res, next) => {
    try {
        const sessionId = req.cookies.sessionID;
  
        if (!sessionId) {
            return res.send('No session found');
        }
  
        // Retrieve session data from Redis
        const sessionData = await getAsync(`session:${sessionId}`);
  
        if (!sessionData) {
            return res.send('Session expired or not found');
        }
  
        // Parse session data
        const session = JSON.parse(sessionData);
        req.user = session;

         next();
    } catch (error) {
        console.error('Error retrieving session:', error);
        res.status(500).send('Server error');
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

module.exports = {verifySession,checkAlreadyLoggedIn};