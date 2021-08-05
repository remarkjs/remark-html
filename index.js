/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('hast-util-sanitize').Schema} Schema
 * @typedef {import('mdast-util-to-hast').Handlers} Handlers
 *
 * @typedef Options
 *   Configuration.
 * @property {boolean|Schema|null} [sanitize]
 *   How to sanitize the output.
 * @property {Handlers} [handlers={}]
 *   Object mapping mdast nodes to functions handling them.
 */

import {toHtml} from 'hast-util-to-html'
import {sanitize} from 'hast-util-sanitize'
import {toHast} from 'mdast-util-to-hast'

/**
 * Plugin to serialize markdown as HTML.
 *
 * @type {import('unified').Plugin<[Options?]|void[], Root, string>}
 */
export default function remarkHtml(options = {}) {
  const handlers = options.handlers || {}
  const schema =
    options.sanitize && typeof options.sanitize === 'object'
      ? options.sanitize
      : undefined

  Object.assign(this, {Compiler: compiler})

  /**
   * @type {import('unified').CompilerFunction<Root, string>}
   */
  function compiler(node, file) {
    const hast = toHast(node, {allowDangerousHtml: !options.sanitize, handlers})
    // @ts-expect-error: assume root.
    const cleanHast = options.sanitize ? sanitize(hast, schema) : hast
    const result = toHtml(
      // @ts-expect-error: assume root.
      cleanHast,
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
