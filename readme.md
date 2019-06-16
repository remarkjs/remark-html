# remark-html

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

[**remark**][remark] plugin to compile Markdown to HTML.

> ⚠️ This package essentially packs [`remark-rehype`][remark2rehype] and
> [`rehype-stringify`][rehype-stringify], and although it does support some
> customisation, it isn’t very pluggable.
> It’s probably smarter to use `remark-rehype` directly and benefit from the
> [**rehype**][rehype] ecosystem.

## Install

[npm][]:

```sh
npm install remark-html
```

## Use

Say we have the following file, `example.md`:

```markdown
# Hello & World

> A block quote.

* Some _emphasis_, **importance**, and `code`.
```

And our script, `example.js`, looks as follows:

```js
var fs = require('fs')
var unified = require('unified')
var markdown = require('remark-parse')
var html = require('remark-html')

unified()
  .use(markdown)
  .use(html)
  .process(fs.readFileSync('example.md'), function(err, file) {
    if (err) throw err
    console.log(String(file))
  })
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

### `remark().use(html[, options])`

Compile Markdown to HTML.

##### `options`

All options except for `sanitize` are passed to
[`hast-util-to-html`][to-html].

###### `options.sanitize`

How to sanitise the output (`Object` or `boolean`, default: `false`).

If `false`, no HTML is sanitized, and dangerous HTML is left unescaped.

If `true` or an `object`, sanitation is done by [`hast-util-sanitize`][sanitize]
If an object is passed in, it’s given as a schema to `hast-util-sanitize`.
If `true`, input is sanitised according to [GitHub’s sanitation rules][github].

> Note that raw HTML in Markdown cannot be sanitized, so it’s removed.
> A schema can still be used to allow certain values from [integrations][]
> though.
> To support HTML in Markdown, use [`rehype-raw`][raw].

For example, to add strict sanitation but allowing `className`s, use something
like:

```js
// ...
var merge = require('deepmerge')
var github = require('hast-util-sanitize/lib/github')

var schema = merge(github, {attributes: {'*': ['className']}})

remark()
  .use(html, {sanitize: schema})
  .processSync(/* ... */)
```

## CommonMark

> You still need to set `commonmark: true` in [`remark-parse`s
> options][remark-options].

[CommonMark][] support is a goal but not (yet) a necessity.
There are some (roughly 115 of 550, relating to inline precedence, lists,
emphasis and importance) issues which I’d like to cover in the future.
Note that this sounds like a lot, but they have to do with obscure differences
which do not often occur in the real world.

## Integrations

`remark-html` works great with:

*   [`remark-autolink-headings`](https://github.com/ben-eb/remark-autolink-headings)
    — Automatically add links to headings in Markdown
*   [`remark-github`](https://github.com/remarkjs/remark-github)
    — Generate references to GitHub issues, PRs, users, and more
*   [`remark-highlight.js`](https://github.com/ben-eb/remark-highlight.js)
    — Highlight code blocks
*   [`remark-html-emoji-image`](https://github.com/jackycute/remark-html-emoji-image)
    — Transform emoji unicodes into html images
*   [`remark-html-katex`](https://github.com/rokt33r/remark-math/blob/master/packages/remark-html-katex/readme.md)
    — Transform math to HTML with KaTeX
*   [`remark-math`](https://github.com/rokt33r/remark-math)
    — Math support for Markdown (inline and block)
*   [`remark-midas`](https://github.com/ben-eb/remark-midas)
    — Highlight CSS code with [midas](https://github.com/ben-eb/midas)
*   [`remark-toc`](https://github.com/remarkjs/remark-toc)
    — Generate a Tables of Contents
*   ...and [more][remark-plugins]

All [**mdast** nodes][mdast] can be compiled to HTML.
Unknown **mdast** nodes are compiled to `div` nodes if they have `children` or
`text` nodes if they have `value`.

In addition, **remark-html** can be told how to compile nodes through
three `data` properties ([more information][to-hast]):

*   `hName` — Tag name to compile as
*   `hChildren` — HTML content to add (instead of `children` and `value`), in
    [`hast`][hast]
*   `hProperties` — Map of properties to add

For example, the following node:

```js
{
  type: 'emphasis',
  data: {
    hName: 'i',
    hProperties: {className: 'foo'},
    hChildren: [{type: 'text', value: 'bar'}]
  },
  children: [{type: 'text', value: 'baz'}]
}
```

…would yield:

```markdown
<i class="foo">bar</i>
```

## Contribute

See [`contributing.md`][contributing] in [`remarkjs/.github`][health] for ways
to get started.
See [`support.md`][support] for ways to get help.

This project has a [Code of Conduct][coc].
By interacting with this repository, organisation, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://img.shields.io/travis/remarkjs/remark-html/master.svg

[build]: https://travis-ci.org/remarkjs/remark-html

[coverage-badge]: https://img.shields.io/codecov/c/github/remarkjs/remark-html.svg

[coverage]: https://codecov.io/github/remarkjs/remark-html

[downloads-badge]: https://img.shields.io/npm/dm/remark-html.svg

[downloads]: https://www.npmjs.com/package/remark-html

[size-badge]: https://img.shields.io/bundlephobia/minzip/remark-html.svg

[size]: https://bundlephobia.com/result?p=remark-html

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/join%20the%20community-on%20spectrum-7b16ff.svg

[chat]: https://spectrum.chat/unified/remark

[npm]: https://docs.npmjs.com/cli/install

[health]: https://github.com/remarkjs/.github

[contributing]: https://github.com/remarkjs/.github/blob/master/contributing.md

[support]: https://github.com/remarkjs/.github/blob/master/support.md

[coc]: https://github.com/remarkjs/.github/blob/master/code-of-conduct.md

[license]: license

[author]: https://wooorm.com

[remark]: https://github.com/remarkjs/remark

[remark-options]: https://github.com/remarkjs/remark/tree/master/packages/remark-parse#options

[remark-plugins]: https://github.com/remarkjs/remark/blob/master/doc/plugins.md#list-of-plugins

[remark2rehype]: https://github.com/remarkjs/remark-rehype

[rehype]: https://github.com/rehypejs/rehype

[rehype-stringify]: https://github.com/rehypejs/rehype/tree/master/packages/rehype-stringify

[raw]: https://github.com/rehypejs/rehype-raw

[mdast]: https://github.com/syntax-tree/mdast

[hast]: https://github.com/syntax-tree/hast

[to-html]: https://github.com/syntax-tree/hast-util-to-html

[sanitize]: https://github.com/syntax-tree/hast-util-sanitize

[github]: https://github.com/syntax-tree/hast-util-sanitize#schema

[to-hast]: https://github.com/syntax-tree/mdast-util-to-hast#note

[commonmark]: https://commonmark.org

[integrations]: #integrations
