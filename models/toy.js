var pool = require('./db_pool');
var ObjectID = require('mongodb').ObjectID;
//var crypto = require('crypto');
var pageSize = 20;
var defaultDistance = 50;

function Toy(toy) {
    this.name = toy.name;
    this.type = toy.type;
    this.price = toy.price;
    this.address = toy.address;
    this.user_id = toy.user_id;
    this.latitude = toy.latitude;
    this.longitude = toy.longitude;
    this.img_url = toy.img_url;
    this.days = toy.days;
    this.info = toy.info;
    this.mobile = toy.mobile;
    this.publish_type = toy.publish_type;
    this.rent = toy.rent;
    this.degree = toy.degree;
    this.status = toy.status;
    this.howOld = toy.howOld;
};

module.exports = Toy;

//存储玩具信息
Toy.prototype.save = function (callback) {
    /*var md5 = crypto.createHash('md5'),
     email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
     head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";*/
    var toy_status = 1, publish_time = new Date().getTime();
    //要存入数据库的玩具信息文档
    var toy = {
        mobile: this.mobile,
        name: this.name,
        type: this.type,
        price: this.price,
        address: this.address,
        user_id: this.user_id,
        //latitude: this.latitude,
        //longitude: this.longitude,
        loc: [this.longitude, this.latitude],
        img_url: this.img_url,
        days: this.days,
        info: this.info,
        status: toy_status,
        publish_time: publish_time,
        publish_type: this.publish_type,
        rent: this.rent,
        howOld: this.howOld,
        access_count: 0
    };
    //打开数据库
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }
        //读取 toys 集合
        db.collection('toys', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);//错误，返回 err 信息
            }
            //将玩具数据插入 toys 集合
            collection.insert(toy, {
                safe: true
            }, function (err, toy) {
                pool.release(db);
                if (err) {
                    return callback(err);
                }
                callback(null, toy[0]);//成功！err 为 null，并返回存储后的文档
            });
        });
    });
};

//读取玩具基本信息
Toy.get = function (id, callback) {
    //打开数据库
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }
        //读取 toys 集合
        db.collection('toys', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);//错误，返回 err 信息
            }
            //按照玩具id进行查询
            collection.findOne({
                _id: ObjectID(id)
            }, function (err, toy) {
                pool.release(db);
                if (err) {
                    return callback(err);//失败！返回 err
                }
                callback(null, toy);//成功！返回查询信息
            });
        });
    });
};

//读取所有玩具基本信息
Toy.getAll = function (page, callback) {
    if(page == undefined || page < 0){
        page = 1;
    }
    //打开数据库
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }
        //读取 toys 集合
        db.collection('toys', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);//错误，返回 err 信息
            }
            //按照玩具id进行查询
            collection.find({
                'status':{'$gt':0}
            },{sort:{'publish_time':-1},skip:(page-1)*pageSize,limit:pageSize}).toArray(function (err, toys) {
                pool.release(db);
                if (err) {
                    return callback(err);//失败！返回 err
                }
                callback(null, toys);//成功！返回查询信息
            });
        });
    });
};

//读取玩具详细信息
Toy.getDetail = function (id, callback) {
    //打开数据库
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }
        //读取 toys 集合
        db.collection('toys', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);//错误，返回 err 信息
            }
            //按照玩具id进行查询
            collection.findOne({
                _id: ObjectID(id)
            }, function (err, toy) {
                pool.release(db);
                if (err) {
                    return callback(err);//失败！返回 err
                }
                callback(null, toy);//成功！返回查询信息
            });
        });
    });
};

Toy.updateAccess = function (id, callback) {
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('toys', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);
            }
            collection.findAndModify({_id: ObjectID(id)}, [], {
                $inc: {access_count: 1}
            }, {new: true}, function (err, toy) {
                pool.release(db);
                if (err) {
                    return callback(err);
                }
                callback(null, toy);
            });
        });
    });
};


//更新某个玩具状态等信息
Toy.update = function (id, changename, changevalue, callback) {
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('toys', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);
            }
            collection.update({"_id": ObjectID(id)}, {$set: {'status': changevalue}}, function (err, result) {
                pool.release(db);
                if (err) {
                    return callback(err);
                }
                callback(null, result);
            })
        });
    });
};

//查询附近玩具列表，通过status过滤,no used
Toy.getNearToyWithStatus = function (longitude, latitude, distance, list_type, page,callback) {
    if (!distance) {
        distance = 3;
    }
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }
        //读取 toys 集合
        db.collection('toys', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);//错误，返回 err 信息
            }

            var queryObj = {
                query: {$or: [{'status': 2}, {'status': 3}]},
                num: pageSize,
                maxDistance: distance
            };

            var tailHandler = function (err, toys) {
                pool.release(db);
                if (err) {
                    return callback(err);//失败！返回 err
                }
                callback(null, toys);//成功！返回查询信息
            };

            // 不可交易玩具列表
            if (list_type == 2) {
                collection.geoNear(longitude, latitude,queryObj ,tailHandler);
            } else {
                var status = 0;
                // 发布状态玩具列表
                if (list_type == 1) {
                    status = 1;
                } else if (list_type == 3) {
                    // 预订状态玩具列表
                    status = 2;
                } else {
                    // 出售状态玩具列表
                    status = 3;
                }

                queryObj.query = {'status': status};
                collection.geoNear(longitude, latitude, queryObj, tailHandler);
            }
        });
    });
};


//查询附近玩具列表,no used
Toy.getNearToyWithoutStatus = function (longitude, latitude, distance, typeSort, callback) {
    if (!distance) {
        distance = 3;
    }
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }
        //读取 toys 集合
        db.collection('toys', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);//错误，返回 err 信息
            }
            //查找附近玩具列表
            if (typeSort < 0 || typeSort > 5) {
                collection.geoNear(longitude, latitude, {query: {'status': 1}, num: 20, maxDistance: distance},
                    function (err, toys) {
                        pool.release(db);
                        if (err) {
                            return callback(err);//失败！返回 err
                        }
                        callback(null, toys);//成功！返回查询信息
                    });
            } else {
                collection.geoNear(longitude, latitude, {
                        query: {'status': 1, 'type': typeSort},
                        num: 20,
                        maxDistance: distance
                    },
                    function (err, toys) {
                        pool.release(db);
                        if (err) {
                            return callback(err);//失败！返回 err
                        }
                        callback(null, toys);//成功！返回查询信息
                    });
            }
        });
    });
};

// 通过关键字查找附近玩具
Toy.searchNearToyWithAggregate = function (longitude, latitude, distance, type, name,page, callback) {
    var distance = checkDistance(distance);
    var page = checkPage(page);

    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }

        //读取 toys 集合
        //geo find policy
        var aggregateOptions = {
            "$geoNear": {
                "near": {
                    "type": "Point",
                    "coordinates": [longitude, latitude]
                },
                "distanceField": "distance",
                "maxDistance": distance,
                "spherical": true,
                "query": {'status':{'$gt':0},$or:[{'type':type},{'name':{$regex: name}}]},
                "num": pageSize
            }
        };

        // skip policy
        var aggregateSkip = {'$skip':(page - 1) * pageSize};

        db.collection('toys').aggregate([
                aggregateOptions,
                aggregateSkip
            ],
            function (err, toys) {
                pool.release(db);
                if (err) {
                    return callback(err);//失败！返回 err
                }
                callback(null, toys);//成功！返回查询信息
            });
    });
};


// 通过经纬度和类别以及状态查找附近玩具
Toy.getNearToyWithAggregate = function (longitude, latitude, distance, listType, toyType, page,callback) {
    var distance = checkDistance(distance);
    var page = checkPage(page);
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }

        //读取 toys 集合
        //geo find policy
        var aggregateOptions = {
            "$geoNear": {
                "near": {
                    "type": "Point",
                    "coordinates": [longitude, latitude]
                },
                "distanceField": "distance",
                "maxDistance": distance,
                "spherical": true,
                "query": {"status": 1, 'type': toyType},
                "num": pageSize
            }
        };

        // sort policy
        var aggregateSort = {'$sort':{'distance':1}};
        // skip policy
        var aggregateSkip = {'$skip':(page - 1) * pageSize};

        var status = 0;
        // 发布状态玩具列表
        if (listType <= 1 || listType == undefined) {
            status = 1;
        } else if (listType == 3) {
            // 预订状态玩具列表
            status = 2;
        } else {
            // 出售状态玩具列表
            status = 3;
        }

        if (toyType == undefined || toyType < 0 || toyType >5) {
            if(listType == 2){
                // dealing toys
                aggregateOptions.$geoNear.query = {status:{$in: [2, 3]}};
            }else if(listType == 10 || listType == 0){
                // all toys exclude toys depublished
                aggregateOptions.$geoNear.query = {status:{$in: [1, 2, 3]}}
            }else{
                aggregateOptions.$geoNear.query = {"status": status};
            }
        } else {
            aggregateSort = {
                "$sort": {"publish_time": -1}
            };
            if(listType == 2){
                aggregateOptions.$geoNear.query = {'type':toyType,status:{$in: [ 2, 3]}};
            }else if(listType == 10){
                console.log('coming aggregate',toyType);
                aggregateOptions.$geoNear.query = {'type':toyType,status: {'$in':[1,2,3]}};
                //aggregateOptions.$geoNear.query = {$or: [{'status': 1},{'status': 2}, {'status': 3}],'type':toyType};
            }else{
                aggregateOptions.$geoNear.query = {"status": status, 'type': toyType};
            }
        }

        db.collection('toys').aggregate([
                aggregateOptions,
                aggregateSort,
                aggregateSkip
            ],
            function (err, toys) {
                pool.release(db);
                if (err) {
                    return callback(err);//失败！返回 err
                }
                callback(null, toys);//成功！返回查询信息
            });
    });
};

//查询附近已被预订玩具列表
Toy.getNearBookedWithAggregate = function (longitude, latitude, distance,page, callback) {
    var distance = checkDistance(distance);
    var page = checkPage(page);

    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }

        //读取 toys 集合
        //geo find policy
        var aggregateOptions = {
            "$geoNear": {
                "near": {
                    "type": "Point",
                    "coordinates": [longitude, latitude]
                },
                "distanceField": "distance",
                "maxDistance": distance,
                "spherical": true,
                "query": {toy_status: 2},
                "num": pageSize
            }
        };

        // skip policy
        var aggregateSkip = {'$skip':(page - 1) * pageSize};

        db.collection('toys').aggregate([
                aggregateOptions,
                aggregateSkip
            ],
            function (err, toys) {
                pool.release(db);
                if (err) {
                    return callback(err);//失败！返回 err
                }
                callback(null, toys);//成功！返回查询信息
            });
    });
};


//查询我的玩具列表
Toy.getMyToys = function (mobile, page,callback) {
    var page = checkPage(page);

    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }
        //读取 toys 集合
        db.collection('toys', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);//错误，返回 err 信息
            }
            //查询我的玩具列表
            collection.find({
                mobile: mobile
                , status:{$in:[1,2]}
            },{sort:{'publish_time':-1},skip:(page-1)*pageSize,limit:pageSize}).toArray(function (err, toys) {
                pool.release(db);
                if (err) {
                    return callback(err);//失败！返回 err
                }
                callback(null, toys);//成功！返回查询信息
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

function checkDistance(distance){
    if (!distance) {
        distance = defaultDistance * 1000;
    }else{
        distance *= 1000;
    }
    return distance;
}
