var settings = require('../settings');
var mongodb = require("mongodb");
var poolModule = require('generic-pool');
//var Db = require('mongodb').Db;
//var Server = require('mongodb').Server;
//module.exports = new Db(settings.db, new Server(settings.mongo_host, settings.mongo_port), {safe: true});
var pool = poolModule.Pool({
    name: 'mongodb',
    create: function (callback) {
        mongodb.MongoClient.connect('mongodb://' + settings.mongo_host + ':' + settings.mongo_port + '/' + settings.db, {
            server: {poolSize: 5}
        }, function (err, db) {
            callback(err, db);
        });
    },
    destroy: function (db) {
        db.close();
    },
    max: 10,//根据应用的可能最高并发数设置
    idleTimeoutMillis: 30000,
    log: false
});
module.exports = pool;