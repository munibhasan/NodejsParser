require("dotenv").config();
const server = require("https");
const path = require("path");
const fs = require("fs");
const cron = require("node-cron");
const clientImport = require("../Modules/Clients/model/client.model");
const { mongoose } = require("../utils/mongoose.service");
const folder = path.join(__dirname, "../ssl");
const privateKey = fs.readFileSync(path.join(folder, "server_key.pem"), "utf8");
var ObjectId = require("mongodb").ObjectId;

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
const zlib = require("zlib");
const { fetchLocationData } = require("../utils/fetchLocationData");
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
    await s3.upload(putObjectRequest).promise();
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
    ).map(async (client) => {
      const collectionName = `avl_${client._id}_today`;
      try {
        const data = await mongoose.connection.db
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

            // {
            //   $sort: { _id: -1 },
            // },
          ])
          .toArray();
        console.log(data.length);
        // .then(async (d) => {
        //   console.log(d.length);
        //   const date = fromDate.split("T")[0];
        //   const data = groupByVehicleReg(d);
        //   const keys = Object.keys(data);
        //   keys.map(async (item) => {
        //     const compressedData = zlib.gzipSync(JSON.stringify(data[item]));
        //     await saveDataInS3(
        //       `${client._id}/${item}/${date}.gzip`,
        //       compressedData
        //     );
        //   });
        //   const dataIds = d.map((it) => {
        //     return it._id;
        //   });
        //   mongoose.connection.db
        //     .collection(collectionName)
        //     .deleteMany({ _id: { $in: dataIds } });
        // });
      } catch (err) {
        console.log(err.message);
      }
    });
  } catch (err) {}
}

async function main() {
  // const redisClient = await redisConnectionHelper();
  cron.schedule("*/30  * * * *", async () => {
    try {
      (await clientModel.find({})).map(async (client) => {
        const collectionName = `avl_${client._id}_today`;
        const collectionData = await mongoose.connection.db
          .collection(collectionName)
          .aggregate([
            {
              $match: {
                OsmElement: null,
              },
            },
          ])
          .toArray();

        const locationDataPromises = collectionData.map(async (document) => {
          try {
            const osmElements = await fetchLocationData(
              document.GpsElement.Y,
              document.GpsElement.X
            );

            return { _id: document._id, OsmElement: osmElements };
          } catch (fetchError) {
            return null; // or handle this case appropriately
          }
        });
        const locationData = await Promise.all(locationDataPromises);

        const updatePromises = locationData
          .filter((data) => data !== null)
          .map(async (location) => {
            try {
              await mongoose.connection.db
                .collection(collectionName)
                .findOneAndUpdate(
                  { _id: location._id },
                  { $set: { OsmElement: location.OsmElement } }
                );
            } catch (err) {}
          });

        await Promise.all(updatePromises);
      });
    } catch (err) {}
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
    "0 0 * * *",
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
