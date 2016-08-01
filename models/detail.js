var pool = require('./db_pool');
//var crypto = require('crypto');

function Detail(detail) {
    this.toy_id = detail.toy_id;
    this.access_count = detail.access_count;
    this.external_info = detail.external_info;
};

module.exports = Detail;

//存储玩具详细信息
Detail.prototype.save = function (callback) {
    /*var md5 = crypto.createHash('md5'),
     email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
     head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";*/
    var ct = 0;
    //要存入数据库的玩具信息文档
    var detail = {
        toy_id: this.toy_id,
        access_count: this.access_count,
        external_info: this.external_info,
        ct: this.ct,
    };
    //打开数据库
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }
        //读取 detail 集合
        db.collection('details', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);//错误，返回 err 信息
            }
            //将玩具详细数据插入 users 集合
            collection.insert(detail, {
                safe: true
            }, function (err, detail) {
                pool.release(db);
                if (err) {
                    return callback(err);
                }
                callback(null, detail[0]);//成功！err 为 null，并返回存储后的文档
            });
        });
    });
};

//读取单个玩具详细信息
Detail.get = function (id, callback) {
    //打开数据库
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }
        //读取 details 集合
        db.collection('details', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);//错误，返回 err 信息
            }
            //按照玩具id进行查询
            collection.findOne({
                id: id
            }, function (err, detail) {
                pool.release(db);
                if (err) {
                    return callback(err);//失败！返回 err
                }
                callback(null, detail);//成功！返回查询信息
            });
        });
    });
};

//更新某个玩具详情信息
Detail.update = function (toy_id, changename, changevalue, callback) {
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('details', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);
            }
            collection.update({"toy_id": toy_id}, {changename: changevalue}, {upsert: false, w: 1},
                function (err, result) {
                    pool.release(db);
                    if (err) {
                        return callback(err);
                    }
                    callback(null);
                })
        });
    });
};

