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
const vehicleImport = require("../Modules/Vehicles/model/vehicle.model");
const vehicleModel = vehicleImport.model;
const getTripsByAvlMongoProms = require("../utils/getTripsByAvlMongos");
const certificate = fs.readFileSync(
  path.join(folder, "server_cert.pem"),
  "utf8"
);
var momentTz = require("moment-timezone");
const moment = require("moment");
moment.suppressDeprecationWarnings = true;

const AWS = require("aws-sdk");
const s3 = new AWS.S3({
  Bucket: process.env.Bucket2,
  accessKeyId: process.env.IAM_USER_KEY,
  secretAccessKey: process.env.IAM_USER_SECRET
});
const zlib = require("zlib");
const { fetchLocationData } = require("../utils/fetchLocationData");
const clientModel = clientImport.model;
const optSsl = {
  key: privateKey,
  cert: certificate,
  ca: [certificate],
  requestCert: false, // put true if you want a client certificate, tested and it works
  rejectUnauthorized: false
};
const WEB_SERVER = server.createServer(optSsl);

async function saveDataInS3(folderName, objectBody) {
  try {
    const putObjectRequest = {
      Bucket: process.env.Bucket2,
      Key: `${folderName}`,
      Body: objectBody,
      ContentEncoding: "gzip",
      ContentType: "application/gzip"
    };
    await s3.upload(putObjectRequest).promise();
    return { status: true };
  } catch (err) {
    console.log(`${err.message} when save data to s3`);
    fs.appendFileSync(
      "Schedular.txt",
      `${err.message} when save data to s3\n`,
      (e, r) => {
        fs.unlinkSync("Schedular.txt");
      }
    );

    return { status: false, message: err.message };
  }
}
// async function getS3Object(key) {
//   try {
//     const getObjectRequest = {
//       Bucket: process.env.Bucket2,
//       Key: `${key}`
//     };

//     return await s3.getObject(getObjectRequest);
//   } catch (err) {
//     return { status: false, message: err.message };
//   }
// }

// const groupByVehicleReg = (data) => {
//   const groups = {};
//   for (const item of data) {
//     delete item.date;
//     const vehicleReg = item.vehicleReg;
//     if (!groups[vehicleReg]) {
//       groups[vehicleReg] = [];
//     }
//     groups[vehicleReg].push(item);
//   }
//   return groups;
// };

async function getDataFromMongoAndSavetoS3(timeZone, fromDate, toDate) {
  try {
    (
      await clientModel.find({
        timeZone
      })
    ).map(async (client) => {
      const vehicles = await vehicleModel.find({ clientId: client._id });
      const collectionName = `avl_${client._id}_today`;
      console.log(
        `data get form collection: ${collectionName} with date range of ${fromDate} to ${toDate}`
      );
      fs.appendFileSync(
        "Schedular.txt",
        `data get form collection: ${collectionName} with date range of ${fromDate} to ${toDate}\n`,
        (e, r) => {
          fs.unlinkSync("Schedular.txt");
        }
      );

      vehicles.map((item) => {
        mongoose.connection.db
          .collection(collectionName)
          .aggregate([
            {
              $project: {
                date: {
                  $dateToString: {
                    date: "$DateTime",
                    timezone: timeZone
                  }
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
                DateTimeDevice: 1
              }
            },
            {
              $match: {
                date: { $gte: fromDate, $lte: toDate },
                vehicleReg: item.vehicleReg
              }
            }
            // { $sort: { date: 1 } }
          ])
          .toArray()
          .then(async (d) => {
            const date = fromDate.split("T")[0];
            if (d.length > 0) {
              let trips = await getTripsByAvlMongoProms(
                { unit: client.typeOfUnit, TimeZone: client.timeZone },
                d
              );

              if (trips.length > 0) {
                const compressedData = zlib.gzipSync(JSON.stringify(trips));
                await saveDataInS3(
                  `${client._id}/${item.vehicleReg}/trips/${date}.gzip`,
                  compressedData
                );
              }

              console.log(d.length);

              console.log(`${item.vehicleReg}, ${date},${d.length}`);

              /////////
              fs.appendFileSync(
                "Schedular.txt",
                `${item.vehicleReg}, ${date},${d.length}\n`,
                (e, r) => {
                  fs.unlinkSync("Schedular.txt");
                }
              );
              const compressedData = zlib.gzipSync(JSON.stringify(d));
              await saveDataInS3(
                `${client._id}/${item.vehicleReg}/${date}.gzip`,
                compressedData
              );
              const dataIds = d.map((it) => {
                return it._id;
              });

              await mongoose.connection.db
                .collection(collectionName)
                .deleteMany({ _id: { $in: dataIds } });
              /////////

              // d.map(async (i) => {
              //   if (i.OsmElement === null) {
              //     try {
              //       i.OsmElement = await fetchLocationData(
              //         i.GpsElement.Y,
              //         i.GpsElement.X
              //       );
              //     } catch (e) {
              //       console.log(e);
              //     }
              //   }
              //   return i;
              // });
            }
          });
        ///////////////
        mongoose.connection.db
          .collection("events")
          .aggregate([
            {
              $project: {
                date: {
                  $dateToString: {
                    date: "$DateTime",
                    timezone: timeZone
                  }
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
                event: 1
              }
            },
            {
              $match: {
                date: { $gte: fromDate, $lte: toDate },
                vehicleReg: item.vehicleReg,
                clientId: client._id.toString()
              }
            }
          ])
          .toArray()
          .then(async (d) => {
            const date = fromDate.split("T")[0];
            if (d.length > 0) {
              const compressedData = zlib.gzipSync(JSON.stringify(d));
              await saveDataInS3(
                `${client._id}/${item.vehicleReg}/event/${date}.gzip`,
                compressedData
              );
              const dataIds = d.map((it) => {
                return it._id;
              });

              await mongoose.connection.db
                .collection("events")
                .deleteMany({ _id: { $in: dataIds } });
            }
          });
      });
    });
  } catch (err) {
    console.log(err.message);
    fs.appendFileSync("Schedular.txt", `${err.message}\n`, (e, r) => {
      fs.unlinkSync("Schedular.txt");
    });
  }
}
function groupByDate(array, dateField) {
  const groupedData = {};

  array.forEach((item) => {
    const date = new Date(item[dateField]);
    const formattedDate = date.toISOString().slice(0, 10); // Format for grouping (YYYY-MM-DD)

    if (!groupedData[formattedDate]) {
      groupedData[formattedDate] = [];
    }

    groupedData[formattedDate].push(item);
  });

  return groupedData;
}

async function getoldDataFromMongoAndSavetoS3(timeZone, fromDate) {
  try {
    (
      await clientModel.find({
        timeZone
      })
    ).map(async (client) => {
      const vehicles = await vehicleModel.find({ clientId: client._id });
      const collectionName = `avl_${client._id}_today`;

      vehicles.map((item) => {
        mongoose.connection.db
          .collection(collectionName)
          .aggregate([
            {
              $project: {
                date: {
                  $dateToString: {
                    date: "$DateTime",
                    timezone: timeZone
                  }
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
                DateTimeDevice: 1
              }
            },
            {
              $match: {
                date: { $lt: fromDate },
                vehicleReg: item.vehicleReg
              }
            }
            // { $sort: { date: 1 } }
          ])
          .toArray()
          .then(async (d) => {
            if (d.length > 0) {
              const groupeddata = groupByDate(d, "DateTime");
              const dates = Object.keys(groupeddata);
              dates.map(async (date) => {
                try {
                  /////
                  s3.getObject(
                    {
                      Bucket: process.env.Bucket2,
                      Key: `${client._id}/${item.vehicleReg}/${date}.gzip`
                    },
                    async (err, compressedFileContent) => {
                      if (err) {
                        console.log("err", err.message);
                        console.log(
                          groupeddata[date].length,
                          item.vehicleReg,
                          date
                        );

                        let trips = await getTripsByAvlMongoProms(
                          {
                            unit: client.typeOfUnit,
                            TimeZone: client.timeZone
                          },
                          groupeddata[date]
                        );
                        if (trips.length > 0) {
                          const compressedData = zlib.gzipSync(
                            JSON.stringify(trips)
                          );
                          await saveDataInS3(
                            `${client._id}/${item.vehicleReg}/trips/${date}.gzip`,
                            compressedData
                          );
                        }

                        const compressedData = zlib.gzipSync(
                          JSON.stringify(groupeddata[date])
                        );
                        await saveDataInS3(
                          `${client._id}/${item.vehicleReg}/${date}.gzip`,
                          compressedData
                        );
                        const dataIds = groupeddata[date].map((it) => {
                          return it._id;
                        });
                        await mongoose.connection.db
                          .collection(collectionName)
                          .deleteMany({ _id: { $in: dataIds } });
                        return;
                      }
                      zlib.unzip(
                        compressedFileContent.Body,
                        async (err, deCompressedJSONFile) => {
                          if (err) {
                            return;
                          } else {
                            let jsonfileContent = JSON.parse(
                              deCompressedJSONFile.toString("utf8")
                            );
                            const arr = [
                              ...jsonfileContent,
                              ...groupeddata[date]
                            ];
                            console.log(item.vehicleReg, date);
                            console.log(
                              jsonfileContent.length,
                              "1",
                              groupeddata[date].length,
                              "2",
                              arr.length,
                              "3"
                            );
                            // arr.sort((a, b) => {
                            //   return (
                            //     new Date(a.DateTime) - new Date(b.DateTime)
                            //   );
                            // });

                            let trips = await getTripsByAvlMongoProms(
                              { unit: client.typeOfUnit },
                              arr
                            );
                            if (trips.length > 0) {
                              const compressedData = zlib.gzipSync(
                                JSON.stringify(trips)
                              );
                              await saveDataInS3(
                                `${client._id}/${item.vehicleReg}/trips/${date}.gzip`,
                                compressedData
                              );
                            }
                            const compressedData = zlib.gzipSync(
                              JSON.stringify(arr)
                            );
                            await saveDataInS3(
                              `${client._id}/${item.vehicleReg}/${date}.gzip`,
                              compressedData
                            );
                            const dataIds = groupeddata[date].map((it) => {
                              return it._id;
                            });
                            await mongoose.connection.db
                              .collection(collectionName)
                              .deleteMany({ _id: { $in: dataIds } });
                            return;
                          }
                        }
                      );
                    }
                  );
                  //////
                } catch (e) {
                  console.log(e.message);
                }
              });
            }
          });
        ///////////
        mongoose.connection.db
          .collection("events")
          .aggregate([
            {
              $project: {
                date: {
                  $dateToString: {
                    date: "$DateTime",
                    timezone: timeZone
                  }
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
                event: 1
              }
            },
            {
              $match: {
                date: { $lt: fromDate },
                vehicleReg: item.vehicleReg,
                clientId: client._id.toString()
              }
            }
          ])
          .toArray()
          .then(async (d) => {
            if (d.length > 0) {
              const groupeddata = groupByDate(d, "DateTime");
              const dates = Object.keys(groupeddata);
              dates.map(async (date) => {
                try {
                  s3.getObject(
                    {
                      Bucket: process.env.Bucket2,
                      Key: `${client._id}/${item.vehicleReg}/event/${date}.gzip`
                    },
                    async (err, compressedFileContent) => {
                      if (err) {
                        console.log("err", err.message);
                        console.log(
                          groupeddata[date].length,
                          item.vehicleReg,
                          date
                        );

                        const compressedData = zlib.gzipSync(
                          JSON.stringify(groupeddata[date])
                        );

                        await saveDataInS3(
                          `${client._id}/${item.vehicleReg}/event/${date}.gzip`,
                          compressedData
                        );
                        const dataIds = groupeddata[date].map((it) => {
                          return it._id;
                        });

                        await mongoose.connection.db
                          .collection("events")
                          .deleteMany({ _id: { $in: dataIds } });
                        return;
                      }
                      zlib.unzip(
                        compressedFileContent.Body,
                        async (err, deCompressedJSONFile) => {
                          if (err) {
                            return;
                          } else {
                            let jsonfileContent = JSON.parse(
                              deCompressedJSONFile.toString("utf8")
                            );

                            const arr = [
                              ...jsonfileContent,
                              ...groupeddata[date]
                            ];

                            console.log(item.vehicleReg, date);
                            console.log(
                              jsonfileContent.length,
                              "1",
                              groupeddata[date].length,
                              "2",
                              arr.length,
                              "3"
                            );

                            const compressedData = zlib.gzipSync(
                              JSON.stringify(arr)
                            );

                            await saveDataInS3(
                              `${client._id}/${item.vehicleReg}/event/${date}.gzip`,
                              compressedData
                            );
                            const dataIds = groupeddata[date].map((it) => {
                              return it._id;
                            });

                            await mongoose.connection.db
                              .collection("events")
                              .deleteMany({ _id: { $in: dataIds } });
                            return;
                          }
                        }
                      );
                    }
                  );
                } catch (e) {
                  console.log(e.message);
                }
              });
            }
          });
      });
    });
  } catch (err) {
    console.log(err.message);
    fs.appendFileSync("Schedular.txt", `${err.message}\n`, (e, r) => {
      fs.unlinkSync("Schedular.txt");
    });
  }
}

async function main() {
  cron.schedule("*/30 * * * *", async () => {
    try {
      (
        await clientModel.find({
          // _id: { $ne: new ObjectId("65575c79332051f73cb9a06b") }
        })
      ).map(async (client) => {
        const vehicles = await vehicleModel.find({ clientId: client._id });
        console.log(vehicles.length);
        vehicles.map(async (item) => {
          const collectionName = `avl_${client._id}_today`;
          const collectionData = await mongoose.connection.db
            .collection(collectionName)
            .aggregate([
              {
                $match: {
                  OsmElement: null,
                  vehicleReg: item.vehicleReg
                }
              },
              { $limit: 100 }
            ])
            .toArray();

          if (collectionData.length > 0) {
            console.log(collectionData.length, item.vehicleReg);
            const locationDataPromises = collectionData.map(
              async (document) => {
                try {
                  const osmElements = await fetchLocationData(
                    document.GpsElement.Y,
                    document.GpsElement.X
                  );

                  return { _id: document._id, OsmElement: osmElements };
                } catch (fetchError) {
                  console.log(
                    `Error in fetch location ${fetchError.message} at lat: ${document.GpsElement.Y} and lon: ${document.GpsElement.X}`
                  );

                  return null; // or handle this case appropriately
                }
              }
            );

            const locationData = await Promise.all(locationDataPromises);

            const updatePromises = locationData
              .filter((data) => data.OsmElement !== null)
              .map(async (location) => {
                try {
                  await mongoose.connection.db
                    .collection(collectionName)
                    .findOneAndUpdate(
                      { _id: location._id },
                      { $set: { OsmElement: location.OsmElement } }
                    );
                } catch (err) {
                  console.log(err.message);
                }
              });
            await Promise.all(updatePromises);
          }
        });
      });
    } catch (err) {
      console.log(err.message);
    }
  });

  // Australia/Sydney
  cron.schedule(
    "15 0 * * *",
    async () => {
      console.log("Schedular run for the region of Australia/Sydney");
      fs.appendFileSync(
        "Schedular.txt",
        "Schedular run for the region of Europe/London\n",
        (e, r) => {
          fs.unlinkSync("Schedular.txt");
        }
      );
      const fromDate = moment(
        momentTz(new Date())
          .tz("Australia/Sydney")
          .subtract(0, "days")
          .startOf("day")
          .toString()
      ).format("YYYY-MM-DDT00:00:00");

      const toDate = moment(
        momentTz(new Date())
          .tz("Australia/Sydney")
          .subtract(0, "days")
          .startOf("day")
          .toString()
      ).format("YYYY-MM-DDT23:59:59");
      getDataFromMongoAndSavetoS3("Australia/Sydney", fromDate, toDate);
    },
    {
      timezone: "Australia/Sydney" //9
    }
  );

  cron.schedule(
    "30 0 * * *",
    async () => {
      console.log("2nd Schedular run for the region of Australia/Sydney");
      fs.appendFileSync(
        "Schedular.txt",
        "Schedular run for the region of Europe/London\n",
        (e, r) => {
          fs.unlinkSync("Schedular.txt");
        }
      );
      const fromDate = moment(
        momentTz(new Date())
          .tz("Australia/Sydney")
          .subtract(0, "days")
          .startOf("day")
          .toString()
      ).format("YYYY-MM-DDT00:00:00");

      getoldDataFromMongoAndSavetoS3("Australia/Sydney", fromDate);
    },
    {
      timezone: "Australia/Sydney" //9
    }
  );
  // Europe/London
  cron.schedule(
    "15 0 * * *",
    async () => {
      console.log("Schedular run for the region of Europe/London");
      fs.appendFileSync(
        "Schedular.txt",
        "Schedular run for the region of Europe/London\n",
        (e, r) => {
          fs.unlinkSync("Schedular.txt");
        }
      );
      const fromDate = moment(
        momentTz(new Date())
          .tz("Europe/London")
          .subtract(1, "days")
          .startOf("day")
          .toString()
      ).format("YYYY-MM-DDT00:00:00");

      const toDate = moment(
        momentTz(new Date())
          .tz("Europe/London")
          .subtract(1, "days")
          .startOf("day")
          .toString()
      ).format("YYYY-MM-DDT23:59:59");
      getDataFromMongoAndSavetoS3("Europe/London", fromDate, toDate);
    },
    {
      timezone: "Europe/London" //9
    }
  );
  cron.schedule(
    "30 0 * * *",
    async () => {
      console.log("2nd Schedular run for the region of Europe/London");
      fs.appendFileSync(
        "Schedular.txt",
        "Schedular run for the region of Europe/London\n",
        (e, r) => {
          fs.unlinkSync("Schedular.txt");
        }
      );
      const fromDate = moment(
        momentTz(new Date())
          .tz("Europe/London")
          .subtract(1, "days")
          .startOf("day")
          .toString()
      ).format("YYYY-MM-DDT00:00:00");

      getoldDataFromMongoAndSavetoS3("Europe/London", fromDate);
    },
    {
      timezone: "Europe/London" //9
    }
  );

  // Asia/Karachi
  cron.schedule(
    "15 0 * * *",
    async () => {
      console.log("Schedular run for the region of Asia/Karachi");
      fs.appendFileSync(
        "Schedular.txt",
        "Schedular run for the region of Asia/Karachi\n",
        (e, r) => {
          fs.unlinkSync("Schedular.txt");
        }
      );
      const fromDate = moment(
        momentTz(new Date()).tz("Asia/Karachi").startOf("day").toString()
      ).format("YYYY-MM-DDT00:00:00");

      const toDate = moment(
        momentTz(new Date()).tz("Asia/Karachi").startOf("day").toString()
      ).format("YYYY-MM-DDT23:59:59");
      getDataFromMongoAndSavetoS3("Asia/Karachi", fromDate, toDate);
    },
    {
      timezone: "Asia/Karachi" //7
    }
  );
  cron.schedule(
    "30 0 * * *",
    async () => {
      console.log("2nd Schedular run for the region of Asia/Karachi");
      fs.appendFileSync(
        "Schedular.txt",
        "Schedular run for the region of Asia/Karachi\n",
        (e, r) => {
          fs.unlinkSync("Schedular.txt");
        }
      );
      const fromDate = moment(
        momentTz(new Date()).tz("Asia/Karachi").startOf("day").toString()
      ).format("YYYY-MM-DDT00:00:00");

      getoldDataFromMongoAndSavetoS3("Asia/Karachi", fromDate);
    },
    {
      timezone: "Asia/Karachi" //9
    }
  );

  // America/Halifax
  cron.schedule(
    "15 0 * * *",
    async () => {
      console.log("Schedular run for the region of America/Halifax");
      fs.appendFileSync(
        "Schedular.txt",
        "Schedular run for the region of America/Halifax\n",
        (e, r) => {
          fs.unlinkSync("Schedular.txt");
        }
      );
      const fromDate = moment(
        momentTz(new Date())
          .tz("America/Halifax")
          .subtract(1, "days")
          .startOf("day")
          .toString()
      ).format("YYYY-MM-DDT00:00:00");
      const toDate = moment(
        momentTz(new Date())
          .tz("America/Halifax")
          .subtract(1, "days")
          .startOf("day")
          .toString()
      ).format("YYYY-MM-DDT23:59:59");

      getDataFromMongoAndSavetoS3("America/Halifax", formDate, toDate);
    },
    {
      timezone: "America/Halifax" //1
    }
  );
  cron.schedule(
    "30 0 * * *",
    async () => {
      console.log("2nd Schedular run for the region of America/Halifax");
      fs.appendFileSync(
        "Schedular.txt",
        "Schedular run for the region of America/Halifax\n",
        (e, r) => {
          fs.unlinkSync("Schedular.txt");
        }
      );
      const fromDate = moment(
        momentTz(new Date())
          .tz("America/Halifax")
          .subtract(1, "days")
          .startOf("day")
          .toString()
      ).format("YYYY-MM-DDT00:00:00");

      getoldDataFromMongoAndSavetoS3("America/Halifax", fromDate);
    },
    {
      timezone: "America/Halifax" //1
    }
  );

  // America/Winnipeg
  cron.schedule(
    "15 0 * * *",
    async () => {
      console.log("Schedular run for the region of America/Winnipeg");

      fs.appendFileSync(
        "Schedular.txt",
        `Schedular run for the region of America/Winnipeg\n`,
        (e, r) => {
          fs.unlinkSync("Schedular.txt");
        }
      );
      const fromDate = moment(
        momentTz(new Date())
          .tz("America/Winnipeg")
          .subtract(1, "days")
          .startOf("day")
          .toString()
      ).format("YYYY-MM-DDT00:00:00");

      const toDate = moment(
        momentTz(new Date())
          .tz("America/Winnipeg")
          .subtract(1, "days")
          .startOf("day")
          .toString()
      ).format("YYYY-MM-DDT23:59:59");
      getDataFromMongoAndSavetoS3("America/Winnipeg", fromDate, toDate);
    },
    {
      timezone: "America/Winnipeg" //1
    }
  );
  cron.schedule(
    "30 0 * * *",
    async () => {
      console.log("2nd Schedular run for the region of America/Winnipeg");

      fs.appendFileSync(
        "Schedular.txt",
        `Schedular run for the region of America/Winnipeg\n`,
        (e, r) => {
          fs.unlinkSync("Schedular.txt");
        }
      );
      const fromDate = moment(
        momentTz(new Date())
          .tz("America/Winnipeg")
          .subtract(1, "days")
          .startOf("day")
          .toString()
      ).format("YYYY-MM-DDT00:00:00");

      getoldDataFromMongoAndSavetoS3("America/Winnipeg", fromDate);
    },
    {
      timezone: "America/Winnipeg" //1
    }
  );

  // Europe/Paris
  cron.schedule(
    "15 0 * * *",
    async () => {
      console.log("Schedular run for the region of Europe/Paris");
      fs.appendFileSync(
        "Schedular.txt",
        "Schedular run for the region of Europe/Paris\n",
        (e, r) => {
          fs.unlinkSync("Schedular.txt");
        }
      );
      const fromDate = moment(
        momentTz(new Date()).tz("Europe/Paris").startOf("day").toString()
      ).format("YYYY-MM-DDT00:00:00");

      const toDate = moment(
        momentTz(new Date()).tz("Europe/Paris").startOf("day").toString()
      ).format("YYYY-MM-DDT23:59:59");
      getDataFromMongoAndSavetoS3("Europe/Paris", fromDate, toDate);
    },
    {
      timezone: "Europe/Paris" //1
    }
  );
  cron.schedule(
    "30 0 * * *",
    async () => {
      console.log("2nd Schedular run for the region of Europe/Paris");
      fs.appendFileSync(
        "Schedular.txt",
        "Schedular run for the region of Europe/Paris\n",
        (e, r) => {
          fs.unlinkSync("Schedular.txt");
        }
      );
      const fromDate = moment(
        momentTz(new Date()).tz("Europe/Paris").startOf("day").toString()
      ).format("YYYY-MM-DDT00:00:00");

      getoldDataFromMongoAndSavetoS3("Europe/Paris", fromDate);
    },
    {
      timezone: "Europe/Paris" //1
    }
  );
}
main();
WEB_SERVER.listen(9000, (err) => {
  if (!err) {
    console.log("Schedular(server2) is running ");
  }
});
