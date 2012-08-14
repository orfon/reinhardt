var assert = require("assert");
var {Context} = require('../lib/context');

exports.testContext = function() {

   // NOT we don't support [] access, only get()
   var c = new Context({"a": 1, "b": "xyzzy"})
   assert.equal(c.get("a"), 1)
   assert.deepEqual(c.push(), {})
   c.set('a', 2);
   assert.equal(c.get("a"), 2)
   assert.deepEqual(c.pop(), {"a": 2})
   assert.equal(c.get('a'), 1)
   assert.equal(c.get("foo", 42), 42)
};

//start the test runner if we're called directly from command line
if (require.main == module.id) {
    system.exit(require('test').run(exports, arguments[1]));
}
