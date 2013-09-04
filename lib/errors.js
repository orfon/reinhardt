var {escape} = require('./utils/html');

// I would want this to work with JsgiServlet's default error handling, but
// don't see how I can extend RhinoException

var TemplateSyntaxError = exports.TemplateSyntaxError = Error;

var TemplateDoesNotExist = exports.TemplateDoesNotExist = Error;
