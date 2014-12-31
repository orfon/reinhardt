var {Reinhardt} = require('reinhardt');
var {Loader} = require('reinhardt/loaders/filesystem');
var {Application} = require('stick');

var app = exports.app = Application();
// for easier template debugging put "reinhardt" as the first middleware:
app.configure(require('reinhardt'), "route");

var context = {
   links: [
      ['Main', '/'],
      ['Error page for TemplateSyntaxError', './discoveryofjazz.html'],
      ['Youth & Early Life', './earlylife.html'],
   ],
   djangoImage: require('ringo/base64').encode(require('fs').read(module.resolve('./static/django-reinhardt.jpg'), {binary: true}))
}

var templates = new Reinhardt({
   loader: new Loader(module.resolve('./templates/'), module.resolve('./templates2'))
});

app.get('/', function() {
   return templates.renderResponse('base.html', context);
});

app.get('/discoveryofjazz.html', function() {
   var {TemplateSyntaxError} = require('reinhardt/errors')
   return templates.renderResponse('discoveryofjazz.html', context);
});

app.get('/earlylife.html', function() {
   return templates.renderResponse('earlylife.html', context);
});

if (require.main == module) {
   require("ringo/httpserver").main(module.id);
}
