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