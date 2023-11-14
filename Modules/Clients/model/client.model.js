const mongoose = require("../../../utils/mongoose.service").mongoose;

const Schema = mongoose.Schema;

const clientSchema = new Schema({
  clientName: String,
  clientAddress: String,
  contactPerson: String,
  contactNumbers: String,
  typeofBusiness: String,
  requiredNoDevices: Number,
  timeZone: String,
  language: String,
  driverProfile: Boolean,
  driverProfileCount: Number,
  featurePortalApp: Boolean,
  featureDriverApp: Boolean,
  featureCustomerApp: Boolean,
  MapType: String,
  MapKey: String,
  // isDeliveredToClient: Boolean,
  // cLientEmail:String,
  portalUrl: String,
  expiryDate: Date,
  accountCode: String,
  reason: String,
  typeOfUnit: String,
  dateFormat: String,
  timeFormat: String,
  notificationdateformat: String,
  notificationtimeformat: String,
  country: String,
  clientEmail: String,
  // EmailNotification: Boolean,
  // SMSNotification: Boolean,
  // AppNotification: Boolean,
  // PortalNotification: Boolean,
  IgnitionOnPortal: Boolean,
  IgnitionOnPushNotification: Boolean,
  IgnitionOnSMS: Boolean,
  IgnitionOnEmail: Boolean,
  IgnitionOffPortal: Boolean,
  IgnitionOffPushNotification: Boolean,
  IgnitionOffSMS: Boolean,
  IgnitionOffEmail: Boolean,
  HarshBreakPortal: Boolean,
  HarshBreakPushNotification: Boolean,
  HarshBreakSMS: Boolean,
  HarshBreakEmail: Boolean,
  HarshCorneringPortal: Boolean,
  HarshCorneringPushNotification: Boolean,
  HarshCorneringSMS: Boolean,
  HarshCorneringEmail: Boolean,
  HarshAccelerationPortal: Boolean,
  HarshAccelerationPushNotification: Boolean,
  HarshAccelerationSMS: Boolean,
  HarshAccelerationmail: Boolean,
  IdelingPortal: Boolean,
  IdelingPushNotification: Boolean,
  IdelingSMS: Boolean,
  Idelingmail: Boolean,
  GeofencePortal: Boolean,
  GeofenceNotification: Boolean,
  GeofenceSMS: Boolean,
  GeofenceEmail: Boolean,
  OverSpeedPortal: Boolean,
  OverSpeedNotification: Boolean,
  OverSpeedSMS: Boolean,
  OverSpeedEmail: Boolean,
});

clientSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

clientSchema.set("toJSON", {
  virtuals: true,
});

clientSchema.findById = function (cb) {
  return this.model("Client").find({ id: this.id }, cb);
};

const Client = mongoose.model("Clients", clientSchema);

exports.model = mongoose.model("Clients", clientSchema);

exports.findById = (id) => {
  return Client.findById(id).then((result) => {
    result = result.toJSON();
    delete result._id;
    delete result.__v;
    return result;
  });
};

exports.getClientById = async (id) => {
  return await Client.findById(id).then((result) => {
    return result;
  });
};

exports.CheckDriverProfile = async (id) => {
  return await Client.findById(id).then((result) => {
    return result;
  });
};

exports.createClient = (clientData) => {
  const client = new Client(clientData);
  // console.log(clientData);
  return client.save();
};

exports.clientlist = async () => {
  return await Client.find();
};

exports.list = (perPage, page) => {
  return new Promise((resolve, reject) => {
    Client.find()
      // Client.aggregate([
      //   {
      //     "$project": {
      //       "timeZone": {
      //         "$toObjectId": "$timeZone"
      //       },
      //       "clientName":1,
      //       "clientAddress":1,
      //       "contactPerson":1,
      //       "typeofBusiness":1,
      //       "language":1
      //     }
      //   },
      //   {
      //     "$lookup": {
      //       "from": "timezones",
      //       "localField": "timeZone",
      //       "foreignField": "_id",
      //       "as": "timezone"
      //     }
      //   },
      // ])
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

exports.GetClientById = (id) => {
  return Client.findById(id).then((result) => {
    return result;
  });
};

// developer comment
// exports.ListbyId = (fieldType,fieldValue) => {
// var mainObj={};
// var childObj={};
// childObj["$regex"]=fieldValue;
// mainObj[fieldType]=childObj;
//   return new Promise((resolve, reject) => {
//      Client.find(mainObj)
//         .exec(function (err, users) {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(users);
//       }
//     });
//   });
// };

exports.ListbyId = async (fieldType, fieldValue) => {
  var mainObj = {};
  var childObj = {};
  childObj["$regex"] = fieldValue;
  mainObj[fieldType] = childObj;
  return await Client.find(mainObj);
};

exports.patchClient = (id, clientData) => {
  // console.log(clientData);
  return Client.findOneAndUpdate(
    {
      _id: id,
    },
    clientData
  );
};

exports.GetAllClients = (perPage, page) => {
  return new Promise((resolve, reject) => {
    Client.find({
      permissionLevel: 2,
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

exports.RemoveClient = (id) => {
  return new Promise((resolve, reject) => {
    Client.deleteMany({ _id: id }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(err);
      }
    });
  });
};

exports.getTotalClients = () => {
  return Client.countDocuments();
};

exports.findByClientId = async (id) => {
  return await Client.findOne({ _id: id }).then((result) => {
    //  console.log(result)
    return result;
  });
};
