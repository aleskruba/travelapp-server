const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { promisify } = require('util');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { redisClient } = require('../redis.js')


const setAsync = promisify(redisClient.set).bind(redisClient);
const delAsync = promisify(redisClient.del).bind(redisClient);
const getAsync = promisify(redisClient.get).bind(redisClient);

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

    try {

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
        catch(e) {
            console.error(e);
        }
    
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

    //    const sessionId = uuidv4();

        // Store the session ID in Redis with an expiration time
/*         await setAsync(`session:${sessionId}`, JSON.stringify(updatedUser), 'EX', 86400); // Expire in 1 day (86400 seconds)

        res.cookie('sessionID', sessionId, {
            httpOnly: true,
            maxAge: 5 * 24 * 60 * 60 * 1000, // 5 days
            secure: true,
            sameSite: 'none'
        });

        const userData = {
            id: updatedUser.id,
            email: updatedUser.email
        }; */

        res.status(200).json({
            message: 'Heslo bylo úspěšně resetováno',
            user: updatedUser
        });

    } catch (err) {
        console.error('Error resetting password:', err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        // Disconnect Prisma Client at the end
        await prisma.$disconnect();
    }
};



module.exports.uploadprofileimage = async (req, res, next) => {
    const user =req.user
    const userId = user.id

    const base64String = req.body.image; // Accessing the base64 string from req.body

    try {


         const cloudinaryUrl = process.env.PUBLIC_CLOUDINARY_URL;

        if (!cloudinaryUrl) {
            console.error("Cloudinary URL is not defined!");
            return res.status(500).json({ error: 'Cloudinary URL is not defined' });
        }

        if (!base64String) {
            console.error('No image selected for upload');
            return res.status(400).json({ error: 'No image selected for upload' });
        }

        const cloudinaryUploadResponse = await fetch(cloudinaryUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                file: base64String,
                upload_preset: 'schoolapp'
            })
        });
        
        const cloudinaryResponseData = await cloudinaryUploadResponse.json();
        const imageUrl = cloudinaryResponseData.secure_url;

        try {
            const resp = await prisma.user.update({
                where: {
                    id: userId
                },
                data: {
                    image: imageUrl
                }
            });
        
            const sessionId = req.cookies.sessionID;
            if (!sessionId) {
                return res.status(400).json({ error: 'No session ID found' });
            }
    
            // Update session data in Redis
            const sessionData = await getAsync(`session:${sessionId}`);
            if (!sessionData) {
                return res.status(400).json({ error: 'Session not found' });
            }
            
            const session = JSON.parse(sessionData);
            session.image = imageUrl;
            await setAsync(`session:${sessionId}`, JSON.stringify(session));

        } catch (error) {
            console.error('Error during uploading image:', error);
        }


        res.status(201).json({ imageUrl      });
    } catch (error) {
        console.error('Error during uploading image:', error);
        res.status(500).json({ error: 'Server error' });
    }
}



module.exports.updateprofile = async (req, res, next) => {
    const sessionUser = req.user;
    const userId = sessionUser.id;
    const { username, firstName, lastName, email } = req.body;

    try {
        // Update user profile in the database
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                username,
                firstName,
                lastName,
                email,
            },
        });

    
        const sessionId = req.cookies.sessionID;
        if (!sessionId) {
            return res.status(400).json({ error: 'No session ID found' });
        }

        // Update session data in Redis
        const sessionData = await getAsync(`session:${sessionId}`);
        if (!sessionData) {
            return res.status(400).json({ error: 'Session not found' });
        }
        
        const session = JSON.parse(sessionData);
        console.log('session',session)
          session.username = username;
          session.firstName = firstName;
          session.lastName = lastName;
          session.email = email;
        await setAsync(`session:${sessionId}`, JSON.stringify(session));

        res.status(201).json({ updatedUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};




module.exports.updatePassword = async (req, res, next) => {
    const sessionUser = req.user;
    const userId = sessionUser.id;
    const { password, confirmPassword } = req.body;

    console.log('password, confirmPassword ',password, confirmPassword )

    console.log(password, confirmPassword )
    if (password !== confirmPassword) {
        return res.status(401).json({ error: 'Hesla nejsou stejná ' });
    }

    if (password.trim().length < 8 || password.trim().length > 50) {
        return res.status(400).json({ error: 'Heslo musí mít 8 až 50 znaků' });
    }

    try {
        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);
        const passwordUpdatedAt = new Date();

        // Update the user's password and the timestamp in the database
        await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                passwordUpdatedAt: passwordUpdatedAt,
            },
        });


        return res.status(201).json({ message: "ok" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

