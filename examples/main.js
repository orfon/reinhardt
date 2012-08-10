var {renderResponse} = require('reinhardt');

var context = {
   links: [
      ['Main', '/'],
      ['Discovery of Jazz', './discoveryofjazz.html'],
      ['Youth & Early Life', './earlylife.html'],
      ['World War II', './worldwar2.html']
   ],
   djangoImage: require('ringo/base64').encode(require('fs').read(module.resolve('./static/django-reinhardt.jpg'), {binary: true}))
}

exports.app = function(req) {
   var templateName = req.pathInfo.split('/').slice(1)[0] || 'base.html';
   return renderResponse(templateName, context);
};

if (require.main == module) {
   var {Loader} = require('reinhardt/loaders/filesystem');
   var templateLoader = new Loader([module.resolve('./templates/'), module.resolve('./templates2')]);
   require('reinhardt').registerLoader(templateLoader);

   require("ringo/httpserver").main(module.id);
}
