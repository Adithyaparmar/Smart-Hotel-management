const router = require('express').Router();
const aiController = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { chatSchema } = require('../validators/ai.validator');
const { idParamSchema } = require('../validators/room.validator');

router.post('/chat', authenticate, validate({ body: chatSchema }), aiController.chat);
router.get('/conversations', authenticate, aiController.listConversations);
router.get('/conversations/:id', authenticate, validate({ params: idParamSchema }), aiController.getConversation);
router.patch('/conversations/:id/close', authenticate, validate({ params: idParamSchema }), aiController.closeConversation);
router.get('/memory', authenticate, aiController.listMemories);
router.delete('/memory/:key', authenticate, aiController.deleteMemory);

module.exports = router;
