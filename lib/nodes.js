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
const TextNode = exports.TextNode = function(text) {
    Object.defineProperties(this, {
        text: {value: text}
    });
    return this;
};
TextNode.prototype = Object.create(Node.prototype);
TextNode.prototype.constructor = TextNode;

TextNode.prototype.render = function(context) {
    return this.text;
};

/**
 *
 */
const VariableNode = exports.VariableNode = function(filterExpression) {
    Object.defineProperties(this, {
        filterExpression: {value: filterExpression}
    });
    return this;
};
VariableNode.prototype = Object.create(Node.prototype);
VariableNode.prototype.constructor = VariableNode;

VariableNode.prototype.render = function(context) {
    const output = this.filterExpression.resolve(context);
    return context.renderValue(output);
};
