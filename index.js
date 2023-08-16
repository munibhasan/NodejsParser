const net = require("net");
const axios = require("axios");
const Parser = require("teltonika-parser-ex");
const binutils = require("binutils64");
const moment = require("moment-timezone");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const redisConnectionHelper = require("./utils/redisConnectionHelper");
// const mongoClientConnectionHelper = require("../utils/mongoClientConnectionHelper");
// const storeCollectionsDataInRedis = require("./utils/storeCollectionsDataInRedis");
// const getAllDataFromRedis = require("./utils/getAllDataFromRedis");

//Importing Models
const deviceAssignImport = require("./Modules/DeviceAssign/model/deviceassign.model");
const vehicleImport = require("./Modules/Vehicles/model/vehicle.model");
const clientImport = require("./Modules/Clients/model/client.model");
const deviceImport = require("./Modules/Devices/model/device.model");

const deviceAssignModel = deviceAssignImport.model;
const vehicleModel = vehicleImport.model;
const clientModel = clientImport.model;
const deviceModel = deviceImport.model;

var deviceConnections = [];

const PARSER_PORT = 1101;

async function main() {
  // let redisData;

  //   const mongoClient = await mongoClientConnectionHelper();
  const redisClient = await redisConnectionHelper();

  async function fetchLocationData(latitude, longitude) {
    let coordinatesStr = `${latitude},${longitude}`;
    const redisCoordinates = await redisClient.get(coordinatesStr);
    if (redisCoordinates) {
      return JSON.parse(redisCoordinates);
    }
    const nominatimBaseUrl = "https://nominatim.openstreetmap.org/reverse";
    const urlParameters = `?lat=${latitude}&lon=${longitude}&zoom=19&format=jsonv2&accept-language=en`;

    try {
      const response = await axios.get(nominatimBaseUrl + urlParameters);
      if (response.status === 200) {
        redisClient.set(coordinatesStr, JSON.stringify(response.data));
        return response.data;
      }
      throw new Error("Failed to fetch location data");
    } catch (error) {
      console.error("OSM ERROR", { latitude, longitude }, error.message);
      return null;
    }
  }

  // This logic stores all data from mongo to redis and then saves all of it in redisData.
  // This is not required with current business logic. Commenting it out for first commit. Remove it in proceeding commits.
  //   ^
  //   |
  //   |
  // await storeCollectionsDataInRedis(mongoClient, redisClient);
  // redisData = await getAllDataFromRedis(redisClient);
  // console.log("redisData", redisData);

  const io = new Server(1102);

  io.on("connection", (socket) => {
    console.log("socket connected", {
      id: socket.id,
      clientId: socket.handshake.query.ClientId,
    });
  });

  function emitDataToSocketByClientId(clientData, sendData) {
    io.fetchSockets()
      .then((sockets) => {
        sockets.forEach((socket) => {
          const socketClientId = socket.handshake.query.ClientId;
          console.log(
            "Socket for client",
            socketClientId,
            clientData?._id.toString()
          );
          if (socketClientId === clientData?._id.toString()) {
            socket.emit("message", sendData);
            console.log("Data emitted to client", {
              clientName: clientData?._id.toString(),
              clientName: clientData?.clientName,
              socketId: socket.id,
            });
          }
        });
      })
      .catch(console.log);
  }

  async function redisSetData(key, value) {
    try {
      await redisClient.set(key, JSON.stringify(value));
    } catch (e) {
      console.log("Error setting redisData-1", IMEI, clientId, redisData);
    }
  }

  let serverParser = net.createServer((c) => {
    c.id = uuidv4();
    console.log("Tracker connected", c.id);

    c.on("end", () => {
      console.log("Tracker disconnected", c.id);
    });

    c.on("data", async (data) => {
      let buffer = data;
      let parser = new Parser(buffer);

      IMEI = parser.imei;
      if (parser.isImei) {
        if (parser.imei.length === 15) {
          const device = await deviceModel.findOne({ deviceIMEI: IMEI });
          if (!device) {
            return;
          }

          deviceConnections = deviceConnections.filter(
            (row) => row.IMEI !== parser.imei
          );
          deviceConnections.push({ id: c.id, IMEI: parser.imei });
          console.log("Tracker acknowledged:", {
            socketId: c.id,
            IMEI: parser.imei,
          });
          // sends 1 as acknowledgment so that device can send AVL packets.
          c.write(Buffer.alloc(1, 1));
        }
      } else {
        const IMEI = deviceConnections.find((row) => row.id === c.id)?.IMEI;
        if (!IMEI) {
          return;
        }
        let avl = parser.getAvl();
        if (!avl) {
          return;
        }
        avl = { ...avl, IMEI };
        console.log("AVL Data Packet received from IMEI", avl?.IMEI);
        const device = await deviceModel.findOne({ deviceIMEI: IMEI });
        const deviceAssignData = await deviceAssignModel.findOne({
          DeviceId: device._id,
        });

        const clientDataPromise = clientModel.findOne({
          _id: deviceAssignData.clientId,
        });

        const vehicleDataPromise = vehicleModel.findOne({
          _id: deviceAssignData.VehicleId,
        });
        const [clientData, vehicleData] = await Promise.all([
          clientDataPromise,
          vehicleDataPromise,
        ]);

        if (!device || !deviceAssignData || !clientData || !vehicleData) {
          return;
        }

        const clientId = clientData._id.toString();
        const vehicleId = vehicleData._id.toString();
        if (!avl?.records || avl?.records?.length === 0) {
          return;
        }
        for (const item of avl?.records) {
          const osmElements = await fetchLocationData(
            item.gps.latitude,
            item.gps.longitude
          );
          let speedWithUnitDesc = "";
          if (clientData.typeOfUnit === "Mile") {
            let convertedSpeed = item.gps.speed / 1.609;
            speedWithUnitDesc = Math.round(convertedSpeed) + " " + "Mph";
          } else {
            let convertedSpeed = item.gps.speed;
            speedWithUnitDesc = Math.round(convertedSpeed) + " " + "Kph";
          }

          let ignitionElement = item?.ioElements?.find(
            (element) => element?.label === "Ignition"
          );
          let ignitionValue = ignitionElement ? ignitionElement?.value : null;

          let timestampConverted = moment(item.timestamp)
            .tz(clientData.timeZone)
            .format("MMMM DD YYYY hh:mm:ss A");
          const payloadSocket = {
            IMEI: avl?.IMEI,
            clientId,
            vehicleId,
            vehicleMake: vehicleData.vehicleMake,
            vehicleModel: vehicleData.vehicleModel,
            vehicleNo: vehicleData.vehicleNo,
            vehicleReg: vehicleData.vehicleReg,
            DriverName: vehicleData.currentDriverName,
            gps: {
              latitude: item.gps.latitude,
              longitude: item.gps.longitude,
              Altitude: item.gps.altitude,
              Angle: item.gps.angle,
              satellites: item.gps.satellites,
              speed: item.gps.speed,
              speedUnit: clientData.typeOfUnit + " " + "/Hr",
              speedWithUnitDesc,
            },
            OSM: osmElements,
            ignition: ignitionValue,
            timestamp: timestampConverted,
            timestampNotParsed: item.timestamp,
            vehicleEventList: [],
            dualCam: false,
            frontCameraDualCamVerify: false,
            frontCameraString: "",
            rearCameraDualCamVerify: false,
            rearCameraString: "",
          };

          const redisClinetIdData = await redisClient.get(clientId);

          if (!redisClinetIdData) {
            const wrappedData = { cacheList: [payloadSocket] };
            emitDataToSocketByClientId(clientData, wrappedData);
            await redisSetData(clientId, wrappedData);
          } else {
            const redisData = JSON.parse(redisClinetIdData);

            const indexToUpdate = redisData.cacheList.findIndex(
              (item) => item.IMEI === IMEI
            );
            if (indexToUpdate !== -1) {
              // This means that IMEI exists so we have to update the data after checking timestamps
              const existingTimestamp = new Date(
                redisData.cacheList[indexToUpdate].timestampNotParsed
              );
              const newTimestamp = new Date(payloadSocket.timestampNotParsed);

              // Check if the new timestamp is not older and not the same as the existing one
              if (newTimestamp >= existingTimestamp) {
                redisData.cacheList[indexToUpdate] = payloadSocket;
                emitDataToSocketByClientId(clientData, redisData);
                await redisSetData(clientId, redisData);
              }
              if (newTimestamp == existingTimestamp) {
                console.log("Duplicate Record Found", { IMEI, clientId });
                //  TODO: Later if any logic is required.
              }
              if (newTimestamp <= existingTimestamp) {
                console.log("Old Record Found", { IMEI, clientId });
                //  TODO: Later if any logic is required.
              }
            } else {
              //Client exists For new vehicle:
              redisData.cacheList.push(payloadSocket);
              emitDataToSocketByClientId(clientData, redisData);
              await redisSetData(clientId, redisData);
            }
          }
        }

        // This is an acknowledgment for data received in which we have to send total number of data being received by the device.
        let writer = new binutils.BinaryWriter();
        writer.WriteInt32(avl.number_of_data);
        let response = writer.ByteBuffer;
        try {
          // This breaks if vehicle closes connections from whatever reason so the server won't be able to write.
          c.write(response);
        } catch (e) {
          console.log("This vehicle has been disconneced", c);
        }
      }
    });
  });

  if (PARSER_PORT) {
    serverParser.listen(PARSER_PORT, () => {
      console.log("Parser started at port ", PARSER_PORT);
    });
  } else {
    console.log("Please set PARSER_PORT in .env file.");
  }
}

main();
