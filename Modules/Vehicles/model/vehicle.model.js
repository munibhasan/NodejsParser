const mongoose = require("../../../utils/mongoose.service").mongoose;

const Schema = mongoose.Schema;

const vehicleSchema = new Schema({
  vehicleNo: String,
  vehicleMake: String,
  vehicleModel: String,
  vehicleReg: String,
  clientId: String,
  IsActive: Boolean,
  DeviceAttach: Boolean,
  vehicleskipstep: Number,
  IgnitionStatus: Boolean,
  Label1: String,
  driverStatus: {
    type: Boolean,
    default: false,
  },
  currentDriverName: {
    type: String,
    default: "",
  },
});

vehicleSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Ensure virtual fields are serialised.
vehicleSchema.set("toJSON", {
  virtuals: true,
});

vehicleSchema.findById = function (cb) {
  return this.model("Vehicles").find({ id: this.id }, cb);
};

const Vehicle = mongoose.model("Vehicles", vehicleSchema);

exports.model = mongoose.model("Vehicles", vehicleSchema);

// exports.findByEmail = (email) => {

//     return User.find({userEmail: email});
// };
exports.findById = (id) => {
  return Vehicle.findById(id).then((result) => {
    return result;
  });
};

exports.getVehicleById = async (id) => {
  if (id != "") {
    return await Vehicle.findById(id).then((result) => {
      return result;
    });
  }
};

exports.findByClientId = (id) => {
  return Vehicle.findOne({ clientId: id }).then((result) => {
    result = result.toJSON();
    delete result._id;
    delete result.__v;
    return result;
  });
};

exports.CreateVehicle = (vehicleData) => {
  // vehicleData.driverStatus=false;
  const vehicle = new Vehicle(vehicleData);
  return vehicle.save();
};

exports.listByClientId = (perPage, page, clientId) => {
  return new Promise((resolve, reject) => {
    Vehicle.find({ clientId: clientId })
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

exports.GetAvailableVehiclesForDriver = async (clientId) => {
  return await new Promise((resolve, reject) => {
    Vehicle.find({ clientId: clientId, driverStatus: false }).exec(function (
      err,
      users
    ) {
      if (err) {
        reject(err);
      } else {
        resolve(users);
      }
    });
  });
};

exports.GetAvailableVehicles = (perPage, page, clientId) => {
  return new Promise((resolve, reject) => {
    Vehicle.find({ clientId: clientId, DeviceAttach: false })
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

exports.VehicleByVehicleId = (perPage, page, vehicleId) => {
  return new Promise((resolve, reject) => {
    Vehicle.find({ _id: vehicleId })
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

exports.patchRecord = (id, vehicleData) => {
  return Vehicle.findOneAndUpdate(
    {
      _id: id,
    },
    vehicleData
  );
};

exports.getTotalVehicles = () => {
  return Vehicle.countDocuments();
};

exports.CheckVehicleStatus = async (vehicleId) => {
  return await Vehicle.countDocuments({ _id: vehicleId, DeviceAttach: true });
};

exports.removeById = (id) => {
  return new Promise((resolve, reject) => {
    Vehicle.deleteMany({ _id: id }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(err);
      }
    });
  });
};

exports.UpdateVehicleStatus = (id) => {
  return Vehicle.findOneAndUpdate(
    {
      _id: id,
    },
    { DeviceAttach: true }
  );
};

exports.RemoveAssignVehicle = (id) => {
  redisClient.del(id);
  return Vehicle.findOneAndUpdate(
    {
      _id: id,
    },
    { DeviceAttach: false }
  );
};

exports.listByClient = (clientId) => {
  return Vehicle.find({ clientId: clientId });
};

exports.getTotalVehiclesbyclientId = async (clientId) => {
  return Vehicle.countDocuments({ clientId: clientId });
};

// exports.getVehicleById = async(id) => {
//   return await Vehicle.findById(id)).then((result) => {
//     return result;
//   });
// };

// exports.list = (clientId,perPage, page) => {
//   return new Promise((resolve, reject) => {
//     Vehicle.find()
//       .limit(perPage)
//       .skip(perPage * page)
//       .exec(function (err, users) {
//         if (err) {
//           reject(err);
//         } else {
//           resolve(users);
//         }
//       });
//   });
// };
