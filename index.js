#!/usr/bin/env node

const {Command, Argument} = require('commander');
const program = new Command();

const use = require('./src/commands/use');
const auth = require('./src/commands/auth');
const firestore = require('./src/commands/firestore');
const storage = require('./src/commands/storage');
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
            .addArgument(new Argument('[uid]', 'ID to set'))
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
        new Command('change-email')
            .alias('ce')
            .description('Changes the users email.')
            .addArgument(new Argument('<id/email>', 'ID/Email'))
            .addArgument(new Argument('<new-email>', 'New Email'))
            .action(auth.changeEmail)
    );

    commands.auth.addCommand(
        new Command('remove-user')
            .alias('ru')
            .description('Removes the user by Email or ID')
            .addArgument(new Argument('<id/email>', 'ID/Email'))
            .action(auth.removeUser)
    );

    commands.auth.addCommand(
        new Command('remove-users')
            .alias('rus')
            .description('Removes users')
            .addArgument(new Argument('[exculded]', 'A comma seperated list of IDs or emails'))
            .action(auth.removeUsers)
    );

    commands.auth.addCommand(
        new Command('list-users')
            .alias('lu')
            .description('List app users.')
            .addArgument(new Argument('[page-size]', 'Page Size').default(100))
            .addArgument(new Argument('[page-number]', 'Page Number'))
            .addArgument(new Argument('[output]', 'Send data to designated file if specified.'))
            .action(auth.listUsers)
    );

    commands.auth.addCommand(
        new Command('get-user')
            .alias('gu')
            .description('Retrieves a user by email or id')
            .addArgument(new Argument('<id/email>', 'ID/Email'))
            .addArgument(new Argument('[output]', 'Send data to designated file if specified.'))
            .action(auth.getUser)
    );

    commands.auth.addCommand(
        new Command('create-custom-token')
        .alias('cct')
        .description('Creates a custom auth token')
        .addArgument(new Argument('<uid>', `UID for the token it doesn't have to be a real one.`))
        .addArgument(new Argument('[customClames]', `Arbitrary custom clames to add to the tokne.`))
        .action(auth.createCustomToken)
    )

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
        new Command('remove-collection')
            .alias('rc')
            .description('Remove all documents from a collection.')
            .addArgument(new Argument('<collection>', 'Collection Name'))
            .addArgument(new Argument('[excluded]', 'A comma seperated list of IDs that should be excluded'))
            .action(firestore.removeCollection)
    );

    commands.firestore.addCommand(
        new Command('export-collection')
            .alias('ec')
            .description('Export a collection to json,csv or xlsx.')
            .addArgument(new Argument('<collection>', 'Collection Name'))
            .addArgument(new Argument('<output>', 'File to write to'))
            .addArgument(new Argument('[type]', 'Type json|csv|xlsx defaults to csv'))
            .addArgument(new Argument('[columns]', 'A comma separated list of columns to return, defaults to *'))
            .addArgument(new Argument('[query]', 'Filters for collection'))
            .addArgument(new Argument('[sort]', 'Sort Key'))
            .addArgument(new Argument('[sort-direction]', 'Sort direction asc|desc'))
            .addArgument(new Argument('[limit]', 'Limit number of returned documents'))
            .action(firestore.export)
    );

    commands.firestore.addCommand(
        new Command('export-collection-group')
            .alias('ecg')
            .description('Export a collection group to json,csv or xlsx.')
            .addArgument(new Argument('<collection-group>', 'Collection Group Name'))
            .addArgument(new Argument('<output>', 'File to write to'))
            .addArgument(new Argument('[type]', 'Type json|csv|xlsx defaults to csv'))
            .addArgument(new Argument('[columns]', 'A comma separated list of columns to return, defaults to *'))
            .addArgument(new Argument('[query]', 'Filters for collection'))
            .addArgument(new Argument('[sort]', 'Sort Key'))
            .addArgument(new Argument('[sort-direction]', 'Sort direction asc|desc'))
            .addArgument(new Argument('[limit]', 'Limit number of returned documents'))
            .action(firestore.collectionGroupExport)
    );

    commands.firestore.addCommand(
        new Command('import-collection')
            .alias('ic')
            .description('Import documents in to a collection from json.')
            .addArgument(new Argument('<collection>', 'Collection Name'))
            .addArgument(new Argument('<filePath>', 'Relative path to json file'))
            .addArgument(new Argument('[merge]', 'When true documents with an id are merged with existing documents with the same id. Otherwise they override the existing ones.')
                .default(false)
                .argParser(v => v === 'true'))
            .action(firestore.collectionImport)
    );

    commands.firestore.addCommand(
        new Command('duplicate-document')
            .alias('dd')
            .description('Duplicate the content of one document to another.')
            .addArgument(new Argument('<originPath>', 'Needs to point to a document'))
            .addArgument(new Argument('<destination>', 'Can point to a document or collection. If it points to a collection a new document is created.'))
            .action(firestore.duplicateDocument)
    );

    commands.firestore.addCommand(
        new Command('get-document')
            .alias('gd')
            .description('Download a specific document.')
            .addArgument(new Argument('<path>', 'Needs to point to a document'))
            .addArgument(new Argument('<output>', 'Location on file system to store the document.'))
            .action(firestore.getDocument)
    );

    /**
     * STORAGE
     */
    commands.storage = program.command('storage');
    commands.storage.description('Manage Firebase Storage');
    commands.firestore.helpOption(false);

    commands.storage.addCommand(
        new Command('export')
            .alias('e')
            .description('Export files and folders.')
            .addArgument(
                new Argument('[directory]', 'When defined starts crawling from the specified prefix.')
            )
            .addArgument(
                new Argument('[bucket]', 'Name of the bucket to use')
                    .default(`${config.get('project')}.appspot.com`)
            )
            .action(storage.exp)
    )

    commands.storage.addCommand(
        new Command('import')
            .alias('i')
            .description('Import files and folders.')
            .addArgument(
                new Argument('[folder]', 'Folder to start crawling')
                    .default(`/`)
            )
            .addArgument(
                new Argument('[bucket]', 'Name of the bucket to use')
                    .default(`${config.get('project')}.appspot.com`)
            )
            .action(storage.imp)
    )

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
