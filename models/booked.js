var pool = require('./db_pool');
//var crypto = require('crypto');

function Booked(booked) {
    this.price = booked.price;
    this.toy_id = booked.toy_id;
    this.user_id = booked.user_id;
    this.b_ct = booked.b_ct;
    this.e_ct = booked.e_ct;
    this.total_price = booked.total_price;
};

module.exports = Booked;

//存储玩具信息
Booked.prototype.save = function (callback) {
    /*var md5 = crypto.createHash('md5'),
     email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
     head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";*/
    //要存入数据库的文档
    var b_ct = new Date().getMilliseconds();
    var booked = {
        price: this.price,
        total_price: this.total_price,
        user_id: this.user_id,
        b_ct: b_ct,
        e_ct: this.e_ct,
        toy_id: this.toy_id,
        status: this.status
    };
    //打开数据库
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }
        //读取 bookeds 集合
        db.collection('bookeds', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);//错误，返回 err 信息
            }
            //将玩具数据插入 users 集合
            collection.insert(booked, {
                safe: true
            }, function (err, booked) {
                pool.release(db);
                if (err) {
                    return callback(err);
                }
                callback(null, booked[0]);//成功！err 为 null，并返回存储后的文档
            });
        });
    });
};

//读取单个booked信息
Booked.get = function (id, callback) {
    //打开数据库
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }
        //读取 bookeds 集合
        db.collection('bookeds', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);//错误，返回 err 信息
            }
            //按照id进行查询
            collection.findOne({
                id: id
            }, function (err, booked) {
                pool.release(db);
                if (err) {
                    return callback(err);//失败！返回 err
                }
                callback(null, booked);//成功！返回查询信息
            });
        });
    });
};

//更新某个booked信息
Booked.update = function (id, changename, changevalue, callback) {
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('bookeds', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);
            }
            collection.update({"id": id}, {$set:{changename: changevalue}},
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

//结束预订
Booked.endDeal = function (mobile, toy_id, totalPrice,status, callback) {
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('bookeds', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);
            }
            collection.update({"mobile": mobile, "toy_id": toy_id}, {$set:{
                    status: status,
                    total_price: totalPrice,
                    e_ct: new Date().getMilliseconds()
                }},
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

//查询我的预订玩具列表
Booked.getMyBooked = function (mobile, callback) {
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }
        //读取 booked 集合
        db.collection('bookeds', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);//错误，返回 err 信息
            }
            //查询我的玩具列表
            collection.find({mobile: mobile}).toArray( function (err, bookeds) {
                pool.release(db);
                if (err) {
                    return callback(err);//失败！返回 err
                }
                callback(null, bookeds);//成功！返回查询信息
            });
        });
    });
};
