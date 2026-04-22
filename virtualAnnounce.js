// virtualAnnounce.js
// Simulates IoT devices announcing themselves over MQTT

const mqtt = require('mqtt');
const { v4: uuidv4 } = require('uuid');

const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';

// Number of virtual devices to simulate
const DEVICE_COUNT = 5;

// Generate a random IP address
function randomIp() {
  return `192.168.1.${Math.floor(Math.random() * 200) + 20}`;
}

// Generate a random MAC address
function randomMac() {
  return Array(6)
    .fill(0)
    .map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0'))
    .join(':')
    .toUpperCase();
}

// Create a random device payload
function createDevicePayload(deviceId) {
  return {
    name: `Virtual Device ${deviceId.substring(0, 4)}`,
    type: ['temperature', 'humidity', 'switch', 'sensor'][Math.floor(Math.random() * 4)],
    ip: randomIp(),
    mac: randomMac(),
    metadata: {
      firmware: `1.0.${Math.floor(Math.random() * 10)}`,
      battery: Math.floor(Math.random() * 100),
      signal: Math.floor(Math.random() * 100)
    }
  };
}

function announceDevices() {
  const client = mqtt.connect(MQTT_URL);

  client.on('connect', () => {
    console.log('Connected to MQTT broker');

    for (let i = 0; i < DEVICE_COUNT; i++) {
      const deviceId = uuidv4();
      const payload = createDevicePayload(deviceId);

      const topic = `homelink/devices/${deviceId}/announce`;

      client.publish(topic, JSON.stringify(payload), { qos: 1 }, () => {
        console.log(`Announced device ${deviceId}`);
      });
    }

    // Close connection after sending all announcements
    setTimeout(() => {
      client.end();
      console.log('Finished announcing devices');
    }, 1000);
  });

  client.on('error', (err) => {
    console.error('MQTT error:', err);
  });
}

announceDevices();