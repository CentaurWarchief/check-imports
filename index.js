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
          'functionSent',
          'functionBind'
        ]
      })

      if (! parsed.program) {
        return
      }

      var root = path.dirname(file)

      parsed.program.body.filter(function(node) {
        return node.type && (
          node.type === 'ImportDeclaration' ||
          node.type === 'ExpressionStatement'
        )
      }).map(function(node) {
        if (node.type === 'ImportDeclaration') {
          return node.source.value
        }

        if (node.expression.callee.name === 'require') {
          return node.expression.arguments[0].value
        }

        return null
      }).filter(function(value) {
        return value !== null
      }).forEach(function(value) {
        var abs = value

        if (! path.isAbsolute(value)) {
          abs = path.resolve(root, value)
        }

        try {
          require(abs)
        } catch (e) {
          if (e.code === 'MODULE_NOT_FOUND') {
            console.info('Not found: %s', value)
          }
        }
      })
    })
  })
} catch (e) {
  console.error(e)
  process.exit(1)
}
