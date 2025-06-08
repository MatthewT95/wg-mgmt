import express from 'express';

const remoteRouter = express.Router({ mergeParams: true });
import { getRemotesController } from '../controllers/remotesController.mjs';

// GET  /routers/:routerId/remotes/      → list all remotes under that router
remoteRouter.get('/', getRemotesController);

export default remoteRouter;