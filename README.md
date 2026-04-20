# Requirements

This project assumes you are running on **Windows** and using **Docker** for MongoDB storage.  
The code can be extended to support additional database tools, but currently only a Docker setup is included.

Before running this project, install the following tools:

### **Node.js (LTS recommended)**
https://nodejs.org/

### **MongoDB Community Server**
https://www.mongodb.com/try/download/community

Or use **MongoDB Atlas (cloud)**:  
https://www.mongodb.com/atlas/database

### **MQTT Broker (Mosquitto recommended)**
https://mosquitto.org/download/

### **Git**
https://git-scm.com/downloads

---

# Install Dependencies

All required modules are listed in `package.json`.

Install them with:

```bash
npm install
```

## This installs:

    express
    mongoose
    mqtt
    cors
    axios
    nodemon (dev)

# Environment Setup

Create a .env file (optional but recommended):


PORT=3000
MONGO_URI=mongodb://localhost:27017/devices
MQTT_URL=mqtt://localhost:1883

If you don’t use .env, the project defaults to local settings.
## Start the Docker instance:
there are a few scripts to help when using docker. i wrote them with powershell in mind so for a quick start you can run:
```bash
npm docker-build
```
this is just a quick script that composes down docker if its running and spins up a new instance.

# Running the Server

## Start the API server:
```bash
npm start
```

Or run in development mode with auto‑reload:

```bash
npm run dev
```

The server will start on **http://localhost:3000**

# Running the Virtual Device Simulator

A quick test script, creates test devices, sends MQTT telemetry, and runs the REST API.

Run it with:
```bash
npm run test-devices
```
# Assumptions

 - For this i made a few assumptions about the IoT manager, firstly that input was validated for creating and updating a new device.
currently the schema is not validated against when creating a new device. with more time rather than assuming user input i would validate against a tool like Joi. 
 - The other assumption is that there is a secure connection here. right now the API calls could be made by anyone connected to the server. this could be improved by adding an Oauth token or an API key to validate who is connecting along with adding Escape strings to prevent code injection.
 - since this is a quick project the logging is simple console logs. with a larger project i would use timestamps, log levels and limit the JSON output.
 - the telemetry doesnt have an expiry. fine for a small project but would quickly bloat a DB if not updated/removed.
 - the test coverage is small and does not cover edge cases. with more time i would add things such linting or proper unit tests with a tool like Jest

# Other desirables
 - A proper frontend with websockets. (i did not manage to finish this to a satisfactory degree and would create a mobile application to call these APIs in a full project)
 - Add proper event handling and alerts (say battery of a device goes below 10% then send a warning)
 - Add integration tests, proper unit tests, test against existing data within the DB, write some manual tests if it got big enough. (lot of test improvements could be made) 
 - Make the DB more agnostic not just docker based
 - MQTT reconnection logic and more validation
 - Make the logs in the virtual device test order correctly. currently all over the place due to running devices in parallel
