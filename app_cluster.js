var cluster = require('cluster');

if (cluster.isMaster) {
    console.log('Master is start.');
    var numCPUs = require('os').cpus().length;

    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', function() {
        console.log('A worker process died, restarting...');
        cluster.fork();
    });
} else {
    var path = require('path');
    var express = require('express');
    var favicon = require('serve-favicon');
    var compress = require('compression');
    var bodyParser = require('body-parser');
    var busboy = require('connect-busboy');
    var errorhandler = require('errorhandler');
    var requestLog = require('./common/request_log');
    var logger = require('./common/logger');
    var helmet = require('helmet');
    var session = require('express-session');
    var MongoStore = require('connect-mongo')(session);
    var flash = require('connect-flash');
    var bytes = require('bytes');
    var RedisStore = require('connect-redis')(session);
    var cors = require('cors');

    var apiRouterV1 = require('./api_router_v1');
    var settings = require('./settings');

    var app = express();
    app.set('views', path.join('/opt/static/views'));
    app.set('view engine', 'html');
    app.engine('html', require('ejs-mate'));
    app.enable('trust proxy');

    app.set('port', process.env.PORT || 80);
    app.use(requestLog);

    app.use(express.static(path.join('/opt/static/public')));
    app.use(favicon('/opt/static/public/images/favicon.ico'));

    app.use(require('response-time')());
    app.use(helmet.frameguard('sameorigin'));
    app.use(bodyParser.json({limit: '1mb'}));
    app.use(bodyParser.urlencoded({extended: true, limit: '1mb'}));
    app.use(require('method-override')());
    app.use(require('cookie-parser')(settings.cookieSecret));
    app.use(compress());
    app.use(session({
        secret: settings.cookieSecret,
        key: settings.db,//cookie name
        cookie: {maxAge: 1000 * 60 * 60 * 24},//30 days
        store: new RedisStore({
            port: settings.redis_port,
            host: settings.redis_host,
            "ttl": 60 * 60 * 24,
        }),
        resave: false,
        saveUninitialized: true,
    }));

//save session in mongodb
    /*app.use(session({
     secret: settings.cookieSecret,
     key: settings.db,//cookie name
     cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},//30 days
     store: new MongoStore({
     db: settings.db,
     host: settings.mongo_host,
     port: settings.mongo_port
     })
     }));*/

    app.use(flash());

    app.use(busboy({
        limits: {
            fileSize: settings.file_limit
        }
    }));

    app.use('/', apiRouterV1);

    /*app.use(function (err, req, res, next) {
     var meta = '[' + new Date() + '] ' + req.url + '\n';
     errorLog.write(meta + err.stack + '\n');
     next();
     });*/
    if (settings.debug) {
        app.use(errorhandler());
    } else {
        app.use(function (err, req, res, next) {
            logger.error(err);
            return res.status(500).send('500 status');
        });
    }

    app.listen(app.get('port'), function () {
        console.log('Express server listening on port ' + app.get('port'));
    });
}