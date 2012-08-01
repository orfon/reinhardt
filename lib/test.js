var {Template} = require('./template');
var {Context} = require('./context');

var tpl = "{% ifequal user.id book.author %} \n\
            {{'Its really him!!'|upper}} \n\
            {% else %} \n\
            {{foo.bar|dateFormat:'yyyy'}} \n\
            {% endifequal %}";
var context = new Context({
   user: {
      id: 1
   },
   book: {
      author: 2
   },
   itshim: "Yeah, it's him!",
   foo: {
      bar: new Date()
   }
});

var t = new Template(tpl);

console.dir(t.nodeList.contents[0]);
print (t.render(context));
