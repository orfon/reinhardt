var {conditionalEscape} = require('../utils/html');
var {markSafe} = require('../utils');

exports.join = function(value, arg, autoescape) {
   var originalValue = value;
   if (autoescape) {
      value = value.map(conditionalEscape)
   }
   try {
      var data = value.join(conditionalEscape(arg));
   } catch (e) {
      return originalValue;
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

exports.sortByKey = function(value, arg) {
   if (!arg || !(value instanceof Array)) {
      return value;
   }
   return value.sort(function(a, b) {
      if (a[arg] > b[arg]) {
         return -1;
      } else if (a[arg] < b[arg]) {
         return 1;
      }
      return 0;
   });
}
exports.sortByKey.isSafe = true;

exports.first = function(value) {
   if (value instanceof Array) {
      return value[0];
   }
   return '';
}
exports.first.isSafe = false;


exports.last = function(value) {
   if (value instanceof Array) {
      return value.slice(-1)[0];
   }
   return '';
}
exports.last.isSafe = true;
