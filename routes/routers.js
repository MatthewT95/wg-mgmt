const express = require('express');
const { getRouters,getRouter } = require('../controllers/routersController.js');
const router = express.Router();

router.get('/', getRouters);

router.get('/:id', getRouter);

module.exports = router;