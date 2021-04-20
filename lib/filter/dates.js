var dates = require('ringo/utils/dates');

exports.date = function(value, arg) {
   if (value === null || value === undefined) {
      return '';
   }
   if (!isNaN(value)) {
      value = new Date(value);
   } else if (typeof(value) === 'string') {
      value = dates.parse(value);
   }
   if ( (!(value instanceof Date) && !(value instanceof java.util.Date)) ||
           value + '' === 'Invalid Date') {
      return '';
   }
   const format = arg || 'MMM. d, yyyy';
   try {
      return dates.format(value, format);
   } catch (e) {
      return '';
   }
};
