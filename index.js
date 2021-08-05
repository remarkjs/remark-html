import {toHtml} from 'hast-util-to-html'
import {sanitize} from 'hast-util-sanitize'
import {toHast} from 'mdast-util-to-hast'

export default function remarkHtml(options = {}) {
  const handlers = options.handlers || {}
  const schema =
    options.sanitize && typeof options.sanitize === 'object'
      ? options.sanitize
      : null

  Object.assign(this, {Compiler: compiler})

  function compiler(node, file) {
    const hast = toHast(node, {allowDangerousHtml: !options.sanitize, handlers})
    const result = toHtml(
      options.sanitize ? sanitize(hast, schema) : hast,
      Object.assign({}, options, {allowDangerousHtml: !options.sanitize})
    )

    if (file.extname) {
      file.extname = '.html'
    }

    // Add an eof eol.
    return node &&
      node.type &&
      node.type === 'root' &&
      result &&
      /[^\r\n]/.test(result.charAt(result.length - 1))
      ? result + '\n'
      : result
  }
}
