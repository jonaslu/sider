const chalk = require('chalk');
const fastLevenshtein = require('fast-levenshtein');

const maxLevenshteinDistanceForCompletion = 3;

function printFatalInternalError(message) {
  console.error(chalk.red(`Internal error:`));
  console.error(message);
}

function containsArguments(argv, ...arguments) {
  const hasArgument = arguments.some(argument => argv.some(arg => arg === argument));
  const rest = argv.filter(arg => !arguments.some(argument => arg === argument));

  return { hasArgument, rest };
}

function printUsageAndExit(usage) {
  console.log(usage);
  process.exit(0);
}

module.exports = {
  containsArguments,
  printUsageAndExit,

  printUserErrorAndDie(message) {
    console.error(`${chalk.yellow(`Error:`)} ${message}`);

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
      completion => fastLevenshtein.get(name, completion) <= maxLevenshteinDistanceForCompletion
    );

    if (foundCompletion) {
      console.error(`${messagePrefix} ${chalk.red(name)} not found, did you mean ${chalk.green(foundCompletion)}?`);
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
  },

  printWarning(message) {
    console.log(`${chalk.yellow('Warning:')} ${message}`);
  },

  printUsageIfHelp(argv, usage) {
    if (!argv.length) {
      printUsageAndExit(usage);
    }

    const { hasArgument: wantHelp } = containsArguments(argv, '-h', '--help');
    if (wantHelp) {
      printUsageAndExit(usage);
    }
  }
};
