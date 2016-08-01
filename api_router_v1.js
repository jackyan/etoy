var express = require('express');
var controller = require('./controllers');
var router = express.Router();

router.get('/index', controller.index);
router.get('/login', controller.checkNotLogin, controller.loginPage);
router.post('/login', controller.checkNotLogin, controller.login);
router.post('/mobile_code', controller.sendMobileCode);
router.get('/my_toy_list', controller.checkLogin, controller.getMyToyList);
router.get('/toy_list', controller.getToyList);
router.get('/publish', controller.checkLogin, controller.publishPage);
router.post('/publish', controller.checkLogin, controller.publish);
router.post('/deal', controller.checkLogin, controller.dealToy);
router.get('/toy_detail', controller.getToyDetail);
router.get('/deal_detail', controller.getDealDetail);
router.get('/search', controller.searchPage);
router.get('/search_result', controller.search);

module.exports = router;
