require("dotenv").config();
const https = require("https");
const server = require("https");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const axios = require("axios");
const express = require("express");

const { mongoose } = require("./utils/mongoose.service");
const { fetchLocationData } = require("./utils/fetchLocationData");

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
  rejectUnauthorized: false
};

const app = express();
app.use(
  cors({
    origin: "*"
  })
);
const httpsAgent = new https.Agent({ rejectUnauthorized: false });
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
// function isPointInPolygon(point, polygon) {
//   const x = point.x;
//   const y = point.y;
//   const numVertices = polygon.length;
//   let inside = false;

//   // Perform the ray casting algorithm:
//   for (let i = 0, j = numVertices - 1; i < numVertices; j = i++) {
//     const xi = polygon[i].x;
//     const yi = polygon[i].y;
//     const xj = polygon[j].x;
//     const yj = polygon[j].y;

//     // Check if ray intersects with polygon edge:
//     if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
//       inside = !inside;
//     }
//   }

//   return inside;
// }
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
      DateTimeDevice,
      eventId
    } = req.body;
    let osmElements = null;
    if (clientId != "65575c79332051f73cb9a06b") {
      osmElements = await fetchLocationData(gps.latitude, gps.longitude);
    }

    var date = new Date();

    const localDate = date.toLocaleDateString();
    const localTime = date.toLocaleTimeString();

    const payloadMongo = {
      clientId,
      vehicleReg,
      DriverName,
      deviceIMEI: IMEI,
      Priority: Priority,
      DateTime: new Date(timestamp),
      DateTimeDevice,
      ServerDateTime: localDate + " " + localTime,
      GpsElement: {
        Y: gps?.latitude,
        X: gps?.longitude,
        Altitude: gps?.altitude,
        Angle: gps?.angle,
        Satellites: gps?.satellites,
        Speed: gps?.speed
      },
      OsmElement: osmElements != null ? osmElements : null,
      IoElement: {
        EventId: eventId,
        PropertiesCount: ioElements.length,
        Properties: ioElements.map((item) => {
          return {
            _id: item.id,
            Value: item.value,
            label: item.label,
            valueHuman: item.valueHuman
          };
        }),
        OriginType: null
      }
    };

    const collectionName = `avl_${clientId}_today`;
    await mongoose.connection.db
      .collection(collectionName)
      .insertOne(payloadMongo);
    console.log(`Data inserted in collection: ${collectionName}`);
    fs.appendFileSync(
      "server.txt",
      `Data inserted in collection: ${collectionName}\n`,
      (e, r) => {}
    );

    //ignitionOff
    if (
      eventId == 239 &&
      ioElements.filter((item) => {
        return item.id == 239;
      })[0]?.value == 0
    ) {
      console.log(
        `ignitionOff Event in vehicle: ${collectionName}/${vehicleReg}`
      );
      fs.appendFileSync(
        "server.txt",
        `ignitionOff Event in vehicle: ${collectionName}/${vehicleReg} \n`,
        (e, r) => {}
      );
      try {
        axios.post(
          "https://backend.vtracksolutions.com/eventshandling/ignitionOff",
          {
            clientId,
            vehicleReg,
            dateTime: DateTimeDevice,
            speed: gps?.speed,
            lat: gps?.latitude,
            lng: gps?.longitude,
            zonename: ""
          },
          {
            httpsAgent,
            "Content-Type": "application/json"
          }
        );
      } catch (err) {
        console.log(
          `Error on ignitionOff Event in vehicle: ${collectionName}/${vehicleReg} : ${err.message}`
        );
        fs.appendFileSync(
          "server.txt",
          `Error on ignitionOff Event in vehicle: ${collectionName}/${vehicleReg} : ${err.message}\n`,
          (e, r) => {}
        );
      }
    }
    //ignitionOn
    if (
      eventId == 239 &&
      ioElements.filter((item) => {
        return item.id == 239;
      })[0]?.value == 1
    ) {
      console.log(
        `ignitionOn Event in vehicle: ${collectionName}/${vehicleReg}`
      );
      fs.appendFileSync(
        "server.txt",
        `ignitionOn Event in vehicle: ${collectionName}/${vehicleReg}\n`,
        (e, r) => {}
      );
      try {
        axios.post(
          "https://backend.vtracksolutions.com/eventshandling/ignitionOn",
          {
            clientId,
            vehicleReg,
            dateTime: DateTimeDevice,
            speed: gps?.speed,
            lat: gps?.latitude,
            lng: gps?.longitude,
            zonename: ""
          },
          {
            httpsAgent,
            "Content-Type": "application/json"
          }
        );
      } catch (err) {
        console.log(
          `Error on ignitionOn Event in vehicle: ${collectionName}/${vehicleReg} : ${err.message}`
        );
        fs.appendFileSync(
          "server.txt",
          `Error on ignitionOn Event in vehicle: ${collectionName}/${vehicleReg} : ${err.message}\n`,
          (e, r) => {}
        );
      }
    }

    //harshBreak
    if (
      eventId == 253 &&
      ioElements.filter((item) => {
        return item.id == 253;
      })[0]?.value == 2
    ) {
      console.log(
        `Harshbreak Event in vehicle: ${collectionName}/${vehicleReg}`
      );
      fs.appendFileSync(
        "server.txt",
        `Harshbreak Event in vehicle: ${collectionName}/${vehicleReg} \n`,
        (e, r) => {}
      );
      try {
        axios.post(
          "https://backend.vtracksolutions.com/eventshandling/harshBreak",
          {
            clientId,
            vehicleReg,
            dateTime: DateTimeDevice,
            speed: gps?.speed,
            lat: gps?.latitude,
            lng: gps?.longitude,
            zonename: ""
          },
          {
            httpsAgent,
            "Content-Type": "application/json"
          }
        );
      } catch (err) {
        console.log(
          `Error on harshBreak Event in vehicle: ${collectionName}/${vehicleReg} : ${err.message}`
        );
        fs.appendFileSync(
          "server.txt",
          `Error on harshBreak Event in vehicle: ${collectionName}/${vehicleReg} : ${err.message}\n`,
          (e, r) => {}
        );
      }
    }
    //harshCornering
    if (
      eventId == 253 &&
      ioElements.filter((item) => {
        return item.id == 253;
      })[0]?.value == 3
    ) {
      console.log(
        `harshCornering Event in vehicle: ${collectionName}/${vehicleReg}`
      );
      fs.appendFileSync(
        "server.txt",
        `harshCornering Event in vehicle: ${collectionName}/${vehicleReg} \n`,
        (e, r) => {}
      );
      try {
        axios.post(
          "https://backend.vtracksolutions.com/eventshandling/harshCornering",
          {
            clientId,
            vehicleReg,
            dateTime: DateTimeDevice,
            speed: gps?.speed,
            lat: gps?.latitude,
            lng: gps?.longitude,
            zonename: ""
          },
          {
            httpsAgent,
            "Content-Type": "application/json"
          }
        );
      } catch (err) {
        console.log(
          `Error on harshCornering Event in vehicle: ${collectionName}/${vehicleReg} : ${err.message}`
        );
        fs.appendFileSync(
          "server.txt",
          `Error on harshCornering Event in vehicle: ${collectionName}/${vehicleReg} : ${err.message}\n`,
          (e, r) => {}
        );
      }
    }
    //harshAcceleration
    if (
      eventId == 253 &&
      ioElements.filter((item) => {
        return item.id == 253;
      })[0]?.value == 1
    ) {
      console.log(
        `harshAcceleration Event in vehicle: ${collectionName}/${vehicleReg}`
      );
      fs.appendFileSync(
        "server.txt",
        `harshAcceleration Event in vehicle: ${collectionName}/${vehicleReg} \n`,
        (e, r) => {}
      );
      try {
        axios.post(
          "https://backend.vtracksolutions.com/eventshandling/harshAcceleration",
          {
            clientId,
            vehicleReg,
            dateTime: DateTimeDevice,
            speed: gps?.speed,
            lat: gps?.latitude,
            lng: gps?.longitude,
            zonename: ""
          },
          {
            httpsAgent,
            "Content-Type": "application/json"
          }
        );
      } catch (err) {
        console.log(
          `Error on harshAcceleration Event in vehicle: ${collectionName}/${vehicleReg} : ${err.message}`
        );
        fs.appendFileSync(
          "server.txt",
          `Error on harshAcceleration Event in vehicle: ${collectionName}/${vehicleReg} : ${err.message}\n`,
          (e, r) => {}
        );
      }
    }

    //overspeed
    if (
      eventId == 255 &&
      ioElements.filter((item) => {
        return item.id == 255;
      }).length > 0
    ) {
      console.log(
        `overspeed Event in vehicle: ${collectionName}/${vehicleReg}`
      );
      fs.appendFileSync(
        "server.txt",
        `overspeed Event in vehicle: ${collectionName}/${vehicleReg} \n`,
        (e, r) => {}
      );
      try {
        axios.post(
          "https://backend.vtracksolutions.com/eventshandling/overSpeeding",
          {
            clientId,
            vehicleReg,
            dateTime: DateTimeDevice,
            speed: gps?.speed,
            lat: gps?.latitude,
            lng: gps?.longitude,
            zonename: ""
          },
          {
            httpsAgent,
            "Content-Type": "application/json"
          }
        );
      } catch (err) {
        console.log(
          `Error on overSpeeding Event in vehicle: ${collectionName}/${vehicleReg} : ${err.message}`
        );
        fs.appendFileSync(
          "server.txt",
          `Error on overSpeeding Event in vehicle: ${collectionName}/${vehicleReg} : ${err.message}\n`,
          (e, r) => {}
        );
      }
    }

    // const zones = await zoneModel.findByClientId(clientId);
    // for (var zone in zones) {
    //   if (zone.zoneType === "Circle") {
    //     const zoneLat = parseFloat(zone.centerPoints.split(".")[0]); // Parse zone latitude as float
    //     const zoneLng = parseFloat(zone.centerPoints.split(".")[1]); // Parse zone longitude as float
    //     const zoneDiameter = parseFloat(zone.latlngCordinates);

    //     // Calculate distance from point to zone center using Pythagorean theorem
    //     const distance = Math.sqrt(
    //       Math.pow(gps.latitude - zoneLat, 2) +
    //         Math.pow(gps.longitude - zoneLng, 2)
    //     );

    //     // Check if point is within the zone's circle
    //     if (distance <= zoneDiameter / 2) {
    //     }
    //   } else {
    //     let jArray = JSON.parse(zone.latlngCordinates).map((latlngc) => {
    //       return { y: latlngc.lat, x: latlngc.lng };
    //     });
    //     isPointInPolygon({ x: gps.latitude, y: gps.longitude }, jArray);
    //   }
    // }
    //targetEnteredZone
    // if (2 == 2) {
    //   console.log(
    //     `overspeed Event in vehicle: ${collectionName}/${vehicleReg}`
    //   );
    //   fs.appendFileSync(
    //     "server.txt",
    //     `overspeed Event in vehicle: ${collectionName}/${vehicleReg} \n`,
    //     (e, r) => {}
    //   );
    //   try {
    //     axios.post(
    //       "https://backend.vtracksolutions.com/eventshandling/targetEnteredZone",
    //       {
    //         clientId,
    //         vehicleReg,
    //         dateTime: DateTimeDevice,
    //         speed: gps?.speed,
    //         lat: gps?.latitude,
    //         lng: gps?.longitude,
    //         zonename: ""
    //       },
    //       {
    //         httpsAgent,
    //         "Content-Type": "application/json"
    //       }
    //     );
    //   } catch (err) {
    //     console.log(
    //       `Error on overSpeeding Event in vehicle: ${collectionName}/${vehicleReg} : ${err.message}`
    //     );
    //     fs.appendFileSync(
    //       "server.txt",
    //       `Error on overSpeeding Event in vehicle: ${collectionName}/${vehicleReg} : ${err.message}\n`,
    //       (e, r) => {}
    //     );
    //   }
    // }
    // //targetLeftZone
    // if (2 == 2) {
    //   console.log(
    //     `overspeed Event in vehicle: ${collectionName}/${vehicleReg}`
    //   );
    //   fs.appendFileSync(
    //     "server.txt",
    //     `overspeed Event in vehicle: ${collectionName}/${vehicleReg} \n`,
    //     (e, r) => {}
    //   );
    //   try {
    //     axios.post(
    //       "https://backend.vtracksolutions.com/eventshandling/targetLeftZone",
    //       {
    //         clientId,
    //         vehicleReg,
    //         dateTime: DateTimeDevice,
    //         speed: gps?.speed,
    //         lat: gps?.latitude,
    //         lng: gps?.longitude,
    //         zonename: ""
    //       },
    //       {
    //         httpsAgent,
    //         "Content-Type": "application/json"
    //       }
    //     );
    //   } catch (err) {
    //     console.log(
    //       `Error on overSpeeding Event in vehicle: ${collectionName}/${vehicleReg} : ${err.message}`
    //     );
    //     fs.appendFileSync(
    //       "server.txt",
    //       `Error on overSpeeding Event in vehicle: ${collectionName}/${vehicleReg} : ${err.message}\n`,
    //       (e, r) => {}
    //     );
    //   }
    // }

    // res.send(payloadMongo)
  } catch (err) {
    console.log(
      `Error in insertion in collection: ${collectionName} is ${err.message}`
    );
    fs.appendFileSync(
      "server.txt",
      `Error in insertion in collection: ${collectionName} is ${err.message}\n`,
      (e, r) => {}
    );

    // res.send()
  }
});

const WEB_SERVER = server.createServer(optSsl, (req, res) => {
  app.handle(req, res);
});
WEB_SERVER.listen(80, (err) => {
  if (!err) {
    console.log("server is running");
  }
});
