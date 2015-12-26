/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:html
 * @fileoverview Compile Markdown to HTML with remark.
 */

'use strict';

/* eslint-env commonjs */

/*
 * Dependencies.
 */

var compilers = require('./lib/compilers');
var transformer = require('./lib/transformer');

/**
 * Attach an HTML compiler.
 *
 * @param {Remark} remark - Instance.
 * @param {Object?} [options] - Configuration.
 */
function plugin(remark, options) {
    var MarkdownCompiler = remark.Compiler;
    var ancestor = MarkdownCompiler.prototype;
    var proto;
    var key;

    /**
     * Extensible prototype.
     */
    function HTMLCompilerPrototype() {}

    HTMLCompilerPrototype.prototype = ancestor;

    proto = new HTMLCompilerPrototype();

    proto.options.xhtml = false;
    proto.options.sanitize = false;
    proto.options.entities = 'true';

    /**
     * Extensible constructor.
     *
     * @param {VFile} file - Virtual file.
     */
    function HTMLCompiler(file) {
        if (file.extension) {
            file.move({
                'extension': 'html'
            });
        }

        MarkdownCompiler.apply(this, [file, options]);
    }

    HTMLCompiler.prototype = proto;

    /*
     * Expose compilers.
     */

    for (key in compilers) {
        proto[key] = compilers[key];
    }

    remark.Compiler = HTMLCompiler;

    return transformer;
}

/*
 * Expose `plugin`.
 */

module.exports = plugin;
