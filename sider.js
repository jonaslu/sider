#! /usr/bin/env node
const [, , cmd] = process.argv;

/* eslint-disable global-require */
switch (cmd) {
  case 'completion':
    require('./completion');
    break;

  case 'install-completion': {
    const completionInstall = require('./completion/install');
    completionInstall.install();
    break;
  }

  case 'uninstall-completion': {
    const completionInstall = require('./completion/install');
    completionInstall.uninstall();
    break;
  }

  default:
    require('./main-program');
    break;
}
/* eslint-enable global-require */
