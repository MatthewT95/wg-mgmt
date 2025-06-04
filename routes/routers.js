const express = require('express');
const { getRouters,getRouter, routerUp, routerDown} = require('../controllers/routersController.js');
const router = express.Router();

// routers.js - Router management routes

// lists all routers and their information
router.get('/', getRouters);

// retrieves information for a specific router by ID
router.get('/:id', getRouter);

// starts a router by ID
router.put('/:id/up', routerUp);

// stops a router by ID
router.put('/:id/down', routerDown);

module.exports = router;