var TemplateSyntaxError = exports.TemplateSyntaxError = function(message) {
   this.name = "TemplateSyntaxError";
   this.message = message || "an error occured";
}

TemplateSyntaxError.prototype = new Error();
TemplateSyntaxError.prototype.constructor = TemplateSyntaxError;

var TemplateDoesNotExist = exports.TemplateDoesNotExist = function(message) {
   this.name = "TemplateDoesNotExist";
   this.message = message || "an error occured";
}

TemplateDoesNotExist.prototype = new Error();
TemplateDoesNotExist.prototype.constructor = TemplateDoesNotExist;