import express from 'express';

const remoteRouter = express.Router({ mergeParams: true });
import { getRemotesController, getRemoteController,createRemoteController,
  getRemoteClientConfigController,updateRemoteController,deleteRemoteController} from '../controllers/remotesController.mjs';

// GET  /routers/:routerId/remotes/      → list all remotes under that router
remoteRouter.get('/', getRemotesController);

// GET  /routers/:routerId/remotes/:remoteId → get a specific remote configuration
remoteRouter.get('/:remoteId', getRemoteController);

// POST /routers/:routerId/remotes/create → create a new remote configuration
remoteRouter.post('/create', createRemoteController);

// PUT /routers/:routerId/remotes/:remoteId/create → create a new remote configuration
remoteRouter.put('/:remoteId/create', createRemoteController);

// GET /routers/:routerId/remotes/:remoteId/client_config → get client configuration for a specific remote
remoteRouter.get('/:remoteId/client_config', getRemoteClientConfigController);

// PUT /routers/:routerId/remotes/:remoteId/update → update a specific remote configuration
remoteRouter.put('/:remoteId/update', updateRemoteController);

// DELETE /routers/:routerId/remotes/:remoteId → delete a specific remote configuration
remoteRouter.delete('/:remoteId', deleteRemoteController)

export default remoteRouter;