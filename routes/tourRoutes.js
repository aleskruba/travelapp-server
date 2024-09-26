const { Router } = require('express');
const tourController = require('../controllers/tourController');
const { verifySession,checkAlreadyLoggedIn,verifyUser} = require('../middleware/authMiddleware');

const router = Router();

router.get('/api/tours', tourController.getTours);
router.get('/api/yourtours',verifySession, tourController.getYourTours);

router.post('/api/tour',verifySession, tourController.postTour);
router.delete('/api/tour/:id',verifySession, tourController.deleteTour);

module.exports = router;