var assert = require('assert');
var {Template} = require('../lib/template');

// test for ticket #3: ifchanged rendered twice
exports.test_ifchangedRenderedTwice = function() {
   var template = new Template('{% ifchanged %}{{ gen.next }}{% endifchanged %}')
   function gen() {
      for (var i = 1; i<10;i++) {
         yield ("iteration no " + i)
      }
   }
   var output = template.render({
      gen: gen()
   })
   assert.equal(output, 'iteration no 1');
}