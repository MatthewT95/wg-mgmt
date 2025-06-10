// routes/vpcs.mjs
import express from 'express';
import { listRoutersController,getRouterController,createRouterController,updateRouterController,deleteRouterController} from '../controllers/routersControllers.mjs';
import { routerExistsMiddleware } from '../utils/middleware.mjs';

// Note the mergeParams option:
const routerRouter = express.Router({mergeParams: true});

// GET /router/ → list all routers
routerRouter.get('/', listRoutersController);

// POST /router/ → create a new router
routerRouter.post('/', createRouterController);

// GET /router/:routerId → get a specific router configuration
routerRouter.get('/:routerId', routerExistsMiddleware, getRouterController);

// PUT /router/:routerId → update an existing router configuration
routerRouter.put('/:routerId', routerExistsMiddleware, updateRouterController);

// DELETE /router/:routerId → delete a specific router configuration
routerRouter.delete('/:routerId', routerExistsMiddleware, deleteRouterController);

export default routerRouter;