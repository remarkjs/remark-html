'use strict'

var xtend = require('xtend')
var toHAST = require('mdast-util-to-hast')
var toHTML = require('hast-util-to-html')
var sanitize = require('hast-util-sanitize')

module.exports = plugin

function plugin(options) {
  var settings = options || {}
  var clean = settings.sanitize
  var schema = clean && typeof clean === 'object' ? clean : null
  var handlers = settings.handlers || {}

  this.Compiler = compiler

  function compiler(node, file) {
    var root = node && node.type && node.type === 'root'
    var hast = toHAST(node, {allowDangerousHTML: !clean, handlers: handlers})
    var result

    if (file.extname) {
      file.extname = '.html'
    }

    if (clean) {
      hast = sanitize(hast, schema)
    }

    result = toHTML(hast, xtend(settings, {allowDangerousHTML: !clean}))

    /* Add a final newline. */
    if (root && result.charAt(result.length - 1) !== '\n') {
      result += '\n'
    }

    return result
  }
}
