require("dotenv").config();

const server = require("https");
const path = require("path");
const fs = require("fs");
const cron = require("node-cron");
const clientImport = require("../Modules/Clients/model/client.model");
const { mongoose } = require("../utils/mongoose.service");
const redisConnectionHelper = require("../utils/redisConnectionHelper");

// const MongoClient = require("mongodb").MongoClient;
const folder = path.join(__dirname, "../ssl");
const privateKey = fs.readFileSync(path.join(folder, "server_key.pem"), "utf8");
const certificate = fs.readFileSync(
  path.join(folder, "server_cert.pem"),
  "utf8"
);
var momentTz = require("moment-timezone");
const moment = require("moment");
moment.suppressDeprecationWarnings = true;

const AWS = require("aws-sdk");
const s3 = new AWS.S3({
  Bucket: process.env.Bucket,
  accessKeyId: process.env.IAM_USER_KEY,
  secretAccessKey: process.env.IAM_USER_SECRET,
});

// const s2 = new AWS.S3({
//   Bucket: process.env.Bucket2, //live bucket in which data store
//   accessKeyId: process.env.IAM_USER_KEY,
//   secretAccessKey: process.env.IAM_USER_SECRET,
// });
const vehicleImport = require("../Modules/Vehicles/model/vehicle.model");

const zlib = require("zlib");

const vehicleModel = vehicleImport.model;

// const client = new MongoClient(
//   "mongodb+srv://Wrapper:D2zQcgJvtnKS4Jkr@vtracksolutions.nih4b.mongodb.net/VtrackV1?retryWrites=true&w=majority"
// );
// client.connect();
// const db = client.db("VtrackV1");

const clientModel = clientImport.model;

const optSsl = {
  key: privateKey,
  cert: certificate,
  ca: [certificate],
  requestCert: false, // put true if you want a client certificate, tested and it works
  rejectUnauthorized: false,
};

const WEB_SERVER = server.createServer(optSsl);

async function saveDataInS3(folderName, objectBody) {
  try {
    const putObjectRequest = {
      Bucket: process.env.Bucket,
      Key: `${folderName}`,
      Body: objectBody,
      ContentEncoding: "gzip",
      ContentType: "application/gzip",
    };

    const uploadPromise = await s3.upload(putObjectRequest).promise();

    return { status: true };
  } catch (err) {
    return { status: false, message: err.message };
  }
}

const groupByVehicleReg = (data) => {
  const groups = {};

  for (const item of data) {
    delete item.date;
    const vehicleReg = item.vehicleReg;

    if (!groups[vehicleReg]) {
      groups[vehicleReg] = [];
    }

    groups[vehicleReg].push(item);
  }

  return groups;
};

async function getDataFromMongoAndSavetoS3(timeZone) {
  try {
    const fromDate = moment(
      momentTz(new Date())
        .tz(timeZone)
        .subtract(1, "days")
        .startOf("day")
        .toString()
    ).format("YYYY-MM-DDT00:00:00");

    const toDate = moment(
      momentTz(new Date())
        .tz(timeZone)
        .subtract(1, "days")
        .startOf("day")
        .toString()
    ).format("YYYY-MM-DDT23:59:59");

    // [...redisClient.get("clientList")]
    (
      await clientModel.find({
        timeZone,
      })
    ).map((client) => {
      const collectionName = `avl_${client._id}_today`;

      mongoose.connection.db
        .collection(collectionName)
        .aggregate([
          {
            $project: {
              date: {
                $dateToString: {
                  date: "$DateTime",
                  timezone: timeZone,
                },
              },
              clientId: 1,
              vehicleReg: 1,
              deviceIMEI: 1,
              DriverName: 1,
              GpsElement: 1,
              IoElement: 1,
              OsmElement: 1,
              GpsElement: 1,
              Priority: 1,
              DateTime: 1,
              ServerDateTime: 1,
              DateTimeDevice: 1,
            },
          },
          {
            $match: {
              date: { $gte: fromDate, $lte: toDate },
            },
          },

          {
            $sort: { date: -1 },
          },
        ])
        .toArray()
        .then(async (d) => {
          const data = groupByVehicleReg(d);
          const keys = Object.keys(data);

          const date = momentTz(new Date(d.DateTimeDevice))
            .tz(timeZone)
            .format("YYYY-MM-DD");
          keys.map(async (item) => {
            // const jsonStringdata = JSON.stringify(data[item]);
            const compressedData = zlib.gzipSync(JSON.stringify(data[item]));
            await saveDataInS3(
              `${client._id}/${item}/${date}.gz`,
              compressedData
            );
          });
        });
    });
  } catch (err) {
    console.log(err.message);
  }
}
// const dateObject = momentTz(
//   "November 16 2023 02:54:56 AM",
//   "MMMM DD YYYY hh:mm:ss A",
//   "America/Winnipeg"
// );
// const utcDate = dateObject.utc();
// console.log(utcDate.format("YYYY-MM-DDTHH:mm:ss"));

async function main() {
  // const redisClient = await redisConnectionHelper();
  cron.schedule("0 */30 * * *", async () => {
    try {
      (
        await clientModel.find({
          timeZone,
        })
      ).map((client) => {
        const collectionName = `avl_${client._id}_today`;

        mongoose.connection.db
          .collection(collectionName)
          .find({ OsmElement: null })
          .toArray()
          .then(async (d) => {
            const osmElements = await fetchLocationData(
              d.gps.latitude,
              d.gps.longitude
            );
          });
      });
    } catch (err) {
      console.log(err.message);
    }
  });
  cron.schedule(
    "0 0 * * *",
    async () => {
      getDataFromMongoAndSavetoS3("Europe/London");
    },
    {
      timezone: "Europe/London", //9
    }
  );
  cron.schedule(
    "* * * * * *",
    async () => {
      getDataFromMongoAndSavetoS3("Asia/Karachi");
    },
    {
      timezone: "Asia/Karachi", //7
    }
  );
  cron.schedule(
    "0 0 * * *",
    async () => {
      getDataFromMongoAndSavetoS3("America/Halifax");
    },
    {
      timezone: "America/Halifax", //1
    }
  );

  cron.schedule(
    "0 0 * * *",
    async () => {
      getDataFromMongoAndSavetoS3("America/Winnipeg");
    },
    {
      timezone: "America/Winnipeg", //1
    }
  );
}
// TODO: redis connection and check the Schedular

main();
// TODO: job runs at every 30 minutes get data from backup and send data to respective folder in S3

WEB_SERVER.listen(9000, (err) => {
  if (!err) {
    console.log("server2 is running ");
  }
});