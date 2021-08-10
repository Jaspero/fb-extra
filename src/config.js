const FileSync = require('lowdb/adapters/FileSync');
const low = require('lowdb');
const path = require('path');

let db;

function get(key) {
    return db.get(key).value();
}

function set(key, value) {
    db.set(key, value).write();
}

function init() {
    const dir = path.dirname(require.main.filename);
    const adapter = new FileSync(path.join(dir, 'config.json'));
    db = low(adapter);
}

module.exports = {
    config: {
        get,
        set,
        init
    }
};
