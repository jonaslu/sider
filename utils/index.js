module.exports = {
  /**
   * For unrecoverable errors, prints to the error
   * console and then process.exit(1)
   */
  errorAndDie(message, error) {
    console.error(`Internal error:`);
    console.error(message);
    console.error(`Error was: ${error}`)
    process.exit(1)
  }
}
