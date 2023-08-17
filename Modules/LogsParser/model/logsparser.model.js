const mongoose = require("../../../utils/mongoose.service").mongoose;

const Schema = mongoose.Schema;

const logsParserSchema = new Schema({
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
});

logsParserSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Ensure virtual fields are serialised.
logsParserSchema.set("toJSON", {
  virtuals: true,
});

logsParserSchema.findById = function (cb) {
  return this.model("LogsParser").find({ id: this.id }, cb);
};

const LogsParser = mongoose.model("LogsParser", logsParserSchema);

exports.model = mongoose.model("LogsParser", logsParserSchema);
