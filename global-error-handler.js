function printErrorAndExit(error) {
  console.error(error);
  process.exit(1);
}

process.on('unhandledRejection', printErrorAndExit);
process.on('uncaughtException', printErrorAndExit);
