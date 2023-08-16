const DeviceAssignModel = require("../model/deviceassign.model");
const DeviceModel = require("../../Devices/model/device.model");
exports.insert = (req, res) => {
  if (req.body.id != "") {
    DeviceAssignModel.patchRecord(req.body.id, req.body).then((result) => {
      res.status(201).send({ id: result._id });
    });
  } else {
    DeviceAssignModel.CreateRecord(req.body).then((result) => {
      res.status(201).send({ id: result._id });
    });
  }
};

exports.list = async (req, res) => {
  DeviceAssignModel.list(req.body.clientid).then((result) => {
    res.status(200).send(result);
  });
};

exports.GetDeviceAssignById = (req, res) => {
  let limit =
    req.query.limit && req.query.limit <= 100 ? parseInt(req.query.limit) : 10;
  let page = 0;
  if (req.query) {
    if (req.query.page) {
      req.query.page = parseInt(req.query.page);
      page = Number.isInteger(req.query.page) ? req.query.page : 0;
    }
  }
  DeviceAssignModel.GetDeviceAssignById(limit, page, req.body.Id).then(
    (result) => {
      res.status(200).send(result);
    }
  );
};

// exports.getById = (req, res) => {
//     DeviceModel.findById(req.body.id).then((result) => {
//     res.status(200).send(result);
//   });
// };
// exports.patchById = (req, res) => {
//     DeviceModel.patchDevice(req.body.id, req.body).then((result) => {
//     res.status(204).send({});
//   });
// };

exports.RemoveById = (req, res) => {
  DeviceModel.UpdateDeviceStatusFree(req.body.deviceId).then((result) => {});

  DeviceAssignModel.removeById(req.body.id).then((result1) => {
    res.status(204).send({});
  });
};
