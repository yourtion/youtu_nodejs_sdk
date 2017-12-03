const http = require('http');
const https = require('https');
const fs = require('fs');
const debug = require('debug')('YouTu:');

const auth = require('./auth');
const conf = require('./conf');

// 30 days
const EXPIRED_SECONDS = 2592000;
const cb = function (ret) {
  console.log(ret);
};

/**
 * return the status message
 */
function statusText(status) {
  switch (status) {
  case 200:
    return 'HTTP OK';
  case 400:
    return 'Bad Request';
  case 401:
    return 'Unauthorized';
  case 403:
    return 'Forbidden';
  case 500:
    return 'Internal Server Error';
  default:
    return 'unkown';
  }
}

function getrequest(protocol, params, callback) {

  return protocol.request(params, function (response) {
  
    debug('STATUS: ' + response.statusCode);
    debug('HEADERS: ' + JSON.stringify(response.headers));

    if(response.statusCode !== 200) {
      callback({ 'httpcode': response.statusCode, 'code': response.statusCode, 'message': statusText(response.statusCode), 'data': {}});
      return;
    }

    let body = '';
    response.setEncoding('utf8');
    
    response.on('data', function (chunk) {
      body += chunk;
    });
    response.on('end', function (){
      callback({ 'httpcode': response.statusCode, 'code': response.statusCode, 'message': statusText(response.statusCode), 'data': JSON.parse(body) });
    });

    response.on('error', function (e){
      callback({ 'httpcode': response.statusCode, 'code': response.statusCode, 'message': '' + e, 'data': {}});
    });
  });
}

function getFile(imagePath, callback) {
  if(imagePath.substring(0, 4) === 'http') {
    return callback(null, imagePath, true);
  }
  fs.readFile(imagePath, function (err, file) {
    if(err) return callback(err);
    callback(null, file.toString('base64'), false);
  });
}

/**
 * @brief detectface
 * @param imagePath 待检测的路径（本地路径或url）
 * @param isbigface 是否大脸模式 ０表示检测所有人脸, 1表示只检测照片最大人脸 适合单人照模式
 * @param callback 回调函数, 参见Readme 文档
 */
exports.detectface = function (imagePath, isbigface, callback) {

  callback = callback || cb;

  const expired = parseInt(Date.now() / 1000, 10) + EXPIRED_SECONDS;
  const sign = auth.appSign(expired);
  getFile(imagePath, function (err, data, url) {
    if(err) return callback({ 'httpcode': 0, 'code': -1, 'message': 'file ' + imagePath + ' not exists', 'data': {}});
    
    const request_body = JSON.stringify({
      app_id: conf.APPID,
      url: url ? data : undefined,
      image: !url ? data : undefined,
      mode: isbigface,
    });
    const params = {
      hostname: conf.API_YOUTU_SERVER,
      path: '/youtu/api/detectface',
      method: 'POST',
      headers: {
        'Authorization': sign,
        'User-Agent': conf.getAgent(),
        'Content-Length': request_body.length,
        'Content-Type': 'text/json',
      },
    };
    
    // debug(request_body);
    debug(params);
    const request = conf.API_DOMAIN === 0 ? getrequest(http, params, callback) : getrequest(https, params, callback);

    request.on('error', function (e) {
      callback({ 'httpcode': 0, 'code': 0, 'message': e.message, 'data': {}});
    });
    
    request.end(request_body);
    // debug(request_body);
  });
};


/**
 * @brief faceshape
 * @param imagePath 待检测的路径（本地路径或url）
 * @param isbigface 是否大脸模式
 * @param callback 回调函数, 参见Readme 文档
 */
exports.faceshape = function (imagePath, isbigface, callback) {

  callback = callback || cb;

  const expired = parseInt(Date.now() / 1000, 10) + EXPIRED_SECONDS;
  const sign = auth.appSign(expired);
  getFile(imagePath, function (err, data, url) {
    if(err) return callback({ 'httpcode': 0, 'code': -1, 'message': 'file ' + imagePath + ' not exists', 'data': {}});
    
    const request_body = JSON.stringify({
      app_id: conf.APPID,
      url: url ? data : undefined,
      image: !url ? data : undefined,
      mode: isbigface,
    });
    const params = {
      hostname: conf.API_YOUTU_SERVER,
      path: '/youtu/api/faceshape',
      method: 'POST',
      headers: {
        'Authorization': sign,
        'User-Agent': conf.getAgent(),
        'Content-Length': request_body.length,
        'Content-Type': 'text/json',
      },
    };
    
    const request = conf.API_DOMAIN === 0 ? getrequest(http, params, callback) : getrequest(https, params, callback);

    request.on('error', function (e) {
      callback({ 'httpcode': 0, 'code': 0, 'message': e.message, 'data': {}});
    });

    // send the request body
    request.end(request_body);
  });
};


/**
 * @brief facecompare
 * @param image_a 待比对的A图片路径（本地路径或url）
 * @param image_b 待比对的B图片路径（本地路径或url）
 * @param callback 回调函数, 参见Readme 文档
 */
exports.facecompare = function (image_a, image_b, callback) {

  callback = callback || cb;

  const expired = parseInt(Date.now() / 1000, 10) + EXPIRED_SECONDS;
  const sign = auth.appSign(expired);
  getFile(image_a, function (err, data_a, url1) {
    if(err) {
      return callback({ 'httpcode': 0, 'code': -1, 'message': 'file ' + image_a + ' not exists', 'data': {}});
    }
    getFile(image_b, function (err, data_b, url2) {
      if(err) {
        return callback({ 'httpcode': 0, 'code': -1, 'message': 'file ' + image_b + ' not exists', 'data': {}});
      }

      const request_body = JSON.stringify({
        app_id: conf.APPID,
        urlA: url1 ? data_a : undefined,
        imageA: !url1 ? data_a : undefined,
        urlB: url1 ? data_b : undefined,
        imageB: !url2 ? data_b : undefined,
      });
  
      const params = {
        hostname: conf.API_YOUTU_SERVER,
        path: '/youtu/api/facecompare',
        method: 'POST',
        headers: {
          'Authorization': sign,
          'User-Agent': conf.getAgent(),
          'Content-Length': request_body.length,
          'Content-Type': 'text/json',
        },
      };
   
      const request = conf.API_DOMAIN === 0 ? getrequest(http, params, callback) : getrequest(https, params, callback);

      request.on('error', function (e) {
        callback({ 'httpcode': 0, 'code': 0, 'message': e.message, 'data': {}});
      });

      // send the request body
      request.end(request_body);
    });
  });
};


/**
 * @brief facecompare
 * @param image_file 待比对的A图片路径（本地路径)
 * @param image_url 待比对的B图片路径（url）
 * @param callback 回调函数, 参见Readme 文档
 */
exports.facecompare_file_url = function (image_file, image_url, callback) {

  callback = callback || cb;

  const expired = parseInt(Date.now() / 1000, 10) + EXPIRED_SECONDS;
  const sign = auth.appSign(expired);

  getFile(image_file, function (err, data) {
    if(err) {
      return callback({ 'httpcode': 0, 'code': -1, 'message': 'file ' + image_file + ' not exists', 'data': {}});
    }

    const request_body = JSON.stringify({
      app_id: conf.APPID,
      imageA: data,
      urlB: image_url,
    });

    const params = {
      hostname: conf.API_YOUTU_SERVER,
      path: '/youtu/api/facecompare',
      method: 'POST',
      headers: {
        'Authorization': sign,
        'User-Agent': conf.getAgent(),
        'Content-Length': request_body.length,
        'Content-Type': 'text/json',
      },
    };
   
    // console.log(request_body);
    const request = conf.API_DOMAIN === 0 ? getrequest(http, params, callback) : getrequest(https, params, callback);

    request.on('error', function (e) {
      callback({ 'httpcode': 0, 'code': 0, 'message': e.message, 'data': {}});
    });

    // send the request body
    request.end(request_body);
  });
};


/**
 * @brief faceverify
 * @param person_id 待验证的人脸id
 * @param imagePath 待验证的图片路径（本地路径或url）
 * @param callback 回调函数, 参见Readme 文档
 */
exports.faceverify = function (imagePath, person_id, callback) {

  callback = callback || cb;

  const expired = parseInt(Date.now() / 1000, 10) + EXPIRED_SECONDS;
  const sign = auth.appSign(expired);
  getFile(imagePath, function (err, data, url) {
    if(err) return callback({ 'httpcode': 0, 'code': -1, 'message': 'file ' + imagePath + ' not exists', 'data': {}});
    
    const request_body = JSON.stringify({
      app_id: conf.APPID,
      url: url ? data : undefined,
      image: !url ? data : undefined,
      person_id,
    });
  
    const params = {
      hostname: conf.API_YOUTU_SERVER,
      path: '/youtu/api/faceverify',
      method: 'POST',
      headers: {
        'Authorization': sign,
        'User-Agent': conf.getAgent(),
        'Content-Length': request_body.length,
        'Content-Type': 'text/json',
      },
    };
    
    // debug(request_body);
    const request = conf.API_DOMAIN === 0 ? getrequest(http, params, callback) : getrequest(https, params, callback);

    request.on('error', function (e) {
      callback({ 'httpcode': 0, 'code': 0, 'message': e.message, 'data': {}});
    });

    // send the request body
    request.end(request_body);
  });
};


/**
 * @brief faceidentify
 * @param group_id 识别的组id
 * @param imagePath 待识别的图片路径（本地路径或url）
 * @param callback 回调函数, 参见Readme 文档
 */
exports.faceidentify = function (imagePath, group_id, callback) {

  callback = callback || cb;

  const expired = parseInt(Date.now() / 1000, 10) + EXPIRED_SECONDS;
  const sign = auth.appSign(expired);
  getFile(imagePath, function (err, data, url) {
    if(err) return callback({ 'httpcode': 0, 'code': -1, 'message': 'file ' + imagePath + ' not exists', 'data': {}});
    

    const request_body = JSON.stringify({
      app_id: conf.APPID,
      url: url ? data : undefined,
      image: !url ? data : undefined,
      group_id,
    });
  
    const params = {
      hostname: conf.API_YOUTU_SERVER,
      path: '/youtu/api/faceidentify',
      method: 'POST',
      headers: {
        'Authorization': sign,
        'User-Agent': conf.getAgent(),
        'Content-Length': request_body.length,
        'Content-Type': 'text/json',
      },
    };
    
    const request = conf.API_DOMAIN === 0 ? getrequest(http, params, callback) : getrequest(https, params, callback);

  
    request.on('error', function (e) {
      callback({ 'httpcode': 0, 'code': 0, 'message': e.message, 'data': {}});
    });

    // send the request body
    request.end(request_body);
  });
};

/**
 * @brief newperson
 * @param imagePath 图片路径（本地路径或url）
 * @param person_id 新建的个体id，用户指定，需要保证app_id下的唯一性
 * @param person_name 个体的名字
 * @param group_ids 新建的个体存放的组id，可以指定多个组id，用户指定（组默认创建）
 * @param persontag 人备注信息，用户自解释字段
 * @param callback 回调函数, 参见Readme 文档
 */
exports.newperson = function (imagePath, person_id, person_name, group_ids, persontag, callback) {

  callback = callback || cb;

  const expired = parseInt(Date.now() / 1000, 10) + EXPIRED_SECONDS;
  const sign = auth.appSign(expired);
  
  getFile(imagePath, function (err, data, url) {
    if(err) return callback({ 'httpcode': 0, 'code': -1, 'message': 'file ' + imagePath + ' not exists', 'data': {}});
    

    const request_body = JSON.stringify({
      app_id: conf.APPID,
      url: url ? data : undefined,
      image: !url ? data : undefined,
      person_id,
      person_name,
      group_ids,
      tag: persontag,
    });

    const params = {
      hostname: conf.API_YOUTU_SERVER,
      path: '/youtu/api/newperson',
      method: 'POST',
      headers: {
        'Authorization': sign,
        'User-Agent': conf.getAgent(),
        'Content-Length': request_body.length,
        'Content-Type': 'text/json',
      },
    };

    const request = conf.API_DOMAIN === 0 ? getrequest(http, params, callback) : getrequest(https, params, callback);

    request.on('error', function (e) {
      callback({ 'httpcode': 0, 'code': 0, 'message': e.message, 'data': {}});
    });
  
    // send the request body
    request.end(request_body);
  });
};


/**
 * @brief delperson
 * @param person_id 待删除的个体id
 * @param callback 回调函数, 参见Readme 文档
 */
exports.delperson = function (person_id, callback) {

  callback = callback || cb;

  const expired = parseInt(Date.now() / 1000, 10) + EXPIRED_SECONDS;
  const sign = auth.appSign(expired);
  
  const request_body = JSON.stringify({
    app_id: conf.APPID,
    person_id,
  });

  const params = {
    hostname: conf.API_YOUTU_SERVER,
    port: conf.API_YOUTU_PORT,
    path: '/youtu/api/delperson',
    method: 'POST',
    headers: {
      'Authorization': sign,
      'User-Agent': conf.getAgent(),
      'Content-Length': request_body.length,
      'Content-Type': 'text/json',
    },
  };

  const request = conf.API_DOMAIN === 0 ? getrequest(http, params, callback) : getrequest(https, params, callback);
  
  request.on('error', function (e) {
    callback({ 'httpcode': 0, 'code': 0, 'message': e.message, 'data': {}});
  });

  // send the request body
  request.end(request_body);
};


/**
 * @brief addface
 * @param person_id 新增人脸的个体身份id
 * @param images 待增加的包含人脸的图片lu路径数组，可加入多张（包体大小<2m）
 * @param facetag 人脸备注信息，用户自解释字段
 * @param callback 回调函数, 参见Readme 文档
 */
exports.addface = function (person_id, images, facetag, callback) {

  callback = callback || cb;

  const expired = parseInt(Date.now() / 1000, 10) + EXPIRED_SECONDS;
  const sign = auth.appSign(expired);
  
  const tag = images[0].substring(0, 4);
  let request_body = '';
  let data;
  if (tag === 'http') {
    request_body = JSON.stringify({
      app_id: conf.APPID,
      urls: images,
      person_id,
      tag: facetag,
    });
  } else {
    const image_bufs = [];
    for(const idx in images) {
      try {
        data = fs.readFileSync(images[idx]);
      } catch (e) {
        callback({ 'httpcode': 0, 'code': -1, 'message': 'file ' + images[idx] + ' not exists', 'data': {}});
        return;
      }
      
      if(data == null) {
        callback({ 'httpcode': 0, 'code': -1, 'message': images[idx] + ': read failed!', 'data': {}});
        return;
      }

      image_bufs[idx] = data.toString('base64');
    }
  
    request_body = JSON.stringify({
      app_id: conf.APPID,
      images: image_bufs,
      person_id,
      tag: facetag,
    });
  }
  
  // debug(request_body);
  const buffer = new Buffer(request_body, 'UTF-8');
  const params = {
    hostname: conf.API_YOUTU_SERVER,
    path: '/youtu/api/addface',
    method: 'POST',
    headers: {
      'Authorization': sign,
      'User-Agent': conf.getAgent(),
      'Content-Length': buffer.length,
      'Content-Type': 'text/json',
    },
  };

  debug(params);
  const request = conf.API_DOMAIN === 0 ? getrequest(http, params, callback) : getrequest(https, params, callback);
  
  request.on('error', function (e) {
    callback({ 'httpcode': 0, 'code': 0, 'message': e.message, 'data': {}});
  });

  // send the request body
  request.end(request_body);

};

 
/**
 * @brief delface
 * @param person_id 待删除人脸的个体身份id
 * @param face_ids 待删除的人脸id 数组
 * @param callback 回调函数, 参见Readme 文档
 */
exports.delface = function (person_id, face_ids, callback) {

  callback = callback || cb;

  const expired = parseInt(Date.now() / 1000, 10) + EXPIRED_SECONDS;
  const sign = auth.appSign(expired);
  
  const request_body = JSON.stringify({
    app_id: conf.APPID,
    face_ids,
    person_id,
  });

  const params = {
    hostname: conf.API_YOUTU_SERVER,
    path: '/youtu/api/delface',
    method: 'POST',
    headers: {
      'Authorization': sign,
      'User-Agent': conf.getAgent(),
      'Content-Length': request_body.length,
      'Content-Type': 'text/json',
    },
  };

  const request = conf.API_DOMAIN === 0 ? getrequest(http, params, callback) : getrequest(https, params, callback);
  
  request.on('error', function (e) {
    callback({ 'httpcode': 0, 'code': 0, 'message': e.message, 'data': {}});
  });

  // send the request body
  request.end(request_body);
};


/**
 * @brief setinfo
 * @param person_id 待设置的个体身份id
 * @param person_name 新设置的个体名字
 * @param tag 新设置的人脸备注信息
 * @param callback 回调函数, 参见Readme 文档
 */
exports.setinfo = function (person_name, person_id, tag, callback) {

  callback = callback || cb;

  const expired = parseInt(Date.now() / 1000, 10) + EXPIRED_SECONDS;
  const sign = auth.appSign(expired);
  
  const request_body = JSON.stringify({
    app_id: conf.APPID,
    person_name,
    person_id,
    tag,
  });

  const params = {
    hostname: conf.API_YOUTU_SERVER,
    path: '/youtu/api/setinfo',
    method: 'POST',
    headers: {
      'Authorization': sign,
      'User-Agent': conf.getAgent(),
      'Content-Length': request_body.length,
      'Content-Type': 'text/json',
    },
  };

  const request = conf.API_DOMAIN === 0 ? getrequest(http, params, callback) : getrequest(https, params, callback);
  
  request.on('error', function (e) {
    callback({ 'httpcode': 0, 'code': 0, 'message': e.message, 'data': {}});
  });

  // send the request body
  request.end(request_body);
};


/**
 * @brief getinfo
 * @param person_id 待查询的个体身份id
 * @param callback 回调函数, 参见Readme 文档
 */
exports.getinfo = function (person_id, callback) {

  callback = callback || cb;

  const expired = parseInt(Date.now() / 1000, 10) + EXPIRED_SECONDS;
  const sign = auth.appSign(expired);

  const request_body = JSON.stringify({
    app_id: conf.APPID,
    person_id,
  });

  const params = {
    hostname: conf.API_YOUTU_SERVER,
    path: '/youtu/api/getinfo',
    method: 'POST',
    headers: {
      'Authorization': sign,
      'User-Agent': conf.getAgent(),
      'Content-Length': request_body.length,
      'Content-Type': 'text/json',
    },
  };

  const request = conf.API_DOMAIN === 0 ? getrequest(http, params, callback) : getrequest(https, params, callback);
  
  request.on('error', function (e) {
    callback({ 'httpcode': 0, 'code': 0, 'message': e.message, 'data': {}});
  });

  // send the request body
  request.end(request_body);
};


/**
 * @brief getgroupids
 * @param callback 回调函数, 参见Readme 文档
 */
exports.getgroupids = function (callback) {

  callback = callback || cb;

  const expired = parseInt(Date.now() / 1000, 10) + EXPIRED_SECONDS;
  const sign = auth.appSign(expired);
  
  const request_body = JSON.stringify({
    app_id: conf.APPID,
  });

  const params = {
    hostname: conf.API_YOUTU_SERVER,
    path: '/youtu/api/getgroupids',
    method: 'POST',
    headers: {
      'Authorization': sign,
      'User-Agent': conf.getAgent(),
      'Content-Length': request_body.length,
      'Content-Type': 'text/json',
    },
  };

  const request = conf.API_DOMAIN === 0 ? getrequest(http, params, callback) : getrequest(https, params, callback);
  
  request.on('error', function (e) {
    callback({ 'httpcode': 0, 'code': 0, 'message': e.message, 'data': {}});
  });

  // send the request body
  request.end(request_body);
};


/**
 * @brief getpersonids
 * @param group_id 待查询的组id
 * @param callback 回调函数, 参见Readme 文档
 */
exports.getpersonids = function (group_id, callback) {

  callback = callback || cb;

  const expired = parseInt(Date.now() / 1000, 10) + EXPIRED_SECONDS;
  const sign = auth.appSign(expired);
  
  
  const request_body = JSON.stringify({
    app_id: conf.APPID,
    group_id,
  });

  const params = {
    hostname: conf.API_YOUTU_SERVER,
    port: conf.API_YOUTU_PORT,
    path: '/youtu/api/getpersonids',
    method: 'POST',
    headers: {
      'Authorization': sign,
      'User-Agent': conf.getAgent(),
      'Content-Length': request_body.length,
      'Content-Type': 'text/json',
    },
  };

  const request = conf.API_DOMAIN === 0 ? getrequest(http, params, callback) : getrequest(https, params, callback);
  
  request.on('error', function (e) {
    callback({ 'httpcode': 0, 'code': 0, 'message': e.message, 'data': {}});
  });

  // send the request body
  request.end(request_body);
};


/**
 * @brief getfaceids
 * @param person_id 待查询的个体id
 * @param callback 回调函数, 参见Readme 文档
 */
exports.getfaceids = function (person_id, callback) {

  callback = callback || cb;

  const expired = parseInt(Date.now() / 1000, 10) + EXPIRED_SECONDS;
  const sign = auth.appSign(expired);
  
  
  const request_body = JSON.stringify({
    app_id: conf.APPID,
    person_id,
  });

  const params = {
    hostname: conf.API_YOUTU_SERVER,
    path: '/youtu/api/getfaceids',
    method: 'POST',
    headers: {
      'Authorization': sign,
      'User-Agent': conf.getAgent(),
      'Content-Length': request_body.length,
      'Content-Type': 'text/json',
    },
  };

  const request = conf.API_DOMAIN === 0 ? getrequest(http, params, callback) : getrequest(https, params, callback);
 
  request.on('error', function (e) {
    callback({ 'httpcode': 0, 'code': 0, 'message': e.message, 'data': {}});
  });

  // send the request body
  request.end(request_body);
};


/**
 * @brief getfaceinfo
 * @param face_id 待查询的人脸id
 * @param callback 回调函数, 参见Readme 文档
 */
exports.getfaceinfo = function (face_id, callback) {

  callback = callback || cb;

  const expired = parseInt(Date.now() / 1000, 10) + EXPIRED_SECONDS;
  const sign = auth.appSign(expired);
  
  const request_body = JSON.stringify({
    app_id: conf.APPID,
    face_id,
  });

  const params = {
    hostname: conf.API_YOUTU_SERVER,
    path: '/youtu/api/getfaceinfo',
    method: 'POST',
    headers: {
      'Authorization': sign,
      'User-Agent': conf.getAgent(),
      'Content-Length': request_body.length,
      'Content-Type': 'text/json',
    },
  };

  const request = conf.API_DOMAIN === 0 ? getrequest(http, params, callback) : getrequest(https, params, callback);
 
  request.on('error', function (e) {
    callback({ 'httpcode': 0, 'code': 0, 'message': e.message, 'data': {}});
  });

  // send the request body
  request.end(request_body);
};

/**
 * @brief fuzzydetect
 * @param imagePath 待检测的路径
 * @param callback 回调函数, 参见Readme 文档
 */
exports.fuzzydetect = function (imagePath, callback) {

  callback = callback || cb;

  const expired = parseInt(Date.now() / 1000, 10) + EXPIRED_SECONDS;
  const sign = auth.appSign(expired);
  getFile(imagePath, function (err, data, url) {
    if(err) return callback({ 'httpcode': 0, 'code': -1, 'message': 'file ' + imagePath + ' not exists', 'data': {}});
    

    const request_body = JSON.stringify({
      app_id: conf.APPID,
      url: url ? data : undefined,
      image: !url ? data : undefined,
    });
  
    const params = {
      hostname: conf.API_YOUTU_SERVER,
      path: '/youtu/imageapi/fuzzydetect',
      method: 'POST',
      headers: {
        'Authorization': sign,
        'User-Agent': conf.getAgent(),
        'Content-Length': request_body.length,
        'Content-Type': 'text/json',
      },
    };
    // debug(request_body);
    debug(params);
    const request = conf.API_DOMAIN === 0 ? getrequest(http, params, callback) : getrequest(https, params, callback);
  
    request.on('error', function (e) {
      callback({ 'httpcode': 0, 'code': 0, 'message': e.message, 'data': {}});
    });
  
    // send the request body
    request.end(request_body);
  });
};

/**
 * @brief fooddetect
 * @param imagePath 待检测的路径
 * @param callback 回调函数, 参见Readme 文档
 */
exports.fooddetect = function (imagePath, callback) {

  callback = callback || cb;

  const expired = parseInt(Date.now() / 1000, 10) + EXPIRED_SECONDS;
  const sign = auth.appSign(expired);
  getFile(imagePath, function (err, data, url) {
    if(err) return callback({ 'httpcode': 0, 'code': -1, 'message': 'file ' + imagePath + ' not exists', 'data': {}});

    const request_body = JSON.stringify({
      app_id: conf.APPID,
      url: url ? data : undefined,
      image: !url ? data : undefined,
    });
  
    const params = {
      hostname: conf.API_YOUTU_SERVER,
      path: '/youtu/imageapi/fooddetect',
      method: 'POST',
      headers: {
        'Authorization': sign,
        'User-Agent': conf.getAgent(),
        'Content-Length': request_body.length,
        'Content-Type': 'text/json',
      },
    };
    // debug(request_body);
    debug(params);
    const request = conf.API_DOMAIN === 0 ? getrequest(http, params, callback) : getrequest(https, params, callback);

    request.on('error', function (e) {
      callback({ 'httpcode': 0, 'code': 0, 'message': e.message, 'data': {}});
    });
  
    // send the request body
    request.end(request_body);
  });
};

/**
 * @brief imagetag
 * @param imagePath 待检测的路径
 * @param callback 回调函数, 参见Readme 文档
 */
exports.imagetag = function (imagePath, callback) {

  callback = callback || cb;

  const expired = parseInt(Date.now() / 1000, 10) + EXPIRED_SECONDS;
  const sign = auth.appSign(expired);
  getFile(imagePath, function (err, data, url) {
    if(err) return callback({ 'httpcode': 0, 'code': -1, 'message': 'file ' + imagePath + ' not exists', 'data': {}});
    
    const request_body = JSON.stringify({
      app_id: conf.APPID,
      url: url ? data : undefined,
      image: !url ? data : undefined,
    });
  
    const params = {
      hostname: conf.API_YOUTU_SERVER,
      path: '/youtu/imageapi/imagetag',
      method: 'POST',
      headers: {
        'Authorization': sign,
        'User-Agent': conf.getAgent(),
        'Content-Length': request_body.length,
        'Content-Type': 'text/json',
      },
    };
    // debug(request_body);
    debug(params);
  
    const request = conf.API_DOMAIN === 0 ? getrequest(http, params, callback) : getrequest(https, params, callback);

    request.on('error', function (e) {
      callback({ 'httpcode': 0, 'code': 0, 'message': e.message, 'data': {}});
    });
  
    // send the request body
    request.end(request_body);
  });
};

/**
 * @brief idcardocr
 * @param imagePath 待检测的路径（本地路径或url）
 * @param card_type	Int	身份证图片类型，0-正面，1-反面
 * @param callback 回调函数, 参见Readme 文档
 */
exports.idcardocr = function (imagePath, card_type, callback) {

  callback = callback || cb;

  const expired = parseInt(Date.now() / 1000, 10) + EXPIRED_SECONDS;
  const sign = auth.appSign(expired);
  getFile(imagePath, function (err, data, url) {
    if(err) return callback({ 'httpcode': 0, 'code': -1, 'message': 'file ' + imagePath + ' not exists', 'data': {}});

    const request_body = JSON.stringify({
      app_id: conf.APPID,
      url: url ? data : undefined,
      image: !url ? data : undefined,
      card_type,
    });
  
    const params = {
      hostname: conf.API_YOUTU_SERVER,
      path: '/youtu/ocrapi/idcardocr',
      method: 'POST',
      headers: {
        'Authorization': sign,
        'User-Agent': conf.getAgent(),
        'Content-Length': request_body.length,
        'Content-Type': 'text/json',
      },
    };
  
    const request = conf.API_DOMAIN === 0 ? getrequest(http, params, callback) : getrequest(https, params, callback);

    request.on('error', function (e) {
      callback({ 'httpcode': 0, 'code': 0, 'message': e.message, 'data': {}});
    });

    // send the request body
    request.end(request_body);
  });
};

/*
 * @brief imageporn
 * @param imagePath 待检测的路径
 * @param callback 回调函数, 参见Readme 文档
 */
exports.imageporn = function (imagePath, callback) {

  callback = callback || cb;

  const expired = parseInt(Date.now() / 1000, 10) + EXPIRED_SECONDS;
  const sign = auth.appSign(expired);
  getFile(imagePath, function (err, data, url) {
    if(err) return callback({ 'httpcode': 0, 'code': -1, 'message': 'file ' + imagePath + ' not exists', 'data': {}});
    

    const request_body = JSON.stringify({
      app_id: conf.APPID,
      url: url ? data : undefined,
      image: !url ? data : undefined,
    });
  
    const params = {
      hostname: conf.API_YOUTU_SERVER,
      path: '/youtu/imageapi/imageporn',
      method: 'POST',
      headers: {
        'Authorization': sign,
        'User-Agent': conf.getAgent(),
        'Content-Length': request_body.length,
        'Content-Type': 'text/json',
      },
    };
  
    const request = conf.API_DOMAIN === 0 ? getrequest(http, params, callback) : getrequest(https, params, callback);
  
    request.on('error', function (e) {
      callback({ 'httpcode': 0, 'code': 0, 'message': e.message, 'data': {}});
    });
  
    // send the request body
    request.end(request_body);
  });
};


/**
 * @brief imageporn
 * @param imagePath 待检测的路径
 * @param cardType 0 代表输入图像是身份证正面， 1代表输入是身份证反面
 * @param callback 回调函数, 参见Readme 文档
 */
exports.idcardocr = function (imagePath, cardType, callback) {
  
  callback = callback || cb;

  const expired = parseInt(Date.now() / 1000, 10) + EXPIRED_SECONDS;
  const sign = auth.appSign(expired);
  getFile(imagePath, function (err, data, url) {
    if(err) return callback({ 'httpcode': 0, 'code': -1, 'message': 'file ' + imagePath + ' not exists', 'data': {}});

    const request_body = JSON.stringify({
      app_id: conf.APPID,
      card_type: cardType,
      url: url ? data : undefined,
      image: !url ? data : undefined,
    });
  
    const params = {
      hostname: conf.API_YOUTU_SERVER,
      path: '/youtu/ocrapi/idcardocr',
      method: 'POST',
      headers: {
        'Authorization': sign,
        'User-Agent': conf.getAgent(),
        'Content-Length': request_body.length,
        'Content-Type': 'text/json',
      },
    };
  
    const request = conf.API_DOMAIN === 0 ? getrequest(http, params, callback) : getrequest(https, params, callback);
  
    request.on('error', function (e) {
      callback({ 'httpcode': 0, 'code': 0, 'message': e.message, 'data': {}});
    });
  
    // send the request body
    request.end(request_body);
  });
};

/**
 * @brief namecardocr
 * @param imagePath 待检测的路径（本地路径或url）
 * @param retimage	是否需要返回处理结果图,true返回，false不返回
 * @param callback 回调函数, 参见Readme 文档
 */
exports.namecardocr = function (imagePath, retimage, callback) {

  callback = callback || cb;

  const expired = parseInt(Date.now() / 1000, 10) + EXPIRED_SECONDS;
  const sign = auth.appSign(expired);
  getFile(imagePath, function (err, data, url) {
    if(err) return callback({ 'httpcode': 0, 'code': -1, 'message': 'file ' + imagePath + ' not exists', 'data': {}});
    

    const request_body = JSON.stringify({
      app_id: conf.APPID,
      url: url ? data : undefined,
      image: !url ? data : undefined,
      retimage,
    });
  
    const params = {
      hostname: conf.API_YOUTU_SERVER,
      path: '/youtu/ocrapi/namecardocr',
      method: 'POST',
      headers: {
        'Authorization': sign,
        'User-Agent': conf.getAgent(),
        'Content-Length': request_body.length,
        'Content-Type': 'text/json',
      },
    };
  
    const request = conf.API_DOMAIN === 0 ? getrequest(http, params, callback) : getrequest(https, params, callback);

    request.on('error', function (e) {
      callback({ 'httpcode': 0, 'code': 0, 'message': e.message, 'data': {}});
    });

    // send the request body
    request.end(request_body);
  });
};
