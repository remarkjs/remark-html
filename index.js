import toHast from 'mdast-util-to-hast'
import toHtml from 'hast-util-to-html'
import sanitize from 'hast-util-sanitize'

export default function remarkHtml(options) {
  var settings = options || {}
  var clean = settings.sanitize
  var schema = clean && typeof clean === 'object' ? clean : null
  var handlers = settings.handlers || {}

  this.Compiler = compiler

  function compiler(node, file) {
    var root = node && node.type && node.type === 'root'
    var hast = toHast(node, {allowDangerousHtml: !clean, handlers: handlers})
    var result

    if (file.extname) {
      file.extname = '.html'
    }

    if (clean) {
      hast = sanitize(hast, schema)
    }

    result = toHtml(
      hast,
      Object.assign({}, settings, {allowDangerousHtml: !clean})
    )

    // Add an eof eol.
    if (root && result && /[^\r\n]/.test(result.charAt(result.length - 1))) {
      result += '\n'
    }

    return result
  }
}
