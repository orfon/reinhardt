var SimpleNode = function(val) {
   this.value = val;
   return this;
}
SimpleNode.prototype.render = function(context) {
   return this.value;
}
SimpleNode.prototype.getByType = function() {
   return [];
}
exports.echo = function(parser, token) {
   var val = token.splitContents().slice(1).join(' ');
   return new SimpleNode(val);
}

exports.other_echo = exports.echo;
exports.echo2 = exports.echo;