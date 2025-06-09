// routes/vpcs.mjs
import express from 'express';
import { getRoutersController,getRouterController,createRouterController,updateRouterController,deleteRouterController} from '../controllers/routersControllers.mjs';
import { routerExistsMiddleware } from '../utils/middleware.mjs';

// Note the mergeParams option:
const routerRouter = express.Router({mergeParams: true});

// GET /router/ → list all VPCs
routerRouter.get('/', getRoutersController);

// POST /router/ → create a new VPC
routerRouter.post('/', createRouterController);

// GET /router/:routerId → get a specific VPC configuration
routerRouter.get('/:routerId', routerExistsMiddleware, getRouterController);

// PUT /router/:routerId → update an existing VPC configuration
routerRouter.put('/:routerId', routerExistsMiddleware, updateRouterController);

// DELETE /router/:routerId → delete a specific VPC configuration
routerRouter.delete('/:routerId', routerExistsMiddleware, deleteRouterController);

export default routerRouter;