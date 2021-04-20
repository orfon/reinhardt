const constants = require('./constants');
const strings = require('ringo/utils/strings');
const {Token} = require('./token');

/**
 * Lexer
 */
const Lexer = exports.Lexer = function(templateString, origin) {
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
   let inTag = false;
   const result = [];
   this.templateString.split(constants.tagRe).forEach(function(bit) {
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
   const blockContent = tokenString.substring(2, tokenString.length-2).trim();
   if (inTag && strings.startsWith(tokenString, constants.BLOCK_TAG_START)) {
      if (this.verbatim && blockContent === this.verbatim) {
         this.verbatim = false;
      }
   }
   let token = null;
   if (inTag && !this.verbatim) {
      if (tokenString.startsWith(constants.VARIABLE_TAG_START)) {
         token = new Token(constants.TOKEN_VAR, blockContent);
      } else if (tokenString.startsWith(constants.BLOCK_TAG_START)) {
         if (['verbatim', 'verbatim '].indexOf(blockContent.substring(0, 9)) > -1) {
            this.verbatim = 'end' + blockContent;
         }
         token = new Token(constants.TOKEN_BLOCK, blockContent);
      } else if (tokenString.startsWith(constants.COMMENT_TAG_START)) {
         token = new Token(constants.TOKEN_COMMENT, '');
      }
   } else {
      token = new Token(constants.TOKEN_TEXT, tokenString);
   }
   token.lineNo = this.lineNo;
   this.lineNo += strings.count(tokenString, '\n');
   return token;
}

