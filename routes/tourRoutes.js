const { Router } = require('express');
const tourController = require('../controllers/tourController');
const { verifySession,checkAlreadyLoggedIn,verifyUser} = require('../middleware/authMiddleware');

const router = Router();

router.get('/api/tours', tourController.getTours);



module.exports = router;