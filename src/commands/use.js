const {successMessage, errorMessage} = require('../utils');
const {config} = require('../config');
const {execute} = require('../utils');
const path = require('path');
const commandExistsSync = require('command-exists').sync;
const fs = require('fs');

async function use(arguments) {
    const project = (arguments[arguments.length - 1] || '').trim().toLowerCase();
    if ((arguments || []).length < 2 || !project) {
        return errorMessage('Please provide Firebase Project ID!');
    }

    const iam = config.get(`iam.${project}`);
    if (!iam) {

        if (!commandExistsSync('gcloud')) {
            return errorMessage(`Command 'gcloud' not found!\nPlease install Cloud SDK Command Line Tools.`)
        }

        await execute({
            command: `gcloud config set project ${project}`,
        });

        const email = await execute({
            command: `gcloud iam service-accounts list`
        }).then((response) => {
            const emails = response.message
                .split('\n')
                .map(row => row.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/gi))
                .filter(item => !!item)
                .map(match => match[0])
                .filter(email => email.startsWith('firebase-adminsdk') && email.endsWith(`@${project}.iam.gserviceaccount.com`));
            return emails[0] || '';
        });

        const serviceAccountPath = `service-account-key-${project}.json`;
        await execute({
            command: `gcloud iam service-accounts keys create ${serviceAccountPath} --iam-account=${email}`
        });

        const serviceAccount = require(`./${serviceAccountPath}`) || {};
        config.set(`iam.${project}`, JSON.stringify(serviceAccount));
        fs.unlinkSync(path.join(path.dirname(require.main.filename), serviceAccountPath));
    }

    config.set('project', project);

    successMessage(`Now using project ${project}!`);
}

module.exports = {
    use
}
