'use strict';

var path = require('path');
var fs = require('fs');
var assert = require('assert');
var test = require('tape');
var remark = require('remark');
var toc = require('remark-toc');
var github = require('remark-github');
var commonmark = require('commonmark.json');
var toVFile = require('to-vfile');
var hidden = require('is-hidden');
var all = require('mdast-util-to-hast/lib/all');
var html = require('..');

var read = fs.readFileSync;
var exists = fs.existsSync;
var join = path.join;

/* By default, CommonMark failures are accepted.
 * To fail on CommonMark exceptions, set the `CMARK`
 * environment variable. */
var ignoreCommonMarkException = !('CMARK' in global.process.env);

var INTEGRATION_MAP = {github: github, toc: toc};
var INTEGRATION_ROOT = join(__dirname, 'integrations');
var FIXTURE_ROOT = join(__dirname, 'fixtures');

var CMARK_OPTIONS = {
  entities: {
    escapeOnly: true,
    useNamedReferences: true
  },
  commonmark: true,
  yaml: false,
  closeSelfClosing: true,
  sanitize: false
};

/* List of CommonMark tests I dissagree with.
 * For reasoning, see `doc/commonmark.md`.
 * Note that these differences have to do with not
 * puting more time into features which IMHO produce
 * less quality HTML. So if you’d like to write the
 * features, I’ll gladly merge! */
var CMARK_IGNORE = [
  /* Exception 1. */
  247,
  248,

  /* Exception 2. */
  3,
  50,
  76,
  77,
  80,
  86,
  89,
  98,
  118,
  176,
  230,
  231,
  233,
  236,
  257,
  258,
  261,
  262,
  263,
  264,
  265,
  266,
  267,
  268,
  269,
  270,
  395,
  396,
  433,
  445,
  520,
  522,
  551,

  /* Exception 3. */
  428,
  477,
  478,
  479,
  480,
  481,
  489,
  493
];

var fixtures = fs.readdirSync(FIXTURE_ROOT);
var integrations = fs.readdirSync(INTEGRATION_ROOT);

fixtures = fixtures.filter(hidden);
integrations = integrations.filter(hidden);

var section;
var start;

commonmark.forEach(function (test, position) {
  if (section !== test.section) {
    section = test.section;
    start = position;
  }

  test.relative = position - start + 1;
});

test('remark-html()', function (t) {
  var processor;

  t.equal(typeof html, 'function', 'should be a function');

  t.doesNotThrow(function () {
    html(remark());
  }, 'should not throw if not passed options');

  t.throws(
    function () {
      remark().use(html).stringify({
        type: 'root',
        children: [{value: 'baz'}]
      });
    },
    /Expected node, got `\[object Object]`/,
    'should throw when not given a node'
  );

  processor = remark().use(html);

  t.equal(
    processor.stringify({type: 'alpha'}),
    '<div></div>',
    'should stringify unknown nodes'
  );

  t.equal(
    processor.stringify({
      type: 'alpha',
      children: [{
        type: 'strong',
        children: [{
          type: 'text',
          value: 'bravo'
        }]
      }]
    }),
    '<div><strong>bravo</strong></div>',
    'should stringify unknown nodes'
  );

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
  );

  processor = remark()
    .use(html, {handlers: {
      paragraph: function (h, node) {
        node.children[0].value = 'changed';
        return h(node, 'p', all(h, node));
      }
    }});

  t.equal(
    processor.process('paragraph text').toString(),
    '<p>changed</p>\n',
    'should allow overriding handlers'
  );

  processor = remark()
    .use(function () {
      return function (ast) {
        ast.children[0].children[0].data = {
          hProperties: {title: 'overwrite'}
        };
      };
    })
    .use(html);

  t.equal(
    processor.process('![hello](example.jpg "overwritten")').toString(),
    '<p><img src="example.jpg" alt="hello" title="overwrite"></p>\n',
    'should patch and merge attributes'
  );

  processor = remark()
    .use(function () {
      return function (ast) {
        ast.children[0].children[0].data = {hName: 'b'};
      };
    })
    .use(html);

  t.equal(
    processor.process('**Bold!**').toString(),
    '<p><b>Bold!</b></p>\n',
    'should overwrite a tag-name'
  );

  processor = remark()
    .use(function () {
      return function (ast) {
        var code = ast.children[0].children[0];

        code.data = {
          hChildren: [{
            type: 'element',
            tagName: 'span',
            properties: {className: ['token']},
            children: [{type: 'text', value: code.value}]
          }]
        };
      };
    })
    .use(html);

  t.equal(
    processor.process('`var`').toString(),
    '<p><code><span class="token">var</span></code></p>\n',
    'should overwrite content'
  );

  processor = remark()
    .use(function () {
      return function (ast) {
        var code = ast.children[0].children[0];

        code.data = {
          hChildren: [{
            type: 'element',
            tagName: 'span',
            properties: {className: ['token']},
            children: [{type: 'text', value: code.value}]
          }]
        };
      };
    })
    .use(html, {sanitize: true});

  t.equal(
    processor.process('`var`').toString(),
    '<p><code>var</code></p>\n',
    'should not overwrite content in `sanitize` mode'
  );

  processor = remark()
    .use(function () {
      return function (ast) {
        ast.children[0].data = {
          hProperties: {className: 'foo'}
        };
      };
    })
    .use(html);

  t.equal(
    processor.process('```js\nvar\n```\n').toString(),
    '<pre><code class="foo">var\n</code></pre>\n',
    'should overwrite classes on code'
  );

  t.equal(
    remark().use(html).process('## Hello <span>world</span>').toString(),
    '<h2>Hello <span>world</span></h2>\n',
    'should be `sanitation: false` by default'
  );

  t.equal(
    remark().use(html, {
      sanitize: true
    }).process('## Hello <span>world</span>').toString(),
    '<h2>Hello world</h2>\n',
    'should support sanitation: true'
  );

  t.equal(
    remark().use(html, {
      sanitize: null
    }).process('## Hello <span>world</span>').toString(),
    '<h2>Hello <span>world</span></h2>\n',
    'should support sanitation: null'
  );

  t.equal(
    remark().use(html, {
      sanitize: false
    }).process('## Hello <span>world</span>').toString(),
    '<h2>Hello <span>world</span></h2>\n',
    'should support sanitation: false'
  );

  t.equal(
    remark().use(html, {
      sanitize: {tagNames: []}
    }).process('## Hello <span>world</span>').toString(),
    'Hello world\n',
    'should support sanitation schemas'
  );

  t.end();
});

/* Assert fixtures. */
test('Fixtures', function (t) {
  fixtures.forEach(function (fixture) {
    var filepath = join(FIXTURE_ROOT, fixture);
    var output = read(join(filepath, 'output.html'), 'utf-8');
    var input = read(join(filepath, 'input.md'), 'utf-8');
    var config = join(filepath, 'config.json');
    var file = toVFile(fixture + '.md');
    var result;

    file.contents = input;

    config = exists(config) ? JSON.parse(read(config, 'utf-8')) : {};
    result = process(file, config);

    t.equal(result, output, 'should work on `' + fixture + '`');
  });

  t.end();
});

/* Assert CommonMark. */
test('CommonMark', function (t) {
  commonmark.forEach(function (test, n) {
    var name = test.section + ' ' + test.relative;
    var file = toVFile(name + '.md');
    var result;
    var message;
    var exception;

    file.contents = test.markdown;
    result = process(file, CMARK_OPTIONS);

    n += 1;

    try {
      assert.equal(result, test.html);
    } catch (err) {
      exception = err;
    }

    message = '(' + n + ') should work on ' + name;

    if (
      CMARK_IGNORE.indexOf(n) !== -1 ||
      (ignoreCommonMarkException && exception)
    ) {
      t.skip(message);
    } else {
      t.equal(result, test.html, message);
    }
  });

  t.end();
});

/* Assert integrations. */
test('Integrations', function (t) {
  integrations.forEach(function (integration) {
    var filepath = join(INTEGRATION_ROOT, integration);
    var output = read(join(filepath, 'output.html'), 'utf-8');
    var input = read(join(filepath, 'input.md'), 'utf-8');
    var config = join(filepath, 'config.json');
    var file = toVFile(integration + '.md');
    var result;

    file.contents = input;

    config = exists(config) ? JSON.parse(read(config, 'utf-8')) : {};

    config.sanitize = false;

    result = remark()
        .use(html, config)
        .use(INTEGRATION_MAP[integration], config)
        .process(file, config)
        .toString();

    t.equal(result, output, 'should work on `' + integration + '`');
  });

  t.end();
});

function process(file, config) {
  return remark().use(html, config).process(file, config).toString();
}
