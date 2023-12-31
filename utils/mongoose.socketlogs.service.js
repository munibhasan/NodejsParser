const mongoose = require("mongoose");

let count = 0;
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const connectWithRetry = () => {
  console.log("MongoDB for Productions connection with retry");
  const uri =
    process.env.DEV_ENV == "true"
      ? "mongodb://172.16.10.47:27017/VtrackV1SocketLogs"
      : "mongodb+srv://Wrapper:D2zQcgJvtnKS4Jkr@vtracksolutions.nih4b.mongodb.net/VtrackV1SocketLogs?retryWrites=true&w=majority";
  mongoose
    .connect(uri, options)
    .then(() => {
      console.log("MongoDB is connected");
    })
    .catch((err) => {
      console.log(
        "MongoDB connection unsuccessful, retry after 5 seconds. ",
        err
      );
      setTimeout(connectWithRetry, 5000);
    });
};

// Development DevWrapp Database Connection
const connectWithRetryDev = () => {
  console.log("DevWrapper for devlopemnt MongoDB connection with retry");
  // const uri = "mongodb://127.0.0.1:27017/VtrackV1SocketLogs_Local?retryWrites=true&w=majority";
  const uri = "mongodb://172.16.10.47:27017/Dev_VtrackV1SocketLogs";

  mongoose
    .connect(uri, options)
    .then(() => {
      console.log("DevWrapper for devlopemnt MongoDB is connected");
    })
    .catch((err) => {
      console.log(
        "DevWrapper MongoDB connection unsuccessful, retry after 5 seconds. ",
        err
      );
      setTimeout(connectWithRetry, 5000);
    });
};
try {
  if (process.env.ENVIRONMENT === "DEVELOPMENT") {
    connectWithRetryDev();
  } else {
    connectWithRetry();
  }
} catch (e) {
  console.log("SOCKET LOGS DB ERROR", e);
}

exports.mongoose = mongoose;
