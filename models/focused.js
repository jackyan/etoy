var pool = require('./db_pool');
//var crypto = require('crypto');

function Focused(focused) {
    this.toy_id = focused.toy_id;
    this.user_id = focused.user_id;
    this.ct = focused.ct;
    this.status = focused.status;
    this.count = focused.count;
};

module.exports = Focused;

//存储关注信息
Focused.prototype.save = function (callback) {
    /*var md5 = crypto.createHash('md5'),
     email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
     head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";*/
    //要存入数据库的文档
    var ct = new Date().getTime();
    var focused = {
        status: this.status,
        user_id: this.user_id,
        ct: ct,
        count: this.count,
        toy_id: this.toy_id
    };
    //打开数据库
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }
        //读取 focuseds 集合
        db.collection('focuseds', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);//错误，返回 err 信息
            }
            collection.insert(focused, {
                safe: true
            }, function (err, focused) {
                pool.release(db);
                if (err) {
                    return callback(err);
                }
                callback(null, focused[0]);//成功！err 为 null，并返回存储后的文档
            });
        });
    });
};


//更新某个focused信息
Focused.update = function (id, changename, changevalue, callback) {
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('focuseds', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);
            }
            collection.update({"id": id}, {changename: changevalue}, {upsert: false, w: 1},
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

//关注
Focused.doFocused = function (wechat_id, toy_id, callback) {
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('focuseds', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);
            }
            collection.find({"wechat_id": wechat_id, "toy_id": toy_id},
                function (err, result) {
                    pool.release(db);
                    if (err) {
                        return callback(err);
                    }
                    if (result) {
                        collection.update({
                            "wechat_id": wechat_id,
                            "toy_id": toy_id
                        }, {$inc: {"count": 1}}, function (err) {
                            pool.release(db);
                            if (err) {
                                return callback(err);
                            }
                        });
                    } else {
                        var focused = new Focused({
                            user_id: wechat_id,
                            toy_id: toy_id,
                            ct: 0,
                            count: 1,
                            status: 1
                        });

                        focused.save(function (err, focused) {
                            if (err) {
                                callback(err);
                            }

                        });

                    }
                    callback(null);
                })
        });
    });
};

//取消关注
Focused.deFocused = function (wechat_id, toy_id, callback) {
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('focuseds', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);
            }
            collection.update({"wechat_id": wechat_id, "toy_id": toy_id}, {status: 0}, {upsert: false, w: 1},
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
Focused.getMyFocused = function (wechat_id, callback) {
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }
        //读取 toys 集合
        db.collection('focuseds', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);//错误，返回 err 信息
            }
            //查询我的玩具列表
            collection.find({
                user_id: wechat_id, status: 1
            }, function (err, focuseds) {
                pool.release(db);
                if (err) {
                    return callback(err);//失败！返回 err
                }
                callback(null, focuseds);//成功！返回查询信息
            });
        });
    });
};
