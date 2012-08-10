var {conditionalEscape} = require('../utils/html');
var {markSafe} = require('../utils');

exports.join = function(value, arg, autoescape) {
   if (autoescape) {
      value = value.map(conditionalEscape)
   }
   try {
      var data = value.join(conditionalEscape(arg));
   } catch (e) {
      return value;
   }
   return markSafe(data);
};
exports.join.isSafe = true;
exports.join.needsAutoescape = true;

exports.slice = function(value, arg) {
   var bits = arg.split(':');
   return value.slice.apply(value, bits);
};
exports.slice.isSafe = true;

exports.length = function(value) {
   if (value instanceof Array || typeof(value) === 'string' || value instanceof String) {
      return value.length;
   }
   return '';
};
exports.length.isSafe = true;

exports.length_is = function(value, arg){
   var len = parseInt(arg);
   if (isNaN(len)) {
      return '';
   }
   if (value instanceof Array || typeof(value) === 'string' || value instanceof String) {
      return value.length === len;
   }
   return '';

};
exports.length_is.isSafe = false;