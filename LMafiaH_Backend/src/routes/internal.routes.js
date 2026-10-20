const router = require('express').Router();
const internalController = require('../controllers/internal.controller');
const internalAuth = require('../middleware/internalAuth');

// Server-to-server only (called by the FastAPI AI service). Never mounted
// behind the public CORS-enabled surface in a real deployment — see README
// for the recommended network-level isolation (internal-only ingress).
router.use(internalAuth);

router.post('/ai/tools/run', internalController.runTool);
router.post('/ai/memory', internalController.upsertMemory);
router.get('/ai/memory/:userId', internalController.getMemories);

module.exports = router;
