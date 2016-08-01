/**
 * Created by Administrator on 2016/3/7.
 */
var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    ReplSetServers = require('mongodb').ReplSetServers,
    ObjectID = require('mongodb').ObjectID,
    Binary = require('mongodb').Binary,
    GridStore = require('mongodb').GridStore,
    Grid = require('mongodb').Grid,
    Code = require('mongodb').Code,
    BSON = require('mongodb').pure().BSON,
    assert = require('assert');

var db = new Db('test', new Server('localhost', 5586));
db.open(function (err, db) {

    // Create a test collection
    var collection = db.collection('test_map_reduce_functions_scope');

    // Insert some test documents
    collection.insert([{'user_id': 1, 'timestamp': new Date()}
        , {'user_id': 2, 'timestamp': new Date()}], {w: 1}, function (err, r) {

        // Map function
        var map = function () {
            emit(fn(this.timestamp.getYear()), 1);
        }

        // Reduce function
        var reduce = function (k, v) {
            count = 0;
            for (i = 0; i < v.length; i++) {
                count += v[i];
            }
            return count;
        }

        // Javascript function available in the map reduce scope
        var t = function (val) {
            return val + 1;
        }

        // Execute the map reduce with the custom scope
        var o = {};
        o.scope = {fn: new Code(t.toString())}
        o.out = {replace: 'replacethiscollection'}

        collection.mapReduce(map, reduce, o, function (err, outCollection) {
            assert.equal(null, err);

            // Find all entries in the map-reduce collection
            outCollection.find().toArray(function (err, results) {
                assert.equal(null, err);
                assert.equal(2, results[0].value);
                console.log('-- first mapReduce --');
                console.log(results);
                // mapReduce with scope containing plain function
                var o = {};
                o.scope = {fn: t}
                o.out = {replace: 'replacethiscollection'}

                collection.mapReduce(map, reduce, o, function (err, outCollection) {
                    assert.equal(null, err);

                    // Find all entries in the map-reduce collection
                    outCollection.find().toArray(function (err, results) {
                        console.log('-- second mapReduce --');
                        console.log(results);
                        assert.equal(2, results[0].value)

                        db.close();
                    });
                });
            });
        });
    });
});
