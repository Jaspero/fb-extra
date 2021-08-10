# fb-extra

Additional CLI commands for interacting with firebase.

## Auth

| Command | Description |
| ---- | ---- |
| fbs (create-user\cu) <email> <password> [custom claims] | Adds a new email/password user |
| fbs (update-claims\uc) <id\email> [custom claims] | Update users custom claims |
| fbs (change-password\cp) <id\email> <new-password> | Changes the users password |  
| fbs (remove-user\ru) <id\email> | Removes a user by email or id |
| fbs (list-users\lu) [regex search] [page-size] | Lists users in descending order. Page size defaults to 20 |   
