var {tokenKwargs} = require('../token');
var {getTemplate} = require('../loader');
var {Context} = require('../context');

var IncludeNode = function(templatePath, extraContext, isolatedContext) {
   this.extraContext = extraContext;
   this.isolatedContext = isolatedContext;
   this.templatePath = templatePath;
   return this;
}
IncludeNode.prototype.render = function(context) {
   if (typeof(this.templatePath) === 'string') {
      var templateName = this.templatePath;
   } else {
      var templateName = this.templatePath.resolve(context);
   }
   var template = getTemplate(templateName);
   // render
   var values = {};
   for (var key in this.extraContext) {
      values[key] = this.extraContext[key].resolve(context);
   }
   if (this.isolatedContext) {
      return template.render(new Context(values));
   }
   context.update(values);
   var output = template.render(context);
   context.pop();
   return output;
}


/**
    Loads a template and renders it with the current context. You can pass
    additional context using keyword arguments.

    Example::

        {% include "foo/some_include" %}
        {% include "foo/some_include" with bar="BAZZ!" baz="BING!" %}

    Use the ``only`` argument to exclude the current context when rendering
    the included template::

        {% include "foo/some_include" only %}
        {% include "foo/some_include" with bar="1" only %}
 */

exports.include = function(parser, token) {
   var bits = token.splitContents();
   if (bits.length < 2) {
      throw new Error('include tag takes at least one argument: the name of the template to be included');
   }
   var options = {};
   var remainingBits = bits.slice(2);
   while (remainingBits.length > 0) {
      var option = remainingBits.shift();
      if (option in options) {
         throw new Error('"' + option +'" was specified more than once');
      }
      if (option == 'with') {
         var value = tokenKwargs(remainingBits, parser);
         if (Object.keys(value).length <= 0) {
            throw new Error('"with in include tags needs at least one arguments.')
         }
      } else if (option == 'only') {
         var value = true;
      } else {
         throw new Error('Unknown argument for include tag: "'+ option +'"')
      }
      options[option] = value;
   }
   var isolatedContext = options.only || false;
   var extraContext = options.with || {};
   var path = bits[1];
   if ( ['"', "'"].indexOf(path[0]) > -1 && path.slice(-1) === path[0]) {
      return new IncludeNode(path.slice(1, -1), extraContext, isolatedContext);
   }
   return new IncludeNode(parser.compileFilter(path), extraContext, isolatedContext);
}