var $d = require('ringo/utils/dates');

exports.date = function(value, arg) {
   if (value == undefined) {
      return '';
   }
   if (!isNaN(value)) {
      value = new Date(value);
   } else if (typeof(value) === 'string') {
      value = $d.parse(value);
   }
   if ( ((value instanceof Date) === false
            && (value instanceof java.util.Date) == false
         ) || value + '' === 'Invalid Date') {
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
