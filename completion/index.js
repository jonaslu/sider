const tabtab = require('tabtab');
const completions = require('../completions');

const env = tabtab.parseEnv(process.env);

function completeOnArray(words, completeObject) {
  if (completeObject.complete) {
    return completeObject.complete(words);
  }

  if (words.length === 0) {
    return Object.keys(completeObject);
  }

  const nextElement = words.shift();
  const completeObjectKey = Object.keys(completeObject).find(
    value => value === nextElement
  );

  if (!completeObjectKey) {
    return [];
  }

  return completeOnArray(words, completeObject[completeObjectKey]);
}

const allWords = env.line.split(' ').filter(value => value !== '');
// Remove sider
allWords.shift();
if (env.last !== '') {
  // Remove last incomplete item
  allWords.pop();
}

tabtab.log(completeOnArray(allWords, completions));
