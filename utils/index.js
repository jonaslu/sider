const chalk = require('chalk');
const fastLevenshtein = require('fast-levenshtein');

const maxLevenshteinDistanceForCompletion = 3;

module.exports = {
  /**
   * For unrecoverable errors, prints to the error
   * console and then process.exit(1)
   */
  errorAndDie(message, error) {
    console.error(chalk.red(`Internal error:`));
    console.error(message);
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
      console.error(`${chalk.red(messagePrefix)} not found`);
    }

    process.exit(1);
  }
};
