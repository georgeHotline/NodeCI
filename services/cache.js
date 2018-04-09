const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util'); // to access promisify
const keys = require('../config/keys');

const redisClient = redis.createClient(keys.redisUrl);
redisClient.hget = util.promisify(redisClient.hget);

// redisClient.flushall();

// Get pointer to original Mongoose query.exec function
// to insert caching checks / routines before calls to database
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function(options = {}) {

    this.useCache = true;
    this.hashKey = JSON.stringify(options.key || 'default' );

    return this; // makes this chainable
};

mongoose.Query.prototype.exec = async function() {

    if (!this.useCache) {
        //console.log('Fetching from DB directly');
        return exec.apply(this, arguments); 
    }

    // build key to use to search in the cache index
    // the key needs to be stringified
    const cacheKey = JSON.stringify(
        Object.assign({},
            {collection: this.mongooseCollection.name},
            this.getQuery()
        ) 
    );

    // check for key value in cache and if found, return that value
    const cacheValue = await redisClient.hget(this.hashKey, cacheKey);

    if (cacheValue) {
        const doc = JSON.parse(cacheValue);        

        console.log('Fetching from cache with key = ' + this.hashKey);

        return Array.isArray(doc)
           ? doc.map(d => new this.model(d))
           : new this.model(doc);
    }

    // otherwise pull data from the DB
    const result = await exec.apply(this, arguments);

    // update the cache
    // TODO: expire the cache record automatically after XX amt of time
    redisClient.hset(this.hashKey, cacheKey, JSON.stringify(result));

    console.log('Data added and fetched from DB and cacheKey updated: ' + this.hashKey);

    return result;
}

module.exports = {
    clearHash(hashKey) {
        redisClient.del(JSON.stringify(hashKey));
    }
};