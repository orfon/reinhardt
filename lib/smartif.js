var {TemplateSyntaxError} = require('./errors');

/**
 *
 see
 http://effbot.org/zone/simple-top-down-parsing.htm

 http://javascript.crockford.com/tdop/tdop.html
 */

var TokenBase = function() {};
TokenBase.prototype.toString = function() {
   var out = [this.id, this.first, this.second].map(function(prop) {
      return prop && prop.toString();
   }, this).filter(function(prop) {
      return prop;
   }, this);
   return "(" + out.join(" ") + ")";
};

/**
  Infix
 */
var InfixOperator = function(bp, func) {
   this.lbp = bp;
   this.first = null;
   this.second = null;
   this.func = func;
   return this;
};

InfixOperator.prototype.toString = TokenBase.prototype.toString;

InfixOperator.prototype.led = function(left, parser) {
   this.first = left;
   this.second = parser.expression(this.lbp);
   return this;
};

InfixOperator.prototype.eval = function(context) {
   try {
      return this.func(context, this.first, this.second);
   } catch (e) {
      /*
       Templates shouldn't throw exceptions when rendering.  We are
       most likely to get exceptions for things like {% if foo in bar
       %} where 'bar' does not support 'in', so default to False
      */
      return false;
   }
}

var infix = function(bp, func) {
   return (function infixFactory() {
      var infixOperator = (new InfixOperator(bp, func));
      infixOperator.id = infixFactory.id;
      return infixOperator;
   });
}

/**
 Prefix
 */
var PrefixOperator = function(bp, func) {
   this.lbp = bp;
   this.first = null;
   this.second = null;
   this.func = func;
   return this;
};

PrefixOperator.prototype.toString = TokenBase.prototype.toString;

PrefixOperator.prototype.nud = function(parser) {
   this.first = parser.expression(this.lbp);
   this.second = null;
   return this;
};
PrefixOperator.prototype.led = function(left, parser) {
   throw new TemplateSyntaxError('Not expecting "' + this.id + '" as infix operator in iftag');
}
PrefixOperator.prototype.eval = function(context) {
  try {
      return this.func(context, this.first);
  } catch (e) {
      return false;
  }
};
var prefix = function(bp, func) {
   return (function prefixFactory() {
      var prefixOperator = (new PrefixOperator(bp, func));
      prefixOperator.id = prefixFactory.id;
      return prefixOperator;
   });
}

var OPERATORS = {
   'or': infix(6, function(context, x, y) {
      return x.eval(context) || y.eval(context);
   }),
   'and': infix(7, function(context, x, y) {
      return x.eval(context) && y.eval(context);
   }),
   'not': prefix(8, function(context, x) {
      return !(x.eval(context));
   }),
   // FIXME i could make 'in' do actual in for objects
   //   and indexOf for arrays
   'in': infix(9, function(context, x, y) {
      var yEvaled = y.eval(context);
      return !!(yEvaled && yEvaled.indexOf(x.eval(context)) > -1);
   }),
   'not in': infix(9, function(context, x, y) {
      var yEvaled = y.eval(context);
      return !!(yEvaled && yEvaled.indexOf(x.eval(context)) == -1);
   }),
   '=': infix(10, function(context, x, y) {
      return x.eval(context) == y.eval(context);
   }),
   '==': infix(10, function(context, x, y) {
      return x.eval(context) == y.eval(context);
   }),
   /*
   '===': infix(10, function(context, x, y) {
      return x.eval(context) === y.eval(context);
   }),
   */
   '!=': infix(10, function(context, x, y) {
      return x.eval(context) != y.eval(context);
   }),
   '>': infix(10, function(context, x, y) {
      return x.eval(context) > y.eval(context);
   }),
   '<': infix(10, function(context, x, y) {
      return x.eval(context) < y.eval(context);
   }),
   '>=': infix(10, function(context, x, y) {
      return x.eval(context) >= y.eval(context);
   }),
   '<': infix(10, function(context, x, y) {
      return x.eval(context) < y.eval(context);
   }),
   '<=': infix(10, function(context, x, y) {
      return x.eval(context) <= y.eval(context);
   }),
};

for (var key in OPERATORS) {
   OPERATORS[key].id = key;
}

var Literal = exports.Literal = function(value) {
   this.id = 'literal';
   this.value = value;
   this.lbp = 0;
   return this;
}
Literal.prototype.toString = function() {
   return "(" + this.id + " " + this.value + ")"
}
Literal.prototype.display = function() {
   return this.value.toString();
}
Literal.prototype.nud = function(parser) {
   return this;
}
Literal.prototype.eval = function(context) {
   return this.value;
};

var EndToken = function() {
   this.lbp = 0;

}
EndToken.prototype.nud = function(parser) {
   throw new TemplateSyntaxError('Unexpected end of expression in "if" tag');
}
var endToken = new EndToken();

/**
 * IfParser
 */
var IfParser = exports.IfParser = function(tokens, createVar) {
   var len = tokens.length;
   // pre-pass necessary to turn  'not','in' into single token
   var i = 0;
   var mappedTokens = [];
   while (i < len) {
      var token = tokens[i];
      if (token === 'not' && i + 1 < len && tokens[i+1] == 'in') {
         token = 'not in';
         i += 1; // skip 'in'
      }
      var translated = this.translateToken(token);
      mappedTokens.push(translated);
      i++;
   }
   this.tokens = mappedTokens;
   this.pos = 0;
   this.currentToken = this.nextToken();
   return this;
}

IfParser.prototype.translateToken = function(token) {
   var op = OPERATORS[token];
   if (op === undefined) {
      return this.createVar(token);
   }
   return op();
}

IfParser.prototype.nextToken = function() {
   if (this.pos >= this.tokens.length) {
      return endToken;
   } else {
      var retVal = this.tokens[this.pos];
      this.pos += 1;
      return retVal;
   }
}

IfParser.prototype.parse = function() {
   var retVal = this.expression();
   if (this.currentToken != endToken) {
      throw new TemplateSyntaxError('Unused "' + this.currentToken + '" at end of if expression.');
   }
   return retVal;
}

IfParser.prototype.expression = function(rbp) {
   if (rbp === undefined) {
      rbp = 0;
   }
   var t = this.currentToken;
   this.currentToken = this.nextToken();
   var left = t.nud(this);
   while (rbp < this.currentToken.lbp) {
      t = this.currentToken;
      this.currentToken = this.nextToken();
      var left = t.led(left, this);
   }
   return left;
}

IfParser.prototype.createVar = function(value) {
   return new Literal(value);
}