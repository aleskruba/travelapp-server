const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { promisify } = require('util');
const redis = require('redis');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

let redisClient = redis.createClient({
        //host: '127.0.0.1',
    // host: process.env.REDIS_URL ,
    host:'red-cq0mg1iju9rs73avmd4g',
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
        const existingUser = await prisma.user.findUnique({
            where: { email: email }
        });
    
        if (existingUser) {
            return res.status(401).json({error:'Email je již zaregistrován'});
        }


        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Hesla musí být stejná' });
        }

        
        if (password.length < 8) {
            return res.status(400).json({ error: 'Heslo musí obsahovat alespoň 8 znaků' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

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



module.exports.googleSignup_post = async (req, res) => {
    const { email, name, profilePicture } = req.body;

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email: email }
        });
    
        if (existingUser) {

            return res.status(401).json({error:'Email je již zaregistrován'});
        }

        const newUser = await prisma.user.create({
            data: {
              email: email,
              firstName: name,
              image: profilePicture,
              googleEmail: email,
              googleName: name,
              googleProfilePicture: profilePicture,
            },
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
                email: newUser.email,
                firstName: newUser.firstName,
                image: newUser.image
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
        const user = await prisma.user.findUnique({
            where: { email: email }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

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
                message: 'Přihlášní proběhlo úspěšně',
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


module.exports.googleLogin_post = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { email: email }
        });

        if (!user) {
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

   
        const sessionId = uuidv4();

        // Store the session ID in Redis with an expiration time
        await setAsync(`session:${sessionId}`, JSON.stringify(user), 'EX', 86400); // Expire in 1 day (86400 seconds)

            res.cookie('sessionID', sessionId, {
                httpOnly: true,
                maxAge: 5 * 24 * 60 * 60 * 1000,
                secure: true,
                sameSite: 'none'
            });

            res.status(200).json({
                message: 'Přihlášní proběhlo úspěšně',
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


module.exports.sendEmail = async (req, res) => {
    const { email } = req.body;
    const resetUrl = req.resetUrl;
    const reset_token_hash = req.reset_token_hash;
    const reset_token_expires_at = req.reset_token_expires_at;

    console.log('token', reset_token_hash);
    console.log('expires_at', reset_token_expires_at);

    try {
        let transporter = nodemailer.createTransport({
            host: process.env.EMAILHOST,
            port: process.env.EMAILPORT,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAILUSER,
                pass: process.env.EMAILPASSWORD,
            },
        });

        let mailOptions = {
            from: process.env.EMAILUSER,
            to: email,
            subject: 'TEST ZAPOMENUTÉHO HESLA',
            text: `${email}, NOVÝ KÓD }`,
            html: `<b>Click on this link</b> <a href='${resetUrl}'>${resetUrl}</a>`, // html body
        };

        transporter.sendMail(mailOptions, async (error, info) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ error: 'Email sending failed' });
            } else {
                console.log('Email sent:', info.response);
                try {
                    await prisma.user.update({
                        where: { email: email },
                        data: {
                            reset_token_hash: reset_token_hash,
                            reset_token_expires_at: new Date(reset_token_expires_at)
                        }
                    });
                    res.status(201).json({ message: 'Email sent successfully!' });
                } catch (e) {
                    console.log(e);
                    res.status(500).json({ error: 'Failed to update user data' });
                }
            }
        });

    } catch (err) {
        console.error('Error sending email:', err);
        res.status(500).json({ error: 'Server error' });
    }
};


module.exports.verifyToken = async (req, res) => {

    const token = req.body.token;
    const hashedToken	 = crypto.createHash("sha256").update(token).digest('hex');

    try {
           const existingUser = await prisma.user.findFirst({
            where: { 
                reset_token_hash: hashedToken,
                reset_token_expires_at: {
                    gt: new Date() 
                }
            }
        });


        if (existingUser) {
           
            res.status(200).json({
                message: 'Login successful',
                user: existingUser.id
            });
        

        } else {
            res.status(404).json({ error: 'vypršel platnost tokenu nebo špatné heslo' });
        }
    } catch (error) {
        console.error('Authentication Error:', error);
        return res.status(500).send({ error: "Authentication Error" });
    }
}


module.exports.resetPassword = async (req, res) => {
    const { password, confirmPassword, userId } = req.body;

    try {
        // Check if the user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            return res.status(401).json({ error: 'špatné id' });
        }

        // Validate password and confirmPassword
        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Hesla musí být stejná' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Heslo musí obsahovat alespoň 8 znaků' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the user in the database
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                registrationDate: new Date(),
                reset_token_hash: null,
                reset_token_expires_at: null
            }
        });

        const sessionId = uuidv4();

        // Store the session ID in Redis with an expiration time
        await setAsync(`session:${sessionId}`, JSON.stringify(updatedUser), 'EX', 86400); // Expire in 1 day (86400 seconds)

        res.cookie('sessionID', sessionId, {
            httpOnly: true,
            maxAge: 5 * 24 * 60 * 60 * 1000, // 5 days
            secure: true,
            sameSite: 'none'
        });

        const userData = {
            id: updatedUser.id,
            email: updatedUser.email
        };

        res.status(200).json({
            message: 'Heslo bylo úspěšně resetováno',
            user: userData
        });

    } catch (err) {
        console.error('Error resetting password:', err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        // Disconnect Prisma Client at the end
        await prisma.$disconnect();
    }
};