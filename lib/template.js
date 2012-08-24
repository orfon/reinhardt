var $s = require('ringo/utils/strings');
var c = require('./constants');
var {Lexer} = require('./lexer');
var {Parser} = require('./parser');
var {Context} = require('./context');

var Template = exports.Template = function(templateString) {
   var lexer = new Lexer(templateString);
   var parser = new Parser(lexer.tokenize());
   this.nodeList = parser.parse();
   return this;
}

Template.prototype._render = function(context) {
   return this.nodeList.render(context).toString();
}

Template.prototype.render = function(context) {
   context = context || new Context();
   if (! (context instanceof Context)) {
      context = new Context(context);
   }
   context.renderContext.push();
   try {
      return this._render(context);
   }catch (e) {
      throw e;
   } finally {
      context.renderContext.pop();
   }
}