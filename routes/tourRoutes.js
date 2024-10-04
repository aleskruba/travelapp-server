const { Router } = require('express');
const tourController = require('../controllers/tourController');
const { verifySession,checkAlreadyLoggedIn,verifyUser} = require('../middleware/authMiddleware');

const router = Router();

router.get('/api/tours', tourController.getTours);
router.get('/api/yourtours',verifySession, tourController.getYourTours);

router.post('/api/tour',verifySession, tourController.postTour);
router.put('/api/tour/:id',verifySession, tourController.updateTour);
router.get('/api/tour/:id',verifySession, tourController.getTour);
router.delete('/api/tour/:id',verifySession, tourController.deleteTour);

module.exports = router;