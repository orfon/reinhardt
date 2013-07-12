var {Environment} = require('reinhardt');

var context = {
   links: [
      ['Main', '/'],
      ['Error page for TemplateSyntaxError', './discoveryofjazz.html'],
      ['Youth & Early Life', './earlylife.html'],
      ['World War II', './worldwar2.html']
   ],
   djangoImage: require('ringo/base64').encode(require('fs').read(module.resolve('./static/django-reinhardt.jpg'), {binary: true}))
}

var env = new Environment({
   loader: [module.resolve('./templates/'), module.resolve('./templates2')],
});
env.DEBUG = true;

exports.app = function(req) {
   var templateName = req.pathInfo.split('/').slice(1)[0] || 'base.html';
   try {
      return env.renderResponse(templateName, context);
   } catch (e) {
      return e;
   }
};

if (require.main == module) {
   require("ringo/httpserver").main(module.id);
}
