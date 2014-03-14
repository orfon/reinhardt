var assert = require('assert');
var {Template} = require('../lib/template');

// test for ticket #3: ifchanged rendered twice
exports.testIfchangedRenderedTwice = function() {
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

// test for bug https://github.com/orfon/reinhardt/commit/c175d09eeb98d1c9e8c79a6cbfcffcf86ed44d1c
exports.testVariableResolvingError = function() {
   var template = new Template("{{session.user.data.name}}");
   var output = template.render({
      session: {
         user: null
      }
   });
   assert.equal(output, "null");

}