import path from 'path'
import fs from 'fs'
import test from 'tape'
import {isHidden} from 'is-hidden'
import {commonmark} from 'commonmark.json'
import {toVFile} from 'to-vfile'
import {all} from 'mdast-util-to-hast'
import {unified} from 'unified'
import {remark} from 'remark'
import remarkParse from 'remark-parse'
import remarkSlug from 'remark-slug'
import remarkFootnotes from 'remark-footnotes'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkGithub from 'remark-github'
import remarkToc from 'remark-toc'
import rehypeParse from 'rehype-parse'
import rehypeStringify from 'rehype-stringify'
import remarkHtml from '../index.js'

test('remarkHtml', (t) => {
  let processor

  t.doesNotThrow(() => {
    remark().use(remarkHtml).freeze()
  }, 'should not throw if not passed options')

  t.throws(
    () => {
      remark()
        .use(remarkHtml)
        .stringify({type: 'root', children: [{value: 'baz'}]})
    },
    /Expected node, got `\[object Object]`/,
    'should throw when not given a node'
  )

  processor = remark().use(remarkHtml)

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

  processor = remark().use(remarkHtml, {
    handlers: {
      paragraph(h, node) {
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
    .use(() => {
      return function (ast) {
        ast.children[0].children[0].data = {
          hProperties: {title: 'overwrite'}
        }
      }
    })
    .use(remarkHtml)

  t.equal(
    processor.processSync('![hello](example.jpg "overwritten")').toString(),
    '<p><img src="example.jpg" alt="hello" title="overwrite"></p>\n',
    'should patch and merge attributes'
  )

  processor = remark()
    .use(() => {
      return function (ast) {
        ast.children[0].children[0].data = {hName: 'b'}
      }
    })
    .use(remarkHtml)

  t.equal(
    processor.processSync('**Bold!**').toString(),
    '<p><b>Bold!</b></p>\n',
    'should overwrite a tag-name'
  )

  processor = remark()
    .use(() => {
      return function (ast) {
        const code = ast.children[0].children[0]

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
    .use(remarkHtml)

  t.equal(
    processor.processSync('`var`').toString(),
    '<p><code><span class="token">var</span></code></p>\n',
    'should overwrite content'
  )

  processor = remark()
    .use(() => {
      return function (ast) {
        const code = ast.children[0].children[0]

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
    .use(remarkHtml, {sanitize: true})

  t.equal(
    processor.processSync('`var`').toString(),
    '<p><code>var</code></p>\n',
    'should not overwrite content in `sanitize` mode'
  )

  processor = remark()
    .use(() => {
      return function (ast) {
        ast.children[0].data = {
          hProperties: {className: 'foo'}
        }
      }
    })
    .use(remarkHtml)

  t.equal(
    processor.processSync('```js\nvar\n```\n').toString(),
    '<pre><code class="foo">var\n</code></pre>\n',
    'should overwrite classes on code'
  )

  t.equal(
    remark()
      .use(remarkHtml)
      .processSync('## Hello <span>world</span>')
      .toString(),
    '<h2>Hello <span>world</span></h2>\n',
    'should be `sanitation: false` by default'
  )

  t.equal(
    remark()
      .use(remarkHtml, {sanitize: true})
      .processSync('## Hello <span>world</span>')
      .toString(),
    '<h2>Hello world</h2>\n',
    'should support sanitation: true'
  )

  t.equal(
    remark()
      .use(remarkHtml, {sanitize: null})
      .processSync('## Hello <span>world</span>')
      .toString(),
    '<h2>Hello <span>world</span></h2>\n',
    'should support sanitation: null'
  )

  t.equal(
    remark()
      .use(remarkHtml, {sanitize: false})
      .processSync('## Hello <span>world</span>')
      .toString(),
    '<h2>Hello <span>world</span></h2>\n',
    'should support sanitation: false'
  )

  t.equal(
    remark()
      .use(remarkHtml, {sanitize: {tagNames: []}})
      .processSync('## Hello <span>world</span>')
      .toString(),
    'Hello world\n',
    'should support sanitation schemas'
  )

  t.end()
})

// Assert fixtures.
test('Fixtures', (t) => {
  const base = path.join('test', 'fixtures')
  const files = fs.readdirSync(base)
  let index = -1

  while (++index < files.length) {
    const name = files[index]

    if (isHidden(name)) continue

    const output = String(fs.readFileSync(path.join(base, name, 'output.html')))
    const input = String(fs.readFileSync(path.join(base, name, 'input.md')))
    const file = toVFile({path: name + '.md', value: input})
    let config = {}

    try {
      config = JSON.parse(fs.readFileSync(path.join(base, name, 'config.json')))
    } catch {}

    const result = processSync(file, config)

    t.equal(result, output, 'should work on `' + name + '`')
  }

  t.end()
})

test('CommonMark', (t) => {
  let start = 0
  let index = -1
  let section

  while (++index < commonmark.length) {
    const example = commonmark[index]
    if (section !== example.section) {
      section = example.section
      start = index
    }

    const actual = unified()
      .use(remarkParse)
      .use(remarkHtml)
      .processSync(example.markdown)
      .toString()

    const reformat = unified()
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

  t.end()
})

test('Integrations', (t) => {
  const integrationMap = {
    footnotes: remarkFootnotes,
    frontmatter: remarkFrontmatter,
    gfm: remarkGfm,
    github: remarkGithub,
    toc: [remarkSlug, remarkToc]
  }
  const base = path.join('test', 'integrations')
  const files = fs.readdirSync(base)
  let index = -1

  while (++index < files.length) {
    const name = files[index]

    if (isHidden(name)) continue

    const output = String(fs.readFileSync(path.join(base, name, 'output.html')))
    const input = String(fs.readFileSync(path.join(base, name, 'input.md')))
    const file = toVFile({path: name + '.md', value: input})
    const result = remark()
      .use(integrationMap[name])
      .use(remarkHtml)
      .processSync(file)
      .toString()

    t.equal(result, output, 'should integrate w/ `' + name + '`')
  }

  t.end()
})

function processSync(file, config) {
  return remark().use(remarkHtml, config).processSync(file).toString()
}
