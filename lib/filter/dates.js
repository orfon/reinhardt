var $d = require('ringo/utils/dates');

exports.date = function(value, arg) {
   if (!value) {
      return '';
   }
   if (!isNaN(value)) {
      value = new Date(value);
   } else if (!(value instanceof Date)) {
      value = $d.parse(""+value);
   }
   if (!(value instanceof Date) || value + '' === 'Invalid Date') {
      return '';
   }
   var format = arg || 'MMM. d, yyyy';
   try {
      var result = $d.format(value, format);
   } catch (e) {
      return '';
   }
   return result;
}
