var fs = require('fs')
var path = require('path')

module.exports = function readdir(directory, exclude) {
  var files = []

  fs.readdirSync(directory).filter(function(file) {
    return exclude && exclude.test(file) ? false : true
  }).forEach(function(file) {
    var abs = path.join(directory, file)

    if (fs.statSync(abs).isDirectory()) {
      files = files.concat(readdir(abs, exclude))
      return
    }

    files.push(abs)
  })

  return files
}
