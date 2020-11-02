const fs = require("fs");
const path = require("path");

let config = { OUTPUT_FILE: ""};
if (fs.existsSync(path.join(__dirname, "./config.js"))) {
  config = require("./config.js");
}

module.exports = async function (group, addresses) {
    if (config.OUTPUT_FILE == "") {
        config.OUTPUT_FILE = "./addresses.json"
    }
    const outputPath = config.OUTPUT_FILE;
    console.log("outPutPath = ", outputPath)
    let content = {};
    if (fs.existsSync(outputPath)) {
        content = JSON.parse(fs.readFileSync(outputPath));
    }
    content[group] = addresses;
    fs.writeFileSync(outputPath, JSON.stringify(content));
    
    
    console.log("Content = ", JSON.stringify(content))
    console.log("   > Addresses has been successfully saved to", outputPath);
};
