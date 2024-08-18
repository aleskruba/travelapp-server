const { Router } = require('express');
const messageController = require('../controllers/messageController');
const { verifySession,checkAlreadyLoggedIn,verifyUser} = require('../middleware/authMiddleware');

const router = Router();

router.get('/api/messages/:id', messageController.getMessages);
router.post('/api/message',verifySession, messageController.postMessage);
router.delete('/api/message/:id',verifySession, messageController.deleteMessage);
router.put('/api/votemessage',verifySession, messageController.voteMessage);

router.post('/api/reply',verifySession, messageController.postReply);
router.delete('/api/reply/:id',verifySession, messageController.deleteReply);
router.put('/api/votereply',verifySession, messageController.voteReply);

module.exports = router;