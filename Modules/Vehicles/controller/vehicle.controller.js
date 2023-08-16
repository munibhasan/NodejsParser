const VehicleModel = require("../model/vehicle.model");
const redis = require("redis");
const redisClient = redis.createClient(process.env.redisServer);
redisClient.on("Redis error", function (error) {
  console.error(error);
});

exports.insert = (req, res) => {
 let errors = [];

  if (!req.body.vehicleNo) {
    errors.push("Missing vehicle #");
  }
  if (!req.body.vehicleModel) {
    errors.push("Missing vehicle Model");
  }
 

  if (errors.length) {
    return res.status(400).send({ errors: errors.join(",") });
  }


  if (req.body.id!="")
  {


    
    VehicleModel.patchRecord(req.body.id,req.body).then((result)=>{
      
      res.status(201).send({ id: result._id });
    });
  }

  else {

    req.body.DeviceAttach= false;
    req.body.IgnitionStatus= false;
    VehicleModel.CreateVehicle(req.body).then((result) => {
      res.status(201).send({ id: result._id });
    });
  }



};

exports.listByClientId = (req, res) => {
  let limit =
    req.query.limit && req.query.limit <= 100 ? parseInt(req.query.limit) : 10000;
  let page = 0;
  if (req.query) {
    if (req.query.page) {
      req.query.page = parseInt(req.query.page);
      page = Number.isInteger(req.query.page) ? req.query.page : 0;
    }
  }
  VehicleModel.listByClientId(limit, page,req.body.clientId).then((result) => {
    res.status(200).send(result); 
  });
};

exports.GetAvailableVehicles = (req, res) => {
  let limit =
    req.query.limit && req.query.limit <= 100 ? parseInt(req.query.limit) : 10000;
  let page = 0;
  if (req.query) {
    if (req.query.page) {
      req.query.page = parseInt(req.query.page);
      page = Number.isInteger(req.query.page) ? req.query.page : 0;
    }
  }
  VehicleModel.GetAvailableVehicles(limit, page,req.body.clientId).then((result) => {
    res.status(200).send(result); 
  });
};

exports.GetAvailableVehiclesForDriver = async(req, res) => {

 var availableVehicles=await VehicleModel.GetAvailableVehiclesForDriver(req.body.clientId);
 if (availableVehicles.length>0)
 {

  res.status(200).send({success:true,Msg:"Data Available",data:availableVehicles});
 }
 else {
  res.status(200).send({success:false,Msg:"Data Not  Available",data:availableVehicles});
 }


  

};



exports.VehicleByVehicleId = (req, res) => {
  let limit =
    req.query.limit && req.query.limit <= 100 ? parseInt(req.query.limit) : 10;
  let page = 0;
  if (req.query) {
    if (req.query.page) {
      req.query.page = parseInt(req.query.page);
      page = Number.isInteger(req.query.page) ? req.query.page : 0;
    }
  }
  VehicleModel.VehicleByVehicleId(limit, page,req.body.VehicleId).then((result) => {
    res.status(200).send(result);
  });
};






exports.getByClientId = (req, res) => {
  VehicleModel.findByClientId(req.body.clientId).then((result) => {
    res.status(200).send(result);
  });
};




exports.getById = (req, res) => {
  VehicleModel.findById(req.params.vehicleNo).then((result) => {
    res.status(200).send(result);
  });
};
exports.patchById = (req, res) => {
  VehicleModel.patchUser(req.params.vehicleNo, req.body).then((result) => {
    res.status(204).send({});
  });
};

exports.removeById = async(req, res) => {

  let countVehicle=await VehicleModel.CheckVehicleStatus(req.body.id);
 
if (countVehicle==1)
{
  res.status(200).send({success:false,Msg:"Vehicle is Bind to Device"});
}
else {
 // res.status(204).send({"Check":"will be delete"});
  VehicleModel.removeById(req.body.id).then((result) => {
    res.status(200).send({success:true,Msg:"Vehicle successfully deleted"});
  });
}
  
};

exports.UpdateVehicleStatus = (req, res) => {
  VehicleModel.UpdateVehicleStatus(req.body.id).then((result) => {
    res.status(204).send({});
  });
};
exports.RemoveAssignVehicle = (req, res) => {
  VehicleModel.RemoveAssignVehicle(req.body.vehicleId).then((result) => {
    res.status(204).send({});
  });
};

 exports.vehicleDetailsWithCurrentLocationById = (req, res) => {
 
  redisClient.get(req.body.vehicleId, async (err, record) => {
    
    if (err) throw err;

    res.status(200).send(JSON.parse(record));
});  

// exports.VehileList = (req, res) => {


//   VehicleModel.list().then((result) => {
//     res.status(200).send(result);
//   });
// };

};




