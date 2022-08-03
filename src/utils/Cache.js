const NodeCache = require( "node-cache" );

const myCache = new NodeCache();

const set = (...args) => {

    myCache.set(args[0], args[1]);
    return true;

}

const get = (CKey) => {
    
    return myCache.get(CKey);

}

module.exports = {
    set, 
    get
}