const { Router } = require('express');
const authController = require('../controllers/authController');
const { verifySession,checkAlreadyLoggedIn,verifyUser} = require('../middleware/authMiddleware');

const router = Router();

router.get('/api/getusers',authController.getUsers);
router.get('/api/checksession',verifySession, authController.checkSession);

router.post('/api/signup', authController.signup_post);
router.post('/api/googlesignup', authController.googleSignup_post);
router.post('/api/login',checkAlreadyLoggedIn, authController.login_post);
router.post('/api/googleauthlogin',checkAlreadyLoggedIn, authController.googleLogin_post);
router.get('/api/logout',verifySession, authController.logout);
router.post('/api/sendemail',verifyUser,authController.sendEmail);
router.post('/api/verifytoken', authController.verifyToken);
router.put('/api/resetpassword', authController.resetPassword);





module.exports = router;