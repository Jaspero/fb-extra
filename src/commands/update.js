const inquirer = require('inquirer');
const jsonPackage = require('../../package.json');
const {execute, checkForUpdates, successMessage, errorMessage, infoMessage} = require('../utils');

async function update() {

    const VERSION = await checkForUpdates(false);

    if (VERSION === jsonPackage.version) {
        return infoMessage(`CLI is already up to date. (${VERSION})`)
    }

    const data = await inquirer.prompt([
        {
            name: 'confirm',
            message: 'Are you sure you want to update CLI?',
            type: 'confirm',
            default: true
        },
        {
            name: 'scope',
            message: 'Update location:',
            when: (row) => row.confirm,
            type: 'list',
            choices: [
                {
                    value: '-g',
                    name: 'global',
                },
                {
                    value: '',
                    name: 'local'
                }
            ],
            loop: false
        },
    ]);

    if (!data.confirm) {
        return;
    }

    const stdout = await execute({command: `npm update ${jsonPackage.name} ${data.scope}`});
    if (stdout.success) {
        successMessage('Successfully updated CLI!');
    } else {
        errorMessage(`Failed to update CLI.\n${stdout.message || ''}`);
    }
}

module.exports = {
    update
};
