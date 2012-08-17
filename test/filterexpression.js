var assert = require("assert");

var {FilterExpression} = require('../lib/filterexpression');
var {Parser} = require('../lib/parser');

var c = {'article': {
   'section': 'News',
   'author': {
         'name': 'Reinhardt'
      },
   'slug': function() {
      return 'Foobar';
   }
}};

exports.testResolving = function() {

   assert.strictEqual(
      new FilterExpression('article.section').resolve(c),
      c.article.section
   );
   assert.strictEqual(
      new FilterExpression('article').resolve(c),
      c.article
   );
   assert.strictEqual(
      new FilterExpression('article.author.name').resolve(c),
      c.article.author.name
   );

   // functions are called
   assert.strictEqual(
      new FilterExpression('article.slug').resolve(c),
      c.article.slug()
   );
};

exports.testParsing = function() {
   var fe = new FilterExpression('"Foobar"');
   assert.deepEqual(fe.filters, []);
   assert.equal(fe.resolve({}), "Foobar");

   var parser = new Parser('');
   var fe = new FilterExpression('"Foobar"|upper', parser);
   assert.equal(fe.resolve({}), 'FOOBAR');

   var fe = new FilterExpression('"Foobar"|upper|lower', parser);
   assert.equal(fe.resolve({}), 'foobar');

   var date = new Date();
   date.setYear(1910);
   var c = {'django': {'birthday': date}};
   var fe = new FilterExpression('django.birthday|date:"yyyy"', parser);
   assert.equal(fe.resolve(c), 1910);
}


//start the test runner if we're called directly from command line
if (require.main == module.id) {
    system.exit(require('test').run(exports, arguments[1]));
}
