// routes/routers.mjs
import express from 'express';
import {
  getRoutersController,
  getRouterController,
  routerUpController,
  routerDownController,
  routerRestartController,
  createRouterController,
  updateRouterController,
  deleteRouterController
} from '../controllers/routersController.mjs'; // Import the necessary controllers for router operations

import  lanRouter  from './lans.mjs';   // <-- import your LAN sub‐router here
import remoteRouter from './remotes.mjs'; // <-- import your remote sub‐router here

// Create a new express router instance
const router = express.Router({ mergeParams: true });

// lists all virtual routers and their information
// GET /routers
router.get('/', getRoutersController);

// retrieves information for a specific virtual router by ID
// GET /routers/:id
router.get('/:id', getRouterController);

// starts a virtual router by ID
// POST /routers/:id/up
router.post('/:id/up', routerUpController);

// stops a virtual router by ID
// POST /routers/:id/down
router.post('/:id/down', routerDownController);

// Restarts a virtual router
// POST /routers/:id/restart
router.post('/:id/restart', routerRestartController);

// Creates a new virtual router with a specific ID using PUT
// PUT /routers/:id/create
router.put('/:id/create', createRouterController);

// Updates a virtual router with a specific ID using PUT
// PUT /routers/:id/update
router.put('/:id/update', updateRouterController);

// Creates a new virtual router with random id using POST
// POST /routers/create
router.post('/create', createRouterController);

// DELETE a virtual router by ID using DELETE
// DELETE /routers/:id/delete
router.delete('/:id/delete', deleteRouterController);

// Mount LAN routes under each router
// e.g.  GET /routers/r003/lan/…  will be handled by lanRouter
router.use('/:routerId/lan', lanRouter);

// Mount remote routes under each router
// e.g.  GET /routers/r003/remotes/…  will be handled by remoteRouter
router.use('/:routerId/remote', remoteRouter);

export default router;
