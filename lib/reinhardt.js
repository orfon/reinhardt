var Template = exports.Template = require('./template').Template;
var Context = exports.Context = require('./context').Context;
exports.registerLoader = require('./loader').register;
var getTemplate = exports.getTemplate = require('./loader').getTemplate;

exports.renderResponse = function(templateName, context) {
   var t = getTemplate(templateName);
   return {
      status: 200,
      headers: {"Content-Type": "text/html; charset=utf-8"},
      body: [t.render(context)]
   };
}