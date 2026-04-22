const express = require('express');
const mongoose = require('mongoose');
const mqtt = require('mqtt');
const deviceRoutes = require('./routes/deviceRoutes');
const cors = require('cors');
const NetworkDiscovery = require('./controllers/networkDiscovery');

const app = express();
app.use(express.json());
app.use(cors());

// ----------------------
// Config
// ----------------------
const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const discovery = new NetworkDiscovery(process.env.MQTT_URL);
const MQTT_DEVICE_TOPIC = 'devices/+/status';
const HTTP_PORT = process.env.PORT || 3000;
const MONGO_URL =
  process.env.MONGO_URL ||
  'mongodb://root:example@localhost:27017/iot_manager?authSource=admin';

// Start listening for device announcements
discovery.start();

// Optional: react to discovered devices
discovery.on('deviceDiscovered', (device) => {
  console.log('New or updated device:', device.deviceId);
});

mongoose.connect(MONGO_URL);

// Mount Routes 
app.use('/', deviceRoutes);
console.log("Registered routes:");

// MQTT Setup
const mqttClient = mqtt.connect(MQTT_URL);

const Device = require('./models/deviceModel');

mqttClient.on('connect', () => {
  console.log('MQTT connected');
  mqttClient.subscribe(MQTT_DEVICE_TOPIC);
});

mqttClient.on('message', async (topic, messageBuffer) => {
  const deviceId = topic.split('/')[1];
  const payload = JSON.parse(messageBuffer.toString());

  await Device.findOneAndUpdate(
    { deviceId },
    {
      deviceId,
      lastSeen: new Date(),
      status: payload.status || 'online',
      lastPayload: payload
    },
    { upsert: true, new: true }
  );
});

// ----------------------
// Start Server
// ----------------------
app.listen(HTTP_PORT, () => {
  console.log(`Server running on port ${HTTP_PORT}`);
});

