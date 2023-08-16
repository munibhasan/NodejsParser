const DeviceModel = require("../model/device.model");
const ClientModel = require("../../Clients/model/client.model");
var MongoClient = require("mongodb").MongoClient;
const AdminRolesModel = require("../../AdminRoles/models/adminroles.model");
const jwt_decode = require("jwt-decode");
const FormName = "Devices";
const DeviceAssignModel = require("../../DeviceAssign/model/deviceassign.model");
const VehicleModel = require("../../Vehicles/model/vehicle.model");

exports.insert = async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  var decoded = jwt_decode(token);
  userRole = decoded.userRole;
  const FormActions = await AdminRolesModel.FindByFormAndRole(
    userRole,
    FormName
  );

  if (req.body.id != "" && FormActions.Edit) {
    DeviceModel.patchDevice(req.body.id, req.body).then((result) => {
      res
        .status(200)
        .send({ success: true, Msg: "Save Successfully", data: result });
    });
  } else if (req.body.id == "" && FormActions.Add) {
    req.body.MachineStatus = "UnAllocated";
    DeviceModel.CreateDevice(req.body).then((result) => {
      res
        .status(200)
        .send({ success: true, Msg: "Save Successfully", data: result });
    });
  } else {
    res.status(200).send({ success: false, Msg: "Permission Denied" });
  }
};

exports.UpdateDeviceStatus = (req, res) => {
  DeviceModel.UpdateDeviceStatus(req.body.id).then((result) => {
    res.status(201).send({ id: result._id });
  });
};

exports.list = (req, res) => {
  let limit =
    req.query.limit && req.query.limit <= 100 ? parseInt(req.query.limit) : 10;
  let page = 0;
  if (req.query) {
    if (req.query.page) {
      req.query.page = parseInt(req.query.page);
      page = Number.isInteger(req.query.page) ? req.query.page : 0;
    }
  }
  DeviceModel.list(limit, page).then((result) => {
    res.status(200).send(result);
  });
};

exports.listUnAllocated = (req, res) => {
  DeviceModel.listUnAllocated().then((result) => {
    res.status(200).send(result);
  });
};

exports.getById = (req, res) => {
  DeviceModel.findById(req.body.id).then((result) => {
    res.status(200).send(result);
  });
};

exports.SingleDevice = async (req, res) => {
  if (!req.body.id) {
    res.status(400).json({ message: "Please send device id in request." });
    return;
  }

  let deviceDataFetched = await DeviceModel.findById(req.body.id);
  let device = deviceDataFetched[0];

  if (!device) {
    res.status(404).json({ message: "No Device Found." });
    return;
  }

  let clientName = "Not Allocated";
  let vehicleNo = "Not Allocated";

  let assignDevice = await DeviceAssignModel.ActiveAssign(device._id);

  if (assignDevice != undefined && assignDevice != null) {
    let client = await ClientModel.getClientById(assignDevice.clientId);
    clientName = client.clientName;
  }
  if (
    assignDevice != undefined &&
    assignDevice != null &&
    assignDevice.VehicleId != ""
  ) {
    let vehicle = await VehicleModel.getVehicleById(assignDevice.VehicleId);
    vehicleNo = vehicle.vehicleReg;
  }
  let deviceAppendedData = { ...device._doc, clientName, vehicleNo };
  res.status(200).json(deviceAppendedData);
};

exports.patchById = (req, res) => {
  DeviceModel.patchDevice(req.body.id, req.body).then((result) => {
    res.status(204).send({});
  });
};

exports.removeById = async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  var decoded = jwt_decode(token);
  userRole = decoded.userRole;
  const FormActions = await AdminRolesModel.FindByFormAndRole(
    userRole,
    FormName
  );

  if (FormActions.Delete) {
    DeviceModel.removeById(req.body.id).then((result) => {
      res
        .status(200)
        .send({ success: true, Msg: "Delete Successfully", data: result });
    });
  } else {
    res.status(200).send({ success: false, Msg: "Permission Denied" });
  }
};

var db;
var IMEI = "";
var connectedDevices = [];
var activeDevices = [];
var allocatedDevices = [];
var UnAllocatedDevices = [];

exports.DeviceWithStatus = function (req, res) {
  var Devices = [];

  db.collection("CurrentLocations", function (err, collection) {
    collection.find().toArray(function (err, items) {
      connectedDevices = items;
    });
  });

  db.collection("devices", function (err, collection) {
    collection.find({ IsActive: true }).toArray(function (err, items) {
      activeDevices = items;
    });
  });

  db.collection("devices", function (err, collection) {
    collection
      .find({ ISActive: true } && { IsBind: true })
      .toArray(function (err, items) {
        allocatedDevices = items;
      });
  });

  db.collection("devices", function (err, collection) {
    collection
      .find({ ISActive: true } && { IsBind: false })
      .toArray(function (err, items) {
        UnAllocatedDevices = items;
      });
  });

  activeDevices.forEach((activeDevice) => {
    connectedDevices.forEach((connectedDevice) => {
      if (activeDevice.deviceIMEI == connectedDevice.IMEI) {
        var singleObj = {
          IMEI: connectedDevice.IMEI,
          Status: "Connected",
        };

        Devices.push(singleObj);
      }
    });
  });

  activeDevices.forEach((activeDevice) => {
    Devices.forEach((connectedDevice) => {
      if (activeDevice.deviceIMEI != connectedDevice.IMEI) {
        var singleObj = {
          IMEI: activeDevice.deviceIMEI,
          Status: "Active",
        };
        Devices.push(singleObj);
      }
    });
  });

  allocatedDevices.forEach((allocatedDevice) => {
    Devices.forEach((connectedDevice) => {
      if (allocatedDevice.deviceIMEI != connectedDevice.IMEI) {
        var singleObj = {
          IMEI: allocatedDevice.deviceIMEI,
          Status: "AllocatedDevice",
        };
        Devices.push(singleObj);
      }
    });
  });

  res.send(Devices);
};

exports.CurrentLocations = function (req, res) {
  db.collection("CurrentLocations", function (err, collection) {
    collection
      .find({ clientId: req.body.ClientId })
      .toArray(function (err, items) {
        res.status(200).send(items);
      });
  });
};

exports.DeviceByName = async (req, res) => {
  var allDevices = [];
  var devices = await DeviceModel.DeviceByName(
    req.body.fieldType,
    req.body.fieldValue
  );

  for (i = 0; i < devices.length; i++) {
    var jsonObj = {};
    jsonObj["DeviceId"] = devices[i]._id;
    jsonObj["deviceNo"] = devices[i].deviceNo;
    jsonObj["deviceIMEI"] = devices[i].deviceIMEI;
    jsonObj["deviceMake"] = devices[i].deviceMake;
    jsonObj["MachineStatus"] = devices[i].MachineStatus;
    var assignDevice = await DeviceAssignModel.ActiveAssign(devices[i]._id);
    if (assignDevice != undefined && assignDevice != null) {
      var client = await ClientModel.getClientById(assignDevice.clientId);
      jsonObj["ClientName"] = client.clientName;
    } else {
      jsonObj["ClientName"] = "Not Allocated";
    }
    if (
      assignDevice != undefined &&
      assignDevice != null &&
      assignDevice.VehicleId != ""
    ) {
      var vehicle = await VehicleModel.getVehicleById(assignDevice.VehicleId);
      jsonObj["vehicleNo"] = vehicle.vehicleReg;
    } else {
      jsonObj["vehicleNo"] = "Not Allocated";
    }
    allDevices.push(jsonObj);
  }
  if (req.body.fieldType === "ClientName") {
    console.log("Searching By Client Name");
    const result = allDevices.filter(
      (obj) => obj.ClientName === req.body.fieldValue
    );
    res.send(result);
    return;
  }

  if (
    req.body.fieldType === "vehicleNo" ||
    req.body.fieldType === "vehcileNo"
  ) {
    console.log("Searching By Vehicle Number");
    const result = allDevices.filter(
      (obj) => obj.vehicleNo === req.body.fieldValue
    );
    res.send(result);
    return;
  }

  res.send(allDevices);
};

exports.deviceAssignList = (req, res) => {
  DeviceAssignModel.deviceAssignList(req.body.DeviceId).then((result) => {
    res.status(200).send(result[0]);
  });
};

exports.ActiveDeviceWithClient = async (req, res) => {
  var allDevices = [];
  var devices = await DeviceModel.ActiveDevices();
  for (i = 0; i < devices.length; i++) {
    var jsonObj = {};
    jsonObj["DeviceId"] = devices[i]._id;
    jsonObj["deviceNo"] = devices[i].deviceNo;
    jsonObj["deviceIMEI"] = devices[i].deviceIMEI;
    jsonObj["deviceMake"] = devices[i].deviceMake;
    jsonObj["MachineStatus"] = devices[i].MachineStatus;
    var assignDevice = await DeviceAssignModel.ActiveAssign(devices[i]._id);
    if (assignDevice != undefined && assignDevice != null) {
      var client = await ClientModel.getClientById(assignDevice.clientId);
      jsonObj["ClientName"] = client.clientName;
    } else {
      jsonObj["ClientName"] = "Not Allocated";
    }
    if (
      assignDevice != undefined &&
      assignDevice != null &&
      assignDevice.VehicleId != ""
    ) {
      var vehicle = await VehicleModel.getVehicleById(assignDevice.VehicleId);
      jsonObj["vehicleNo"] = vehicle.vehicleReg;
      // console.log(vehicle.vehicleModel);
      //  console.log(assignDevice.VehicleId)
      //  console.log(vehicle);
    } else {
      jsonObj["vehicleNo"] = "Not Allocated";
    }

    allDevices.push(jsonObj);
  }
  //devices.forEach(async function(singleRecord){

  //           var assignDevice=await DeviceAssignModel.ActiveAssign(singleRecord._id);
  //           if (assignDevice!=undefined && assignDevice!=null)
  //           {
  //             var client=await ClientModel.getClientById(assignDevice.clientId);
  // if (client!=[] && client!=undefined && client!=null)
  //           {
  //             jsonObj["ClientName"]=client.clientName;

  //             allDevices.push(jsonObj);
  //           }

  //         }

  //           else {
  //             jsonObj["ClientName"]="Not Assigned"
  //             allDevices.push(jsonObj);
  //           }

  //});

  res.send(allDevices);
};

exports.getMaxNo = async (req, res) => {
  var devicesModel = await DeviceModel.getMaxno();
  var newDevice = devicesModel[0].deviceNo + 1;
  res.status(201).send({ maxDeviceNo: newDevice });
};

exports.CountDevicesIMEI = async (req, res) => {
  var devicesIMEI = await DeviceModel.CountDevicesIMEI(req.body.deviceIMEI);
  res.status(200).send({ countDeviceIMEI: devicesIMEI });
};
