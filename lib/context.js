var $o = require('ringo/utils/objects');

var Context = exports.Context = function(dict, autoescape) {
   this.autoescape = autoescape === false ? false : true;
   this.dicts = [dict];
   this.renderContext = new RenderContext();
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

/**
Get a variable's value, starting at the current context and going upward
*/
Context.prototype.get = function(key, otherwise) {
   for (var i = this.dicts.length-1; i >= 0; i--) {
      if (key in this.dicts[i]) {
         return this.dicts[i][key];
      }
   }
   return otherwise;
}

Context.prototype.set = function(key, value) {
   this.dicts[this.dicts.length-1][key] = value;
}

Context.prototype.has = function(key) {
   return this.get(key) !== undefined;
}

Context.prototype.update = function(obj) {
   this.dicts.push(obj);
}

Context.prototype.new = function(dict) {
   return new Context(dict, this.autoescape);
}

/**
 *
 */
var RenderContext = function(dict) {
   this.dicts = [dict];
   return this;
}
RenderContext.prototype.push = Context.prototype.push;
RenderContext.prototype.pop = Context.prototype.pop;
RenderContext.prototype.set = Context.prototype.set;
RenderContext.prototype.has = Context.prototype.has;
RenderContext.prototype.get = function(key, otherwise) {
   var d = this.dicts[this.dicts.length-1];
   if (key in d) {
      return d[key];
   }
   return otherwise;
}