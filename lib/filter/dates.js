var $d = require('ringo/utils/dates');

exports.date = function(value, arg) {
   var format = arg || 'YYY-mm';
   return $d.format(value, format);
}
