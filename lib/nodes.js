var {NodeList} = require("./nodelist");

// augment adds Function.prototype.augment
require('augment');

var Node = exports.Node = Object.augment(function() {
   this.mustBeFirst = false;
   this.constructor = function() {
      return this;
   },
   /**
    * Return all nodes below this node which hava the
    * given type. Note how we do an instanceof test on
    * every property of the node to detect NodeLists.
    * Some nodes have multiple nodelists, like the {% if %}
    * tag, which has one nodelist for the True path, one
    * for False, and potentially even more if it as {% elif %}
    * blocks. It's either this, or each node must
    * keep a list of properties holding a nodelist in something
    * like `Node.childLists`.
    */
   this.getByType = function(type) {
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
   }
});

/**
 *
 */
var TextNode = exports.TextNode = Node.augment(function() {
   this.constructor = function(s) {
      this.s = s;
      return this;
   },
   this.render = function(context) {
      return this.s;
   }
});

/**
 *
 */
var VariableNode = exports.VariableNode = Node.augment(function() {
   this.constructor = function(filterExpression) {
      this.filterExpression = filterExpression;
      return this;
   },
   this.render = function(context) {
      var output = this.filterExpression.resolve(context);
      return context.renderValue(output);
   }
});
