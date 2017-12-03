const fs = require('fs');
const path = require('path');
const os = require('os');

// 请到 open.youtu.qq.com查看您对应的appid相关信息并填充
// 请统一 通过 setAppInfo 设置

exports.APPID = '';
exports.SECRET_ID = '';
exports.SECRET_KEY = '';
exports.USERID = '';

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../', 'package.json')));
const ua = function () {
  return 'YouTuSDK/' + pkg.version + ' (' + os.type() + '; ' + os.platform() + '; ' + os.arch() + '; ) ';
};

exports.getAgent = ua;
exports.API_YOUTU_SERVER = 'api.youtu.qq.com';
exports.API_YOUTU_PORT = 80;
exports.API_DOMAIN = 0;

// 初始化 应用信息
exports.setAppInfo = function (appid, secretId, secretKey, userid, domain) {
  module.exports.APPID = appid;
  module.exports.SECRET_ID = secretId;
  module.exports.SECRET_KEY = secretKey;
  module.exports.USERID = userid;
  if(domain === 0) {
    exports.API_YOUTU_SERVER = 'api.youtu.qq.com';
  } else {
    exports.API_YOUTU_SERVER = 'youtu.api.qcloud.com';
  }
  exports.API_DOMAIN = domain;
};

