const { Router } = require('express');
const vlogController = require('../controllers/vlogController');
const { verifySession} = require('../middleware/authMiddleware');

const router = Router();

router.get('/api/vlogs/:id', vlogController.getVlogs);
router.post('/api/vlog',verifySession, vlogController.postVlog);
router.delete('/api/vlog/:id',verifySession, vlogController.deleteVlog);
router.put('/api/vlog/:id',verifySession, vlogController.updateVlog);

router.get('/api/yourvlogs',verifySession, vlogController.getYourVlogs);

module.exports = router;
