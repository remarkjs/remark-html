// Dependencies:
var remark = require('remark');
var html = require('./index.js');

// Process.
var file = remark().use(html).process([
    '# Hello & World',
    '',
    '**Alpha**, _bravo_, and ~~Charlie~~.'
].join('\n'));

// Yields:
console.log('html', String(file));
