#! /usr/bin/env node
const { processArgv } = require('./commands/main/usage');

const [, , ...rest] = process.argv;
const [subcommand] = rest;

function getBashRcAndSiderLine() {
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

  const splitBashRcLines = fileContents.split('\n');
  const siderCompletionLine = splitBashRcLines.findIndex(line => line.match(/\s*\. <\(sider completion\)\s*$/));

  return { siderCompletionLine, splitBashRcLines };
}

function writeBashRc(splitFileContents) {
  const fsExtra = require('fs-extra');
  const untiltdify = require('untildify');

  const bashRcPath = untiltdify('~/.bashrc');

  try {
    fsExtra.writeFileSync(bashRcPath, splitFileContents.join('\n'));
  } catch (e) {
    console.error(`Could not read ~/.bashrc.`);
    console.error(`Create it first if it does not exists. Otherwise check it's write permissions.`);
    console.error(`To manually enable completion, run the line:`);
    console.error(`. <(sider completion)`);

    process.exit(1);
  }
}

switch (subcommand) {
  case 'completion': {
    const fsExtra = require('fs-extra');
    const path = require('path');

    const completion = fsExtra.readFileSync(path.join(__dirname, 'completion.sh'), 'utf-8');
    console.log(completion);

    break;
  }

  case 'install-completion': {
    const { siderCompletionLine, splitBashRcLines } = getBashRcAndSiderLine();

    if (siderCompletionLine !== -1) {
      console.error('Completion already installed - forgot to source it?');
      process.exit(1);
    }

    const bashRcLine = `. <(sider completion)`;
    splitBashRcLines.push(bashRcLine);

    writeBashRc(splitBashRcLines);
    break;
  }

  case 'uninstall-completion':
    const { siderCompletionLine, splitBashRcLines } = getBashRcAndSiderLine();

    if (siderCompletionLine === -1) {
      console.error('Completion not installed - cannot remove it.');
      process.exit(1);
    }

    splitBashRcLines.splice(siderCompletionLine, 1);

    writeBashRc(splitBashRcLines);
    break;

  default:
    processArgv(rest);
}
