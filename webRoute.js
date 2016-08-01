var express           = require('express');
var controller   = require('./controllers');
var router            = express.Router();

router.get('/mobile_check',controller.checkMobileCode);
router.get('/mobile_code',controller.sendMobileCode);
router.get('/my_toy_list',controller.getMyToyList);
router.get('/toy_list',controller.getToyList);
router.post('/publish_toy',controller.publishToy);
router.get('/book_toy',controller.bookToy);
router.get('/toy_detail',controller.getToyDetail);
router.post('/upload',controller.upload);

module.exports = router;
