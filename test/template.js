var assert = require("assert");

var {Template} = require('../lib/template');
var {Context} = require('../lib/context');

var templateString = "<html>\n\
            {% ifequal user.name 'Django' %} \n\
            {{'Its really him!!'|upper}} \n\
            {% else %} \n\
            {{foo.bar|date:'yyyy'}} \n\
            {% endifequal %}\n\
            </html>";
var renderedString = "<html>\n\
             \n\
            ITS REALLY HIM!! \n\
            \n\
            </html>"
var context = new Context({
   user: {
      name: 'Django'
   },
   book: {
      author: 2
   },
   foo: {
      bar: new Date()
   }
});

exports.testTemplate = function() {
   var template = new Template(templateString);
   assert.strictEqual(template.render(context), renderedString)
}

//start the test runner if we're called directly from command line
if (require.main == module.id) {
    system.exit(require('test').run(exports, arguments[1]));
}
