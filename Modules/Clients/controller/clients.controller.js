const ClientModel = require("../model/client.model");
const DeliverySettingModel = require("../model/deliverySetting.model");
const AdminRolesModel = require("../../AdminRoles/models/adminroles.model"); 

const VehicleModel = require("../../Vehicles/model/vehicle.model");

const emailSettingModel = require("../../EmailSetting/model/emailsetting.model");
var nodemailer = require("nodemailer");
require("dotenv").config();

const AdminemailSettingModel = require("../../AdminEmailSetting/model/adminemailsetting.model");
const jwt_decode = require("jwt-decode");
const FormName="Clients";
exports.insert = async (req, res) => {

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  var decoded = jwt_decode(token);
  userRole = decoded.userRole;
  const FormActions = await AdminRolesModel.FindByFormAndRole(userRole,FormName); 

 
 
  // console.log(req.body.clientname+'clientname');
  // var clientId='60705b8108db5718c8b499fd';
  // let clientEmailSetting = await  emailSettingModel.GetSettingByClientId(clientId);
  // var emailTemplate = clientEmailSetting.emailTemplate;
  //console.log('emailTemplate'+emailTemplate);  

  let adminEmailSetting = await AdminemailSettingModel.GetSettingByadmin();
  //console.log('adminEmailSetting'+adminEmailSetting);
  var emailTemplate = adminEmailSetting.emailTemplate;
  //console.log('emailTemplate'+emailTemplate);
  

  var emailtitle = "Client Information";
  var clientname=req.body.clientName;
  var clientaddress=req.body.clientAddress;
  var contactPerson=req.body.contactPerson;
  var contactNumbers=req.body.contactNumbers;
  var typeofBusiness=req.body.typeofBusiness; 
  var requiredNoDevices=req.body.requiredNoDevices;
  var timeZone=req.body.timeZone;
  var language=req.body.language;
  var driverProfileCount=req.body.driverProfileCount;
  var MapType=req.body.MapType;
  var typeOfUnit=req.body.typeOfUnit; 
  var driverProfile=req.body.driverProfile; 
  //var featurePortalApp=req.body.featurePortalApp; 

  var completeEmail = emailTemplate
  .replace("{emailTitle}", emailtitle)
  .replace("{clientname}", clientname)
  .replace("{clientaddress}", clientaddress)
  .replace("{ContactPerson}", contactPerson)
  .replace("{ContactNo}", contactNumbers)
  .replace("{TypeofBusiness}", typeofBusiness)
  .replace("{RequireNoOfDevices}", requiredNoDevices)
  .replace("{Language}", language)
  .replace("{NoOfDriverProfile}", driverProfileCount)
  .replace("{TypeofMap}", MapType)
  .replace("{TypeofUnit}", typeOfUnit)
  .replace("{Time Zone}", timeZone)
  .replace("{DriverProfile}", driverProfile)
  //.replace("{Features}", featurePortalApp)

    if (req.body.id != "" && FormActions.Edit) {
      ClientModel.patchClient(req.body.id, req.body).then((result) => {
       
        res.status(200).send({ success: true,Msg:"Save Successfully",data:result });
      });
    }
  
 
  else  if ( req.body.id == "" && FormActions.Add) {
   
      ClientModel.createClient(req.body).then((result) => {
        res.status(200).send({ success: true,Msg:"Save Successfully",data:result });
      
        // yaha py emai wala km krna hai 


       // var emailTemplate='<html> <head><link href="https://fonts.googleapis.com/css2?family=Lato:wght@100;300;400;700&amp;family=Open+Sans:wght@300;400;700&amp;family=Roboto:wght@100;300;400;700&amp;display=swap" rel="stylesheet"></head><body><div style="margin: 0 auto; width: 700px; font-family: "Lato", sans-serif;"><table width="100%" border="0" cellspacing="0" cellpadding="0" style="border:#d4e0ee 1px solid"><tbody <tr><td style="text-align:center;font-size:22px;padding:0 0 20px 0;background:#4c9a2a;color:#fff"><img src="https://ci4.googleusercontent.com/proxy/npJ4_QQnT5TV2k6-69mKYqrh0J6j3sBPhswo5CO4pZnPJWzOhJWmU3yPTraWcyDhkih05_nDvY08eJXYWPjeffg-FY7uVAqXpBA=s0-d-e1-ft#https://vtracksolutions.com/images/emailTemplateLogo.png" style="width:30%;margin:30px 0 20px" class="CToWUd"><br>{emailTitle}</td></tr><tr><td style="text-align:center;font-size:20px;padding:20px 0"><h2 style="font-size:24px;line-height:40px;margin:30px 0">'+{clientname}+'<br><span style="font-weight:700">{emailDetail2}<br></span><span style="font-weight:700"></span> </h2></td></tr><tr style="background: #363636;color:#fff;text-align:center;"><td style="padding:30px 0;font-size:14px"><p style="font-size: 15px;">{Link1} </tr></tbody></table></div></body></html>';
      //  console.log(emailTemplate);  

      const Toemail = [adminEmailSetting.to];
      const stringToemail = Toemail.join(', ') 

      const ccemail = [adminEmailSetting.cc];
      const stringccemail = ccemail.join(', ')
      
    


      var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: adminEmailSetting.userId,
            pass: adminEmailSetting.password
        }
    });
    
    const mailOptions = {
        from: adminEmailSetting.email, 
        to: stringToemail, 
        cc :stringccemail,
        subject: 'VTrack', 
        html: completeEmail   
    };
    
    transporter.sendMail(mailOptions, function (err, info) {
        if(err)
            console.log(err)
        else
            console.log(info);
    }); 

      }); 


    
  }
  else {
    res.status(200).send({ success: false,Msg:"Permission Denied" });
  }
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
  ClientModel.list(limit, page).then((result) => {
    res.status(200).send(result);
  });
 
};

exports.clientlist =async (req, res) => {
  let limit =
    req.query.limit && req.query.limit <= 100 ? parseInt(req.query.limit) : 10;
  let page = 0;
  if (req.query) {
    if (req.query.page) {
      req.query.page = parseInt(req.query.page);
      page = Number.isInteger(req.query.page) ? req.query.page : 0;
    }
  }

  var allClients=[];
  var clients=await ClientModel.clientlist();
  for(i=0;i<clients.length;i++)
  {
  var jsonObj={};
  jsonObj["_id"]=clients[i]._id;
  jsonObj["clientName"]=clients[i].clientName;
  jsonObj["clientAddress"]=clients[i].clientAddress;
  jsonObj["contactPerson"]=clients[i].contactPerson;
  jsonObj["contactNumbers"]=clients[i].contactNumbers;
  jsonObj["typeofBusiness"]=clients[i].typeofBusiness;
  jsonObj["requiredNoDevices"]=clients[i].requiredNoDevices;
  jsonObj["timeZone"]=clients[i].timeZone;
  jsonObj["language"]=clients[i].language;
  jsonObj["driverProfile"]=clients[i].driverProfile;
  jsonObj["driverProfileCount"]=clients[i].driverProfileCount;
  jsonObj["featurePortalApp"]=clients[i].featurePortalApp;
  jsonObj["featureDriverApp"]=clients[i].featureDriverApp;
  jsonObj["featureCustomerApp"]=clients[i].featureCustomerApp;
  jsonObj["MapType"]=clients[i].MapType;
  jsonObj["typeOfUnit"]=clients[i].typeOfUnit;

  var vehicle=await VehicleModel.getTotalVehiclesbyclientId(clients[i]._id);
  if (vehicle!=undefined && vehicle!=null && vehicle!=0){
    jsonObj["vehicle"]=vehicle;
  }
  else {
    jsonObj["vehicle"]="Not Allocated"; 
  }

  allClients.push(jsonObj);
 
}
  res.send(allClients);
};



exports.GetClientById = (req, res) => {
  ClientModel.GetClientById(req.body.id).then((result) => {
    res.status(200).send(result);
  });
};






exports.RemoveClient = async(req, res) => {



  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  var decoded = jwt_decode(token);
  userRole = decoded.userRole;
  const FormActions = await AdminRolesModel.FindByFormAndRole(userRole,FormName);
 


if (FormActions.Delete)
{

  ClientModel.RemoveClient(req.body.id).then((result) => {
    res.status(200).send({ success: true,Msg:"Save Successfully" });
   
  });
}
else {
  res.status(200).send({ success: false,Msg:"Permission Denied" });
}


};

exports.GetClientByName = (req, res) => {
  ClientModel.GetClientByName(req.body.Name).then((result) => {
    res.status(200).send(result);
  });
};

exports.ListbyId =async (req, res) => {
  // ClientModel.ListbyId(req.body.fieldType, req.body.fieldValue).then(
  //   (result) => {
  //     res.status(200).send(result);
  //   }
  // ); 

  var allClients=[];
  var clients=await ClientModel.ListbyId(req.body.fieldType, req.body.fieldValue);
  for(i=0;i<clients.length;i++)
  {
  var jsonObj={};
  jsonObj["_id"]=clients[i]._id;
  jsonObj["clientName"]=clients[i].clientName;
  jsonObj["clientAddress"]=clients[i].clientAddress;
  jsonObj["contactPerson"]=clients[i].contactPerson;
  jsonObj["contactNumbers"]=clients[i].contactNumbers;
  jsonObj["typeofBusiness"]=clients[i].typeofBusiness;
  jsonObj["requiredNoDevices"]=clients[i].requiredNoDevices;
  jsonObj["timeZone"]=clients[i].timeZone;
  jsonObj["language"]=clients[i].language;
  jsonObj["driverProfile"]=clients[i].driverProfile;
  jsonObj["driverProfileCount"]=clients[i].driverProfileCount;
  jsonObj["featurePortalApp"]=clients[i].featurePortalApp;
  jsonObj["featureDriverApp"]=clients[i].featureDriverApp;
  jsonObj["featureCustomerApp"]=clients[i].featureCustomerApp;
  jsonObj["MapType"]=clients[i].MapType;
  jsonObj["typeOfUnit"]=clients[i].typeOfUnit;

  var vehicle=await VehicleModel.getTotalVehiclesbyclientId(clients[i]._id);
  if (vehicle!=undefined && vehicle!=null && vehicle!=0){
    jsonObj["vehicle"]=vehicle;
  }
  else {
    jsonObj["vehicle"]="Not Allocated"; 
  }

  allClients.push(jsonObj);
 
}
  res.send(allClients);
};

// start work on deliverySetting
exports.insertdeliverySetting = (req, res) => {
  if (req.body.id != "") {
    console.log("Id update" + req.body.id);
    console.log("Update")
    
    DeliverySettingModel.UpdateDeliverySetting(
      req.body.clientId,
      req.body.isDeliveredToClient,
      req.body.clientEmail
    ).then((result) => {
      res.status(200).send(result);
    });
  }
  
  else {
    console.log("insert")
    console.log(req.body)
    DeliverySettingModel.createDeliverySetting(req.body).then((result) => {
      res.status(201).send(result);
    });
  }
};

exports.CheckDriverProfile =async (req, res) => {
  var result = await ClientModel.CheckDriverProfile(req.body.clientId)

   var driverProfile=result.driverProfile;
    if (!driverProfile)
    {
      res.status(201).send({ success: false,Msg:"Driver profile not enable" });
    }
    else {
      res.status(201).send({ success: true,Msg:"Driver profile is enabled" });
    }  
   
 
};

// exports.GetDeliverySettingById = (req, res) => {
//   DeliverySettingModel.GetDeliverySettingById(req.body.clientId).then((result) => {
//     res.status(200).send(result);
//   });
// };

exports.GetDeliverySettingById = (req, res) => {
  let limit =
    req.query.limit && req.query.limit <= 100
      ? parseInt(req.query.limit)
      : 10000;
  let page = 0;
  if (req.query) {
    if (req.query.page) {
      req.query.page = parseInt(req.query.page);
      page = Number.isInteger(req.query.page) ? req.query.page : 0;
    }
  }
  DeliverySettingModel.GetDeliverySettingById(
    limit,
    page,
    req.body.clientId
  ).then((result) => {
    res.status(200).send(result);
  });
};

exports.UpdateDeliverySetting = (req, res) => {
  DeliverySettingModel.UpdateDeliverySetting(
    req.body.clientId,
    req.body.isDeliveredToClient,
    req.body.clientEmail
  ).then((result) => {
    res.status(200).send(result);
  });
};
