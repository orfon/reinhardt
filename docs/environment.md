Reinhardt environment
===================

This document describes the Reinhardt environment.

Basics
------

Reinhardt uses a central object called a template environment. Instances of this class are used to store the configuration and global objects, and are used to load templates from the file system. Even if you are creating templates from strings by using the constructor of Template class, an environment is created automatically for you, albeit a shared one.

Most applications will create one Reinhardt environment object on application initialization and use that to load templates. In some cases it’s however useful to have multiple environments side by side, if different configurations are in use.

The simplest way to configure a Reinhardt environment to load templates for your application looks roughly like this:

    var {Reinhardt} = require('reinhardt');
    var reinhardt = new Reinhardt({
		loader: module.resolve('./templates/')
    });

This will create a Reinhardt environment with the default settings and a loader that looks up the templates in the templates folder inside the "./templates/" directory relative to the module containing this code. You can also write your own if you want to load templates from a database or other resources.

To load a template from this environment you just have to call the `getTemplate()` method which then returns the loaded Template:

	template = reinhardt.getTemplate('mytemplate.html')

To render it with some variables, just call the `render()` method:

	template.render({'foo': 'bar'})

To return a JSGI 200 response with the rendred template as the response body, call the `renderResponse` method:

	template.renderResponse({'foo': 'bar'})

Using a template loader rather then passing strings to Template has multiple advantages. Besides being a lot easier to use it also enables template inheritance.

Supported options
----------

An environment holds the shared configuration for all templates loaded through that environment.
Modifying an environment after templates where loaded will lead to surprising effects and undefined behaviour.

<dl>
<dt>debug</dt>
<dd>(boolean) whether detailed error messages are enabled or not. Debug rendering uses a different parser and lexer which can be significantly slower then the normal code path.</dd>
<dt>loader</dt>
<dd>(Array|Object) the tepmlate loader(s) for this environment.</dd>
<dt>filters</dt>
<dd>(Array|Object) an array of modules. The exported properites are added as filters for all templates in this environemnt.</dd>
<dt>tags</dt>
<dd>(Array|Object) an array of modules. The exported properites are added as tags for all templates in this environemnt.</dd>
<dt>stringIfUndefined</dt>
<dd>By default, undefined values in a template are not output. Set this to a string
of your liking to make undefined values visible.</dd>
</dl>

If you pass additional properties to the `Reinhardt` constructor, those will be available on the `config` Object of the environment. This can be useful for custom tags or filters which need global configuration.