const {successMessage, errorMessage} = require('../utils');
const {config} = require('../config');
const {sync} = require('command-exists');

async function use(arguments) {
    const project = (arguments[arguments.length - 1] || '').trim().toLowerCase();
    if ((arguments || []).length < 2 || !project) {
        return errorMessage('Please provide Firebase Project ID!');
    }

    if (!sync('gcloud')) {
        return errorMessage(`Command 'gcloud' not found!\nPlease install Cloud SDK Command Line Tools.`)
    }

    config.set('project', project);

    successMessage(`Now using project ${project}!`);
}

module.exports = {
    use
};
