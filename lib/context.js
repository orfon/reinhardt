var Context = exports.Context = function(dict) {
   this.dicts = [dict];
   return this;
}

Context.prototype.push = function() {
   var d = {};
   this.dicts.push(d);
   return d;
}

Context.prototype.pop = function() {
   if (this.dicts.length == 1) {
      throw new Error('pop() more often called then push()');
   }
   return this.dicts.pop();
}

// not __getitem__
Context.prototype.get = function(key, otherwise) {
   var d = this.dicts[this.dicts.length-1];
   if (key in d) {
      return d[key];
   }
   return otherwise;
}

Context.prototype.set = function(key, value) {
   this.dicts[this.dicts.length-1][key] = value;
}