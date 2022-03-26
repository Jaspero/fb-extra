const {successMessage, initializeFirebase} = require('../utils');
const {config} = require('../config');
const admin = require('firebase-admin');
const {outputFile} = require('fs-extra');
const {join} = require('path');

async function exp(directory, name) {
    initializeFirebase();
    const bucket = admin.storage().bucket(name);

    const [files] = await bucket.getFiles({
        autoPaginate: true,
        ...directory && {directory}
    });

    for (const file of files) {
        if (file.metadata.name.endsWith('/') && file.contentType === 'application/x-www-form-urlencoded;charset=UTF-8') {
            continue;
        }
        const f = await file.download();
        await outputFile(join(process.cwd(), file.metadata.name), f[0]);
    }

    successMessage(`Export completed successfully.`)
}

module.exports = {
    exp
};