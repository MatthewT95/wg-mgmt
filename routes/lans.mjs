// routes/lan.mjs
import express from 'express';
import { getLANsController } from '../controllers/lansController.mjs';

// Note the mergeParams option:
const lanRouter = express.Router({ mergeParams: true });

// GET  /routers/:routerId/lan/      → list all LANs under that router
lanRouter.get('/', getLANsController);

export default lanRouter;