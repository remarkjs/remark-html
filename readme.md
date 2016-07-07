# remark-html [![Build Status][build-badge]][build-status] [![Coverage Status][coverage-badge]][coverage-status] [![Chat][chat-badge]][chat]

Compile markdown to HTML with [**remark**][remark].

## Installation

[npm][]:

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
var file = remark().use(html).process([
    '# Hello & World',
    '',
    '**Alpha**, _bravo_, and ~~Charlie~~.'
].join('\n'));
```

Yields:

```html
<h1>Hello &#x26; World</h1>
<p><strong>Alpha</strong>, <em>bravo</em>, and <del>Charlie</del>.</p>
```

## API

### `remark.use(html[, options])`

##### `options`

All options except for `sanitize` are passed to
[`hast-util-to-html`][to-html].

###### `options.sanitize`

Whether or not to sanitize the output (`boolean` or `Object`, default:
`true`).

An object can be passed, in which case it’s passed to
[`hast-util-sanitize`][sanitize].  By default, input is sanitized
according to [GitHub’s sanitation rules][github], with the addition
that all embedded HTML is also stripped.

`false` can be passed to allow dangerous HTML.

## CommonMark

> You still need to set `commonmark: true` in
> [**remark**s options][remark-options].

[CommonMark][] support is a goal but not (yet) a necessity.  There are
some (roughly 115 of 550, relating to inline precedence, lists, emphasis
and importance) issues which I’d like to cover in the future.  Note that
this sounds like a lot, but they have to do with obscure differences
which do not often occur in the real world.  Read more on some of the
reasoning in [`doc/commonmark.md`][commonmark-notes].

## Integrations

`remark-html` works great with:

*   [`wooorm/remark-toc`](https://github.com/wooorm/remark-toc), which
    generates tables of contents;
*   [`wooorm/remark-github`](https://github.com/wooorm/remark-github), which
    generates references to GitHub issues, PRs, users, and more;
*   ...and [more][remark-plugins].

All [**MDAST** nodes][mdast] can be compiled to HTML.  Unknown **MDAST**
nodes are compiled to `div` nodes.

In addition, **remark-html** can be told how to compile nodes through
three `data` properties ([more information][to-hast]):

*   `hName` — Tag-name to compile as;
*   `hChildren` — HTML content to add (instead of `children` and `value`);
*   `hProperties` — Map of attributes to add.

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

[releases]: https://github.com/wooorm/remark-html/releases

[license]: LICENSE

[author]: http://wooorm.com

[npm]: https://docs.npmjs.com/cli/install

[remark]: https://github.com/wooorm/remark

[remark-options]: https://github.com/wooorm/remark#remarkprocessvalue-options-done

[commonmark]: http://commonmark.org

[commonmark-notes]: doc/commonmark.md

[remark-plugins]: https://github.com/wooorm/remark/blob/master/doc/plugins.md#list-of-plugins

[mdast]: https://github.com/wooorm/mdast

[to-html]: https://github.com/wooorm/hast-util-to-html

[sanitize]: https://github.com/wooorm/hast-util-sanitize

[github]: https://github.com/wooorm/hast-util-sanitize#schema

[to-hast]: https://github.com/wooorm/mdast-util-to-hast#note
