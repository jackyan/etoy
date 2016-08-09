var User = require('../models/user.js');
var Toy = require('../models/toy.js');
var Deal = require('../models/deal.js');
var Detail = require('../models/detail.js');
var Focused = require('../models/focused.js');

/*Deal.getDealRecord('18601355208','56d7e76db22b53722db26749',function(err,deal){
 if(err){
 console.log(err.message);
 }
 console.log(deal);
 });*/
/*Deal.getMyBooked('18601355208',function(err,deal){
 if(err){
 console.log(err.message);
 }
 console.log(deal);
 });*/

/*Toy.updateAccess('56d7e76db22b53722db26749', function (err, toy) {
    if (err) {
        console.log(err.message);
    }
    // get deal record
    Deal.getDealRecord('18601355208', '56d7e76db22b53722db26749', function (err, deal) {
        if (err) {
            logger.error(err.message);
        }
        console.log(toy);
        console.log(deal);
    });
});*/

/*console.log('-------start to getNearToyWithAggregate------------');
Toy.getNearToyWithAggregate(116.360911, 39.948602, 50, 10,2,function (err, toys) {
    if (err) {
        //res.status(200);
        console.log(err.message);
    } else {
        /!*toys.results.forEach(function (ob, index) {
            console.log(ob.obj);
        });*!/
        console.log(toys);
    }
});
console.log('-------end to getNearToyWithAggregate------------');*/

/*console.log('------- start to seachToy ------------');
Toy.searchToyWithTypeAndName(116.360911, 39.948602, 50, 2,'可租',function (err, toys) {
    if (err) {
        //res.status(200);
        console.log(err.message);
    } else {
        /!*toys.results.forEach(function (ob, index) {
         console.log(ob.obj);
         });*!/
        console.log(toys);
    }
});
console.log('-------end to search------------');*/
var newUser = new User({
    mobile: '18501355208',
    wechat_id: '18501355208',
    sex: 'N',
    address: 'BJ',
    latitude: 43.02,
    longitude: 42.68
});
newUser.save(function(err,user){
    if(err){
        console.log(err);
    }else{
        console.log(user);
    }
});

/*Toy.getNearToyWithoutStatus(116.360911, 39.948602,3, function (err, toys) {
 console.log('end getNearToyWithoutStatus');
 if (err) {
 //res.status(200);
 console.log(err.message);
 } else {
 toys.results.forEach(function (ob, index) {
 console.log(ob.obj);
 });
 }
 });
 console.log('-------end to getNearToyWithoutStatus------------');*/


/*var wechat_id = req.query.wechat_id;
 var mobile = req.query.mobile;
 var code = req.query.code;*/
/*var mobile = 18601355208;
 var wechat_id = '22dww';
 var newUser = new User({
 mobile: mobile,
 wechat_id: wechat_id,
 /!*sex: req.query.sex,
 address: req.query.address,
 latitude: req.query.latitude,
 longitude: req.query.longitude*!/
 });*/
//return res.send({e:{code:0,desc:""},data:""});
/*var mobile = '18601355208';
 var outs = [];
 Toy.getMyToys(mobile, function (err, toys) {
 if (err) {
 console.log(err.message);
 } else {
 //console.log(toys);
 outs = toys;
 outs.forEach(function (toy, index) {
 //console.log(JSON.parse(toy.img_url[0]).url);
 var img = toy.img_url[0];
 console.log(img.url);
 //var imgObject = JSON.parse(img);
 //console.log(imgObject.url);
 })

 }
 });*/
/*http://182.92.81.243/toy_list?wechat_id=18600108726&latitude=39.948602&longitude=116.360911&
 status=1&callbackparam=callback&_=1453883252133*/



//console.log(toys);

/*Booked.getMyBooked(mobile,function(err,toys){
 if(err){
 console.log(err.message);
 }else{
 console.log(toys);
 //toys = toys;
 }
 });*/
//console.log(toys);