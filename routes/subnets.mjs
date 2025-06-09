// routes/subnets.mjs
import express from 'express';
import { createSubnetController, deleteSubnetController } from '../controllers/subnetController.mjs';

// Note the mergeParams option:
const subnetRouter = express.Router({mergeParams: true});

// GET /subnet/ → list all subnets
// routerRouter.get('/', getRoutersController);

// POST /subnet/ → create a new subnet
subnetRouter.post('/', createSubnetController);

// // GET /subnet/:subnetId → get a specific subnet configuration
// routerRouter.get('/:subnetId', getRouterController);

// // PUT /subnet/:routerId/update → update an existing subnet configuration
// routerRouter.put('/:subnetId', updateRouterController);

// DELETE /subnet/:subnetId/delete → delete a specific subnet configuration
subnetRouter.delete('/:subnetId', deleteSubnetController);

export default subnetRouter;