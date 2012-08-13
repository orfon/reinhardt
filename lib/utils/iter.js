exports.cycle = function(values) {
   var idx = 0;
   while(true) {
      yield values[idx];
      idx++;
      if (idx == values.length) {
         idx = 0;
      }
   }
}