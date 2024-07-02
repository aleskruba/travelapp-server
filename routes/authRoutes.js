const { Router } = require('express');
const authController = require('../controllers/authController');
const { verifySession,checkAlreadyLoggedIn} = require('../middleware/authMiddleware');

const router = Router();

router.get('/api/getusers',authController.getUsers);
router.get('/api/checksession',verifySession, authController.checkSession);

router.post('/api/signup', authController.signup_post);
router.post('/api/login',checkAlreadyLoggedIn, authController.login_post);
router.get('/api/logout',verifySession, authController.logout);






module.exports = router;