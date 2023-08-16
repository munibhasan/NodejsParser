const mongoose = require("../../../utils/mongoose.service").mongoose;

const Schema = mongoose.Schema;

const deviceassignSchema = new Schema({
  clientId: String,
  DeviceId: String,
  VehicleId: String,
  DeviceFittedDate: String,
  DeviceConfiguredBy: String,
});

deviceassignSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Ensure virtual fields are serialised.
deviceassignSchema.set("toJSON", {
  virtuals: true,
});

deviceassignSchema.findById = function (cb) {
  return this.model("DeviceAssign").find({ id: this.id }, cb);
};

const DeviceAssign = mongoose.model("DeviceAssign", deviceassignSchema);

exports.model = mongoose.model("DeviceAssign", deviceassignSchema);

// exports.findByEmail = (email) => {

//     return User.find({userEmail: email});
// };
exports.findById = (id) => {
  return DeviceAssign.findById(id).then((result) => {
    // result = result.toJSON();
    // delete result._id;
    // delete result.__v;
    return result;
  });
};

exports.CreateRecord = (deviceassignData) => {
  const deviceAssign = new DeviceAssign(deviceassignData);
  return deviceAssign.save();
};

exports.list = (clientid) => {
  return new Promise((resolve, reject) => {
    DeviceAssign.aggregate([
      { $match: { clientId: clientid } }, // Filter documents based on clientId first
      {
        $match: {
          // Filter documents where DeviceId is a valid ObjectId
          DeviceId: { $regex: /^[0-9a-fA-F]{24}$/ },
        },
      },
      {
        $match: {
          // Filter documents where VehicleId is a valid ObjectId
          VehicleId: { $regex: /^[0-9a-fA-F]{24}$/ },
        },
      },
      {
        $project: {
          DeviceId: {
            $toObjectId: "$DeviceId",
          },
          VehicleId: {
            $toObjectId: "$VehicleId",
          },
          DeviceFittedDate: 1,
          DeviceConfiguredBy: 1,
          clientId: 1,
        },
      },
      {
        $lookup: {
          from: "devices",
          localField: "DeviceId",
          foreignField: "_id",
          as: "device",
        },
      },
      {
        $lookup: {
          from: "vehicles",
          localField: "VehicleId",
          foreignField: "_id",
          as: "vehicle",
        },
      },
    ]).exec(function (err, users) {
      if (err) {
        reject(err);
      } else {
        resolve(users);
      }
    });
  });
};
exports.GetDeviceAssignById = (perPage, page, id) => {
  return new Promise((resolve, reject) => {
    DeviceAssign.find({ _id: id })
      .limit(perPage)
      .skip(perPage * page)
      .exec(function (err, users) {
        if (err) {
          reject(err);
        } else {
          resolve(users);
        }
      });
  });
};

exports.patchRecord = (id, DeviceAssignData) => {
  return DeviceAssign.findOneAndUpdate(
    {
      _id: id,
    },
    DeviceAssignData
  );
};

exports.removeById = (id) => {
  return new Promise((resolve, reject) => {
    DeviceAssign.deleteMany({ _id: id }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(err);
      }
    });
  });
};

exports.VehicleExist = async (ClientId) => {
  return await deviceassigns
    .countDocuments({ clientId: ClientId })
    .then((result) => {
      return result;
    });
};

exports.ActiveAssign = async (deviceId) => {
  return await DeviceAssign.find({ DeviceId: deviceId }).then((result) => {
    return result[0];
  });
};

exports.deviceList = (perPage, page) => {
  return new Promise((resolve, reject) => {
    DeviceAssign.aggregate([
      {
        $project: {
          DeviceIds: {
            $toObjectId: "$DeviceId",
          },
          ClientId: {
            $toObjectId: "$clientId",
          },
          clientId: 1,
        },
      },
      {
        $lookup: {
          from: "devices",
          localField: "DeviceIds",
          foreignField: "_id",
          as: "device",
        },
      },
      {
        $lookup: {
          from: "clients",
          localField: "ClientId",
          foreignField: "_id",
          as: "Client",
        },
      },
    ])
      .limit(perPage)
      .skip(perPage * page)
      .exec(function (err, users) {
        if (err) {
          reject(err);
        } else {
          resolve(users);
        }
      });
  });
};

exports.deviceAssignList = (DeviceId) => {
  return new Promise((resolve, reject) => {
    DeviceAssign.find({ DeviceId: DeviceId }).exec(function (err, users) {
      if (err) {
        reject(err);
      } else {
        resolve(users);
      }
    });
  });
};

exports.IMEIlist = (deviceIMEI) => {
  return new Promise((resolve, reject) => {
    DeviceAssign.aggregate([
      {
        $project: {
          DeviceId: {
            $toObjectId: "$DeviceId",
          },
          VehicleId: {
            $toObjectId: "$VehicleId",
          },
          clientId: 1,
        },
      },
      {
        $lookup: {
          from: "devices",
          localField: "DeviceId",
          foreignField: "_id",
          as: "device",
        },
      },
      {
        $lookup: {
          from: "vehicles",
          localField: "VehicleId",
          foreignField: "_id",
          as: "Vehicle",
        },
      },
      { $match: { "device.deviceIMEI": deviceIMEI } },
    ]).exec(function (err, users) {
      if (err) {
        reject(err);
      } else {
        resolve(users);
      }
    });
  });
};

exports.VehicleReglist = (vehicleReg) => {
  return new Promise((resolve, reject) => {
    DeviceAssign.aggregate([
      {
        $project: {
          DeviceId: {
            $toObjectId: "$DeviceId",
          },
          VehicleId: {
            $toObjectId: "$VehicleId",
          },
          clientId: 1,
        },
      },
      {
        $lookup: {
          from: "devices",
          localField: "DeviceId",
          foreignField: "_id",
          as: "device",
        },
      },
      {
        $lookup: {
          from: "vehicles",
          localField: "VehicleId",
          foreignField: "_id",
          as: "Vehicle",
        },
      },
      { $match: { "Vehicle.vehicleReg": vehicleReg } },
    ]).exec(function (err, users) {
      if (err) {
        reject(err);
      } else {
        resolve(users);
      }
    });
  });
};
