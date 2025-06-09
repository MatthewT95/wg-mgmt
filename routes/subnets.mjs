// routes/subnets.mjs
import express from 'express';
import { createSubnetController, deleteSubnetController ,listSubnetsController,getSubnetController,updateSubnetController} from '../controllers/subnetController.mjs';

// Note the mergeParams option:
const subnetRouter = express.Router({mergeParams: true});

// GET /subnet/ → list all subnets
subnetRouter.get('/', listSubnetsController);

// POST /subnet/ → create a new subnet
subnetRouter.post('/', createSubnetController);

// GET /subnet/:subnetId → get a specific subnet configuration
subnetRouter.get('/:subnetId', getSubnetController);

// PUT /subnet/:subnetId/update → update an existing subnet configuration
subnetRouter.put('/:subnetId', updateSubnetController);

// DELETE /subnet/:subnetId/delete → delete a specific subnet configuration
subnetRouter.delete('/:subnetId', deleteSubnetController);

export default subnetRouter;