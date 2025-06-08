// routes/lan.mjs
import express from 'express';
import { getLANsController, getLANController,createLANController,updateLANController} from '../controllers/lansController.mjs';

// Note the mergeParams option:
const lanRouter = express.Router({ mergeParams: true });

// GET  /routers/:routerId/lan/      → list all LANs under that router
lanRouter.get('/', getLANsController);

// GET  /routers/:routerId/lan/:lanId → get a specific LAN configuration
lanRouter.get('/:lanId', getLANController);

// PUT /routers/:routerId/lan/:lanId/create → create a new LAN configuration
lanRouter.put('/:lanId/create', createLANController);

// PUT /routers/:routerId/lan/:lanId/update → update an existing LAN configuration
lanRouter.put('/:lanId/update', updateLANController);

// POST /routers/:routerId/lan/create → create a new LAN configuration
lanRouter.post('/create', createLANController);

export default lanRouter;