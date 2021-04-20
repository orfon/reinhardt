// I would want this to work with JsgiServlet's default error handling, but
// don't see how I can extend RhinoException

exports.TemplateSyntaxError = Error;

exports.TemplateDoesNotExist = Error;
