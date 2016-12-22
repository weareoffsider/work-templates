module.exports.questions = function () {
  return [{
    "type": "input",
    "name": "componentName",
    "message": "What is the name of your component?",
  }, {
    "type": "list",
    "name": "componentFolder",
    "choices": ["atoms", "molecules", "containers", "templates"],
    "message": "What component folder should this go in?",
  }, {
    "type": "confirm",
    "name": "clientJavascript",
    "message": "Need a client.js file?",
  }]
}

module.exports.setup = function (projectRoot, answers) {
  const target = (
    projectRoot + '/exampleoutput/' + answers.componentFolder + '/' +
    answers.componentName
  )

  const files = [{
    src: '_index.js',
    data: answers,
    dest: target + '/index.js',
  }, {
    src: '___componentName___.react.js',
    data: answers,
    dest: target + '/' + answers.componentName + '.react.js',
  }]

  if (answers.clientJavascript) {
    files.push({
      src: '___componentName___.client.js',
      data: answers,
      dest: target + '/' + answers.componentName + '.client.js',
    })
  }

  return files
}
