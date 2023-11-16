require("dotenv").config();
// const net = require("net");
// const axios = require("axios");
// const Parser = require("teltonika-parser-ex");
// const binutils = require("binutils64");
// const moment = require("moment-timezone");
// const { Server } = require("socket.io");
// const { v4: uuidv4 } = require("uuid");
const server = require("https");
const path = require("path");
const fs = require("fs");
// const GPRS = require("./GPRS");
const cors = require("cors");
// const redisConnectionHelper = require("./utils/redisConnectionHelper");

//Importing Models
// const deviceAssignImport = require("./Modules/DeviceAssign/model/deviceassign.model");
// const vehicleImport = require("./Modules/Vehicles/model/vehicle.model");
// const clientImport = require("./Modules/Clients/model/client.model");
// const deviceImport = require("./Modules/Devices/model/device.model");
// const gprsCommandImport = require("./Modules/GPRSCOMMAND/model/gprscommand.model");
const express = require("express");
// const { mongo } = require("mongoose");
const { mongoose } = require("./utils/mongoose.service");
const { fetchLocationData } = require("./utils/fetchLocationData");

var momentTz = require("moment-timezone");

// const deviceAssignModel = deviceAssignImport.model;
// const vehicleModel = vehicleImport.model;
// const clientModel = clientImport.model;
// const deviceModel = deviceImport.model;
// const gprsModel = gprsCommandImport.model;

// var deviceConnections = [];

// const PARSER_PORT = 1101;
const folder = path.join(__dirname, "ssl");
const privateKey = fs.readFileSync(path.join(folder, "server_key.pem"), "utf8");
const certificate = fs.readFileSync(
  path.join(folder, "server_cert.pem"),
  "utf8"
);

const optSsl = {
  key: privateKey,
  cert: certificate,
  ca: [certificate],
  requestCert: false, // put true if you want a client certificate, tested and it works
  rejectUnauthorized: false,
};

const app = express();
app.use(
  cors({
    origin: "*",
  })
);
// app.use(bodyParser.json({ limit: "100mb" }));
app.use(express.json());
// app.get("/", (req, res) => {
//   res.send("Wellcome to nodejs parser");
// });

app.get("/", async (req, res) => {
  try {
    const { id } = req.params;

    const value = await redisClient.get(id);
    var record = {};
    var cacheListObj = JSON.parse(value);

    var cacheList = cacheListObj.cacheList;
    var sortedList = cacheList.sort(GetSortOrder("vehicleReg"));
    var cacheObj = { cacheList: sortedList };
    // cacheObj["cacheList"] = sortedList;
    record["id"] = id;
    record["Value"] = JSON.stringify(cacheObj);

    return res.status(200).json({ data: record });
  } catch (err) {
    return res.status(200).json({ data: null, message: err.message });
  }
});
app.post("/data", async (req, res) => {
  try {
    const {
      IMEI,
      clientId,
      vehicleReg,
      DriverName,
      gps,
      Priority,
      timestamp,
      ioElements,
      timeZone,
    } = req.body;

    // const osmElements = await fetchLocationData(gps.latitude, gps.longitude);

    const localDate = date.toLocaleDateString();
    const localTime = date.toLocaleTimeString();

    // momentTz(
    //   "November 16 2023 09:32:15 AM",
    //   "MMMM DD YYYY hh:mm:ss A",
    //   "America/Winnipage"
    // )
    //   .utc()
    //   .format("YYYY-MM-DDTHH:MM:ss");
    const payloadMongo = {
      clientId,
      vehicleReg,
      DriverName,
      deviceIMEI: IMEI,
      Priority: Priority,
      DateTime: momentTz(timestamp, "MMMM DD YYYY hh:mm:ss A", timeZone)
        .utc()
        .format("YYYY-MM-DDTHH:MM:ss"),
      DateTimeDevice: timestamp,
      ServerDateTime: localDate + " " + localTime,
      GpsElement: {
        Y: gps?.latitude,
        X: gps?.longitude,
        Altitude: gps?.altitude,
        Angle: gps?.angle,
        satellites: gps?.satellites,
        speed: gps?.speed,
      },
      OsmElement: null,
      IoElement: ioElements,
    };
    const collectionName = `avl_${clientId}_today`;
    await mongoose.connection.db
      .collection(collectionName)
      .insertOne(payloadMongo);
    res.send(payloadMongo);
  } catch (err) {
    res.send();
  }
});
const WEB_SERVER = server.createServer(optSsl, (req, res) => {
  app.handle(req, res);
});
WEB_SERVER.listen(80, (err) => {
  if (!err) {
    console.log("server2 is running");
  }
});

// async function main() {
//   const redisClient = await redisConnectionHelper();

//   const io = new Server({
//     cors: {
//       origin: "*",
//     },
//   });

//   // function createSocketLog(logData, response) {
//   //   // Disabling it for now because it generates too many logs for us to handle.
//   //   if (process.env.MONGO_LOG_SAVE == "true") {
//   //     try {
//   //       io.emit("logs", { ...logData, response });
//   //       // logsParserModel.create({ ...logData, response });
//   //       // const data = JSON.stringify({ ...logData, response });
//   //       // const API_CONFIG_LOGS = {
//   //       //   method: "post",
//   //       //   maxBodyLength: Infinity,
//   //       //   url: process.env.LOGS_URL,
//   //       //   headers: {
//   //       //     "Content-Type": "application/json",
//   //       //   },
//   //       //   data: data,
//   //       // };
//   //       // try {
//   //       //   //sends the data, don't listen to any response.
//   //       //   axios.request(API_CONFIG_LOGS).catch((er) => {
//   //       //     if (process.env.SHOW_CONSOLE_LOG == "true") {
//   //       //       console.log("Error creating MongoDB Log");
//   //       //     }
//   //       //   });
//   //       // } catch (e) {
//   //       //   console.log("storing log error", e);
//   //       // }
//   //     } catch (e) {
//   //       console.log("error creating log", e);
//   //     }
//   //   }
//   //   if (process.env.SHOW_CONSOLE_LOG == "true") {
//   //     if (response?.message) {
//   //       console.log("DEBUG_CONSOLE_LOG: ", response.message);
//   //     }
//   //   }
//   // }

//   // io.listen(WEB_SERVER);

//   // // io.on("connection", (socket) => {
//   // //   //This code is used to get current connected trackers with this server.
//   // //   // TODO: Implement security token in args so that not everyone can get this data.
//   // //   socket.on("getConnectedSockets", (arg) => {
//   // //     io.emit("getConnectedSocketsResponse", deviceConnections);
//   // //   });

//   // //   console.log("client socket connected", {
//   // //     id: socket.id,
//   // //     clientId: socket.handshake.query.clientId,
//   // //   });
//   // // });

//   // function emitDataToSocketByClientId(obj) {
//   //   const { device, clientData, vehicleData, sendData } = obj;
//   //   io.fetchSockets()
//   //     .then((sockets) => {
//   //       sockets.forEach((socket) => {
//   //         const socketClientId = socket.handshake.query.clientId;
//   //         if (
//   //           socketClientId ===
//   //           (clientData && clientData._id && clientData._id.toString())
//   //         ) {
//   //           socket.emit("message", sendData);
//   //           console.log("Data emitted to client", {
//   //             clientId: clientData?._id.toString(),
//   //             clientName: clientData?.clientName,
//   //             socketId: socket.id,
//   //           });
//   //         }
//   //       });
//   //     })
//   //     .catch(console.log);
//   // }

//   // async function redisSetData(key, value) {
//   //   try {
//   //     await redisClient.set(key, JSON.stringify(value));
//   //   } catch (e) {
//   //     console.log("Error setting redisData-1", IMEI, clientId, redisData);
//   //   }
//   // }

//   let serverParser = net.createServer((c) => {
//     // Keep this function here because we need "c" to send the data to the server.
//     async function sendGPRS(IMEI) {
//       // The function gets "Pending" command from the model and send the commands to the device and then marks it "Complete"
//       const GPRS_PENDING_COMMANDS_LIST = await gprsModel.find({
//         status: "Pending",
//         deviceIMEI: IMEI,
//       });
//       for (let i = 0; i < GPRS_PENDING_COMMANDS_LIST.length; i++) {
//         const commandCodec12 = GPRS.generateCodec12(
//           GPRS_PENDING_COMMANDS_LIST[i].commandtext
//         );

//         console.log("Processing Codec Command", {
//           commandtext: GPRS_PENDING_COMMANDS_LIST[i].commandtext,
//           commandCodec12,
//         });
//         c.write(Buffer.from(commandCodec12, "hex"));
//         await gprsModel.findByIdAndUpdate(GPRS_PENDING_COMMANDS_LIST[i].id, {
//           status: "Complete",
//         });
//       }
//     }

//     async function parseGPRS(buffer, IMEI) {
//       const hexa = buffer?.toString("hex");
//       if (!hexa) {
//         return;
//       }
//       const parsedCodec12 = GPRS.parseCodec12(hexa);
//       if (parsedCodec12?.command) {
//         gprsModel.create({
//           status: "Response",
//           deviceIMEI: IMEI,
//           commandtext: parsedCodec12?.command,
//         });
//       }
//     }

//     c.id = uuidv4();
//     console.log("Tracker connected", c.id);

//     c.on("end", () => {
//       console.log("Tracker disconnected", c.id);
//     });

//     c.on("data", async (data) => {
//       let buffer = data;
//       let parser = new Parser(buffer);

//       IMEI = parser.imei;
//       if (parser.isImei) {
//         if (parser.imei.length === 15) {
//           const device = await deviceModel.findOne({ deviceIMEI: IMEI });
//           if (!device) {
//             createSocketLog(
//               { IMEI: parser.imei },
//               {
//                 type: "ERROR",
//                 occursBeforeIMEIAcknowledgement: true,
//                 status: 404,
//                 message: "Device for this IMEI was not found",
//                 data: { parserDecodedData: parser },
//               }
//             );
//             return;
//           }

//           // deviceConnections = deviceConnections.filter(
//           //   (row) => row.IMEI !== parser.imei
//           // );
//           // deviceConnections.push({ id: c.id, IMEI: parser.imei });
//           if (
//             deviceConnections.includes((row) => {
//               return row.IMEI == parser.imei;
//             }) != -1
//           ) {
//             deviceConnections.push({ id: c.id, IMEI: parser.imei });
//           }
//           // console.log("Tracker acknowledged:", {
//           //   socketId: c.id,
//           //   IMEI: parser.imei,
//           // });
//           // sends 1 as acknowledgment so that device can send AVL packets.

//           createSocketLog(
//             { IMEI: parser.imei },
//             {
//               type: "INFO",
//               occursBeforeIMEIAcknowledgement: true,
//               status: 200,
//               message:
//                 "Device for this IMEI found. Sending Acknowledgment back to the device.",
//               data: { parserDecodedData: parser },
//             }
//           );
//           c.write(Buffer.alloc(1, 1));
//         }
//       } else {
//         const IMEI = deviceConnections.find((row) => row.id === c.id)?.IMEI;

//         if (!IMEI) {
//           createSocketLog(
//             {},
//             {
//               type: "ERROR",
//               status: 400,
//               message:
//                 "Device sent AVL packet assuming the client exists but the server could not find any device socket for this IMEI.",
//             }
//           );
//           return;
//         }
//         let avl = parser.getAvl();
//         if (!avl) {
//           createSocketLog(
//             { IMEI: IMEI },
//             {
//               type: "ERROR",
//               status: 400,
//               message: "AVL packet could not be properly parsed.",
//             }
//           );

//           return;
//         }
//         avl = { ...avl, IMEI };
//         console.log("AVL Data Packet received from IMEI", avl?.IMEI);
//         const device = await deviceModel.findOne({ deviceIMEI: IMEI });
//         if (!device) {
//           createSocketLog(
//             { IMEI },
//             {
//               type: "ERROR",
//               status: 400,
//               message: "Device for this IMEI was not found.",
//             }
//           );
//           return;
//         }
//         const deviceAssignData = await deviceAssignModel.findOne({
//           DeviceId: device?._id,
//         });

//         if (!deviceAssignData) {
//           createSocketLog(
//             { IMEI: IMEI, deviceId: device?._id.toString(), device: device },
//             {
//               type: "ERROR",
//               status: 400,
//               message: "The device has not been assigned",
//             }
//           );
//           return;
//         }

//         const clientDataPromise = clientModel.findOne({
//           _id: deviceAssignData.clientId,
//         });

//         const vehicleDataPromise = vehicleModel.findOne({
//           _id: deviceAssignData.VehicleId,
//         });
//         const [clientData, vehicleData] = await Promise.all([
//           clientDataPromise,
//           vehicleDataPromise,
//         ]);

//         let logData = {
//           IMEI: IMEI,
//           clientId: clientData?._id.toString(),
//           vehicleId: vehicleData?._id.toString(),
//           deviceId: device?._id.toString(),
//           client: clientData,
//           device: device,
//           vehicle: vehicleData,
//         };

//         if (!clientData || !vehicleData) {
//           createSocketLog(logData, {
//             type: "ERROR",
//             status: 404,
//             message: "Either client data or vehicle data could not be found.",
//           });
//           return;
//         }

//         if (!device || !deviceAssignData || !clientData || !vehicleData) {
//           return;
//         }

//         const clientId = clientData?._id.toString();
//         const vehicleId = vehicleData?._id.toString();

//         try {
//           sendGPRS(IMEI);
//         } catch (e) {
//           console.log(
//             createSocketLog(
//               { IMEI },
//               {
//                 type: "ERROR",
//                 status: 500,
//                 message: "Error in sending GPRS",
//               }
//             )
//           );
//         }

//         if (!avl?.records || avl?.records?.length === 0) {
//           try {
//             parseGPRS(buffer, IMEI);
//           } catch (e) {
//             console.log(
//               createSocketLog(
//                 { IMEI },
//                 {
//                   type: "ERROR",
//                   status: 500,
//                   message: "Error in parsing GPRS",
//                 }
//               )
//             );
//           }
//           createSocketLog(logData, {
//             type: "ERROR",
//             status: 404,
//             message: "AVL Records Could Not Be Found In Packet",
//             data: { avl },
//           });

//           return;
//         }

//         for (const item of avl?.records) {
//           // Disabling OSM Logic from parser due to extreme network resources being used.
//           const osmElements = await fetchLocationData(
//             item.gps.latitude,
//             item.gps.longitude
//           );
//           if (osmElements?.isErrorOSM) {
//             createSocketLog(logData, {
//               type: "ERROR",
//               status: 404,
//               message: "Open Street Map Error",
//               data: {
//                 avlRecord: item,
//               },
//             });
//           }

//           if (item?.gps?.latitude == 0 || item?.gps?.longitude == 0) {
//             createSocketLog(
//               { IMEI: avl?.IMEI },
//               {
//                 type: "ERROR",
//                 status: 400,
//                 message: "Latitude and Longitude is 0.",
//               }
//             );
//             return;
//           }

//           let speedWithUnit = "";
//           if (clientData.typeOfUnit === "Mile") {
//             let convertedSpeed = item.gps.speed / 1.609;
//             speedWithUnit = Math.round(convertedSpeed) + " " + "Mph";
//           } else {
//             let convertedSpeed = item.gps.speed;
//             speedWithUnit = Math.round(convertedSpeed) + " " + "Kph";
//           }

//           let ignitionElement = item?.ioElements?.find(
//             (element) => element?.label === "Ignition"
//           );
//           let ignitionValue = ignitionElement ? ignitionElement?.value : null;

//           let timestampConverted = moment(item.timestamp)
//             .tz(clientData.timeZone)
//             .format("MMMM DD YYYY hh:mm:ss A");
//           // project payload according to our required payload in mongodb
//           const payloadSocket = {
//             IMEI: avl?.IMEI,
//             clientId,
//             vehicleId,
//             vehicleMake: vehicleData?.vehicleMake,
//             vehicleModel: vehicleData?.vehicleModel,
//             vehicleNo: vehicleData?.vehicleNo,
//             vehicleReg: vehicleData?.vehicleReg,
//             DriverName: vehicleData?.currentDriverName,
//             gps: {
//               latitude: item?.gps?.latitude,
//               longitude: item?.gps?.longitude,
//               Altitude: item?.gps?.altitude,
//               Angle: item?.gps?.angle,
//               satellites: item?.gps?.satellites,
//               speed: item?.gps?.speed,
//               speedUnit: clientData?.typeOfUnit + "/Hr",
//               speedWithUnit,
//             },
//             OSM: osmElements,
//             ignition: ignitionValue,
//             timestamp: timestampConverted,
//             timestampNotParsed: item?.timestamp,
//             vehicleEventList: [],
//             dualCam: false,
//             frontCameraDualCamVerify: false,
//             frontCameraString: "",
//             rearCameraDualCamVerify: false,
//             rearCameraString: "",
//           };
//           const payloadMongo = {
//             clientId,
//             vehicleReg: vehicleData?.vehicleReg,
//             DriverName: vehicleData?.currentDriverName,
//             deviceIMEI: avl?.IMEI,
//             Priority: item.Priority,
//             DateTime: new Date(),
//             DateTimeDevice: timestamp,
//             gps: {
//               Y: item?.gps?.latitude,
//               X: item?.gps?.longitude,
//               Altitude: item?.gps?.altitude,
//               Angle: item?.gps?.angle,
//               satellites: item?.gps?.satellites,
//               speed: item?.gps?.speed,
//               speedUnit: clientData?.typeOfUnit + " " + "/Hr",
//               speedWithUnit,
//             },
//             OSM: osmElements,
//             IoElement: item?.ioElements,
//           };
//           // add data into mongo collection

//           logData = { payloadSocket: payloadSocket };
//           let redisClinetIdData;
//           // Implement socket here to send `avl_record` after being parsed.
//           // io.emit("avl_record", payloadSocket);

//           if (process.env.SEND_DATA_TO_PARSER_PROCESSOR == "true") {
//             try {
//               const API_CONFIG_PARSER_PROCESSOR = {
//                 method: "post",
//                 maxBodyLength: Infinity,
//                 url: process.env.PARSER_PROCESSOR_URL,
//                 headers: {
//                   "Content-Type": "application/json",
//                 },
//                 data: JSON.stringify(payloadSocket),
//               };
//               //sends the data in async method so that the code is not stopped here.
//               axios
//                 .request(API_CONFIG_PARSER_PROCESSOR)
//                 .then((el) => {
//                   createSocketLog(logData, {
//                     type: "INFO",
//                     status: 200,
//                     message: "AVL Record Stored.",
//                   });
//                 })
//                 .catch((er) => {
//                   createSocketLog(logData, {
//                     type: "ERROR",
//                     status: 400,
//                     message: "Error storing AVL Record",
//                   });
//                 });
//             } catch (e) {
//               createSocketLog(logData, {
//                 type: "ERROR",
//                 status: 400,
//                 message: "Error storing AVL Record",
//               });
//             }
//           }

//           try {
//             redisClinetIdData = await redisClient.get(clientId);
//           } catch (e) {
//             createSocketLog(logData, {
//               type: "ERROR",
//               status: 400,
//               message: "Error getting data from redisClient from clientId",
//             });
//           }

//           if (!redisClinetIdData) {
//             const wrappedData = { cacheList: [payloadSocket] };
//             //emit data to socket by clientId
//             try {
//               emitDataToSocketByClientId({
//                 device,
//                 clientData,
//                 vehicleData,
//                 sendData: wrappedData,
//               });
//               createSocketLog(logData, {
//                 type: "INFO",
//                 status: 200,
//                 message:
//                   "Socket data sent to the client. This is very first data and thus nothing exists in redis. Now setting the data into the redis.",
//               });
//             } catch (e) {
//               createSocketLog(logData, {
//                 type: "ERROR",
//                 status: 400,
//                 message: "Error sending data to the client socket.",
//               });
//             }
//             // set data in redis
//             try {
//               await redisSetData(clientId, wrappedData);
//               createSocketLog(logData, {
//                 type: "INFO",
//                 status: 200,
//                 message: "Data has been set to the redis.",
//               });
//             } catch (e) {
//               createSocketLog(logData, {
//                 type: "ERROR",
//                 status: 400,
//                 message: "Error setting data to the redis.",
//               });
//             }
//           } else {
//             const redisData = JSON.parse(redisClinetIdData);
//             const indexToUpdate = redisData.cacheList.findIndex(
//               (item) => item.IMEI === IMEI
//             );
//             if (indexToUpdate !== -1) {
//               // This means that IMEI exists so we have to update the data after checking timestamps
//               const existingTimestamp = new Date(
//                 redisData.cacheList[indexToUpdate].timestamp
//               );
//               const newTimestamp = new Date(payloadSocket.timestamp);

//               // Check if the new timestamp is not older and not the same as the existing one
//               if (newTimestamp > existingTimestamp) {
//                 redisData.cacheList[indexToUpdate] = payloadSocket;
//                 try {
//                   emitDataToSocketByClientId({
//                     device,
//                     clientData,
//                     vehicleData,
//                     sendData: redisData,
//                   });
//                   createSocketLog(logData, {
//                     type: "INFO",
//                     status: 200,
//                     message:
//                       "Updated Socket data with respect to timestamp has been sent to the client. Data updated in previous cacheList.",
//                   });
//                 } catch (e) {
//                   createSocketLog(logData, {
//                     type: "ERROR",
//                     status: 400,
//                     message:
//                       "Error sending updated to the client socket with respect to timestamp in already made cacheList.",
//                   });
//                 }

//                 try {
//                   await redisSetData(clientId, redisData);
//                   createSocketLog(logData, {
//                     response: {
//                       type: "INFO",
//                       status: 200,
//                       message:
//                         "Updated data has been set in client redis cache.",
//                     },
//                   });
//                 } catch (e) {
//                   createSocketLog(logData, {
//                     response: {
//                       type: "ERROR",
//                       status: 400,
//                       message: "Error setting updated cacheList to the redis.",
//                     },
//                   });
//                 }
//               }
//               if (newTimestamp == existingTimestamp) {
//                 console.log("Duplicate Record Found", { IMEI, clientId });
//                 createSocketLog(logData, {
//                   type: "ERROR",
//                   status: 400,
//                   message: "Duplicate Record Found",
//                 });
//                 //  TODO: Later if any logic is required.
//               }
//               if (newTimestamp < existingTimestamp) {
//                 // console.log("Old Record Found", { IMEI, clientId });
//                 //  TODO: Later if any logic is required.
//                 // emitDataToSocketByClientId({clientData, redisData}); // REMOVE THIS LATER ON AFTER TESTING
//                 createSocketLog(logData, {
//                   type: "ERROR",
//                   status: 400,
//                   message: `Old Record Found ${IMEI}`,
//                 });
//               }
//             } else {
//               //Client exists but the device is new so index could not be found in cacheList, thus adding new device into cacheList.

//               redisData.cacheList.push(payloadSocket);
//               try {
//                 emitDataToSocketByClientId({
//                   device,
//                   clientData,
//                   vehicleData,
//                   sendData: redisData,
//                 });
//                 createSocketLog(logData, {
//                   type: "INFO",
//                   status: 200,
//                   message:
//                     "Updated Socket data with respect to timestamp has been sent to the client. This is a new device first time being added to cacheList.",
//                 });
//               } catch (e) {
//                 createSocketLog(logData, {
//                   type: "ERROR",
//                   status: 400,
//                   message:
//                     "Error sending updated to the client socket with respect to timestamp in already made cacheList. This is a new device first time being added to cacheList.",
//                 });
//               }

//               try {
//                 await redisSetData(clientId, redisData);
//                 createSocketLog(logData, {
//                   response: {
//                     type: "INFO",
//                     status: 200,
//                     message:
//                       "Updated data has been set in client redis cache. This is a new device first time being added to cacheList.",
//                   },
//                 });
//               } catch (e) {
//                 createSocketLog(logData, {
//                   response: {
//                     type: "ERROR",
//                     status: 400,
//                     message:
//                       "Error setting updated cacheList to the redis. This is a new device first time being added to cacheList.",
//                   },
//                 });
//               }
//             }
//           }
//         }

//         // This is an acknowledgment for data received in which we have to send total number of data being received by the device.

//         let writer = new binutils.BinaryWriter();
//         writer.WriteInt32(avl.number_of_data);
//         let response = writer.ByteBuffer;
//         try {
//           // This breaks if vehicle closes connections from whatever reason so the server won't be able to write.
//           c.write(response);
//           createSocketLog(logData, {
//             response: {
//               type: "INFO",
//               status: 200,
//               message:
//                 "Server has sent acknowledgment of AVL data back to the tracker.",
//             },
//           });
//         } catch (e) {
//           console.log("This vehicle has been disconneced", c);
//         }
//       }
//     });
//   });

//   if (PARSER_PORT) {
//     serverParser.listen(PARSER_PORT, () => {
//       console.log("Parser started at port ", PARSER_PORT);
//     });
//   } else {
//     console.log("Please set PARSER_PORT in .env file.");
//   }
// }

// try {
//  main();
// } catch (err) {
//   console.log(err);
//   console.log(parseErr(err));
//   main();
// }

// function parseErr(err) {
//   return new Error(err).stack
//     .replace(/^.*[\\/]node_modules[\\/].*$/gm, "")
//     .replace(/\n+/g, "\n");
// }
