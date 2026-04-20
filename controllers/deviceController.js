const Device = require('../models/deviceModel');

async function createDevice(req, res) {
  try {
    const { deviceId, status, metadata, payload = null } = req.body
    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }

    // Check if device already exists
    const existing = await Device.findOne({ deviceId });
    if (existing) {
      return res.status(409).json({ error: 'Device already exists' });
    }

    const now = new Date();

    //default to an empty metadata field and offline status
    const newDevice = await Device.create({
      deviceId,
      status: status ?? 'unknown',
      metadata: metadata ?? {},
      lastSeen: now,
      lastPayload: payload
    });

    return res.status(201).json({
      id: newDevice._id,        
      deviceId: newDevice.deviceId,
      status: newDevice.status,
      lastSeen: newDevice.lastSeen,
      lastPayload: newDevice.lastPayload,
      metadata: newDevice.metadata
    });

  } catch (err) {
    console.error('Error creating device:', err);
    return res.status(500).json({ error: 'Failed to create device' });
  }
}

//list all devices in the DB
async function listDevices(req, res) {
  try {
    const devices = await Device.find({}).sort({ deviceId: 1 });
    res.json(devices);
  } catch (err) {
    console.error('Error fetching devices:', err);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
}

//get a specific device
async function getDevice(req, res) {
    try {
      const device = await Device.findOne({ deviceId: req.params.id });
  
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
  
      res.json(device);
    } catch (err) {
      console.error('Error fetching device:', err);
      res.status(500).json({ error: 'Failed to fetch device' });
    }
  }
  

async function updateDevice(req, res) {
    try {
      const deviceId = req.params.id;
      const updates = req.body;
  
      if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No fields provided to update' });
      }
  
      // Always update lastSeen when device is updated
      updates.lastSeen = new Date();
  
      //runValidators used to check new data mataches schema, strict to prevent adding new fields
      const updated = await Device.findOneAndUpdate(
        { deviceId },
        { $set: updates },
        {
          new: true,
          runValidators: true,  
          strict: true      
        }
      );
  
      if (!updated) {
        return res.status(404).json({ error: 'Device not found' });
      }
  
      res.json(updated.toJSON());
  
    } catch (err) {
      console.error('Error updating device:', err);
      res.status(500).json({ error: 'Failed to update device' });
    }
  }

  //deletes a device from the DB if it can be found
  async function deleteDevice(req, res) {
    try {
      const deleted = await Device.findOneAndDelete({ deviceId: req.params.id });
  
      if (!deleted) {
        return res.status(404).json({ error: 'Device not found' });
      }
  
      res.json({ message: `Device ${req.params.id} deleted successfully` });
    } catch (err) {
      console.error('Error deleting device:', err);
      res.status(500).json({ error: 'Failed to delete device' });
    }
  }

module.exports = { listDevices, updateDevice, deleteDevice, getDevice, createDevice };