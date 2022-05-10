# Firebase Extra

This is a CLI tool with useful commands for interacting with firebase. It contains things like managing users and managing firestore data.

## Installation

To install the library run:

```
npm i -g @jaspero/fb-extra
```

Initially you'll need to define a project, do that by running:

```
fbs use [your-project-id]
```

## Commands

<table>
  <tr>
    <th>Command</td>
    <td>Description</td>
  </tr>
  <tr>
    <th colspan="2">Auth</th>
  </tr>
  <tr>
    <td>fbs auth (create-user|cu) {email} {password} [custom claims]</td>
    <td>Adds a new email/password user</td>
  </tr>
  <tr>
    <td>fbs auth (update-claims|uc) {id|email} [custom claims]</td>
    <td>Update users custom claims</td>
  </tr>
  <tr>
    <td>fbs auth (change-password|cp) {id|email} <new-password></td>
    <td>Changes the users password</td>
  </tr>
  <tr>
    <td>fbs auth (remove-user|ru) {id|email}</td>
    <td>Removes a user by email or id</td>
  </tr>
  <tr>
    <tr>
    <td>fbs auth (remove-users|rus) [excluded]</td>
    <td>Removes all users except for users on the exclusion list</td>
  </tr>
    <td>fbs auth (list-users|lu) [regex search] [page-size]</td>
    <td>Lists users in descending order. Page size defaults to 20</td>
  </tr>
  <tr>
    <th colspan="2">Firestore</th>
  </tr>
  <tr>
    <td>fbs firestore (add-document|ad) {collection} {json|path}</td>
    <td>Creates a document in the desired collection</td>
  </tr>
</table>


