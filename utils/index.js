const fastLevenshtein = require('fast-levenshtein');

const maxLevenshteinDistanceForCompletion = 3;

module.exports = {
  /**
   * For unrecoverable errors, prints to the error
   * console and then process.exit(1)
   */
  errorAndDie(message, error) {
    console.error(`Internal error:`);
    console.error(message);
    console.error(`Error was: ${error}`);

    process.exit(1);
  },
  didYouMean(
    name,
    completions,
    completionFoundMessage,
    completionNotFoundMessage
  ) {
    const foundCompletion = completions.find(
      completion =>
        fastLevenshtein.get(name, completion) <=
        maxLevenshteinDistanceForCompletion
    );

    if (foundCompletion) {
      console.error(completionFoundMessage.replace('$1', foundCompletion));
    } else {
      console.error(completionNotFoundMessage);
    }

    process.exit(1);
  }
};
