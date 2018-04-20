module.exports = [
  {
    name: 'admin',
    perms: [
      'list user', 'add user', 'update user', 'remove user',
      'list users', 'add users', 'update users', 'remove users',
    ],
  },
  {
    name: 'user',
    perms: [
      'list own user', 'add user', 'update own user', 'remove own user',
    ],
  }
];
