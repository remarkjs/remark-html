import unified = require('unified')
import html = require('remark-html')

unified().use(html)
unified().use(html, {preferUnquoted: true})
unified().use(html, {sanitize: false})
unified().use(html, {sanitize: false})
unified().use(html, {sanitize: {allowComments: false}})
unified().use(html, {handlers: {hr: (h, node) => h(node, 'hr')}})
