var pool = require('./db_pool');
var ObjectID = require('mongodb').ObjectID;
//var crypto = require('crypto');

var pageSize = 20;

function Deal(deal) {
    this.price = deal.price;
    this.toy_id = deal.toy_id;
    this.user_id = deal.user_id;
    this.mobile = deal.mobile;
    this.total_price = deal.total_price;
    this.status = deal.status;
    this.name = deal.name;
    this.type = deal.type;
    this.address = deal.address;
    this.img_url = deal.img_url;
    this.publish_type = deal.publish_type;
    this.publish_time = deal.publish_time;
    this.rent = deal.rent;
    this.b_ct = deal.b_ct;
    this.e_ct = deal.e_ct;
};

module.exports = Deal;

//存储玩具信息
Deal.prototype.save = function (callback) {
    /*var md5 = crypto.createHash('md5'),
     email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
     head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";*/
    //要存入数据库的文档
    var b_ct = new Date().getTime();
    if(!this.total_price){
        this.total_price = -1;
    }
    var booked = {
        price: this.price,
        total_price: this.total_price,
        user_id: this.user_id,
        mobile: this.mobile,
        b_ct: b_ct,
        e_ct: this.e_ct,
        toy_id: this.toy_id,
        status: this.status,
        name: this.name,
        type: this.type,
        address: this.address,
        img_url: this.img_url,
        publish_type: this.publish_type,
        publish_time: this.publish_time,
        rent: this.rent

    };
    //打开数据库
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }
        //读取 bookeds 集合
        db.collection('deals', function (err, collection) {
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
Deal.get = function (id, callback) {
    //打开数据库
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }
        //读取 deals 集合
        db.collection('deals', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);//错误，返回 err 信息
            }
            //按照id进行查询
            collection.findOne({
                toy_id: id
            }, {'sort':[['b_ct',-1]]},function (err, booked) {
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
Deal.update = function (id, changename, changevalue, callback) {
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('deals', function (err, collection) {
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
Deal.endDeal = function (mobile, toy_id, totalPrice,status, callback) {
    console.log('totalPrice:' + totalPrice);
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('deals', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);
            }
            collection.update({"mobile": mobile, "toy_id": toy_id,'total_price':-1}, {$set:{
                    status: status,
                    total_price: totalPrice,
                    e_ct: new Date().getTime()
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
Deal.getMyBooked = function (mobile, page,callback) {
    var page = checkPage(page);
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }
        //读取 booked 集合
        db.collection('deals', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);//错误，返回 err 信息
            }
            //查询我的玩具列表
            collection.find({mobile: mobile},{sort:{'b_ct':-1},skip:(page-1)*pageSize,limit:pageSize}).toArray( function (err, deals) {
                pool.release(db);
                if (err) {
                    return callback(err);//失败！返回 err
                }
                callback(null, deals);//成功！返回查询信息
            });
        });
    });
};

//查询交易记录
Deal.getDealRecord = function (mobile,toyId, callback) {
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }
        //读取 booked 集合
        db.collection('deals', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);//错误，返回 err 信息
            }
            //查询我的玩具列表
            collection.find({'mobile': mobile,'toy_id':toyId},{'limit':1,'sort':[['b_ct','desc']]}).toArray(function (err, deals) {
                pool.release(db);
                if (err) {
                    return callback(err);//失败！返回 err
                }
                callback(null, deals);//成功！返回查询信息
            });
        });
    });
};

//查询交易记录
Deal.getDealRecordById = function (id, callback) {
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }
        //读取 booked 集合
        db.collection('deals', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);//错误，返回 err 信息
            }
            //查询我的玩具列表
            collection.findOne({
                _id: ObjectID(id)
            }, function (err, deal) {
                pool.release(db);
                if (err) {
                    return callback(err);//失败！返回 err
                }
                callback(null, deal);//成功！返回查询信息
            });
        });
    });
};

function checkPage(page){
    if(page == undefined || page < 0){
        page = 1;
    }
    return page;
}