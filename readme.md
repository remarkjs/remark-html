# remark-html [![Build Status][travis-badge]][travis] [![Coverage Status][codecov-badge]][codecov]

Compiles markdown to HTML.  Built on [**remark**][remark], an
extensively tested and pluggable parser.

## Installation

[npm][npm-install]:

```bash
npm install remark-html
```

**remark-html** is also available as an AMD, CommonJS, and
globals module, [uncompressed and compressed][releases].

## Usage

Dependencies:

```javascript
var remark = require('remark');
var html = require('remark-html');
```

Process.

```javascript
var doc = remark().use(html).process([
    '# Hello & World',
    '',
    '**Alpha**, _bravo_, and ~~Charlie~~.'
].join('\n'));
```

Yields:

```html
<h1>Hello &amp; World</h1>
<p><strong>Alpha</strong>, <em>bravo</em>, and <del>Charlie</del>.</p>
```

## API

### `remark.use(html[, options])`

`options` (`Object?`):

*   `entities` (`true`, `'numbers'`, or `'escape'`, default: `true`)
    — How to encode non-ASCII and HTML-escape characters: the default
    generates named entities (`&` > `&amp;`); `'numbers'` generates
    numbered entities (`&` > `&#x26;`), and `'escape'` only encodes
    characters which are required by HTML to be escaped: `&`, `<`, `>`,
    `"`, `'`, and `` ` ``, leaving non-ASCII characters untouched.

*   `xhtml` (`boolean`, default: `false`)
    — Whether or not to terminate self-closing tags (such as `img`) with a
    slash;

*   `sanitize` (`boolean`, default: `false`)
    — Whether or not to allow the use of HTML inside markdown.

## CommonMark

> You still need to set `commonmark: true` in
> [**remark**s options][remark-options].

[CommonMark][] support is a goal but not (yet) a
necessity. There are some (roughly 115 of 550, relating to inline
precedence, lists, emphasis and strongness) issues which I’d like
to cover in the future. Note that this sounds like a lot, but they
have to do with obscure differences which do not often occur in the
real world. Read more on some of the reasoning in
[`doc/commonmark.md`][commonmark-notes].

## Integrations

`remark-html` works great with:

*   [`wooorm/remark-toc`](https://github.com/wooorm/remark-toc), which
    generates tables of contents;

*   [`wooorm/remark-github`](https://github.com/wooorm/remark-github), which
    generates references to GitHub issues, PRs, users, and more;

*   [`wooorm/remark-comment-config`](https://github.com/wooorm/remark-comment-config)
    and [`wooorm/remark-yaml-config`](https://github.com/wooorm/remark-yaml-config),
    which specify how HTML is compiled in the document itself;

*   [`ben-eb/remark-highlight.js`](https://github.com/ben-eb/remark-highlight.js) and
    [`ben-eb/remark-midas`](https://github.com/ben-eb/remark-midas) which
    highlight code-blocks;

*   [`ben-eb/remark-autolink-headings`](https://github.com/ben-eb/remark-autolink-headings),
    which generates GitHub style anchors for each of the headings;

*   ...and [more][remark-plugins].

All [**MDAST** nodes][mdast] can be compiled to HTML. Unknown **MDAST**
nodes are compiled to `div` nodes.

In addition, **remark-html** can be told how to compile nodes through three
`data` properties:

*   `htmlName` — Tag-name to compile as;
*   `htmlContent` — HTML content to add (instead of `children` and `value`);
*   `htmlAttributes` — Map of attributes to add.

For example, the following node:

```json
{
  "type": "emphasis",
  "data": {
    "htmlName": "i",
    "htmlAttributes": {
      "id": "foo"
    },
    "htmlContent": "bar"
  },
  "children": [{
    "type": "text",
    "value": "baz",
  }]
}
```

...would yield:

```markdown
<i id="foo">bar</i>
```

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[travis-badge]: https://img.shields.io/travis/wooorm/remark-html/master.svg

[travis]: https://travis-ci.org/wooorm/remark-html

[codecov-badge]: https://img.shields.io/codecov/c/github/wooorm/remark-html.svg

[codecov]: https://codecov.io/github/wooorm/remark-html

[npm-install]: https://docs.npmjs.com/cli/install

[releases]: https://github.com/wooorm/remark-html/releases

[license]: LICENSE

[author]: http://wooorm.com

[remark]: https://github.com/wooorm/remark

[remark-options]: https://github.com/wooorm/remark#remarkprocessvalue-options-done

[commonmark]: http://commonmark.org

[commonmark-notes]: doc/commonmark.md

[remark-plugins]: https://github.com/wooorm/remark/blob/master/doc/plugins.md#list-of-plugins

[mdast]: https://github.com/wooorm/mdast
