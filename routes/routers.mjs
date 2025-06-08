// routes/routers.mjs
import express from 'express';
import {
  getRouters,
  getRouter,
  routerUp,
  routerDown,
  routerRestartController,
  createRouterController
} from '../controllers/routersController.mjs';

import  lanRouter  from './lans.mjs';   // <-- import your LAN sub‐router here

const router = express.Router();

// lists all routers and their information
// GET /routers
router.get('/', getRouters);

// retrieves information for a specific router by ID
// GET /routers/:id
router.get('/:id', getRouter);

// starts a router by ID
// POST /routers/:id/up
router.post('/:id/up', routerUp);

// stops a router by ID
// POST /routers/:id/down
router.post('/:id/down', routerDown);

// Restart router
// POST /routers/:id/restart
router.post('/:id/restart', routerRestartController);

// Create a new router
// PUT /routers/:id/create
router.put('/:id/create', createRouterController);

// Create a new router using POST
// POST /routers/create
router.post('/create', createRouterController);

// Mount LAN routes under each router
// e.g.  GET /routers/r003/lan/…  will be handled by lanRouter
router.use('/:routerId/lan', lanRouter);

export default router;
