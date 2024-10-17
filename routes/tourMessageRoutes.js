const { Router } = require('express');
const tourMessageController = require('../controllers/tourMessageController');
const { verifySession,checkAlreadyLoggedIn,verifyUser} = require('../middleware/authMiddleware');

const router = Router();

router.get('/api/tourmessages/:id',verifySession,tourMessageController.getTourMessages);

router.post('/api/tourmessage/:id',verifySession, tourMessageController.postTourMessage);
router.delete('/api/tourmessage/:id',verifySession, tourMessageController.deleteTourMessage);

router.post('/api/tourreply',verifySession, tourMessageController.postTourReply);
router.delete('/api/tourreply/:id',verifySession, tourMessageController.deleteTourReply);


module.exports = router;