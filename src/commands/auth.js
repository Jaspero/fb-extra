const {
  successMessage,
  errorMessage,
  initializeFirebase,
} = require("../utils");
const admin = require("firebase-admin");
const { outputFile } = require("fs-extra");
const { join } = require("path");
const inquirer = require("inquirer");

async function createUser(email, password, uid, customClaims, tenantId) {
  try {
    initializeFirebase();

    // Get auth instance, with tenant if specified
    const auth = tenantId
      ? admin.auth().tenantManager().authForTenant(tenantId)
      : admin.auth();

    const user = await auth.createUser({
      ...(uid && { uid }),
      email,
      password,
    });

    if (customClaims) {
      try {
        let claims = customClaims;
        // If Commander passes an object (rare), keep it, else try to parse.
        if (typeof claims === "string") {
          // Trim and normalize common shell quoting issues (e.g., single quotes in PowerShell)
          const trimmed = claims.trim();
          let toParse = trimmed;
          // If wrapped in single quotes, strip them
          if (
            (toParse.startsWith("'") && toParse.endsWith("'")) ||
            (toParse.startsWith('"') && toParse.endsWith('"'))
          ) {
            toParse = toParse.slice(1, -1);
          }
          // If it looks like JSON with single quotes, replace single quotes around keys/values with double quotes
          // This is a best-effort fix for PowerShell users typing '{'role':'admin'}'
          const maybeJsonLike =
            toParse.startsWith("{") && toParse.endsWith("}");
          if (maybeJsonLike && toParse.includes("'")) {
            // Replace only simple cases: 'key': and: 'value'
            toParse = toParse
              .replace(/'\s*:/g, '":')
              .replace(/:\s*'/g, ':"')
              .replace(/'\s*,/g, '",')
              .replace(/'\s*}/g, '"}')
              .replace(/{\s*'/g, '{"');
          }
          claims = JSON.parse(toParse);
        }
        await auth.setCustomUserClaims(user.uid, claims);
      } catch (error) {
        return errorMessage("Provided invalid Custom Claims JSON!");
      }
    }

    const tenantMessage = tenantId ? ` for tenant ${tenantId}` : "";
    return successMessage(`Successfully created user${tenantMessage}!`);
  } catch (error) {
    errorMessage(`Something went wrong!\n\n${error}`);
  }
}

async function updateClaims(identifier, customClaims, tenantId) {
  try {
    initializeFirebase();

    const isEmail = identifier.includes("@");

    // Get auth instance, with tenant if specified
    const auth = tenantId
      ? admin.auth().tenantManager().authForTenant(tenantId)
      : admin.auth();

    let user;
    if (isEmail) {
      user = await auth.getUserByEmail(identifier);
    } else {
      user = await auth.getUser(identifier);
    }

    if (customClaims) {
      try {
        let claims = customClaims;
        if (typeof claims === "string") {
          const trimmed = claims.trim();
          let toParse = trimmed;
          if (
            (toParse.startsWith("'") && toParse.endsWith("'")) ||
            (toParse.startsWith('"') && toParse.endsWith('"'))
          ) {
            toParse = toParse.slice(1, -1);
          }
          const maybeJsonLike =
            toParse.startsWith("{") && toParse.endsWith("}");
          if (maybeJsonLike && toParse.includes("'")) {
            toParse = toParse
              .replace(/'\s*:/g, '":')
              .replace(/:\s*'/g, ':"')
              .replace(/'\s*,/g, '",')
              .replace(/'\s*}/g, '"}')
              .replace(/{\s*'/g, '{"');
          }
          claims = JSON.parse(toParse);
        }
        await auth.setCustomUserClaims(user.uid, claims);
      } catch (error) {
        return errorMessage("Provided invalid Custom Claims JSON!");
      }
    }

    const tenantMessage = tenantId ? ` for tenant ${tenantId}` : "";
    return successMessage(`Successfully updated user claims${tenantMessage}!`);
  } catch (error) {
    errorMessage(`Something went wrong!\n\n${error}`);
  }
}

async function changePassword(identifier, password, tenantId) {
  try {
    initializeFirebase();

    const isEmail = identifier.includes("@");

    // Get auth instance, with tenant if specified
    const auth = tenantId
      ? admin.auth().tenantManager().authForTenant(tenantId)
      : admin.auth();

    let user;
    if (isEmail) {
      user = await auth.getUserByEmail(identifier);
    } else {
      user = await auth.getUser(identifier);
    }

    await auth.updateUser(user.uid, {
      password,
    });

    const tenantMessage = tenantId ? ` for tenant ${tenantId}` : "";
    return successMessage(`Successfully changed password${tenantMessage}!`);
  } catch (error) {
    errorMessage(`Something went wrong!\n\n${error}`);
  }
}

async function changeEmail(identifier, email, tenantId) {
  try {
    initializeFirebase();

    const isEmail = identifier.includes("@");

    // Get auth instance, with tenant if specified
    const auth = tenantId
      ? admin.auth().tenantManager().authForTenant(tenantId)
      : admin.auth();

    let user;
    if (isEmail) {
      user = await auth.getUserByEmail(identifier);
    } else {
      user = await auth.getUser(identifier);
    }

    await auth.updateUser(user.uid, {
      email,
    });

    const tenantMessage = tenantId ? ` for tenant ${tenantId}` : "";
    return successMessage(`Successfully changed email${tenantMessage}!`);
  } catch (error) {
    errorMessage(`Something went wrong!\n\n${error}`);
  }
}

async function removeUser(identifier, tenantId) {
  try {
    initializeFirebase();

    const isEmail = identifier.includes("@");

    // Get auth instance, with tenant if specified
    const auth = tenantId
      ? admin.auth().tenantManager().authForTenant(tenantId)
      : admin.auth();

    let user;
    if (isEmail) {
      user = await auth.getUserByEmail(identifier);
    } else {
      user = await auth.getUser(identifier);
    }

    const data = await inquirer.prompt([
      {
        name: "confirm",
        message: `Are you sure you want to remove user '${user.email}'?`,
        type: "confirm",
        default: false,
      },
    ]);

    if (!data.confirm) {
      return;
    }

    await auth.deleteUser(user.uid);

    const tenantMessage = tenantId ? ` from tenant ${tenantId}` : "";
    return successMessage(`Successfully removed user${tenantMessage}!`);
  } catch (error) {
    errorMessage(`Something went wrong!\n\n${error}`);
  }
}

async function removeUsers(excluded, tenantId) {
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

    // Get auth instance, with tenant if specified
    const auth = tenantId
      ? admin.auth().tenantManager().authForTenant(tenantId)
      : admin.auth();

    const users = await batchGet(auth);
    const exclusionList = excluded ? excluded.split(",") : [];
    for (const user of users) {
      const excluded = exclusionList.some((item) => {
        const isEmail = item.includes("@");
        return isEmail ? user.email === item : user.uid === item;
      });

      if (excluded) {
        continue;
      }

      await auth.deleteUser(user.uid);
    }

    const tenantMessage = tenantId ? ` from tenant ${tenantId}` : "";
    successMessage(`Users removed successfully${tenantMessage}!`);
  } catch (error) {
    errorMessage(`Something went wrong!\n\n${error}`);
  }
}

async function listUsers(pageSize = 100, page, output, tenantId) {
  try {
    initializeFirebase();

    // Get auth instance, with tenant if specified
    const auth = tenantId
      ? admin.auth().tenantManager().authForTenant(tenantId)
      : admin.auth();

    const { users } = await auth.listUsers(Number(pageSize), page);

    if (output) {
      await outputFile(
        join(process.cwd(), output),
        JSON.stringify(users, null, 2)
      );
    } else {
      console.table(
        users.map((user) => ({ uid: user.uid, email: user.email }))
      );
    }
  } catch (error) {
    errorMessage(`Something went wrong!\n\n${error}`);
  }
}

async function getUser(identifier, output, tenantId) {
  try {
    initializeFirebase();

    const isEmail = identifier.includes("@");

    // Get auth instance, with tenant if specified
    const auth = tenantId
      ? admin.auth().tenantManager().authForTenant(tenantId)
      : admin.auth();

    const user = await (isEmail
      ? auth.getUserByEmail(identifier)
      : auth.getUser(identifier));

    if (output) {
      await outputFile(
        join(process.cwd(), output),
        JSON.stringify(user, null, 2)
      );
    } else {
      console.table(user);
    }
  } catch (error) {
    errorMessage(`Something went wrong!\n\n${error}`);
  }
}

async function createCustomToken(uid, customClaims, tenantId) {
  try {
    initializeFirebase();

    // Get auth instance, with tenant if specified
    const auth = tenantId
      ? admin.auth().tenantManager().authForTenant(tenantId)
      : admin.auth();

    const token = await auth.createCustomToken(
      uid,
      customClaims ? JSON.parse(customClaims) : {}
    );
    const tenantMessage = tenantId ? ` for tenant ${tenantId}` : "";
    return successMessage(`Generated token${tenantMessage}: ${token}`);
  } catch (error) {
    errorMessage(`Something went wrong!${error}`);
  }
}

async function addTenant(identifier, tenantId) {
  try {
    initializeFirebase();

    const isEmail = identifier.includes("@");

    // Get the user first
    let user;
    if (isEmail) {
      user = await admin.auth().getUserByEmail(identifier);
    } else {
      user = await admin.auth().getUser(identifier);
    }

    // Get the tenant auth instance
    const tenantAuth = admin.auth().tenantManager().authForTenant(tenantId);

    // Import the user to the tenant
    const importResult = await tenantAuth.importUsers([user]);

    if (importResult.successCount === 1) {
      return successMessage(
        `Successfully added user ${
          user.email || user.uid
        } to tenant ${tenantId}!`
      );
    } else {
      return errorMessage(
        `Failed to add user to tenant. Error: ${importResult.errors[0]?.error}`
      );
    }
  } catch (error) {
    errorMessage(`Something went wrong!${error}`);
  }
}

module.exports = {
  createUser,
  updateClaims,
  changePassword,
  changeEmail,
  removeUser,
  removeUsers,
  listUsers,
  getUser,
  createCustomToken,
  addTenant,
};
