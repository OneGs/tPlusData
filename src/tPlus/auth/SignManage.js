const crypto = require('crypto')
const jwt = require('jsonwebtoken')

function CreateSign(data, privateKey, customParas) {
    let ts = new Date().getTime();
    let exp = ts + 30000;
    let header = {"alg": "PS256", "typ": "JWT"};
    let payload = {
        "sub": "tester",
        "exp": exp,
        "datas": GetMd5(data)
    };
    if (customParas) {
        for (let prop in customParas) {
            payload[prop] = customParas[prop];
        }
    }
    return jwt.sign(JSON.stringify(payload), privateKey, {"algorithm": "PS256", "header": header});
}

function GetMd5(data) {
    return crypto.createHash('md5').update(data).digest("hex");
}

exports.CreateSign = CreateSign;
exports.GetMd5 = GetMd5;