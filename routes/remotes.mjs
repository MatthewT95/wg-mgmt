import express from 'express';

const remoteRouter = express.Router({ mergeParams: true });
import { getRemotesController, getRemoteController} from '../controllers/remotesController.mjs';

// GET  /routers/:routerId/remotes/      → list all remotes under that router
remoteRouter.get('/', getRemotesController);

// GET  /routers/:routerId/remotes/:remoteId → get a specific remote configuration
remoteRouter.get('/:remoteId', getRemoteController);

export default remoteRouter;