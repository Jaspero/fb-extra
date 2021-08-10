#!/usr/bin/env node

const {Command, Argument} = require('commander');
const program = new Command();

const use = require('./src/commands/use');
const auth = require('./src/commands/auth');
const update = require('./src/commands/update');
const jsonPackage = require('./package.json');
const {checkForUpdates, errorMessage, infoMessage} = require('./src/utils');
const {config} = require('./src/config');

async function init() {
    await checkForUpdates();
    config.init();

    const activeProject = config.get('project');

    if (!activeProject && !process.argv.some(argument => argument.toLowerCase() === 'use')) {
        return errorMessage(`No currently active project!\nPlease set active project via command 'use'`);
    }

    if (!process.argv.some(argument => argument.toLowerCase() === 'use')) {
        infoMessage(`Using project ${activeProject}.\n`);
    }

    const commands = {};

    /**
     * USE
     */
    commands.use = program.command('use');
    commands.use.description('Manage Currently Active Project');
    commands.use.helpOption(false);
    commands.use.action(() => use.use(program.args))

    /**
     * AUTH
     */
    commands.auth = program.command('auth');
    commands.auth.description('Manage Firebase Authentication');
    commands.auth.helpOption(false);
    commands.auth.addCommand(
        new Command('create-user')
            .description('Create a new user.')
            .addArgument(new Argument('<email>', 'Email'))
            .addArgument(new Argument('<password>', 'Password'))
            .addArgument(new Argument('[custom-claims]', 'Custom Claims'))
            .action(auth.createUser)
    );
    commands.auth.addCommand(
        new Command('update-claims')
            .description('Update users custom claims.')
            .addArgument(new Argument('<id/email>', 'ID/Email'))
            .addArgument(new Argument('<custom-claims>', 'Custom Claims'))
            .action(auth.updateClaims)
    );
    commands.auth.addCommand(
        new Command('change-password')
            .description('Changes the users password.')
            .addArgument(new Argument('<id/email>', 'ID/Email'))
            .addArgument(new Argument('<new-password>', 'New Password'))
            .action(auth.changePassword)
    );
    commands.auth.addCommand(
        new Command('remove-user')
            .description('Removes the user by Email or ID')
            .addArgument(new Argument('<id/email>', 'ID/Email'))
            .action(auth.removeUser)
    );
    commands.auth.addCommand(
        new Command('list-users')
            .description('List app users.')
            .addArgument(new Argument('[page-size]', 'Page Size').default(100))
            .addArgument(new Argument('[page-number]', 'Page Number'))
            .action(auth.listUsers)
    );

    /**
     * UPDATE
     */
    commands.update = program.command('update');
    commands.update.description('Update CLI package');
    commands.update.helpOption(false);
    commands.update.action(update.update);

    program.name('fb-extra');
    program.helpOption(false);
    program.version(jsonPackage.version);
    program.parse(process.argv);
}

init().catch(message => errorMessage(`Something went wrong!\n\n${message}`));
