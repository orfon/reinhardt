var {NodeList} = require("./nodelist");

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

var Node = exports.Node = function() {
    return this;
};

Node.prototype.getByType = function(type) {
   var nodes = [];
   if (this instanceof type) {
      nodes.push(this);
   }
   for each (let value in this) {
       if (value instanceof NodeList) {
          nodes.push.apply(nodes, value.getByType(type));
       }
   }
   return nodes;
};

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
   var output = this.filterExpression.resolve(context);
   return context.renderValue(output);
}
VariableNode.prototype.getByType = Node.prototype.getByType;
