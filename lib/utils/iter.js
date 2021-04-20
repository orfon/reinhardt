exports.cycle = function(values) {
   let idx = 0;
   while (true) {
      yield values[idx];
      idx++;
      if (idx === values.length) {
         idx = 0;
      }
   }
}