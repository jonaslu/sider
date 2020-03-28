#! /usr/bin/env node
const { processArgv } = require('./commands/main/usage');

const [, , ...rest] = process.argv;
const [subcommand] = rest;

switch (subcommand) {
  case 'completion': {
    const fsExtra = require('fs-extra');
    const path = require('path');

    const completion = fsExtra.readFileSync(path.join(__dirname, 'completion.sh'), 'utf-8');
    console.log(completion);

    break;
  }

  case 'install-completion': {
    const fsExtra = require('fs-extra');
    const untiltdify = require('untildify');

    const bashRcPath = untiltdify('~/.bashrc');
    let fileContents;
    try {
      fileContents = fsExtra.readFileSync(bashRcPath, 'utf-8');
    } catch (e) {
      console.error(`Could not read ~/.bashrc.`);
      console.error(`Create it first if it does not exists. Otherwise check it's read permissions.`);
      console.error(`To manually enable completion, run the line:`);
      console.error(`. <(sider completion)`);

      process.exit(1);
    }

    const bashRcLine = `. <(sider completion)`
    if (fileContents.includes(bashRcLine)) {
      console.error('Completion already installed - forgot to source it?');
      process.exit(1);
    }

    let fileSplit = fileContents.split('\n');
    fileSplit.push(bashRcLine);

    try {
      fsExtra.writeFileSync(bashRcPath, fileSplit.join('\n'));
    } catch (e) {
      console.error(`Could not read ~/.bashrc.`);
      console.error(`Create it first if it does not exists. Otherwise check it's write permissions.`);
      console.error(`To manually enable completion, run the line:`);
      console.error(`. <(sider completion)`);

      process.exit(1);
    }

    break;
  }

  case 'uninstall-completion':
    break;

  default:
    processArgv(rest);
}
