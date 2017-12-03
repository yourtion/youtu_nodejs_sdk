const crypto = require('crypto');
const conf = require('./conf');

exports.AUTH_PARAMS_ERROR = -1;
exports.AUTH_SECRET_ID_KEY_ERROR = -2;

exports.appSign = function (expired, userid) {

  const secretId = conf.SECRET_ID || '';
  const secretKey = conf.SECRET_KEY || '';
  const appid = conf.APPID || '';
    
  const pexpired = expired || '';
  const puserid = userid || conf.USERID;
    
    
  if (!pexpired || !puserid) {
    return module.exports.AUTH_PARAMS_ERROR;
  }
    
  if (!secretId || !secretKey) {
    return module.exports.AUTH_SECRET_ID_KEY_ERROR;
  }
    
  const now = parseInt(Date.now() / 1000, 10);
  const rdm = parseInt(Math.random() * Math.pow(2, 32), 10);
    
  // the order of every key is not matter verify
  const plainText = 'a=' + appid + '&k=' + secretId + '&e=' + pexpired + '&t=' + now + '&r=' + rdm + '&u=' + puserid;
        
  const data = new Buffer(plainText, 'utf8');
    
  const res = crypto.createHmac('sha1', secretKey).update(data).digest();
    
  const bin = Buffer.concat([ res, data ]);
    
  const sign = bin.toString('base64');

  return sign;
};

