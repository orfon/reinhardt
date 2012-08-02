
exports.testFilterExpression = require('./variable');
exports.testFilterExpression = require('./filterexpression');
exports.testLexer = require('./lexer');
exports.testTemplate = require('./template');
exports.testBasic = require('./basic');

// start the test runner if we're called directly from command line
if (require.main == module.id) {
    system.exit(require('test').run(exports));
}

