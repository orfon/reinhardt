var assert = require("assert");

var {Variable} = require('../lib/variable');

exports.testResolving = function() {
   var c = {'article': {
      'section': 'News',
      'author': {
            'name': 'Reinhardt'
         },
      'slug': function() {
         return 'Foobar';
      }
   }};

   assert.strictEqual(
      new Variable('article.section').resolve(c),
      c.article.section
   );
   assert.strictEqual(
      new Variable('article').resolve(c),
      c.article
   );
   assert.strictEqual(
      new Variable('article.author.name').resolve(c),
      c.article.author.name
   );

   // functions are called
   assert.strictEqual(
      new Variable('article.slug').resolve(c),
      c.article.slug()
   );
}

exports.testParsing = function() {
   // literal false is resolved to type false
   // string "false" is unchanged
   assert.strictEqual(
      new Variable('false').resolve({}),
      false
   );
   assert.strictEqual(
      new Variable('null').resolve({}),
      null
   );

   assert.equal(
      new Variable('"false"').resolve({}),
      'false'
   );
   assert.equal(
      new Variable('"A constant string"').resolve({}),
      "A constant string"
   );

   // escaped quotes work
   assert.equal(
      new Variable('"Some \"Good\" News"').resolve({}),
      'Some "Good" News'
   );
   assert.equal(
      new Variable('"Some \'Good\' News"').resolve({}),
      "Some 'Good' News"
   );
}

//start the test runner if we're called directly from command line
if (require.main == module.id) {
    system.exit(require('test').run(exports, arguments[1]));
}
