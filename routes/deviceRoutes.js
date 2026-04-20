const express = require('express');
const router = express.Router();
const { listDevices, deleteDevice, createDevice, updateDevice, getDevice } = require('../controllers/deviceController');

//register all the REST APIs to the router
router.post('/devices', createDevice);
router.patch('/devices/:id', updateDevice);
router.get('/devices', listDevices);
router.get('/devices/:id', getDevice);
router.delete('/devices/:id', deleteDevice);

module.exports = router;