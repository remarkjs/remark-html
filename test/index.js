/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('mdast').Paragraph} Paragraph
 * @typedef {import('mdast').Root} Root
 * @typedef {import('unified').Pluggable} Pluggable
 * @typedef {import('../index.js').Options} Options
 */

import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import process from 'node:process'
import test from 'node:test'
import {commonmark} from 'commonmark.json'
import {fromHtml} from 'hast-util-from-html'
import {toHtml} from 'hast-util-to-html'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkGithub from 'remark-github'
import remarkParse from 'remark-parse'
import remarkSlug from 'remark-slug'
import remarkToc from 'remark-toc'
import {unified} from 'unified'
import {VFile} from 'vfile'
import remarkHtml from '../index.js'

test('remarkHtml', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('../index.js')).sort(), [
      'default'
    ])
  })

  await t.test('should stringify unknown void nodes', async function () {
    assert.equal(
      unified()
        .use(remarkParse)
        .use(remarkHtml)
        // @ts-expect-error: check how an unknown node is handled.
        .stringify({type: 'alpha'}),
      '<div></div>'
    )
  })

  await t.test('should stringify unknown nodes w/ children', async function () {
    assert.equal(
      unified()
        .use(remarkParse)
        .use(remarkHtml)
        .stringify({
          // @ts-expect-error: check how an unknown node is handled.
          type: 'alpha',
          children: [
            {type: 'strong', children: [{type: 'text', value: 'bravo'}]}
          ]
        }),
      '<div><strong>bravo</strong></div>'
    )
  })

  await t.test(
    'should stringify unknown nodes w/ data fields',
    async function () {
      assert.equal(
        unified()
          .use(remarkParse)
          .use(remarkHtml, {sanitize: false})
          .stringify({
            // @ts-expect-error: check how an unknown node is handled.
            type: 'alpha',
            children: [{type: 'text', value: 'bravo'}],
            data: {
              hName: 'i',
              hProperties: {className: 'charlie'},
              hChildren: [{type: 'text', value: 'delta'}]
            }
          }),
        '<i class="charlie">delta</i>'
      )
    }
  )

  await t.test('should support handlers', async function () {
    assert.equal(
      String(
        await unified()
          .use(remarkParse)
          .use(remarkHtml, {
            handlers: {
              /** @param {Paragraph} node */
              paragraph(state, node) {
                const head = node.children[0]

                if (head.type === 'text') {
                  head.value = 'changed'
                }

                /** @type {Element} */
                const result = {
                  type: 'element',
                  tagName: 'p',
                  properties: {},
                  children: state.all(node)
                }
                state.patch(node, result)
                return state.applyData(node, result)
              }
            }
          })
          .process('paragraph text')
      ),
      '<p>changed</p>\n'
    )
  })

  await t.test('should patch and merge attributes', async function () {
    assert.equal(
      String(
        await unified()
          .use(remarkParse)
          .use(function () {
            /**
             * @param {Root} tree
             *   Tree.
             * @returns {undefined}
             *   Nothing.
             */
            return function (tree) {
              const paragraph = tree.children[0]
              assert(paragraph.type === 'paragraph')
              const image = paragraph.children[0]
              assert(image.type === 'image')
              image.data = {
                hProperties: {title: 'overwrite'}
              }
            }
          })
          .use(remarkHtml)
          .process('![hello](example.jpg "overwritten")')
      ),
      '<p><img src="example.jpg" alt="hello" title="overwrite"></p>\n'
    )
  })

  await t.test('should overwrite a tag name', async function () {
    assert.equal(
      String(
        await unified()
          .use(remarkParse)
          .use(function () {
            /**
             * @param {Root} tree
             *   Tree.
             * @returns {undefined}
             *   Nothing.
             */
            return function (tree) {
              const paragraph = tree.children[0]
              assert(paragraph.type === 'paragraph')
              const strong = paragraph.children[0]
              assert(strong.type === 'strong')
              strong.data = {hName: 'b'}
            }
          })
          .use(remarkHtml)
          .process('**Bold!**')
      ),
      '<p><b>Bold!</b></p>\n'
    )
  })

  await t.test('should overwrite content', async function () {
    assert.equal(
      String(
        await unified()
          .use(remarkParse)
          .use(function () {
            /**
             * @param {Root} tree
             *   Tree.
             * @returns {undefined}
             *   Nothing.
             */
            return function (tree) {
              const paragraph = tree.children[0]
              assert(paragraph.type === 'paragraph')
              const inlineCode = paragraph.children[0]
              assert(inlineCode.type === 'inlineCode')
              inlineCode.data = {
                hChildren: [
                  {
                    type: 'element',
                    tagName: 'span',
                    properties: {className: ['token']},
                    children: [{type: 'text', value: inlineCode.value}]
                  }
                ]
              }
            }
          })
          .use(remarkHtml, {sanitize: false})
          .process('`var`')
      ),
      '<p><code><span class="token">var</span></code></p>\n'
    )
  })

  await t.test('should sanitize overwriten content', async function () {
    assert.equal(
      String(
        await unified()
          .use(remarkParse)
          .use(function () {
            /**
             * @param {Root} tree
             *   Tree.
             * @returns {undefined}
             *   Nothing.
             */
            return function (tree) {
              const paragraph = tree.children[0]
              assert(paragraph.type === 'paragraph')
              const inlineCode = paragraph.children[0]
              assert(inlineCode.type === 'inlineCode')
              inlineCode.data = {
                hChildren: [
                  {
                    type: 'element',
                    tagName: 'span',
                    properties: {className: ['token']},
                    children: [{type: 'text', value: inlineCode.value}]
                  }
                ]
              }
            }
          })
          .use(remarkHtml, {sanitize: true})
          .process('`var`')
      ),
      '<p><code><span>var</span></code></p>\n'
    )
  })

  await t.test('should overwrite classes on code', async function () {
    assert.equal(
      String(
        await unified()
          .use(remarkParse)
          .use(function () {
            /**
             * @param {Root} tree
             *   Tree.
             * @returns {undefined}
             *   Nothing.
             */
            return function (tree) {
              const code = tree.children[0]
              assert(code.type === 'code')
              code.data = {hProperties: {className: 'foo'}}
            }
          })
          .use(remarkHtml, {sanitize: false})
          .process('```js\nvar\n```\n')
      ),
      '<pre><code class="foo">var\n</code></pre>\n'
    )
  })

  await t.test('should be `sanitize: true` by default', async function () {
    assert.equal(
      String(
        await unified()
          .use(remarkParse)
          .use(remarkHtml)
          .process('## Hello <span>world</span>')
      ),
      '<h2>Hello world</h2>\n'
    )
  })

  await t.test('should support `sanitize: true`', async function () {
    assert.equal(
      String(
        await unified()
          .use(remarkParse)
          .use(remarkHtml, {sanitize: true})
          .process('## Hello <span>world</span>')
      ),
      '<h2>Hello world</h2>\n'
    )
  })

  await t.test('should support `sanitize: null`', async function () {
    assert.equal(
      String(
        await unified()
          .use(remarkParse)
          .use(remarkHtml, {sanitize: null})
          .process('## Hello <span>world</span>')
      ),
      '<h2>Hello world</h2>\n'
    )
  })

  await t.test('should support `sanitize: false`', async function () {
    assert.equal(
      String(
        await unified()
          .use(remarkParse)
          .use(remarkHtml, {sanitize: false})
          .process('## Hello <span>world</span>')
      ),
      '<h2>Hello <span>world</span></h2>\n'
    )
  })

  await t.test('should support sanitize schemas', async function () {
    assert.equal(
      String(
        await unified()
          .use(remarkParse)
          .use(remarkHtml, {sanitize: {tagNames: []}})
          .process('## Hello <span>world</span>')
      ),
      'Hello world\n'
    )
  })
})

test('CommonMark', async function (t) {
  /** @type {Set<number>} */
  const skip = new Set()
  let start = 0
  let index = -1
  /** @type {string | undefined} */
  let section

  while (++index < commonmark.length) {
    const example = commonmark[index]

    if (skip.has(index)) {
      console.log('To do: `commonmark` test %d', index)
      continue
    }

    await t.test(
      index + ': ' + example.section + ' (' + (index - start + 1) + ')',
      async function () {
        if (section !== example.section) {
          section = example.section
          start = index
        }

        const actual = String(
          await unified()
            .use(remarkParse)
            .use(remarkHtml, {sanitize: false})
            .process(example.markdown)
        )

        // Normalize meaningless stuff, like character references, `<hr />` is `<hr>`,
        // etc.
        assert.equal(
          String(toHtml(fromHtml(actual))),
          String(toHtml(fromHtml(actual)))
        )
      }
    )
  }
})

test('fixtures', async function (t) {
  const base = new URL('fixtures/', import.meta.url)
  const files = await fs.readdir(base)
  let index = -1

  while (++index < files.length) {
    const folder = files[index]

    if (folder.startsWith('.')) continue

    await t.test(folder, async function () {
      const folderUrl = new URL(folder + '/', base)
      const inputUrl = new URL('input.md', folderUrl)
      const outputUrl = new URL('output.html', folderUrl)
      const configUrl = new URL('config.json', folderUrl)
      const input = String(await fs.readFile(inputUrl))
      /** @type {Options | undefined} */
      let config
      /** @type {string} */
      let output

      try {
        config = JSON.parse(String(await fs.readFile(configUrl)))
      } catch {}

      const actual = String(
        await unified().use(remarkParse).use(remarkHtml, config).process(input)
      )

      try {
        if ('UPDATE' in process.env) {
          throw new Error('Updating…')
        }

        output = String(await fs.readFile(outputUrl))
      } catch {
        output = actual
        await fs.writeFile(outputUrl, actual)
      }

      assert.equal(actual, String(output))
    })
  }
})

test('integrations', async function (t) {
  /** @type {Record<string, Pluggable>} */
  const integrationMap = {
    footnotes: remarkGfm,
    frontmatter: remarkFrontmatter,
    gfm: remarkGfm,
    github: remarkGithub,
    toc: [
      // @ts-expect-error: legacy; to do: remove?
      remarkSlug,
      remarkToc
    ]
  }
  const base = new URL('integrations/', import.meta.url)
  const files = await fs.readdir(base)
  let index = -1

  while (++index < files.length) {
    const folder = files[index]

    if (folder.startsWith('.')) continue

    await t.test('should integrate w/ `' + folder + '`', async function () {
      const folderUrl = new URL(folder + '/', base)
      const inputUrl = new URL('input.md', folderUrl)
      const outputUrl = new URL('output.html', folderUrl)
      const input = String(await fs.readFile(inputUrl))

      const actual = String(
        await unified()
          .use(remarkParse)
          // @ts-expect-error: fine.
          .use(integrationMap[folder])
          .use(remarkHtml, {sanitize: false})
          .process(new VFile({path: folder + '.md', value: input}))
      )

      /** @type {string} */
      let output

      try {
        if ('UPDATE' in process.env) {
          throw new Error('Updating…')
        }

        output = String(await fs.readFile(outputUrl))
      } catch {
        output = actual
        await fs.writeFile(outputUrl, actual)
      }

      assert.equal(actual, String(output))
    })
  }
})
