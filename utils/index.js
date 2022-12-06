const chalk = require('chalk');
const fastLevenshtein = require('fast-levenshtein');

const maxLevenshteinDistanceForCompletion = 3;

function printFatalInternalError(message) {
  console.error(chalk.red(`Internal error:`));
  console.error(message);
}

function containsArguments(argv, ...args) {
  const hasArgument = args.some(argument => argv.some(arg => arg === argument));
  const rest = argv.filter(arg => !args.some(argument => arg === argument));

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
    console.error(`${chalk.red(`Error:`)} ${message}`);

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
    const [foundCompletion] = completions
      .reduce((agg, completion) => {
        const distance = fastLevenshtein.get(name, completion);
        if (distance <= maxLevenshteinDistanceForCompletion) {
          agg.push({ distance, completion });
        }

        return agg;
      }, [])
      .sort((a, b) => (a.distance > b.distance ? 1 : a.distance === b.distance ? 0 : -1));

    if (foundCompletion) {
      console.error(`${chalk.red(messagePrefix)} ${chalk.yellow(name)} not found, did you mean ${chalk.cyanBright(foundCompletion.completion)}?`);
    } else {
      console.error(`${chalk.red(messagePrefix)} ${chalk.yellow(name)} not found`);
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

  printUsageIfHelp(argv, usage, needsArguments = true) {
    if (needsArguments && !argv.length) {
      printUsageAndExit(usage);
    }

    const { hasArgument: wantHelp } = containsArguments(argv, '-h', '--help');
    if (wantHelp) {
      printUsageAndExit(usage);
    }
  },
};

console.log(module.exports.didYouMean("ab", ["abcd"], "goat"));
// console.log(module.exports.didYouMean("ab", [], "goat"));