const {successMessage, errorMessage, initializeFirebase} = require('../utils');
const admin = require('firebase-admin');
const {readFileSync} = require('fs');
const {outputFile} = require('fs-extra');
const {utils} = require('XLSX');
const {Parser} = require('json2csv');
const {join} = require('path');

async function addDocument(collection, objectPath) {
    let isObject = false;

    try {
        JSON.parse(objectPath);
        isObject = true;
    } catch (error) {}

    let object;
    try {
        object = JSON.parse(isObject ? objectPath : readFileSync(objectPath).toString());
    } catch (error) {
        return errorMessage(`No such file ${objectPath} or provided invalid JSON!`);
    }

    initializeFirebase();
    const document = await admin.firestore().collection(collection).add(object);
    successMessage(`Successfully added document: ${document.id}`)
}

async function collectionExport(
    collection,
    output,
    query,
    type = 'csv',
    sort,
    sortDirection,
    limit
) {
    initializeFirebase();

    let col = admin.firestore().collection(collection);

    if (query) {
        JSON.parse(query).forEach(filter => {
            col = col.where(filter.key, filter.filter, filter.value);
        });
    }

    if (sort) {
        col = col.orderBy(sort, sortDirection | 'desc');
    }

    if (limit) {
        col = col.limit(limit);
    }

    col = (await col.get()).docs.map(it => ({id: it.id, ...it.data()}));

    switch (type) {
        case 'json':
            col = JSON.stringify(col);
            break;
        case 'xls':
        case 'xlsx':
            col = utils.json_to_sheet(col);
            break;

        case 'csv':
        case 'tab':
        default:
            const json2csvParser = new Parser({
                // fields: appliedColumns.map(({label}) => label),
                delimiter: type === 'csv' ? ',' : '  '
            });
            col = json2csvParser.parse(col);
            break;
    }

    await outputFile(join(process.cwd(), output), col);
    successMessage(`Successfully exported: ${collection}`)
}

module.exports = {
    addDocument,
    export: collectionExport
};
