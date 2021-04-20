const {NodeList} = require("./nodelist");

/*
interface only, no extend

const Node = exports.Node = function() {

   return this;
}
Node.prototype.mustBeFirst = false;
Node.prototype.childNodeLists = ['nodelist'];

Node.prototype.render = function() {
   return;
}
*/

const Node = exports.Node = function() {
    return this;
};

Node.prototype.getByType = function(type) {
   const nodes = [];
   if (this instanceof type) {
      nodes.push(this);
   }
   Object.keys(this).forEach(key => {
      const value = this[key];
      if (value instanceof NodeList) {
         nodes.push.apply(nodes, value.getByType(type));
      }
   });
   return nodes;
};

/**
 *
 */
const TextNode = exports.TextNode = function(s) {
   this.s = s;
   return this;
};
TextNode.prototype = Object.create(Node.prototype);
TextNode.prototype.constructor = TextNode;

TextNode.prototype.render = function(context) {
   return this.s;
};

/**
 *
 */
const VariableNode = exports.VariableNode = function(filterExpression) {
   this.filterExpression = filterExpression;
   return this;
};
VariableNode.prototype = Object.create(Node.prototype);
VariableNode.prototype.constructor = VariableNode;

VariableNode.prototype.render = function(context) {
   const output = this.filterExpression.resolve(context);
   return context.renderValue(output);
};
