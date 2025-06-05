const express = require('express');
const { getRouters,getRouter, routerUp, routerDown,routerRestartController
  , createRouterController
} = require('../controllers/routersController.js');
const router = express.Router();

// routers.js - Router management routes

// lists all routers and their information
router.get('/', getRouters);

// retrieves information for a specific router by ID
router.get('/:id', getRouter);

// starts a router by ID
router.post('/:id/up', routerUp);

// stops a router by ID
router.post('/:id/down', routerDown);

// Restart router
router.post('/:id/restart', routerRestartController);

// Create a new router
router.put('/:id/create', createRouterController);

module.exports = router;