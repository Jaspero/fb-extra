const {successMessage, errorMessage} = require('../utils');
const admin = require('firebase-admin');
const {config} = require('../config');

async function createUser(email, password, customClaims) {

    try {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(config.get(`iam.${config.get('project')}`) || '{}'))
        });

        const user = await admin.auth().createUser({
            email,
            password
        });

        if (customClaims) {
            await admin.auth().setCustomUserClaims(user.uid, {
                role: customClaims
            });
        }

        return successMessage(`Successfully created user!`);
    } catch (error) {
        errorMessage(`Something went wrong!\n\n${error}`);
    }
}

module.exports = {
    createUser
}
