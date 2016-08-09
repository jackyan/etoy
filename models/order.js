var pool = require('./db_pool');
var ObjectID = require('mongodb').ObjectID;
//var crypto = require('crypto');

var pageSize = 20;

function Order(order) {
    this.deal_id = order.deal_id;
    this.out_trade_no = order.out_trade_no;
    this.openid = order.openid;
    this.mobile = order.mobile;
    this.total_price = order.total_price;
    this.order_titile = order.order_title;
    this.status = order.status;
    this.order_type = order.order_type;
    this.goods_id = order.goods_id;
    this.pre_status = order.pre_status;
    this.ct = order.ct;
};

module.exports = Order;

//存储订单信息
Order.prototype.save = function (callback) {
    /*var md5 = crypto.createHash('md5'),
     email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
     head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";*/
    //要存入数据库的文档
    var ct = new Date().getTime();
    var order = {
        total_price: this.total_price,
        mobile: this.mobile,
        ct: ct,
        goods_id: this.goods_id,
        status: this.status,
        order_type: this.order_type,
        out_trade_no: this.out_trade_no,
        openid: this.openid,
        order_title: this.order_titile,
        deal_id: this.deal_id
    };
    //打开数据库
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }
        //读取 bookeds 集合
        db.collection('orders', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);//错误，返回 err 信息
            }
            //将玩具数据插入 users 集合
            collection.insert(order, {
                safe: true
            }, function (err, order) {
                pool.release(db);
                if (err) {
                    return callback(err);
                }
                callback(null, order[0]);//成功！err 为 null，并返回存储后的文档
            });
        });
    });
};


//通过不同查询对象获取单个order信息
Order.query = function (query, callback) {
    //打开数据库
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }
        //读取 deals 集合
        db.collection('orders', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);//错误，返回 err 信息
            }
            //按照id进行查询
            if(query.id){
                query = {'_id' : ObjectID(query.id)};
            }
            collection.findOne(query, function (err, order) {
                pool.release(db);
                if (err) {
                    return callback(err);//失败！返回 err
                }
                callback(null, order);//成功！返回查询信息
            });
        });
    });
};


//查询交易记录
Order.listOrder = function (query, callback) {
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
            collection.find({'mobile': query.mobile,'ct':{'$gt':query.b_date,'$lt':query.e_date}},{'sort':[['ct','desc']]}).toArray(function (err, orders) {
                pool.release(db);
                if (err) {
                    return callback(err);//失败！返回 err
                }
                callback(null, orders);//成功！返回查询信息
            });
        });
    });
};


//更新某个order信息
Order.update = function (query, update, callback) {
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('orders', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);
            }
            //按照id进行查询
            if(query.id){
                query = {'_id' : ObjectID(query.id)};
            }
            collection.update(query, {$set:update},
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


//order支付结果通知
Order.commit = function(commit,callback){
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('orders', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);
            }
            collection.update({"out_trade_no": commit.out_trade_no}, {$set:commit},
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


function checkPage(page){
    if(page == undefined || page < 0){
        page = 1;
    }
    return page;
}