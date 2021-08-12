const {successMessage, errorMessage, initializeFirebase} = require('../utils');
const admin = require('firebase-admin');
const {readFileSync} = require('fs');

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

module.exports = {
    addDocument
}
