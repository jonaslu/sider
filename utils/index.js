const chalk = require('chalk');
const fastLevenshtein = require('fast-levenshtein');

const maxLevenshteinDistanceForCompletion = 3;

function printFatalInternalError(message) {
  console.error(chalk.red(`Internal error:`));
  console.error(message);
}

module.exports = {
  printUserErrorAndDie(message) {
    console.error(chalk.red(`Fatal:`));
    console.error(message);

    process.exit(1);
  },
  printInternalAndDie(message) {
    printFatalInternalError(message);

    process.exit(1);
  },
  /**
   * For unrecoverable errors, prints to the error
   * console and then process.exit(1)
   */
  internalErrorAndDie(message, error) {
    printFatalInternalError(message);
    console.error(`${chalk.red('Error was')}: ${error}`);

    process.exit(1);
  },
  didYouMean(name, completions, messagePrefix) {
    const foundCompletion = completions.find(
      completion =>
        fastLevenshtein.get(name, completion) <=
        maxLevenshteinDistanceForCompletion
    );

    if (foundCompletion) {
      console.error(
        `${messagePrefix} ${chalk.red(name)} not found, did you mean ${chalk.green(foundCompletion)}?`
      );
    } else {
      console.error(`${chalk.red(messagePrefix)} ${chalk.green(name)} not found`);
    }

    process.exit(1);
  },
  getUserError(message) {
    const userError = new Error(message);
    userError.userError = true;

    return userError;
  },
  isUserError(error) {
    return error.userError || false;
  }
};
