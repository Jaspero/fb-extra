const {successMessage, errorMessage, initializeFirebase} = require('../utils');
const admin = require('firebase-admin');
const {readFileSync} = require('fs');
const {outputFile, readFile} = require('fs-extra');
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
    successMessage(`Successfully added document: ${document.id}`);
}

async function getDocument(path, output) {
    initializeFirebase();
    try {
        const doc = await admin.firestore().doc(path).get();
        await outputFile(join(process.cwd(), output), JSON.stringify(doc.data(), null, 2));
    } catch (error) {
        return errorMessage(error.toString());
    }
}

async function duplicateDocument(originPath, destination) {

    initializeFirebase();

    const isDestinationCollection = destination.split('/').length % 2;
    const fs = admin.firestore();
    const origin = await fs.doc(originPath).get();
    const data = origin.data();

    let id;

    if (isDestinationCollection) {
        const document = await fs.collection(destination).add(data);
        id = document.id;
    } else {
        await fs.doc(destination).set(data);
        id = destination.split('/').pop();
    }

    successMessage(`Successfully added document: ${id}`);
}

async function collectionExport(
    collection,
    output,
    type = 'csv',
    columns = '*',
    query,
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
                ...columns === '*' ? {} : {fields: columns.split(',')},
                delimiter: type === 'csv' ? ',' : '  '
            });
            col = json2csvParser.parse(col);
            break;
    }

    await outputFile(join(process.cwd(), output), col);
    successMessage(`Successfully exported: ${collection}`)
}

/**
 * TODO:
 * Support formats other then JSON
 */
async function collectionImport(collection, filePath, merge = true) {
    initializeFirebase();

    const colRef = admin.firestore().collection(collection);

    let file;

    try {
        file = await readFile(join(process.cwd(), filePath));
    } catch (e) {
        errorMessage(`Failed to read file from path ${filePath}. Is this a relative path from your current working directory (because it should be)?`);
        console.error(e);
        return;
    }

    try {
        file = JSON.parse(file);
    } catch (e) {
        errorMessage(`Failed to parse file. Is this a JSON file (because it should be)?`);
        console.error(e);
        return;
    }

    let counter = 0;

    for (const doc of file) {
        const {id, ...data} = doc;

        if (id) {
            await colRef.doc(id).set(data, {merge});
        } else {
            await colRef.add(data);
        }

        counter++;
    }

    successMessage(`Successfully added ${counter} documents to ${collection}`);
}

async function removeCollection(collection, excluded) {
    initializeFirebase();

    const exclusionList = excluded ? excluded.split(',') : [];
    const {docs} = await admin.firestore().collection(collection).get();

    for (const doc of docs) {
        if (exclusionList.includes(doc.id)) {
            continue;
        }

        await doc.ref.delete();
    }

    successMessage(`Successfully removed ${collection} documents.`)
}

module.exports = {
    addDocument,
    getDocument,
    export: collectionExport,
    collectionImport,
    removeCollection,
    duplicateDocument
};
