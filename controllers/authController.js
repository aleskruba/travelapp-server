const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const session = require('express-session');



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
    console.log(email, password,confirmPassword)

    try {
        // Check if the email is already registered
        const existingUser = await prisma.user.findUnique({
            where: { email: email }
        });
        console.log('existingUser',existingUser)
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
   
        res.status(201).json({
            message: 'Registrace proběhla úspěšně',
            data:newUser
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
    const data = req.body;

    console.log(data);

    try {
/*         const users = await database.query('SELECT * FROM user WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const user = users[0];
        
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
 */
   
        res.status(201).json({
            message: 'Příhlášení proběhlo úspěšně',
            data:data
        });

    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).json({ error: 'Server error' });
    }
};



module.exports.logout = async (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Failed to logout' });
        }
        res.clearCookie('connect.sid'); // Optional: clear the session cookie
        res.status(200).json({ message: 'Logout successful' });
    });
};