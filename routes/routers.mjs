// routes/vpcs.mjs
import express from 'express';
import { getRoutersController,getRouterController,createRouterController,updateRouterController,deleteRouterController} from '../controllers/routersControllers.mjs';

// Note the mergeParams option:
const routerRouter = express.Router({mergeParams: true});

// GET /router/ → list all VPCs
routerRouter.get('/', getRoutersController);

// POST /router/ → create a new VPC
routerRouter.post('/', createRouterController);

// GET /router/:routerId → get a specific VPC configuration
routerRouter.get('/:routerId', getRouterController);

// PUT /router/:routerId/update → update an existing VPC configuration
routerRouter.put('/:routerId', updateRouterController);

// // DELETE /router/:routerId/delete → delete a specific VPC configuration
routerRouter.delete('/:routerId', deleteRouterController);

export default routerRouter;