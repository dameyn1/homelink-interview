const mqtt = require('mqtt');
const axios = require('axios');

const MQTT_URL = 'mqtt://localhost:1883';
const API_URL = 'http://localhost:3000';

const DEVICE_COUNT = 10;
const TELEMETRY_RUNS = 4;
const TELEMETRY_INTERVAL_MS = 2000;
let completed = 0

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function simulateDevice(deviceId) {

 // 1. Create device via REST
 await addDevice(deviceId);

 // 2. Update device via REST
 await updateDevice(deviceId);

 // 3. Now start MQTT simulation
 const client = mqtt.connect(MQTT_URL);

 client.on('connect', () => {
   console.log(`${deviceId} connected to MQTT`);

   let count = 0;

   const interval = setInterval(() => {
     const payload = {
       status: 'online',
       temp: random(18, 25),
       humidity: random(30, 60),
       battery: random(70, 100)
     };

     client.publish(
       `devices/${deviceId}/status`,
       JSON.stringify(payload)
     );

     console.log(`${deviceId} sent telemetry`, payload);

     count++;
     if (count >= TELEMETRY_RUNS) {
       clearInterval(interval);
       console.log(`Telemetry stopped for ${deviceId}`);

       // Pass client + interval to cleanup later
       runRestTests(deviceId, client);
     }
   }, TELEMETRY_INTERVAL_MS);
 });
}

async function addDevice(deviceId) {
  console.log(`POST /devices`);

  try {
    const res = await axios.post(`${API_URL}/devices`, {
      deviceId,
      status: "offline",
      metadata: { createdBy: "virtualTest" }
    });

    const data = res.data;
    console.log(`Created device:`, data);

    // ⭐ Validate required fields
    if (!data.id) {
      console.error(`ERROR: createDevice did not return an 'id' field`);
    } else {
      console.log(`createDevice returned id: ${data.id}`);
    }

    if (data.deviceId !== deviceId) {
      console.error(`ERROR: Returned deviceId does not match request`);
    } else {
      console.log(`deviceId matches`);
    }

    if (!data.lastSeen) {
      console.error(`ERROR: lastSeen missing from response`);
    } else {
      console.log(`lastSeen present`);
    }

    // Optional: return the full response for later use
    return data;

  } catch (err) {
    if (err.response?.status === 409) {
      console.log(`Device ${deviceId} already exists, continuing...`);
      return null;
    }

    console.error(`Unexpected error creating device:`, err.response?.data || err.message);
  }
}


async function updateDevice(deviceId) {
  console.log(`PATCH /devices/${deviceId}`);
  const res = await axios.patch(`${API_URL}/devices/${deviceId}`, {
    status: "online",
    metadata: { updatedBy: "virtualTest" }
  });
  console.log(`Updated device:`, res.data);
}


async function runRestTests(deviceId, client) {
  try {

    //Wait a moment for DB writes
    await new Promise(r => setTimeout(r, 2500));

    console.log(`GET /devices/${deviceId}`);
    const getRes = await axios.get(`${API_URL}/devices/${deviceId}`);
    console.log(`Device info:`, getRes.data);

    console.log(`GET /devices`);
    const listRes = await axios.get(`${API_URL}/devices`);
    console.log(`Device list:`, listRes.data);

    console.log(`DELETE /devices/${deviceId}`);
    const delRes = await axios.delete(`${API_URL}/devices/${deviceId}`);
    console.log(`Deleted:`, delRes.data);

    console.log(`Confirming deletion for ${deviceId}`);
    try {
      await axios.get(`${API_URL}/devices/${deviceId}`);
    } catch (err) {
      console.log(`Confirmed deleted:`, err.response?.data || err.message);
    }
    console.log(`Cleaning up ${deviceId}...`);
    //close MQTT connection when device is deleted
    client.end(true); 
    completed++;
    if (completed === DEVICE_COUNT) {
      console.log("All tests complete. Exiting.");
      process.exit(0);
    }

  } catch (err) {
    console.log(`Error during REST tests for ${deviceId}:`, err.response?.data || err.message);
  }

}

for (let i = 1; i <= DEVICE_COUNT; i++) {
  const deviceId = `test-device-${i}`;
  simulateDevice(deviceId);
}