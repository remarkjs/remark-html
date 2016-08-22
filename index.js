/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:html
 * @fileoverview Compile Markdown to HTML with remark.
 */

'use strict';

/* Dependencies. */
var xtend = require('xtend');
var toHAST = require('mdast-util-to-hast');
var toHTML = require('hast-util-to-html');
var sanitize = require('hast-util-sanitize');

/* Expose `plugin`. */
module.exports = plugin;

/**
 * Attach an HTML compiler.
 *
 * @param {Unified} processor - Instance.
 * @param {Object?} [options] - Configuration.
 */
function plugin(processor, options) {
  var settings = options || {};
  var clean = settings.sanitize;
  var schema = clean && typeof clean === 'object' ? clean : null;

  Compiler.prototype.compile = compile;

  processor.Compiler = Compiler;

  /**
   * Extensible constructor.
   */
  function Compiler(file) {
    /* istanbul ignore if - vfile@1.0.0 */
    if (file.extension) {
      file.move({extension: 'html'});
    }

    if (file.extname) {
      file.extname = '.html';
    }
  }

  /**
   * Compile MDAST to HTML.
   *
   * @param {Node} node - MDAST node.
   * @return {string} - HTML.
   */
  function compile(node) {
    var root = node && node.type && node.type === 'root';
    var hast = toHAST(node, {allowDangerousHTML: !clean});
    var result;

    if (clean) {
      hast = sanitize(hast, schema);
    }

    result = toHTML(hast, xtend(settings, {
      allowDangerousHTML: !clean
    }));

    /* Add a final newline. */
    if (root && result.charAt(result.length - 1) !== '\n') {
      result += '\n';
    }

    return result;
  }
}
