var assert = require("assert");
var fs = require('fs');

var {Lexer} = require('../lib/lexer');
var c = require("../lib/constants");

exports.testLexer = function() {
   var templateString = fs.read(module.resolve('./lexer.html'));
   var lexer = new Lexer(templateString);
   var tokens = lexer.tokenize();
   var tokenTypes = tokens.map(function(t) {
      return t.tokenType;
   });
   var expectedTokenTypes = [c.TOKEN_TEXT, c.TOKEN_BLOCK, c.TOKEN_TEXT, c.TOKEN_BLOCK, c.TOKEN_TEXT, c.TOKEN_BLOCK,
       c.TOKEN_TEXT, c.TOKEN_VAR, c.TOKEN_TEXT, c.TOKEN_BLOCK, c.TOKEN_TEXT, c.TOKEN_VAR,
       c.TOKEN_TEXT, c.TOKEN_VAR, c.TOKEN_TEXT, c.TOKEN_BLOCK, c.TOKEN_TEXT];

   assert.equal(tokenTypes.length, expectedTokenTypes.length);
   assert.deepEqual(tokenTypes, expectedTokenTypes);

   // FIXME more tests verifying that `contents` is correct too?
}

//start the test runner if we're called directly from command line
if (require.main == module.id) {
    system.exit(require('test').run(exports, arguments[1]));
}
