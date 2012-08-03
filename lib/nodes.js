/*
interface only, no extend

var Node = exports.Node = function() {

   return this;
}
Node.prototype.mustBeFirst = false;
Node.prototype.childNodeLists = ['nodelist'];

Node.prototype.render = function() {
   return;
}
*/

var Node = exports.Node = function() {};
Node.prototype.getByType = function(type) {
   var nodes = [];
   if (this instanceof type) {
      nodes.push(this);
   }
   for (var key in this) {
      // FIXME either this or childNodeLists fuckery
      // I had a prettier solution but this.constructor.name is never set with my exports pattern
      if (key.indexOf('NodeList') > -1 || key.indexOf('nodeList') > -1) {
         nodes.push.apply(nodes, this[key].getByType(type));
      }
   }
   return nodes;
}

/**
 *
 */
var TextNode = exports.TextNode = function(s) {
   this.s = s;
   return this;
}
TextNode.prototype.render = function(context) {
   return this.s;
}
TextNode.prototype.getByType = Node.prototype.getByType;

/**
 *
 */
var VariableNode = exports.VariableNode = function(filterExpression) {
   this.filterExpression = filterExpression;
   return this;
}
VariableNode.prototype.render = function(context) {
   return this.filterExpression.resolve(context);
}
VariableNode.prototype.getByType = Node.prototype.getByType;
