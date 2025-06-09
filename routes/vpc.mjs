// routes/vpcs.mjs
import express from 'express';
import { createVPCController, getVPCsController,getVPCController,updateVPCController,deleteVPCController} from '../controllers/vpcController.mjs'; // Import the necessary controllers for VPC operations

// Note the mergeParams option:
const vpcRouter = express.Router({mergeParams: true});

// GET /vpc/ → list all VPCs
vpcRouter.get('/', getVPCsController);

// POST /vpc/ → create a new VPC
vpcRouter.post('/', createVPCController);

// GET /vpc/:vpcId → get a specific VPC configuration
vpcRouter.get('/:vpcId', getVPCController);

// PUT /vpc/:vpcId/update → update an existing VPC configuration
vpcRouter.put('/:vpcId', updateVPCController);

// DELETE /vpc/:vpcId/delete → delete a specific VPC configuration
vpcRouter.delete('/:vpcId', deleteVPCController);

export default vpcRouter;