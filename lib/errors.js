var {escape} = require('./utils/html');

// I would want this to work with JsgiServlet's default error handling, but
// don't see how I can extend RhinoException

var TemplateSyntaxError = exports.TemplateSyntaxError = function(message) {
   Error.apply(this, arguments);
   this.name = "TemplateSyntaxError";
   this.message = message;
   return this;
}

TemplateSyntaxError.prototype = new Error();
TemplateSyntaxError.prototype.constructor = TemplateSyntaxError;

var TemplateDoesNotExist = exports.TemplateDoesNotExist = function(message) {
   Error.apply(this, arguments);
   this.name = "TemplateDoesNotExist";
   this.message = this.message;
   return this;
}

TemplateDoesNotExist.prototype = new Error();
TemplateDoesNotExist.prototype.constructor = TemplateDoesNotExist;
