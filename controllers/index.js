//var validator    = require('validator');
var http = require('http');
var validator = require('validator');
var iconv = require('iconv-lite');
var redis = require('../common/redis.js');
var logger = require('../common/logger');
var config = require('../settings');
var store = require('../common/store');
var User = require('../models/user.js');
var Toy = require('../models/toy.js');
var Deal = require('../models/deal.js');
var Detail = require('../models/detail.js');
var Focused = require('../models/focused.js');
var tools = require('../common/tools.js');
var url = require('url');
var request = require('request');
var Payment = require('../lib/payment').Payment;
var middleware = require('../lib/middleware');
var defaultDistance = 50;
var comm = {
    appId: 'wx278f3c9ac083158f',
    mchId: '1314082701',
    grantType: 'authorization_code',
    secret: 'e9516bab3c6bf08c7cc6f2e21f6961cb'
};

var uris = {
    notifyUri: 'http://www.e-wanju.com/pay_notice',
    redirectUri: 'https://www.e-wanju.com/get_openid',
    openidUri: 'https://open.weixin.qq.com/connect/oauth2/authorize?appid='+ comm.appId + '&redirect_uri='+ urlencoded(this.redirectUri) + '&response_type=code&scope=snsapi_base&state=',
    tokenUri: 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + comm.appId + '&secret=' + comm.secret + '&code='
};

var initConfig = {
    appId: comm.appId,
    mchId: comm.mchId,
    notifyUrl: uris.notifyUri
};

var payment = new Payment(initConfig);

//登录页
exports.loginPage = function (req, res) {
    res.render('login', {
        title: '登录',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
};

//发送验证码
exports.sendMobileCode = function (req, res) {
    var mobile = req.query.mobile;
    var wechat_id = req.query.wechat_id;
    if (!mobile || !wechat_id) {
        return res.send(tools.toJsonString(-1, 'missing params'));
    }

    if (!validateMobile(mobile)) {
        return res.send(tools.toJsonString(-2, 'wrong mobile'));
    }

    redis.get(config.redis_code_per_day_prefix + mobile, function (err, result) {
        if (err) {
            logger.error('problem with redis: ' + err.message);
            return res.send(-3, 'system error');
        } else {
            if (config.code_per_day <= result) {
                logger.debug(mobile + ' send code times:' + result + ',over the max times');
                return res.send(tools.toJsonString(-4, 'too many times'));
            } else {
                SendMobileCode(req, res, result);
            }
        }
    });
};

//登录
exports.login = function (req, res) {
    var wechat_id = req.query.wechat_id;
    var mobile = req.query.mobile;
    var code = req.query.code;
    if (!mobile || !code) {
        return res.send(tools.toJsonString(-1, 'missing params'));
    }

    redis.get(config.redis_prefix + mobile, function (err, result) {
        if (err) {
            return res.send(tools.toJsonString(-2, 'missing params'));
        }
        if (code == result) {
            User.getByMobile(mobile, function (err, user) {
                if (err) {
                    return res.send(tools.toJsonString(-2, 'missing params'));
                }
                var callbackuri = uris.redirectUri + mobiile + '#wechat_redirect';
                if (!user) {
                    // get openid
                    var newUser = new User({
                        mobile: mobile,
                        wechat_id: wechat_id,
                        sex: req.query.sex,
                        address: req.query.address,
                        latitude: req.query.latitude,
                        longitude: req.query.longitude
                    });
                    newUser.save(function (err, user) {
                        if (err) {
                            res.send(tools.toJsonString(-2, 'missing params'));
                        } else {
                            request.get(callbackuri).on('response', function(response) {
                                if(response.statusCode == 200){
                                    redis.del(config.redis_prefix + mobile);
                                    req.session.user = user;//用户信息存入 session
                                    res.send(tools.toJsonString(0, '', {location: req.session.rurl}));
                                }else{
                                    console.log(err);
                                    return res.send(tools.toJsonString(-100, 'system err'));
                                }
                            });
                        }
                    });
                } else {
                    logger.info('user already exist');
                    if(!user.openid) {
                        request.get(callbackuri).on('error', function(err) {
                            console.log(err);
                            return res.send(tools.toJsonString(-100, 'system err'));
                        });
                    }
                    req.session.user = user;//用户信息存入 session
                    res.send(tools.toJsonString(0, '', {location: req.session.rurl}));
                }
            });
        } else {
            res.send(tools.toJsonString(-3, 'error code'));
        }
    });
};

// 搜索页面
exports.searchPage = function (req, res) {
    res.render('search', {
        title: '搜索玩具',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });

}

// 搜索附近玩具
exports.search = function (req, res) {
    var latitude = Number(req.query.latitude == undefined ? 39.948602 : req.query.latitude);
    var longitude = Number(req.query.longitude == undefined ? 116.360911 : req.query.longitude);
    var distance = Number(req.query.distance == undefined ? defaultDistance : req.query.distance);
    var status = Number(req.query.status == undefined ? 1 : req.query.status);
    var toyType = Number(req.query.toy_type == undefined ? -1 : req.query.toy_type);
    var page = Number(req.query.page == undefined ? 1 : req.query.page);

    var findKey = req.query.find_key;
    if (!findKey) {
        Toy.getNearToyWithAggregate(longitude, latitude, distance, 10, toyType, page,function (err, toys) {
            if (err) {
                logger.error(err.message);
            } else {
                tools.forbidCache(res);
                res.render('index', {
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString(),
                    toys: toys
                });
            }
        });
    } else {
        keyArray = findKey.split(',');
        var typeArray = [];
        stringArray2NumArray(keyArray,typeArray);
        if(typeArray.length == 0){
            typeArray.push(1);
        }

        Toy.searchNearToyWithAggregate(longitude,latitude,distance,typeArray[0],keyArray[0],page,function(err,toys){
            if (err) {
                logger.error(err.message);
            } else {
                tools.forbidCache(res);
                res.render('searchresult', {
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString(),
                    toys: toys
                });
            }
        });
    }

}

//新首页的展示纯页面
exports.index = function(req,res){
    res.render('index', {
        success: req.flash('success').toString(),
        error: req.flash('error').toString(),
    });
}

//原首页展示逻辑，获取附近玩具列表
exports.originalIndex = function (req, res) {
    // validate must parameters
    var latitude = Number(req.query.latitude == undefined ? 39.948602 : req.query.latitude);
    var longitude = Number(req.query.longitude == undefined ? 116.360911 : req.query.longitude);
    var distance = Number(req.query.distance == undefined ? defaultDistance : req.query.distance);
    var status = Number(req.query.status == undefined ? 1 : req.query.status);
    var toyType = Number(req.query.toy_type == undefined ? -1 : req.query.toy_type);
    var page = Number(req.query.page == undefined ? 1 : req.query.page);

/*    Toy.getNearToyWithAggregate(longitude, latitude, distance, 10, toyType, page,function (err, toys) {
        if (err) {
            logger.error(err.message);
        } else {
            tools.forbidCache(res);
            res.render('index', {
                success: req.flash('success').toString(),
                error: req.flash('error').toString(),
                toys: toys
            });
        }
    });*/

    Toy.getAll(page,function (err, toys) {
        if (err) {
            logger.error(err.message);
        } else {
            tools.forbidCache(res);
            res.render('index', {
                success: req.flash('success').toString(),
                error: req.flash('error').toString(),
                toys: toys
            });
        }
    });
};

// 可用玩具列表
exports.getToyList = function (req, res) {
    var listType = req.query.status == undefined ? 0 : req.query.status;
    var latitude = parseFloat(req.query.latitude == undefined ? 0 : req.query.latitude);
    var longitude = parseFloat(req.query.longitude == undefined ? 0 : req.query.longitude);
    var distance = parseFloat(req.query.distance == undefined ? defaultDistance : req.query.distance);
    var toyType = Number(req.query.toy_type == undefined ? -1 : req.query.toy_type);
    var page = Number(req.query.page == undefined ? 1 : req.query.page);

    //console.log(req.session.user);
    listType = parseInt(listType);
    var renderPage = '';

    // page need to render
    if (listType == 0) {
        renderPage = 'getnearbytoys';
    } else {
        renderPage = 'getfreetoys';
    }

    Toy.getNearToyWithAggregate(longitude, latitude, distance, listType, toyType, page,function (err, toys) {
        if (err) {
            logger.error(err.message);
        } else {
            res.render(renderPage, {
                success: req.flash('success').toString(),
                error: req.flash('error').toString(),
                toys: toys
            });
        }
    });
};

//我的玩具列表，根据状态可以显示我发布的，我预订的，我关注的
exports.getMyToyList = function (req, res) {
    var status = req.query.status == undefined ? 1 : req.query.status;
    var mobile = req.session.user.mobile;
    var page = Number(req.query.page == undefined ? 1 : req.query.page);

    status = parseInt(status);
    // my published toys
    if (status == 1) {
        Toy.getMyToys(mobile, page,function (err, toys) {
            if (err) {
                toys = [];
            }

            res.render('publishrecord', {
                toys: toys
            });
        });
    }

    // get deals record
    if (status == 2) {
        Deal.getMyBooked(mobile,page, function (err, bookeds) {
            if (err) {
                bookeds = [];
            }
            res.render('bookrecord', {
                deals: bookeds,
                user: req.session.user
            });
        });
    }

    if (status == 4) {
        Focused.getMyFocused(mobile, function (err, focuseds) {
            if (err) {
                focuseds = [];
            }
            res.render('focuserecord', {
                toys: focuseds
            });
        });
    }

};

//玩具详情页
exports.getToyDetail = function (req, res) {
    var toyId = req.query.toy_id;
    var action = req.query.action;

    var page = '';
    if (action === undefined) {
        page = 'toydetail';
    } else if (0 === parseInt(action)) {
        page = 'toydetail';
    } else if (1 === parseInt(action)) {
        page = 'publishtoydetail';
    } else {
        page = 'booktoydetail';
    }

    /* Toy.getDetail(toyId, function (err, toy) {
     if (err) {
     logger.error(err.message);
     toy = null;
     }
     if (toy) {

     }
     });*/
    Toy.updateAccess(toyId, function (err, toy) {
        if (err) {
            logger.error(err.message);
        }
        if (req.session.user) {
            // get deal record
            Deal.getDealRecord(req.session.user.mobile, toyId, function (err, deal) {
                if (err) {
                    logger.error(err.message);
                }
                res.render(page, {
                    toy: toy,
                    deal: deal,
                    user: req.session.user
                });
            });
        } else {
            res.render(page, {
                toy: toy,
                user: req.session.user
            });
        }
    });

};

// 订单详情页
exports.getDealDetail = function (req, res) {
    var dealId = req.query.deal_id;

    Deal.getDealRecordById(dealId, function (err, deal) {
        if (err) {
            logger.error(err.message);
        }

        if (req.session.user) {
            // get deal record
            res.render('booktoydetail', {
                deal: deal,
                user: req.session.user
            });
        } else {
            res.render('booktoydetail', {
                deal: deal,
            });
        }
    });
};


//发布玩具页面
exports.publishPage = function (req, res) {
    res.render('publishtoy', {
        title: '发布玩具',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
};


//发布玩具
exports.publish = function (req, res) {
    var action = req.query.action;
    if (action === undefined) {
        return res.send(tools.toJsonString(-1, 'missing action'));
    }

    // frozen the publish record
    if (0 === parseInt(action)) {
        var toyId = req.query.toy_id;
        Toy.update(toyId, 'status', 0, function (err, result) {
            if (err) {
                logger.error(err.message);
                res.status(200).send(tools.toJsonString(-2, 'system error'));
            }

            if (result.n == 0) {
                res.status(200).send(tools.toJsonString(-3, 'can not find this toy'));
                //res.send(-3, 'can not find this toy');
            } else {
                res.status(200).send(tools.toJsonString(0, 'de_publish success'));
                //res.send(0, 'de_publish success');
            }
        });
    } else {
        // publish
        var isFileLimit = false;
        var params = {};
        var images = [];
        req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
            file.on('limit', function () {
                isFileLimit = true;
                //res.send(tools.toJsonString(-1,'File size too large. Max is' + config.file_limit,""));
            });

            if (!isFileLimit) {
                store.upload(file, {filename: filename}, function (err, result) {
                    if (!err) {
                        images.push(result.url);
                    } else {
                        logger.error(err.message);
                    }
                    //res.send(tools.toJsonString(0,'upload success',result.url));
                });
            }
        });

        req.busboy.on('field', function (key, value, keyTruncated, valueTruncated) {
            params[key] = value;
        });

        req.busboy.on('finish', function () {
            params['images'] = images;
            PublishToy(req, res, params);
        });

        req.pipe(req.busboy);
    }
};


//订阅玩具
exports.dealToy = function (req, res) {
    var mobile = req.session.user.mobile;
    var toyId = req.query.toy_id;
    var action = req.query.action;

    if (!mobile || !toyId || !action) {
        return res.send(tools.toJsonString(-1, 'missing param'));
    }

    action = parseInt(action);
    if (action != 0 && action != 1 && action != 2) {
        return res.status(200).send(tools.toJsonString(-1, 'status error'));
    }

    Toy.get(toyId, function (err, toy) {
        if (err) {
            res.status(200).send(tools.toJsonString(-2, '[dealToy Toy.get] error'));
        } else {
            if (toy.mobile == mobile) {
                return res.status(200).send(tools.toJsonString(-5, 'can not make deal with self'));
            }

            if (toy.status == 0) {
                res.status(200).send(tools.toJsonString(-3, 'toy already de_published'));
            } else {
                // constructor deal data template
                var dealData = new Deal({
                    mobile: mobile,
                    toy_id: toyId,
                    user_id: toy.mobile,
                    rent: toy.rent,
                    price: toy.price,
                    status: 1,
                    name: toy.name,
                    type: toy.type,
                    address: toy.address,
                    img_url: toy.img_url,
                    publish_type: toy.publish_type,
                    publish_time: toy.publish_time
                });

                // 1. book,need to insert 2 deal record,one for publisher,the other for the booker
                if (action == 0) {
                    if (toy.status == 2 || toy.status == 3) {
                        if(toy.publish_type == 1){
                            res.status(200).send(tools.toJsonString(-3, 'toy just for sell'));
                        }else {
                            res.status(200).send(tools.toJsonString(-3, 'toy is dealing'));
                        }
                    } else {
                        Toy.update(toyId, 'status', 2, function (err, toy2) {
                            if (err) {
                                res.status(200).send(tools.toJsonString(-2, '[dealToy Toy.update] error'));
                            } else {
                                // insert dealer deal record
                                dealData.save(function (err, booked) {
                                    if (err) {
                                        res.status(200).send(tools.toJsonString(-2, '[dealToy bookerDeal.save] error'));
                                    } else {
                                        // insert publisher deal record
                                        dealData.mobile = toy.mobile;
                                        dealData.user_id = mobile;
                                        dealData.status = 2;
                                        dealData.save(function (err, booked) {
                                            if (err) {
                                                res.status(200).send(tools.toJsonString(-2, '[dealToy publisherDeal.save] error'));
                                            } else {
                                                res.status(200).send(tools.toJsonString(0, '', {location: '/my_toy_list?status=2'}));
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                }

                // 2. de_book or end book,need to update 2 booked record,one update for publisher,the other one for dealer
                if (action == 1) {
                    if (toy.status != 2 || toy.publish_type == 1) {
                        res.status(200).send(tools.toJsonString(-3, 'toy status is not right'));
                    } else {
                        Toy.update(toyId, 'status', 1, function (err) {
                                if (err) {
                                    res.status(200).send(tools.toJsonString(-2, '[dealToy Toy.update] error'));
                                } else {
                                    Deal.get(toyId, function (err, booked) {
                                        if (err) {
                                            res.status(200).send(tools.toJsonString(-2, '[dealToy Booked.get] error'));
                                        } else {
                                            var totalPrice = Number(((((new Date().getTime() - booked.b_ct) / (1000 * 3600 * 24)) - 0.5) * booked.rent).toFixed(2));
                                            console.log('totalPrice_1:' + totalPrice);
                                            if (totalPrice < 0) {
                                                totalPrice = 0;
                                            }
                                            console.log('totalPrice_2:' + totalPrice);
                                            // update dealer deal record
                                            Deal.endDeal(mobile, toyId, totalPrice, 1, function (err) {
                                                if (err) {
                                                    res.status(200).send(tools.toJsonString(-2, '[dealToy dealer Booked.endDeal] error'));
                                                } else {
                                                    // update publisher deal record
                                                    Deal.endDeal(toy.mobile, toyId, totalPrice, 2, function (err) {
                                                        if (err) {
                                                            res.status(200).send(tools.toJsonString(-2, '[dealToy publisher Booked.endDeal] error'))
                                                        } else {
                                                            res.status(200).send(tools.toJsonString(0, ' ', {location: '/my_toy_list?status=2'}));
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            }
                        );
                    }
                }

                // 3. buy
                if (action == 2) {
                    if (toy.status != 1 || toy.publish_type == 0) {
                        res.status(200).send(tools.toJsonString(-3, 'toy status is not right'));
                    } else {
                        Toy.update(toyId, 'status', 3, function (err) {
                                if (err) {
                                    res.status(200).send(tools.toJsonString(-2, '[bookToy Toy.update] error'));
                                } else {
                                    // insert dealer deal record
                                    dealData.price = toy.price;
                                    dealData.total_price = toy.price;
                                    dealData.status = 3;
                                    dealData.save(function (err, booked) {
                                        if (err) {
                                            res.status(200).send(tools.toJsonString(-2, '[dealToy buyerDeal.save] error'));
                                        } else {
                                            // insert publisher deal record
                                            dealData.mobile = toy.mobile;
                                            dealData.status = 4;
                                            dealData.user_id = mobile;
                                            dealData.save(function (err, booked) {
                                                if (err) {
                                                    res.status(200).send(tools.toJsonString(-2, '[dealToy salerDeal.save] error'));
                                                } else {
                                                    res.status(200).send(tools.toJsonString(0, ' ', {location: '/my_toy_list?status=1'}));
                                                }
                                            });
                                        }
                                    });
                                }
                            }
                        );
                    }
                }
            }
        }

    });
};


//统一下单
exports.uniorder = function(req,res){
    var mobile = req.session.user.mobile;
    var openid = req.session.user.openid;
    var total = parseFloat(req.query.total);
    var orderTitle = req.query.order_title;
    var goodId = req.query.good_id;
    var order = {
        body: orderTitle,
        out_trade_no: goodId + tools.mathRand(5) + (+new Date),
        total_fee: total,
        spbill_create_ip: req.ip,
        trade_type: 'JSAPI'
    };
    if(!openid){
        User.getByMobile(mobile,function(err,user){
            if(err){
                return res.send(tools.toJsonString(-3,'db err'));
            }else{
                order.openid = user.openid;
                payment.getBrandWCPayRequestParams(order,function(err,payargs){
                    res.json(payargs);
                });
            }
        });
    }else{
        payment.getBrandWCPayRequestParams(order,function(err,payargs){
            res.json(payargs);
        });
    }
};


//支付结果通知
exports.payNotice = function(req,res){
    middleware(initConfig).getNotify().done(function(message, req, res, next) {
        var openid = message.openid;
        var order_id = message.out_trade_no;
        var attach = {};
        try{
            attach = JSON.parse(message.attach);
        }catch(e){}

        /**
         * 查询订单，在自己系统里把订单标为已处理
         * 如果订单之前已经处理过了直接返回成功
         */
        res.reply('success');

        /**
         * 有错误返回错误，不然微信会在一段时间里以一定频次请求你
         * res.reply(new Error('...'))
         */
    });
};


//获取openid
exports.getOpenId = function(req,res){
    var code = req.query.code;
    var mobile = req.query.state;

    if(!code || !mobile){
        return res.send(tools.toJsonString(-3, 'param missing'));
    }

    var tokenUri = uris.tokenUri + code + '&grant_type=' + comm.grantType;
    request.get(tokenUri).on('response',function(response){
        if(response.statusCode == 200){
            ret = JSON.parse(JSON.stringify(response));
            var openId = ret.openid;
            User.update(mobile,'openid',openId,function(err){
                if(err){
                    logger.log(err);
                    res.send(tools.toJsonString(-5, 'db err'));
                }
            });
        }else{
            res.send(tools.toJsonString(-4, 'request openid err'));
        }
    });

};

/**
 * 检查是否为未登录
 * @param req
 * @param res
 * @param next
 */
exports.checkNotLogin = function (req, res, next) {
    if (req.session && req.session.user) {
        req.flash('error', '已登录');
        //req.session.rurl = req.url;
        if (req.headers['Accept'] === 'application/json') {
            return res.send(tools.toJsonString(0, '', {location: 'back'}));
        } else {
            return res.redirect('back');
        }
    }
    next();
};


/**
 * 检查是否已经登录
 * @param req
 * @param res
 * @param next
 */
exports.checkLogin = function (req, res, next) {
    if (!req.session || !req.session.user) {
        //logger.debug('NOT LOGIN!!');
        req.flash('error', '未登录');
        //logger.debug('checkLogin request url:' + req.url);
        //logger.debug(req.headers);
        if (req.headers['accept'].indexOf('application/json') != -1) {
            logger.debug('checkLogin:ajax request');
            var ref = req.headers['referer'] || req.headers['refer'];
            var refArray = ref.split('/');
            var url = '/' + refArray[refArray.length - 1];
            req.session.rurl = url;
            return res.send(tools.toJsonString(0, '', {location: '/login'}));
        } else {
            logger.log('****location*** is:' + '/login');
            req.session.rurl = req.url;
            return res.redirect('/login');
        }
    }
    next();
};


function PublishToy(req, res, params) {
    var query = url.parse(req.url, true).query;
    var mobile = req.session.user.mobile;
    var longitude = query.longitude;
    var latitude = query.latitude;
    var type = params['type'];
    var price = params['price'];
    var rent = params['rent'];
    var publish_type = params['publish_type'];
    var degree = params['degree'];
    var howOld = params['how_old'];

    logger.info(mobile, longitude, latitude, type, price, rent, publish_type, degree);

    var isError = false;
    if (!mobile || !latitude || !publish_type || !longitude || !price || !type) {
        logger.error('[PublishToy]:missing params');
        req.flash('error', '缺少必要参数');
        isError = true;
    } else {
        var newToy = new Toy({
            mobile: mobile,
            name: params['name'],
            type: type,
            price: parseFloat(price),
            address: params['publish_address'],
            user_id: query.wechat_id,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            img_url: params['images'],
            info: params['toy_info'],
            publish_type: parseInt(publish_type),
            rent: parseFloat(rent),
            degree: parseInt(degree),
            howOld:parseInt(howOld),
            status: 1
        });

        User.getByMobile(mobile, function (err, user) {
            if (err) {
                logger.error('[PublishToy:getByMobile]:db error');
                req.flash('error', '系统错误');
                isError = true;
            } else {
                newToy.save(function (err, toy) {
                    if (err) {
                        logger.error('[PublishToy:save]:db error');
                        req.flash('error', '系统错误');
                        isError = true;
                    } else {
                        if (toy) {
                            var integration = 0;
                            if (!user.p_count) {
                                integration = 10;
                            } else if (user.p_count <= 5) {
                                integration = 8;
                            } else {
                                integration = 5;
                            }
                            User.updatePublish(mobile, integration, function (err, user) {
                                if (err) {
                                    logger.error('[PublishToy:updatePublish]:db error');
                                    req.flash('error', '系统错误');
                                    isError = true;
                                } else {
                                    req.session.user = user;
                                    req.flash('success', '发布成功');
                                }
                            });
                        }
                    }
                });
            }
        });

        if (isError) {
            res.redirect('/publish');
        } else {
            res.redirect('/my_toy_list');
        }
    }
}


function SendMobileCode(req, res, result) {
    var mobile = req.query.mobile;
    var code = tools.mathRand();
    var content = 'appId=F0000036&tpId=2079628&customerId=C1010134&userId=U1011346&password=jixingKeji7753&phones='
        + mobile + '&fields=' + config.app_name + '||' + code + '||' + config.company_name;

    var buffer = iconv.encode(content, 'gbk');
    var options = {
        host: config.code_host,
        //port: 10086,
        path: config.code_path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept-Charset': 'GBK',
            'Transfer-Encoding': 'chunked'
        }
    };

    var codeReq = http.request(options, function (res) {
        logger.debug('STATUS: ' + res.statusCode);
        //logger.debug('HEADERS: ' + JSON.stringify(res.headers));
        //res.setEncoding(config.GBK);
        res.on('data', function (chunk) {
            logger.debug('BODY: ' + iconv.decode(chunk, 'GBK'));
        });
    });

    codeReq.on('error', function (e) {
        logger.error('problem with request: ' + e.message);
    });

    // write data to request body
    codeReq.write(buffer);
    codeReq.end();

    var multi = redis.multi();
    multi.set(config.redis_prefix + mobile, code);
    multi.incr(config.redis_code_per_day_prefix + mobile);
    multi.expire(config.redis_prefix + mobile, 60 * 10);
    if (!result) {
        multi.expire(config.redis_code_per_day_prefix + mobile, 3600 * 24);
    }
    multi.exec(function (err, replies) {
        if (err) {
            logger.error(err.message);
            res.send(tools.toJsonString(-3, 'system error'));
        } else {
            logger.debug(replies);
            res.send(tools.toJsonString(0));
        }
    });

}

function validateMobile(mobile) {
    if (mobile.length == 0) {
        return false;
    }
    if (mobile.length != 11) {
        return false;
    }

    var myreg = /^(((13[0-9]{1})|(15[0-9]{1})|(17[0-9]{1})|(18[0-9]{1}))+\d{8})$/;
    if (!myreg.test(mobile)) {
        return false;
    }
    return true;
}

function stringArray2NumArray(stringArray,typeArray) {
    var typeName = '拼图操作类' + '_' + '语言教育类' + '_' + '智力开发类' + '_' + '科学实验类' + '_' + '其他类';
    stringArray.forEach(function (item, index, array) {
        var pos = typeName.indexOf(item);
        if (pos < 6 && pos > -1) {
            typeArray.push(1);
        } else if (pos > 5 && pos < 12) {
            typeArray.push(2);
        }else if(pos > 11 && pos < 18){
            typeArray.push(3);
        }else if(pos > 17 && pos < 24){
            typeArray.push(4);
        }else{
            typeArray.push(5);
        }

        return typeArray;
    });

}