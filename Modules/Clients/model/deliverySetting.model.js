const mongoose = require("../../../utils/mongoose.service").mongoose;

const Schema = mongoose.Schema;

const deliverySettingSchema = new Schema({
  clientId: String,
  isDeliveredToClient: Boolean,
  clientEmail: String,
});

deliverySettingSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

deliverySettingSchema.set("toJSON", {
  virtuals: true,
});

deliverySettingSchema.findById = function (cb) {
  return this.model("deliverySetting").find({ id: this.id }, cb);
};

const deliverySetting = mongoose.model(
  "deliverySetting",
  deliverySettingSchema
);

exports.findById = (id) => {
  return deliverySetting.findById(id).then((result) => {
    result = result.toJSON();
    delete result._id;
    delete result.__v;
    return result;
  });
};

exports.createDeliverySetting = (deliverySettingData) => {
  const deliverySettings = new deliverySetting(deliverySettingData);
  // console.log(deliverySettingData);
  return deliverySettings.save();
};

// exports.GetDeliverySettingById = (clientId) => {

//     return deliverySetting.find({clientId:clientId}).then((result) => {
//     return result;

//     });
//   };

exports.GetDeliverySettingById = (perPage, page, clientId) => {
  return new Promise((resolve, reject) => {
    deliverySetting
      .find({ clientId: clientId })
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

exports.patchDeliverySetting = (id, deliverySettingData) => {
  // console.log(clientData);
  return deliverySetting.findOneAndUpdate(
    {
      _id: id,
    },
    deliverySettingData
  );
};

//  exports.GetAllClients = (perPage, page) => {
//    return new Promise((resolve, reject) => {
//      Client.find({
//        permissionLevel: 2,
//      })
//        .limit(perPage)
//        .skip(perPage * page)
//        .exec(function (err, users) {
//          if (err) {
//            reject(err);
//          } else {
//            resolve(users);
//          }
//        });
//    });
//  };

exports.UpdateDeliverySetting = async (
  clientId,
  isDeliveredToClient,
  clientEmail
) => {
  return await deliverySetting.updateOne(
    {
      clientId: clientId,
    },
    {
      $set: {
        isDeliveredToClient: isDeliveredToClient,
        clientEmail: clientEmail,
      },
    }
  );
};
