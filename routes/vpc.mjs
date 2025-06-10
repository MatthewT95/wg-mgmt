// routes/vpcs.mjs
import express from 'express';
import { createVPCController, listVPCController,getVPCController,updateVPCController,deleteVPCController,listVPCRoutersController} from '../controllers/vpcController.mjs'; // Import the necessary controllers for VPC operations
import { vpcExistsMiddleware } from '../utils/middleware.mjs';

// Note the mergeParams option:
const vpcRouter = express.Router({mergeParams: true});

// GET /vpc/ → list all VPCs
vpcRouter.get('/', listVPCController);

// POST /vpc/ → create a new VPC
vpcRouter.post('/', createVPCController);

// GET /vpc/:vpcId → get a specific VPC configuration
vpcRouter.get('/:vpcId', vpcExistsMiddleware, getVPCController);

// PUT /vpc/:vpcId/update → update an existing VPC configuration
vpcRouter.put('/:vpcId', vpcExistsMiddleware, updateVPCController);

// DELETE /vpc/:vpcId/delete → delete a specific VPC configuration
vpcRouter.delete('/:vpcId', vpcExistsMiddleware, deleteVPCController);

// GET /vpc/:vpcId/routers → list all routers in a specific VPC
vpcRouter.get('/:vpcId/routers', vpcExistsMiddleware, listVPCRoutersController);

export default vpcRouter;