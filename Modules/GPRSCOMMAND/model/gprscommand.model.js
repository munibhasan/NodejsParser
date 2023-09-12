const mongoose = require("../../../utils/mongoose.service").mongoose;

const Schema = mongoose.Schema;
var ObjectId = require("mongodb").ObjectID;

const gprscommandSchema = new Schema(
  {
    deviceIMEI: String,
    command: String,
    parameter: String,
    commandtext: String,
    commandtextResponse: String,
    createdDate: String,
    modifyDate: String,
    status: String,
  },
  { timestamps: true }
);

gprscommandSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Ensure virtual fields are serialised.
gprscommandSchema.set("toJSON", {
  virtuals: true,
});

gprscommandSchema.findById = function (cb) {
  return this.model("GprsCommand").find({ id: this.id }, cb);
};

const GprsCommand = mongoose.model("GprsCommand", gprscommandSchema);

exports.model = mongoose.model("GprsCommand", gprscommandSchema);

exports.GetGprsCommandById = (id) => {
  return GprsCommand.find({ _id: ObjectId(id) }).then((result) => {
    return result;
  });
};

exports.list = (perPage, page) => {
  return new Promise((resolve, reject) => {
    GprsCommand.find()
      .sort({ _id: -1 })
      .limit(perPage)
      .skip(perPage * page)
      .exec(function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
  });
};

exports.patchRecord = (id, gprscommandData) => {
  return GprsCommand.findOneAndUpdate(
    {
      _id: id,
    },
    gprscommandData
  );
};

exports.AddGprsCommand = (gprscommandSchema) => {
  const gprscommand = new GprsCommand(gprscommandSchema);
  return gprscommand.save();
};

exports.RemoveGprsCommand = (id) => {
  return new Promise((resolve, reject) => {
    GprsCommand.deleteMany({ _id: id }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(err);
      }
    });
  });
};

exports.FindByClientId = (clientId) => {
  return GprsCommand.find({ clientId: clientId }).then((result) => {
    return result;
  });
};
