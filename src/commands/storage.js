const {successMessage, initializeFirebase} = require('../utils');
const admin = require('firebase-admin');
const {outputFile, readdir, readFile} = require('fs-extra');
const {join} = require('path');
const {lstatSync} = require('fs');

async function exp(directory, name) {
    initializeFirebase();
    const bucket = admin.storage().bucket(name);

    const [files] = await bucket.getFiles({
        autoPaginate: true,
        ...directory && {directory}
    });

    for (const file of files) {
        if (file.metadata.name.endsWith('/') && file.metadata.contentType === 'application/x-www-form-urlencoded;charset=UTF-8') {
            continue;
        }
        const f = await file.download();
        await outputFile(join(process.cwd(), file.metadata.name), f[0]);
    }

    successMessage(`Export completed successfully.`)
}

async function importFolder(bucket, folder) {
    const list = await readdir(join(process.cwd(), folder));

    for (const i of list) {
        let relativePath = join(folder, i);
        const absolutePath = join(process.cwd(), relativePath);
        const st = lstatSync(absolutePath).isDirectory();

        if (st) {
            await importFolder(bucket, relativePath);
        } else {
            const file = await readFile(absolutePath);
            if (process.platform === 'win32') {
                relativePath = relativePath.replace(/\\/g, '/');
            }
            await bucket.file(relativePath).save(file);
        }
    }


}

async function imp(folder, name) {
    initializeFirebase();
    const bucket = admin.storage().bucket(name);
    await importFolder(bucket, folder);

    successMessage('All files imported successfully.')
}

module.exports = {
    exp,
    imp
};