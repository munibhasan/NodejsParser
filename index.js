require("dotenv").config();
const https = require("https");
const server = require("https");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const axios = require("axios");
const express = require("express");

const moment = require("moment-timezone");
const clientImport = require("./Modules/Clients/model/client.model");
const clientModel = clientImport.model;
var ObjectId = require("mongodb").ObjectId;
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
      eventId,
      zone,
      users
    } = req.body;
    let { OsmElement } = req.body;
    let { timeZone } = req.body;
    // if (clientId != "65575c79332051f73cb9a06b") {
    // }
    let OsmElement2 = OsmElement;
    if (OsmElement == null) {
      OsmElement = await fetchLocationData(gps.latitude, gps.longitude);
    }

    if (timeZone === undefined) {
      timeZone = (
        await clientModel.findOne({
          _id: new ObjectId(clientId)
        })
      ).timeZone;
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
      zone,
      DateTime: new Date(timestamp),
      DateTimeDevice,
      ServerDateTime: localDate + " " + localTime,
      users,
      GpsElement: {
        Y: gps?.latitude,
        X: gps?.longitude,
        Altitude: gps?.altitude,
        Angle: gps?.angle,
        Satellites: gps?.satellites,
        Speed: gps?.speed
      },
      OsmElement: OsmElement != null ? OsmElement : null,
      OsmElement2,
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
      (e, r) => {
        fs.unlinkSync("server.txt");
      }
    );
    const d1 = moment(timestamp).tz(timeZone).format("YYYY-MM-DDTHH:mm:ss"); //input time
    const d2 = moment(date).tz(timeZone).format("YYYY-MM-DDTHH:mm:ss"); //current time
    const currentTime = d2.split("T")[1].split(":");
    const inputTime = d1.split("T")[1].split(":");
    const currentDate = d2.split("T")[0].split("-");
    const inputDate = d1.split("T")[0].split("-");
    const diffinyear = currentDate[0] - inputDate[0];
    const diffinmonth = currentDate[1] - inputDate[1];
    const diffinday = currentDate[2] - inputDate[2];
    const diffinhour = (currentTime[0] - inputTime[0]) * 60;
    const diffinminutes = currentTime[1] - inputTime[1];

    const diff = diffinhour + diffinminutes;

    if (
      diffinyear == 0 &&
      diffinmonth == 0 &&
      diffinday == 0 &&
      diff <= 5 &&
      diff >= 0
    ) {
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
          (e, r) => {
            fs.unlinkSync("server.txt");
          }
        );
        try {
          axios
            .post(
              `${process.env.BackendUrl}/eventshandling/ignitionOff`,
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
            )
            .then((response) => {
              // Handle successful response
            })
            .catch((error) => {
              if (error.response && error.response.status === 502) {
                // Handle 502 error specifically
                console.error("Bad Gateway encountered");
                // Implement recovery logic or retry mechanism
              } else {
                // Handle other errors
              }
            });
        } catch (err) {
          console.log(
            `Error on ignitionOff Event in vehicle: ${collectionName}/${vehicleReg} : ${err.message}`
          );
          fs.appendFileSync(
            "server.txt",
            `Error on ignitionOff Event in vehicle: ${collectionName}/${vehicleReg} : ${err.message}\n`,
            (e, r) => {
              fs.unlinkSync("server.txt");
            }
          );
        }
        await mongoose.connection.db
          .collection("events")
          .insertOne({ ...payloadMongo, event: "ignitionOff" });
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
          (e, r) => {
            fs.unlinkSync("server.txt");
          }
        );
        try {
          axios
            .post(
              `${process.env.BackendUrl}/eventshandling/ignitionOn`,
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
            )
            .then((response) => {
              // Handle successful response
            })
            .catch((error) => {
              if (error.response && error.response.status === 502) {
                // Handle 502 error specifically
                console.error("Bad Gateway encountered");
                // Implement recovery logic or retry mechanism
              } else {
                // Handle other errors
              }
            });
        } catch (err) {
          console.log(
            `Error on ignitionOn Event in vehicle: ${collectionName}/${vehicleReg} : ${err.message}`
          );
          fs.appendFileSync(
            "server.txt",
            `Error on ignitionOn Event in vehicle: ${collectionName}/${vehicleReg} : ${err.message}\n`,
            (e, r) => {
              fs.unlinkSync("server.txt");
            }
          );
        }
        await mongoose.connection.db
          .collection("events")
          .insertOne({ ...payloadMongo, event: "ignitionOn" });
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
          (e, r) => {
            fs.unlinkSync("server.txt");
          }
        );
        try {
          axios
            .post(
              `${process.env.BackendUrl}/eventshandling/harshBreak`,
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
            )
            .then((response) => {
              // Handle successful response
            })
            .catch((error) => {
              if (error.response && error.response.status === 502) {
                // Handle 502 error specifically
                console.error("Bad Gateway encountered");
                // Implement recovery logic or retry mechanism
              } else {
                // Handle other errors
              }
            });
        } catch (err) {
          console.log(
            `Error on harshBreak Event in vehicle: ${collectionName}/${vehicleReg} : ${err.message}`
          );
          fs.appendFileSync(
            "server.txt",
            `Error on harshBreak Event in vehicle: ${collectionName}/${vehicleReg} : ${err.message}\n`,
            (e, r) => {
              fs.unlinkSync("server.txt");
            }
          );
        }
        await mongoose.connection.db
          .collection("events")
          .insertOne({ ...payloadMongo, event: "harshBreak" });
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
          (e, r) => {
            fs.unlinkSync("server.txt");
          }
        );
        try {
          axios
            .post(
              `${process.env.BackendUrl}/eventshandling/harshCornering`,
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
            )
            .then((response) => {
              // Handle successful response
            })
            .catch((error) => {
              if (error.response && error.response.status === 502) {
                // Handle 502 error specifically
                console.error("Bad Gateway encountered");
                // Implement recovery logic or retry mechanism
              } else {
                // Handle other errors
              }
            });
        } catch (err) {
          console.log(
            `Error on harshCornering Event in vehicle: ${collectionName}/${vehicleReg} : ${err.message}`
          );
          fs.appendFileSync(
            "server.txt",
            `Error on harshCornering Event in vehicle: ${collectionName}/${vehicleReg} : ${err.message}\n`,
            (e, r) => {
              fs.unlinkSync("server.txt");
            }
          );
        }
        await mongoose.connection.db
          .collection("events")
          .insertOne({ ...payloadMongo, event: "harshCornering" });
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
          (e, r) => {
            fs.unlinkSync("server.txt");
          }
        );
        try {
          axios
            .post(
              `${process.env.BackendUrl}/eventshandling/harshAcceleration`,
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
            )
            .then((response) => {
              // Handle successful response
            })
            .catch((error) => {
              if (error.response && error.response.status === 502) {
                // Handle 502 error specifically
                console.error("Bad Gateway encountered");
                // Implement recovery logic or retry mechanism
              } else {
                // Handle other errors
              }
            });
        } catch (err) {
          console.log(
            `Error on harshAcceleration Event in vehicle: ${collectionName}/${vehicleReg} : ${err.message}`
          );
          fs.appendFileSync(
            "server.txt",
            `Error on harshAcceleration Event in vehicle: ${collectionName}/${vehicleReg} : ${err.message}\n`,
            (e, r) => {
              fs.unlinkSync("server.txt");
            }
          );
        }
        await mongoose.connection.db
          .collection("events")
          .insertOne({ ...payloadMongo, event: "harshAcceleration" });
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
          (e, r) => {
            fs.unlinkSync("server.txt");
          }
        );
        try {
          axios
            .post(
              `${process.env.BackendUrl}/eventshandling/overSpeeding`,
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
            )
            .then((response) => {
              // Handle successful response
            })
            .catch((error) => {
              if (error.response && error.response.status === 502) {
                // Handle 502 error specifically
                console.error("Bad Gateway encountered");
                // Implement recovery logic or retry mechanism
              } else {
                // Handle other errors
              }
            });
        } catch (err) {
          console.log(
            `Error on overSpeeding Event in vehicle: ${collectionName}/${vehicleReg} : ${err.message}`
          );
          fs.appendFileSync(
            "server.txt",
            `Error on overSpeeding Event in vehicle: ${collectionName}/${vehicleReg} : ${err.message}\n`,
            (e, r) => {
              fs.unlinkSync("server.txt");
            }
          );
        }
        await mongoose.connection.db
          .collection("events")
          .insertOne({ ...payloadMongo, event: "overspeed" });
      }
    } else {
      {
        //ignitionOff
        if (
          (eventId == 250 || eventId == 239) &&
          ioElements.filter((item) => {
            return item.id == 239;
          })[0]?.value == 0
        ) {
          await mongoose.connection.db
            .collection("events")
            .insertOne({ ...payloadMongo, event: "ignitionOff" });
        }
        //ignitionOn
        if (
          (eventId == 250 || eventId == 239) &&
          ioElements.filter((item) => {
            return item.id == 239;
          })[0]?.value == 1
        ) {
          await mongoose.connection.db
            .collection("events")
            .insertOne({ ...payloadMongo, event: "ignitionOn" });
        }

        //harshBreak
        if (
          eventId == 253 &&
          ioElements.filter((item) => {
            return item.id == 253;
          })[0]?.value == 2
        ) {
          await mongoose.connection.db
            .collection("events")
            .insertOne({ ...payloadMongo, event: "harshBreak" });
        }
        //harshCornering
        if (
          eventId == 253 &&
          ioElements.filter((item) => {
            return item.id == 253;
          })[0]?.value == 3
        ) {
          await mongoose.connection.db
            .collection("events")
            .insertOne({ ...payloadMongo, event: "harshCornering" });
        }
        //harshAcceleration
        if (
          eventId == 253 &&
          ioElements.filter((item) => {
            return item.id == 253;
          })[0]?.value == 1
        ) {
          await mongoose.connection.db
            .collection("events")
            .insertOne({ ...payloadMongo, event: "harshAcceleration" });
        }

        //overspeed
        if (
          eventId == 255 &&
          ioElements.filter((item) => {
            return item.id == 255;
          }).length > 0
        ) {
          await mongoose.connection.db
            .collection("events")
            .insertOne({ ...payloadMongo, event: "overspeed" });
        }
      }
    }
    // else if (diffinyear == 0 && diffinmonth == 0 && diffinday == 0) {
    //   payloadMongo.d1 = d1;
    //   payloadMongo.d2 = d2;
    //   payloadMongo.diff = diff;

    //   await mongoose.connection.db
    //     .collection("eventshandling")
    //     .insertOne(payloadMongo);
    // }

    // res.send(payloadMongo)
  } catch (err) {
    console.log(` ${err.message}`);
    fs.appendFileSync("server.txt", `${err.message}\n`, (e, r) => {
      fs.unlinkSync("server.txt");
    });

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
