var pool = require('./db_pool');
//var crypto = require('crypto');

function User(user) {
    this.name = user.name;
    //this.password = user.password;
    this.wechat_id = user.wechat_id;
    this.mobile = user.mobile;
    this.sex = user.sex;
    this.address = user.address;
    this.latitude = user.latitude;
    this.longitude = user.longitude;
    this.p_count = user.p_count;
    this.last_accesstime = user.last_accesstime;
    this.integration = user.integration;
};

module.exports = User;

//存储用户信息
User.prototype.save = function (callback) {
    /*var md5 = crypto.createHash('md5'),
     email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
     head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";*/
    var create_time = new Date().getTime(), account_status = "Y";
    //要存入数据库的用户信息文档
    var user = {
        name: this.name,
        wechat_id: this.wechat_id,
        mobile: this.mobile,
        sex: this.sex,
        address: this.address,
        //latitude: this.latitude,
        //longitude: this.longitude
        loc: [this.longitude, this.latitude],
        create_time: create_time,
        account_status: account_status,
        integration: 0
        //password: this.password,
        //email: this.email,
        //head: head
    };
    //打开数据库
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }
        //读取 users 集合
        db.collection('users', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);//错误，返回 err 信息
            }
            //将用户数据插入 users 集合
            collection.insert(user, {
                safe: true
            }, function (err, user) {
                pool.release(db);
                if (err) {
                    return callback(err);
                }
                callback(null, user[0]);//成功！err 为 null，并返回存储后的用户文档
            });
        });
    });
};

//读取用户信息
User.getByWechat = function (wechat_id, callback) {
    //打开数据库
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }
        //读取 users 集合
        db.collection('users', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);//错误，返回 err 信息
            }
            //查找用户名（name键）值为 name 一个文档
            collection.findOne({
                wechat_id: wechat_id
            }, function (err, user) {
                pool.release(db);
                if (err) {
                    return callback(err);//失败！返回 err
                }
                callback(null, user);//成功！返回查询的用户信息
            });
        });
    });
};

User.getByMobile = function (mobile, callback) {
    //打开数据库
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }
        //读取 users 集合
        db.collection('users', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);//错误，返回 err 信息
            }
            //查找用户名（name键）值为 name 一个文档
            collection.findOne({
                mobile: mobile
            }, function (err, user) {
                pool.release(db);
                if (err) {
                    return callback(err);//失败！返回 err
                }
                callback(null, user);//成功！返回查询的用户信息
            });
        });
    });
};

User.update = function (mobile, changename, changevalue, callback) {
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('users', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);
            }
            collection.update({"mobile": mobile}, {changename: changevalue}, {
                upsert: false,
                w: 1
            }, function (err, result) {
                pool.release(db);
                if (err) {
                    return callback(err);
                }
                callback(null);
            })
        });
    });
};

User.updatePublish = function (mobile, integration, callback) {
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('users', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);
            }

            collection.findAndModify({"mobile": mobile}, [], {
                $inc: {integration: integration,p_count:1}
            }, {new: true}, function (err, user) {
                pool.release(db);
                if (err) {
                    return callback(err);
                }
                callback(null,user);
            });
        });
    });
};


