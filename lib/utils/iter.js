const Cycle = function(values) {
   let index = 0;
   Object.defineProperties(this, {
      next: {value: () => values[index++ % values.length]}
   });
   return this;
};

exports.cycle = function(values) {
   return new Cycle(values);
}