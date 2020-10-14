'use strict'

var path = require('path')
var fs = require('fs')
var test = require('tape')
var remark = require('remark')
var slug = require('remark-slug')
var footnotes = require('remark-footnotes')
var frontmatter = require('remark-frontmatter')
var gfm = require('remark-gfm')
var github = require('remark-github')
var toc = require('remark-toc')
var commonmark = require('commonmark.json')
var vfile = require('to-vfile')
var hidden = require('is-hidden')
var not = require('not')
var unified = require('unified')
var parse = require('remark-parse')
var rehypeParse = require('rehype-parse')
var rehypeStringify = require('rehype-stringify')
var all = require('mdast-util-to-hast/lib/all')
var html = require('..')

test('remark-html()', function (t) {
  var processor

  t.equal(typeof html, 'function', 'should be a function')

  t.doesNotThrow(function () {
    remark().use(html).freeze()
  }, 'should not throw if not passed options')

  t.throws(
    function () {
      remark()
        .use(html)
        .stringify({type: 'root', children: [{value: 'baz'}]})
    },
    /Expected node, got `\[object Object]`/,
    'should throw when not given a node'
  )

  processor = remark().use(html)

  t.equal(
    processor.stringify({type: 'alpha'}),
    '<div></div>',
    'should stringify unknown nodes'
  )

  t.equal(
    processor.stringify({
      type: 'alpha',
      children: [{type: 'strong', children: [{type: 'text', value: 'bravo'}]}]
    }),
    '<div><strong>bravo</strong></div>',
    'should stringify unknown nodes'
  )

  t.equal(
    processor.stringify({
      type: 'alpha',
      children: [{type: 'text', value: 'bravo'}],
      data: {
        hName: 'i',
        hProperties: {className: 'charlie'},
        hChildren: [{type: 'text', value: 'delta'}]
      }
    }),
    '<i class="charlie">delta</i>',
    'should stringify unknown nodes'
  )

  processor = remark().use(html, {
    handlers: {
      paragraph: function (h, node) {
        node.children[0].value = 'changed'
        return h(node, 'p', all(h, node))
      }
    }
  })

  t.equal(
    processor.processSync('paragraph text').toString(),
    '<p>changed</p>\n',
    'should allow overriding handlers'
  )

  processor = remark()
    .use(function () {
      return function (ast) {
        ast.children[0].children[0].data = {
          hProperties: {title: 'overwrite'}
        }
      }
    })
    .use(html)

  t.equal(
    processor.processSync('![hello](example.jpg "overwritten")').toString(),
    '<p><img src="example.jpg" alt="hello" title="overwrite"></p>\n',
    'should patch and merge attributes'
  )

  processor = remark()
    .use(function () {
      return function (ast) {
        ast.children[0].children[0].data = {hName: 'b'}
      }
    })
    .use(html)

  t.equal(
    processor.processSync('**Bold!**').toString(),
    '<p><b>Bold!</b></p>\n',
    'should overwrite a tag-name'
  )

  processor = remark()
    .use(function () {
      return function (ast) {
        var code = ast.children[0].children[0]

        code.data = {
          hChildren: [
            {
              type: 'element',
              tagName: 'span',
              properties: {className: ['token']},
              children: [{type: 'text', value: code.value}]
            }
          ]
        }
      }
    })
    .use(html)

  t.equal(
    processor.processSync('`var`').toString(),
    '<p><code><span class="token">var</span></code></p>\n',
    'should overwrite content'
  )

  processor = remark()
    .use(function () {
      return function (ast) {
        var code = ast.children[0].children[0]

        code.data = {
          hChildren: [
            {
              type: 'element',
              tagName: 'output',
              properties: {className: ['token']},
              children: [{type: 'text', value: code.value}]
            }
          ]
        }
      }
    })
    .use(html, {sanitize: true})

  t.equal(
    processor.processSync('`var`').toString(),
    '<p><code>var</code></p>\n',
    'should not overwrite content in `sanitize` mode'
  )

  processor = remark()
    .use(function () {
      return function (ast) {
        ast.children[0].data = {
          hProperties: {className: 'foo'}
        }
      }
    })
    .use(html)

  t.equal(
    processor.processSync('```js\nvar\n```\n').toString(),
    '<pre><code class="foo">var\n</code></pre>\n',
    'should overwrite classes on code'
  )

  t.equal(
    remark().use(html).processSync('## Hello <span>world</span>').toString(),
    '<h2>Hello <span>world</span></h2>\n',
    'should be `sanitation: false` by default'
  )

  t.equal(
    remark()
      .use(html, {sanitize: true})
      .processSync('## Hello <span>world</span>')
      .toString(),
    '<h2>Hello world</h2>\n',
    'should support sanitation: true'
  )

  t.equal(
    remark()
      .use(html, {sanitize: null})
      .processSync('## Hello <span>world</span>')
      .toString(),
    '<h2>Hello <span>world</span></h2>\n',
    'should support sanitation: null'
  )

  t.equal(
    remark()
      .use(html, {sanitize: false})
      .processSync('## Hello <span>world</span>')
      .toString(),
    '<h2>Hello <span>world</span></h2>\n',
    'should support sanitation: false'
  )

  t.equal(
    remark()
      .use(html, {sanitize: {tagNames: []}})
      .processSync('## Hello <span>world</span>')
      .toString(),
    'Hello world\n',
    'should support sanitation schemas'
  )

  t.end()
})

// Assert fixtures.
test('Fixtures', function (t) {
  var base = path.join(__dirname, 'fixtures')

  fs.readdirSync(base).filter(not(hidden)).forEach(each)

  t.end()

  function each(name) {
    var output = String(fs.readFileSync(path.join(base, name, 'output.html')))
    var input = String(fs.readFileSync(path.join(base, name, 'input.md')))
    var config = {}
    var file = vfile(name + '.md')
    var result

    file.contents = input

    try {
      config = JSON.parse(fs.readFileSync(path.join(base, name, 'config.json')))
    } catch (_) {}

    result = processSync(file, config)

    t.equal(result, output, 'should work on `' + name + '`')
  }
})

test('CommonMark', function (t) {
  var start = 0
  var section

  commonmark.forEach(each)

  t.end()

  function each(example, index) {
    if (section !== example.section) {
      section = example.section
      start = index
    }

    var actual = unified()
      .use(parse)
      .use(html)
      .processSync(example.markdown)
      .toString()

    var reformat = unified()
      .use(rehypeParse, {fragment: true})
      .use(rehypeStringify)

    // Normalize meaningless stuff, like character references, `<hr />` is `<hr>`,
    // etc.
    t.equal(
      String(reformat.processSync(actual)),
      String(reformat.processSync(example.html)),
      index + ': ' + example.section + ' (' + (index - start + 1) + ')'
    )
  }
})

test('Integrations', function (t) {
  var integrationMap = {
    footnotes: footnotes,
    frontmatter: frontmatter,
    gfm: gfm,
    github: github,
    toc: [slug, toc]
  }
  var base = path.join(__dirname, 'integrations')

  fs.readdirSync(base).filter(not(hidden)).forEach(each)

  t.end()

  function each(name) {
    var output = String(fs.readFileSync(path.join(base, name, 'output.html')))
    var input = String(fs.readFileSync(path.join(base, name, 'input.md')))
    var file = vfile({path: name + '.md', contents: input})
    var result

    result = remark()
      .use(integrationMap[name])
      .use(html)
      .processSync(file)
      .toString()

    t.equal(result, output, 'should integrate w/ `' + name + '`')
  }
})

function processSync(file, config) {
  return remark().use(html, config).processSync(file).toString()
}
