// routes/lan.mjs
import express from 'express';
import { getLANsController, getLANController} from '../controllers/lansController.mjs';

// Note the mergeParams option:
const lanRouter = express.Router({ mergeParams: true });

// GET  /routers/:routerId/lan/      → list all LANs under that router
lanRouter.get('/', getLANsController);

// GET  /routers/:routerId/lan/:lanId → get a specific LAN configuration
lanRouter.get('/:lanId', getLANController);

export default lanRouter;