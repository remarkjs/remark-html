'use strict';

/*
 * Constants.
 */

var WHITE_SPACE_COLLAPSABLE_LINE = /[ \t]*\n+[ \t]*/g;
var WHITE_SPACE_COLLAPSABLE = /[ \t\n]+/g;

/**
 * Remove initial and final spaces and tabs in each line in
 * `value`.
 *
 * @example
 *   trimLines(' foo\n bar \nbaz'); // 'foo\nbar\nbaz'
 *
 * @param {string} value - Content to trim.
 * @return {string} - Trimmed `value`.
 */
function trimLines(value) {
    return String(value).replace(WHITE_SPACE_COLLAPSABLE_LINE, '\n');
}

/**
 * Collapse multiple spaces, tabs, and newlines.
 *
 * @example
 *   collapse(' \t\nbar \nbaz\t'); // ' bar baz '
 *
 * @param {string} value - Content to trim.
 * @return {string} - Trimmed `value`.
 */
function collapse(value) {
    return String(value).replace(WHITE_SPACE_COLLAPSABLE, ' ');
}

/**
 * Normalize `uri`.
 *
 * This only works when both `encodeURI` and `decodeURI`
 * are available.
 *
 * @example
 *   normalizeURI('foo bar'); // 'foo%20bar'
 *
 * @param {string} uri - URI to normalize.
 * @return {string} - Normalized uri.
 */
function normalizeURI(uri) {
    try {
        uri = encodeURI(decodeURI(uri));
    } catch (exception) { /* empty */ }

    return uri;
}

/*
 * Expose.
 */

var util = {};

util.trimLines = trimLines;
util.collapse = collapse;
util.normalizeURI = normalizeURI;

module.exports = util;
