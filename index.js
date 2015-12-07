var babylon = require('babylon')
var fs = require('fs')
var path = require('path')

var root = process.argv.slice(2)[0]

if (! fs.existsSync(root)) {
  process.exit(1)
}

var readdir = require('./readdir')

try {
  var files = readdir(root, /node_modules/).filter(file => {
    return /\.jsx?$/.test(file)
  })

  files.forEach(function(file) {
    fs.readFile(file, function(err, data) {
      if (err) {
        throw err
      }

      var parsed = babylon.parse(data.toString(), {
        sourceType: 'module',
        // @link https://github.com/babel/babel/tree/master/packages/babylon#plugins
        plugins: [
          'jsx',
          'flow',
          'asyncFunctions',
          'classConstructorCall',
          'doExpressions',
          'trailingFunctionCommas',
          'objectRestSpread',
          'decorators',
          'classProperties',
          'exportExtensions',
          'exponentiationOperator',
          'asyncGenerators',
          'functionSent'
        ]
      })

      if (! parsed.program) {
        return
      }

      var root = path.dirname(file)

      parsed.program.body.filter(function(node) {
        return node.type && node.type === 'ImportDeclaration'
      }).map(function(node) {
        return node.source.value
      }).forEach(function(value) {
        var abs = value

        if (! path.isAbsolute(value)) {
          abs = path.resolve(root, value)
        }

        if (! fs.existsSync(abs + '.js')) {
          console.info('Not found: %s', value)
        }
      })
    })
  })
} catch (e) {
  console.error(e)
  process.exit(1)
}
