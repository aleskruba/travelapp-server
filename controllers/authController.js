const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { promisify } = require('util');
const redis = require('redis');


let redisClient = redis.createClient({
        //host: '127.0.0.1',
    host: process.env.REDIS_URL ,
    port: 6379,

});


const setAsync = promisify(redisClient.set).bind(redisClient);
const delAsync = promisify(redisClient.del).bind(redisClient);

module.exports.checkSession = (req, res, next) => {
    const user = req.user;

    try {
      const userData = {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        image: user.image
    };
        return res.status(200).json({user: userData} );
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
};


module.exports.getUsers = async (req, res) => {


    async function main() {
        // Example: Fetch all users
        const allUsers = await prisma.user.findMany();
        res.send(allUsers);
      }
      
      main()
        .catch(e => {
          throw e;
        })
        .finally(async () => {
          await prisma.$disconnect();
        });

}

module.exports.signup_post = async (req, res) => {
    const { email, password, confirmPassword } = req.body;
 

    try {
        // Check if the email is already registered
        const existingUser = await prisma.user.findUnique({
            where: { email: email }
        });
    
        if (existingUser) {
            return res.status(401).json({error:'Email je již zaregistrován'});
        }

        // Validate password and confirmPassword
        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Hesla musí být stejná' });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user in the database
        const newUser = await prisma.user.create({
            data: {
                email: email,
                password: hashedPassword,
                registrationDate: new Date()
            }
        });
   
        const sessionId = uuidv4();

        // Store the session ID in Redis with an expiration time
        await setAsync(`session:${sessionId}`, JSON.stringify(newUser), 'EX', 86400); // Expire in 1 day (86400 seconds)

          //  res.cookie('sessionID', sessionId, { maxAge: 86400 * 1000, httpOnly: true });

            res.cookie('sessionID', sessionId, {
                httpOnly: true,
                maxAge: 5 * 24 * 60 * 60 * 1000,
                secure: true,
                sameSite: 'none'
            });

            const userData = {
                id: newUser.id,
                email: newUser.email
            };

            res.status(200).json({
                message: 'Register successful',
                user: userData
            });

    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        // Disconnect Prisma Client at the end
        await prisma.$disconnect();
    }
};



module.exports.login_post = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the user exists
        const user = await prisma.user.findUnique({
            where: { email: email }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Validate the password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const userData = {
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            image: user.image
        };

        // Generate a unique session ID
        const sessionId = uuidv4();

        // Store the session ID in Redis with an expiration time
        await setAsync(`session:${sessionId}`, JSON.stringify(user), 'EX', 86400); // Expire in 1 day (86400 seconds)

          //  res.cookie('sessionID', sessionId, { maxAge: 86400 * 1000, httpOnly: true });

            res.cookie('sessionID', sessionId, {
                httpOnly: true,
                maxAge: 5 * 24 * 60 * 60 * 1000,
                secure: true,
                sameSite: 'none'
            });

            res.status(200).json({
                message: 'Login successful',
                user: userData
            });

    } catch (err) {
        console.error('Error logging in user:', err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        // Disconnect Prisma Client at the end
        await prisma.$disconnect();
    }
};


module.exports.logout = async (req, res) => {
    try {
        const sessionId = req.cookies.sessionID;

        if (!sessionId) {
            return res.status(400).json({ error: 'No session found' });
        }

        // Delete the session from Redis
        await delAsync(`session:${sessionId}`);

        // Clear the cookie
        res.clearCookie('sessionID', {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        });

        res.status(200).json({ message: 'Uspěšné odhlášení' });
    } catch (error) {
        console.error('Error logging out user:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


