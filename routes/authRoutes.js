const { Router } = require('express');
const authController = require('../controllers/authController');


const router = Router();

router.get('/api/getusers',authController.getUsers);


router.post('/api/signup', authController.signup_post);
router.post('/api/login', authController.login_post);
router.post('/api/logout', authController.logout);







module.exports = router;