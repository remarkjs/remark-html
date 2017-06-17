# remark-html [![Build Status][build-badge]][build-status] [![Coverage Status][coverage-badge]][coverage-status] [![Chat][chat-badge]][chat]

Compile markdown to HTML with [**remark**][remark].

> :warning: This package essentially packs [`remark-rehype`][remark2rehype] and
> [`rehype-stringify`][rehype-stringify], and although it does support some
> customisation, it isn’t very pluggable.  It’s probably smarter to use
> `remark-rehype` directly and benefit from the [**rehype**][rehype]
> ecosystem.

## Installation

[npm][]:

```bash
npm install remark-html
```

## Usage

Say we have the following file, `example.md`:

```markdown
# Hello & World

> A block quote.

* Some _emphasis_, **importance**, and `code`.
```

And our script, `example.js`, looks as follows:

```javascript
var fs = require('fs');
var unified = require('unified');
var markdown = require('remark-parse');
var html = require('remark-html');

unified()
  .use(markdown)
  .use(html)
  .process(fs.readFileSync('example.md'), function (err, file) {
    if (err) throw err;
    console.log(String(file));
  });
```

Now, running `node example` yields:

```html
<h1>Hello &#x26; World</h1>
<blockquote>
<p>A block quote.</p>
</blockquote>
<ul>
<li>Some <em>emphasis</em>, <strong>importance</strong>, and <code>code</code>.</li>
</ul>
```

## API

### `remark.use(html[, options])`

##### `options`

All options except for `sanitize` are passed to
[`hast-util-to-html`][to-html].

###### `options.sanitize`

How to sanitise the output (`Object` or `boolean`, default: `false`).

If `true` or an `object`, sanitation is done by
[`hast-util-sanitize`][sanitize].  If an object is passed in, it’s
given as a schema to `sanitize`.  If `true`, input is sanitised
according to [GitHub’s sanitation rules][github].

For example, to add strict sanitation but allowing `className`s, use
something like:

```js
// ...
var merge = require('deepmerge');
var github = require('hast-util-sanitize/lib/github');

var schema = merge(github, {attributes: {'*': ['className']}});

remark().use(html, {sanitize: schema}).processSync(/*...*/);
```

## CommonMark

> You still need to set `commonmark: true` in
> [`remark-parse`s options][remark-options].

[CommonMark][] support is a goal but not (yet) a necessity.  There are
some (roughly 115 of 550, relating to inline precedence, lists, emphasis
and importance) issues which I’d like to cover in the future.  Note that
this sounds like a lot, but they have to do with obscure differences
which do not often occur in the real world.

## Integrations

`remark-html` works great with:

*   [`remark-autolink-headings`](https://github.com/ben-eb/remark-autolink-headings)
    — Automatically add links to headings in Markdown
*   [`remark-github`](https://github.com/wooorm/remark-github)
    — Generate references to GitHub issues, PRs, users, and more
*   [`remark-highlight.js`](https://github.com/ben-eb/remark-highlight.js)
    — Highlight code blocks
*   [`remark-html-emoji-image`](https://github.com/jackycute/remark-html-emoji-image)
    — Transform emoji unicodes into html images
*   [`remark-html-katex`](https://github.com/rokt33r/remark-math/blob/master/packages/remark-html-katex/readme.md)
    — Transform math to HTML with KaTeX
*   [`remark-math`](https://github.com/rokt33r/remark-math)
    — Math support for markdown (inline and block)
*   [`remark-midas`](https://github.com/ben-eb/remark-midas)
    — Highlight CSS code with [midas](https://github.com/ben-eb/midas)
*   [`remark-toc`](https://github.com/wooorm/remark-toc)
    — Generate a Tables of Contents
*   ...and [more][remark-plugins]

All [**MDAST** nodes][mdast] can be compiled to HTML.  Unknown **MDAST**
nodes are compiled to `div` nodes if they have `children` or `text` nodes
if they have `value`.

In addition, **remark-html** can be told how to compile nodes through
three `data` properties ([more information][to-hast]):

*   `hName` — Tag-name to compile as
*   `hChildren` — HTML content to add (instead of `children` and `value`),
    in [`HAST`][hast]
*   `hProperties` — Map of attributes to add

For example, the following node:

```js
{
  type: 'emphasis',
  data: {
    hName: 'i',
    hProperties: {
      className: 'foo'
    },
    hChildren: [{
      type: 'text',
      value: 'bar'
    }]
  },
  children: [{
    type: 'text',
    value: 'baz',
  }]
}
```

...would yield:

```markdown
<i class="foo">bar</i>
```

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://img.shields.io/travis/wooorm/remark-html.svg

[build-status]: https://travis-ci.org/wooorm/remark-html

[coverage-badge]: https://img.shields.io/codecov/c/github/wooorm/remark-html.svg

[coverage-status]: https://codecov.io/github/wooorm/remark-html

[chat-badge]: https://img.shields.io/gitter/room/wooorm/remark.svg

[chat]: https://gitter.im/wooorm/remark

[license]: LICENSE

[author]: http://wooorm.com

[npm]: https://docs.npmjs.com/cli/install

[remark]: https://github.com/wooorm/remark

[remark-options]: https://github.com/wooorm/remark/tree/master/packages/remark-parse#options

[commonmark]: http://commonmark.org

[remark-plugins]: https://github.com/wooorm/remark/blob/master/doc/plugins.md#list-of-plugins

[mdast]: https://github.com/syntax-tree/mdast

[to-html]: https://github.com/syntax-tree/hast-util-to-html

[sanitize]: https://github.com/syntax-tree/hast-util-sanitize

[github]: https://github.com/syntax-tree/hast-util-sanitize#schema

[to-hast]: https://github.com/syntax-tree/mdast-util-to-hast#note

[remark2rehype]: https://github.com/wooorm/remark-rehype

[rehype-stringify]: https://github.com/wooorm/rehype/tree/master/packages/rehype-stringify

[rehype]: https://github.com/wooorm/rehype

[hast]: https://github.com/syntax-tree/hast
