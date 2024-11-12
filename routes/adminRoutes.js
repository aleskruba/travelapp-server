const { Router } = require('express');
const adminController = require('../controllers/adminController');
const { verifySession,checkAlreadyLoggedIn,verifyUser,isAdmin} = require('../middleware/authMiddleware');

const router = Router();

router.get('/api/admin/getusers',verifySession,isAdmin,adminController.getUsers);
router.get('/api/admin/getuser/:id',verifySession,isAdmin,adminController.getUser);
router.get('/api/admin/logindata',verifySession,isAdmin,adminController.getLoginData);



module.exports = router;