const mongoose = require("../../../utils/mongoose.service").mongoose;

const Schema = mongoose.Schema;

const zoneSchema = new Schema({
  clientId: String,
  zoneName: String,
  zoneShortName: String,
  GeoFenceType: String,
  latlngCordinates: String,
  zoneType: String,
  centerPoints: String
  // isNewlyCreated:Boolean,
});

zoneSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Ensure virtual fields are serialised.
zoneSchema.set("toJSON", {
  virtuals: true
});

zoneSchema.findById = function (cb) {
  return this.model("Zones").find({ id: this.id }, cb);
};

const Zones = mongoose.model("Zones", zoneSchema);

exports.model = mongoose.model("Zones", zoneSchema);

exports.findById = (id) => {
  return Zones.findById(id).then((result) => {
    // result = result.toJSON();
    // delete result._id;
    // delete result.__v;
    return result;
  });
};

exports.CreateZone = (zoneData) => {
  const zone = new Zones(zoneData);
  return zone.save();
};

exports.zoneByFilters = (req, perPage, page) => {
  return new Promise((resolve, reject) => {
    Zones.find({
      $or: req.body.Filters,
      $and: [{ clientId: req.body.clientId }]
    })
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

exports.list = (clientId, perPage, page) => {
  return new Promise((resolve, reject) => {
    Zones.find({ clientId: clientId })
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

exports.patchRecord = (id, zoneData) => {
  return Zones.findOneAndUpdate(
    {
      _id: id
    },
    zoneData
  );
};

// exports.listByClientId = (perPage, page,clientId) => {
//   return new Promise((resolve, reject) => {
//     Zones.find({clientId:clientId})
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

// exports.VehicleByVehicleId = (perPage, page,vehicleId) => {
//   return new Promise((resolve, reject) => {
//     Vehicle.find({_id:vehicleId})
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

// exports.patchRecord = (id, vehicleData) => {

//   return Vehicle.findOneAndUpdate(
//     {
//       _id: id,
//     },
//     vehicleData
//   );
// }

// exports.getTotalVehicles = () => {

//   return Vehicle.countDocuments()

// }

exports.removeById = (id) => {
  return new Promise((resolve, reject) => {
    Zones.deleteMany({ _id: id }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(err);
      }
    });
  });
};

exports.ZonegetbyId = (id) => {
  return Zones.find({ _id: id });
};

exports.zoneNameByFilters = (req, perPage, page) => {
  return new Promise((resolve, reject) => {
    Zones.find({
      $or: req.body.Filters,
      $and: [{ clientId: req.body.clientId }]
    })
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

exports.findByClientId = (id) => {
  return Zones.find({ clientId: id }).then((result) => {
    // result = result.toJSON();
    // delete result._id;
    // delete result.__v;
    return result;
  });
};
