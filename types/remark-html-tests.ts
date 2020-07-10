import unified = require('unified')
import html = require('remark-html')

unified().use(html)
unified().use(html, {preferUnquoted: true})
unified().use(html, {sanitize: false})
