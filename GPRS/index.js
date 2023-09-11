const stringUtil_1 = require("./utils/stringUtil");
const CRC16_1 = require("./utils/CRC16");

const calcCRC16 = (str) =>
  (0, CRC16_1.CalcCRC16)(str).toString(16).padStart(8, "0");

function generateCodec12(command) {
  command = (0, stringUtil_1.toHex)(command);
  let commandSize = (command.length / 2).toString(16);
  let data = {
    CodecID: "0C",
    CommandQuantity1: "01",
    Type: "5".padStart(2, "0"),
    CommandSize: commandSize.padStart(8, "0"),
    Command: command,
    CommandQuantity2: "01",
  };
  let dataStr = Object.values(data).reduce((acc, item) => acc + item, "");
  let returnObj =
    "".padStart(8, "0") +
    (dataStr.length / 2).toString(16).padStart(8, "0") +
    dataStr +
    calcCRC16(dataStr);

  return returnObj.toUpperCase();
}

function parseCodec12(hexStr) {
  let [preamble, content, crc] = (0, stringUtil_1.splitAt)(hexStr, 8, -8);
  if (preamble !== "".padStart(8, "0"))
    console.log(`GPRS PARSE ERROR: Invalid preamble.`);
  let [dataSize, data] = (0, stringUtil_1.splitAt)(content, 8);
  if (parseInt(dataSize, 16) !== data.length / 2)
    console.log(
      `GPRS PARSE ERROR: Data size doesn't match with the actual data size.`
    );
  //   let calculatedCRC = calcCRC16(data);
  //   if (crc !== calculatedCRC) console.log(`GPRS PARSE ERROR: CRCs don't match.`);
  let [codec, quantity1, type, commandContent, quantity2] = (0,
  stringUtil_1.splitAt)(data, 2, 2, 2, -2);
  if (quantity1 !== quantity2)
    console.log(`GPRS PARSE ERROR: Command quantity did not match.`);
  if (codec == "0C") {
    if (!["05", "06"].includes(type))
      console.log(`GPRS PARSE ERROR: Invalid type.`);
    let [commandSize, command] = (0, stringUtil_1.splitAt)(commandContent, 8);
    if (parseInt(commandSize, 16) !== command.length / 2)
      console.log(
        `GPRS PARSE ERROR: Command/Response size doesn't match with the actual size.`
      );
    return {
      isResponse: type === "06",
      command: (0, stringUtil_1.hexToAscII)(command),
    };
  } else {
    console.log(`GPRS PARSE ERROR: Not implemented`);
  }
}

// Use functions from the examples provided below:

// console.log(generateCodec12("setparam 66000:2"));
// console.log(
//   parseCodec12(
//     "00000000000000370C01060000002F4449313A31204449323A30204449333A302041494E313A302041494E323A313639323420444F313A3020444F323A3101000066E3"
//   )
// );
