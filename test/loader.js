var assert = require('assert');
var loader = require('../lib/loader');
var {Context} = require('../lib/context');

exports.tearDown = function() {
   loader.reset();
}

var MockLoader = function() {
   this.templateAccess = {
      'foo': 0,
      'bar': 0
   }
   this.loadTemplateSource = function(templateName) {
      if (!templateName in this.templateAccess) {
         return null;
      }
      this.templateAccess[templateName]++;
      return templateName;
   }

   this.reset = function() {
      for (var key in this.templateAccess) {
         this.templateAccess[key] = 0;
      }
   }
   return this;
}

var c = new Context({});

exports.testLoaderOrderA = function() {
   var FsLoader = require('../lib/loaders/filesystem').Loader;
   var fsReader = new FsLoader(module.resolve('./templatedir/bar/'),
                               module.resolve('./templatedir/foo/'));
   loader.register(fsReader);
   assert.equal(loader.getTemplate('test.html').render(c), 'bar');
   assert.equal(loader.getTemplate('baz/test.html').render(c), 'baz');
}

exports.testLoaderOrderB = function() {
   var FsLoader = require('../lib/loaders/filesystem').Loader;
   var fsLoader = new FsLoader(module.resolve('./templatedir/foo/'),
                               module.resolve('./templatedir/bar/'));
   loader.register(fsLoader);
   assert.equal(loader.getTemplate('test.html').render(c), 'foo');
   assert.equal(loader.getTemplate('baz/test.html').render(c), 'baz');
}

// does it return the same as raw filesystem loader?
exports.testCachedLoader = function() {
   var FsLoader = require('../lib/loaders/filesystem').Loader;
   var fsLoader = new FsLoader(module.resolve('./templatedir/foo/'),
                              module.resolve('./templatedir/bar/'));
   var CachedLoader = require('../lib/loaders/cached').Loader;
   var cachedLoader = new CachedLoader(fsLoader)
   loader.register(cachedLoader);
   assert.equal(loader.getTemplate('test.html').render(c), 'foo');
   assert.equal(loader.getTemplate('baz/test.html').render(c), 'baz');
}

// does it cache?
exports.testCacheLoaderCaching = function() {
   var mockLoader = new MockLoader();
   var CachedLoader = require('../lib/loaders/cached').Loader;
   var cachedLoader = new CachedLoader(mockLoader);
   loader.register(cachedLoader);
   assert.equal(loader.getTemplate('foo').render(c), 'foo');
   // one access to foo template
   assert.equal(mockLoader.templateAccess.foo, 1);
   // try again
   assert.equal(loader.getTemplate('foo').render(c), 'foo');
   // still only one access
   assert.equal(mockLoader.templateAccess.foo, 1);
   // same for bar
   assert.equal(loader.getTemplate('bar').render(c), 'bar');
   assert.equal(loader.getTemplate('bar').render(c), 'bar');
   assert.equal(mockLoader.templateAccess.bar, 1);
   // unless we call reset
   cachedLoader.reset();
   assert.equal(loader.getTemplate('bar').render(c), 'bar');
   assert.equal(mockLoader.templateAccess.bar, 2);
}

//start the test runner if we're called directly from command line
if (require.main == module.id) {
    system.exit(require('test').run(exports, arguments[1]));
}
