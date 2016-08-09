var bcrypt = require('bcryptjs');
var moment = require('moment');

moment.locale('zh-cn'); // 使用中文

// 格式化时间
exports.formatDate = function (date, friendly) {
  date = moment(date);

  if (friendly) {
    return date.fromNow();
  } else {
    return date.format('YYYY-MM-DD HH:mm');
  }

};

exports.mathRand = function (digit) {
    if(!digit){
        var digit = 4;
    }
    var Num="";
    for(var i=0;i<digit;i++)
    {
        Num+=Math.floor(Math.random()*10);
    }
    return Num;
};

exports.validateId = function (str) {
  return (/^[a-zA-Z0-9\-_]+$/i).test(str);
};

exports.bhash = function (str, callback) {
  bcrypt.hash(str, 10, callback);
};

exports.bcompare = function (str, hash, callback) {
  bcrypt.compare(str, hash, callback);
};

exports.toJsonString = function(code,desc,data){
    if(!code){
        var code = 0;
    }
    if(!data){
        var data = "";
    }
    if(!desc){
        var desc = "OK";
    }
    var obj = {
        e:{
            code: code,
            desc: desc
        },
        data: data
    };
    return JSON.stringify(obj);
    //return 'callback([' + JSON.stringify(obj) + "])";
};

exports.forbidCache = function(res){
    res.append('Cache-control', 'no-cache');
}


