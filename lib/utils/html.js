var {markSafe, isSafe} = require('../utils');

/*
 Returns the given text with ampersands, quotes and angle brackets encoded for use in HTML.
*/
var escape = exports.escape = function(text) {
   if (text === undefined) {
      return;
   }
   if (typeof(text) !== 'string' && ! (text instanceof String)) {
      if (text && typeof(text.toString) === 'function') {
         text = text.toString();
      } else {
         text = JSON.stringify(text);
      }
   }
   return markSafe(text.replace(/&/g, '&amp;').
      replace(/</g, '&lt;').
      replace(/>/g, '&gt;').
      replace(/"/g, '&quot;').
      replace(/'/g, '&#39;')
      );
};

/**
  Similar to escape(), except that it doesn't operate on pre-escaped strings.
 */
exports.conditionalEscape = function(text) {
   if (typeof(text) !== 'string' && ! (text instanceof String)) {
      if (text && typeof(text.toString) === 'function') {
         text = text.toString();
      } else {
         text = JSON.stringify(text);
      }
   }
   if (!isSafe(text)) {
      return escape(text);
   }
   return text;
}