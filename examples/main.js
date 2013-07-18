var {Environment} = require('reinhardt');
var {Application} = require('stick');

var app = exports.app = Application();
app.configure(require("reinhardt/middleware"), "route");

var context = {
   links: [
      ['Main', '/'],
      ['Error page for TemplateSyntaxError', './discoveryofjazz.html'],
      ['Youth & Early Life', './earlylife.html'],
   ],
   djangoImage: require('ringo/base64').encode(require('fs').read(module.resolve('./static/django-reinhardt.jpg'), {binary: true}))
}

var env = new Environment({
   loader: [module.resolve('./templates/'), module.resolve('./templates2')],
   debug: true
});

app.get('/', function() {
   return env.renderResponse('base.html', context);
});

app.get('/discoveryofjazz.html', function() {
   var {TemplateSyntaxError} = require('reinhardt/errors')
   return env.renderResponse('discoveryofjazz.html', context);
});

app.get('/earlylife.html', function() {
   return env.renderResponse('earlylife.html', context);
});

if (require.main == module) {
   require("ringo/httpserver").main(module.id);
}