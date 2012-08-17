var $d = require('ringo/utils/dates');

exports.date = function(value, arg) {
   if (!value) {
      return '';
   }
   var format = arg || 'YYY-mm';
   try {
      var result = $d.format(value, format);
      // FIXME only catch certain exceptions - e.g. don't catch
      // exceptions which have to do with formatting errors
   } catch (e) {
      return '';
   }
   return result;
}
