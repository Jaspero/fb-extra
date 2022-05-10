const {successMessage, errorMessage, initializeFirebase} = require('../utils');
const admin = require('firebase-admin');
const inquirer = require('inquirer');

async function createUser(email, password, customClaims) {
    try {
        initializeFirebase();

        const user = await admin.auth().createUser({
            email,
            password
        });

        if (customClaims) {
            try {
                const json = JSON.parse(customClaims);
                await admin.auth().setCustomUserClaims(user.uid, json);
            } catch (error) {
                return errorMessage('Provided invalid Custom Claims JSON!');
            }
        }

        return successMessage(`Successfully created user!`);
    } catch (error) {
        errorMessage(`Something went wrong!\n\n${error}`);
    }
}

async function updateClaims(identifier, customClaims) {
    try {
        initializeFirebase();

        const isEmail = identifier.includes('@');

        let user;
        if (isEmail) {
            user = await admin.auth().getUserByEmail(identifier);
        } else {
            user = await admin.auth().getUser(identifier);
        }

        if (customClaims) {
            try {
                const json = JSON.parse(customClaims);
                await admin.auth().setCustomUserClaims(user.uid, json);
            } catch (error) {
                return errorMessage('Provided invalid Custom Claims JSON!');
            }
        }

        return successMessage(`Successfully updated user claims!`);
    } catch (error) {
        errorMessage(`Something went wrong!\n\n${error}`);
    }
}

async function changePassword(identifier, password) {
    try {
        initializeFirebase();

        const isEmail = identifier.includes('@');

        let user;
        if (isEmail) {
            user = await admin.auth().getUserByEmail(identifier);
        } else {
            user = await admin.auth().getUser(identifier);
        }

        await admin.auth().updateUser(user.uid, {
            password
        });

        return successMessage(`Successfully changed password!`);
    } catch (error) {
        errorMessage(`Something went wrong!\n\n${error}`);
    }
}

async function removeUser(identifier) {
    try {
        initializeFirebase();

        const isEmail = identifier.includes('@');

        let user;
        if (isEmail) {
            user = await admin.auth().getUserByEmail(identifier);
        } else {
            user = await admin.auth().getUser(identifier);
        }

        const data = await inquirer.prompt([
            {
                name: 'confirm',
                message: `Are you sure you want to remove user '${user.email}'?`,
                type: 'confirm',
                default: false
            }
        ]);

        if (!data.confirm) {
            return;
        }

        await admin.auth().deleteUser(user.uid);

        return successMessage(`Successfully removed user!`);
    } catch (error) {
        errorMessage(`Something went wrong!\n\n${error}`);
    }
}

async function removeUsers(excluded) {
    async function batchGet(auth) {
        const users = [];
        const results = await auth.listUsers(1000);

        let pageToken = results.pageToken;

        users.push(...results.users);

        while (pageToken) {
            const results = await auth.listUsers(1000, pageToken);
            pageToken = results.pageToken;
            users.push(...results.users);
        }

        return users;
    }

    try {
        initializeFirebase();
        const auth = admin.auth();
        const users = await batchGet(auth);
        const exclusionList = excluded ? excluded.split(',') : [];
        for (const user of users) {

            const excluded = exclusionList.some(item => {
                const isEmail = item.includes('@');
                return isEmail ? user.email === item : user.uid === item;
            });

            if (excluded) {
                continue;
            }

            await auth.deleteUser(user.uid);
        }

        successMessage(`Users removed successfully!`)
    } catch (error) {
        errorMessage(`Something went wrong!\n\n${error}`);
    }
}

async function listUsers(pageSize = 100, page) {
    try {
        initializeFirebase();
        const {users} = await admin.auth().listUsers(Number(pageSize), page);
        console.table(users.map(user => ({uid: user.uid, email: user.email})));
    } catch (error) {
        errorMessage(`Something went wrong!\n\n${error}`);
    }
}

async function getUser(identifier) {
    try {
        initializeFirebase();

        const isEmail = identifier.includes('@');

        const user = await (
            isEmail ?
                admin.auth().getUserByEmail(identifier) :
                admin.auth().getUser(identifier)
        );
        console.table(user);
    } catch (error) {
        errorMessage(`Something went wrong!\n\n${error}`);
    }
}

module.exports = {
    createUser,
    updateClaims,
    changePassword,
    removeUser,
    removeUsers,
    listUsers,
    getUser,
}
