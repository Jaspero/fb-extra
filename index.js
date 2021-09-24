#!/usr/bin/env node

const {Command, Argument} = require('commander');
const program = new Command();

const use = require('./src/commands/use');
const auth = require('./src/commands/auth');
const firestore = require('./src/commands/firestore');
const update = require('./src/commands/update');
const jsonPackage = require('./package.json');
const {checkForUpdates, errorMessage, infoMessage} = require('./src/utils');
const {config} = require('./src/config');

async function init() {
    await checkForUpdates();
    config.init();

    const activeProject = config.get('project');

    if (!activeProject && !process.argv.some(argument => ['use', 'update'].includes(argument.toLowerCase()))) {
        return errorMessage(`No currently active project!\nPlease set active project via command 'use'`);
    }

    if (!process.argv.some(argument => ['use', 'update'].includes(argument.toLowerCase()))) {
        infoMessage(`Using project ${activeProject}.\n`);
    }

    const commands = {};

    /**
     * USE
     */
    commands.use = program.command('use');
    commands.use.description('Manage Currently Active Project');
    commands.use.helpOption(false);
    commands.use.action(() => use.use(program.args));

    /**
     * AUTH
     */
    commands.auth = program.command('auth');
    commands.auth.description('Manage Firebase Authentication');
    commands.auth.helpOption(false);

    commands.auth.addCommand(
        new Command('create-user')
            .alias('cu')
            .description('Create a new user.')
            .addArgument(new Argument('<email>', 'Email'))
            .addArgument(new Argument('<password>', 'Password'))
            .addArgument(new Argument('[custom-claims]', 'Custom Claims'))
            .action(auth.createUser)
    );

    commands.auth.addCommand(
        new Command('update-claims')
            .alias('uc')
            .description('Update users custom claims.')
            .addArgument(new Argument('<id/email>', 'ID/Email'))
            .addArgument(new Argument('<custom-claims>', 'Custom Claims'))
            .action(auth.updateClaims)
    );

    commands.auth.addCommand(
        new Command('change-password')
            .alias('cp')
            .description('Changes the users password.')
            .addArgument(new Argument('<id/email>', 'ID/Email'))
            .addArgument(new Argument('<new-password>', 'New Password'))
            .action(auth.changePassword)
    );

    commands.auth.addCommand(
        new Command('remove-user')
            .alias('ru')
            .description('Removes the user by Email or ID')
            .addArgument(new Argument('<id/email>', 'ID/Email'))
            .action(auth.removeUser)
    );

    commands.auth.addCommand(
        new Command('list-users')
            .alias('lu')
            .description('List app users.')
            .addArgument(new Argument('[page-size]', 'Page Size').default(100))
            .addArgument(new Argument('[page-number]', 'Page Number'))
            .action(auth.listUsers)
    );

    /**
     * FIRESTORE
     */
    commands.firestore = program.command('firestore');
    commands.firestore.description('Manage Firebase Firestore');
    commands.firestore.helpOption(false);
    commands.firestore.addCommand(
        new Command('add-document')
            .alias('ad')
            .description('Create Document in Collection.')
            .addArgument(new Argument('<collection>', 'Collection Name'))
            .addArgument(new Argument('<json/path>', 'Stringified JSON or path to file'))
            .action(firestore.addDocument)
    );

    commands.firestore.addCommand(
        new Command('export-collection')
            .alias('ec')
            .description('Export a collection to json,csv or xlsx.')
            .addArgument(new Argument('<collection>', 'Collection Name'))
            .addArgument(new Argument('<output>', 'File to write to'))
            .addArgument(new Argument('[type]', 'Type json|csv|xlsx defaults to csv'))
            .addArgument(new Argument('[query]', 'Filters for collection'))
            .addArgument(new Argument('[sort]', 'Sort Key'))
            .addArgument(new Argument('[sort-direction]', 'Sort direction asc|desc'))
            .addArgument(new Argument('[limit]', 'Limit number of returned documents'))
            .action(firestore.export)
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