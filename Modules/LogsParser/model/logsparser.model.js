const mongoose = require("../../../utils/mongoose.service").mongoose;

const Schema = mongoose.Schema;

const logsParserSchema = new Schema(
  {
    IMEI: String,
    clientId: String,
    deviceId: String,
    vehicleId: String,
    client: Schema.Types.Mixed,
    device: Schema.Types.Mixed,
    vehicle: Schema.Types.Mixed,
    deviceAssign: Schema.Types.Mixed,
    payloadSocket: Schema.Types.Mixed,
    response: new Schema({
      occursBeforeIMEIAcknowledgement: {
        type: Boolean,
        default: false,
      },
      type: String,
      status: String,
      message: String,
      data: Schema.Types.Mixed,
    }),
  },
  {
    capped: {
      size: 300 * 1024 * 1024, // 300MB in bytes
      max: 1000000, // Maximum number of records
      autoIndexId: true,
    },
    timestamps: true,
  }
);

exports.model = mongoose.model("LogsParser", logsParserSchema);
