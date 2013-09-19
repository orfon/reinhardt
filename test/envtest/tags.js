/**
 * outputs the "foo" property of the environment
 */
var EchoFooNode = function(val) {
   this.value = val;
   return this;
}
EchoFooNode.prototype.render = function(context) {
   return markSafe(this.env.config.foo);
}
EchoFooNode.prototype.getByType = function() {
   return [];
}
exports.echofoo = function(parser, token) {
   return new EchoFooNode();
}
