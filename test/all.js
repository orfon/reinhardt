exports.testBasic = require('./basic');
exports.testContext = require('./context');
exports.testFilterExpression = require('./filterexpression');
exports.testFilters = require('./filters');
exports.testLexer = require('./lexer');
exports.testLoader = require('./loader');
exports.testNodeList = require('./nodelist');
exports.testRegressions = require('./regressions');
exports.testSmartIf = require('./smartif');
exports.testTemplate = require('./template');
exports.testVariable = require('./variable');

// start the test runner if we're called directly from command line
if (require.main == module.id) {
  require('system').exit(require('test').run(exports));
}

