// networkDeiscovery.js
// Handles MQTT-based device discovery via announce topics

const EventEmitter = require('events');
const mqtt = require('mqtt');
const Device = require('../models/deviceModel');

class NetworkDiscovery extends EventEmitter {
  constructor(mqttUrl, options = {}) {
    super();

    this.mqttUrl = mqttUrl;
    this.options = options;

    this.client = null;
    this.isConnected = false;
  }

  // Connect to MQTT broker
  start() {
    if (this.client) return;

    this.client = mqtt.connect(this.mqttUrl, this.options);

    this.client.on('connect', () => {
      this.isConnected = true;
      console.log('Connected to MQTT broker');

      // Subscribe to announce topic
      this.client.subscribe('homelink/devices/+/announce', (err) => {
        if (err) {
          console.error('Failed to subscribe to announce topic:', err);
        } else {
          console.log('Listening for device announcements...');
        }
      });
    });

    this.client.on('message', async (topic, message) => {
      try {
        const deviceId = topic.split('/')[2];
        const payload = JSON.parse(message.toString());

        console.log(`Device found: ${deviceId}`);

        const deviceData = {
          deviceId,
          name: payload.name || `Device-${deviceId}`,
          type: payload.type || 'unknown',
          ip: payload.ip || null,
          mac: payload.mac || null,
          metadata: payload.metadata || {},
          lastSeen: new Date()
        };

        // Upsert device in MongoDB
        const device = await Device.findOneAndUpdate(
          { deviceId },
          { $set: deviceData },
          { new: true, upsert: true }
        );

        // Emit discovery event
        this.emit('deviceDiscovered', device);

      } catch (err) {
        console.error(' Error processing announce message:', err);
      }
    });

    this.client.on('error', (err) => {
      console.error('MQTT error:', err);
    });
  }

  stop() {
    if (this.client) {
      this.client.end();
      this.client = null;
      this.isConnected = false;
      console.log('Stopped MQTT discovery');
    }
  }
}

module.exports = NetworkDiscovery;
