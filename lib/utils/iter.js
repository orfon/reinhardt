const Cycle = function(values) {
   let index = 0;
   this.next = function() {
      return values[index++ % values.length];
   }
};

exports.cycle = function(values) {
   return new Cycle(values);
}