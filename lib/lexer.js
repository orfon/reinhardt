var c = require('./constants');
var $s = require('ringo/utils/strings');
var {Token} = require('./token');

/**
 * Lexer
 */
var Lexer = exports.Lexer = function(templateString, origin) {
   this.templateString = templateString;
   this.lineNo = 1;
   this.verbatim = false;
   this.origin = origin;
   return this;
}
/**
 * Return a list of tokens from a given template_string.
 */
Lexer.prototype.tokenize = function() {
   var inTag = false;
   var result = [];
   this.templateString.split(c.tagRe).forEach(function(bit) {
      if (bit) {
         result.push(this.createToken(bit, inTag));
      }
      inTag = !inTag;
   }, this);
   return result;
}
/**
 * Convert the given token string into a new Token object and return it.
 * If in_tag is True, we are processing something that matched a tag,
 * otherwise it should be treated as a literal string.
 */
Lexer.prototype.createToken = function(tokenString, inTag) {
   var blockContent = tokenString.substring(2, tokenString.length-2).trim();
   if (inTag && $s.startsWith(tokenString, c.BLOCK_TAG_START)) {
      if (this.verbatim && blockContent == this.verbatim) {
         this.verbatim = false;
      }
   }
   var token = null;
   if (inTag && !this.verbatim) {
      if ($s.startsWith(tokenString, c.VARIABLE_TAG_START)) {
         token = new Token(c.TOKEN_VAR, blockContent);
      } else if ($s.startsWith(tokenString, c.BLOCK_TAG_START)) {
         if (['verbatim', 'verbatim '].indexOf(blockContent.substring(0, 9)) > -1) {
            this.verbatim = 'end' + blockContent;
         }
         token = new Token(c.TOKEN_BLOCK, blockContent);
      } else if ($s.startsWith(tokenString, c.COMMENT_TAG_START)) {
         token = new Token(c.TOKEN_COMMENT, '');
      }
   } else {
      token = new Token(c.TOKEN_TEXT, tokenString);
   }
   token.lineNo = this.lineNo;
   this.lineNo += $s.count(tokenString, '\n');
   return token;
}

