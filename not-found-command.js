const chalk = require('chalk');
const fastLevenshtein = require('fast-levenshtein');

module.exports = {
  printCommandHelp(completions, commander) {
    const [ unknownCommand ] = commander.args;

    const firstFoundCompletion = completions.find(
      command => fastLevenshtein.get(command, unknownCommand) < 3
    );

    if (firstFoundCompletion) {
      console.error(
        `Unknown command ${chalk.red(
          unknownCommand
        )}, did you mean ${chalk.green(firstFoundCompletion)}?`
      );

      return;
    }

    console.error(`  Unknown command ${chalk.red(unknownCommand)}`);
    commander.help();
  }
};
