const {TemplateSyntaxError} = require('./errors');

/**
 *
 see
 http://effbot.org/zone/simple-top-down-parsing.htm

 http://javascript.crockford.com/tdop/tdop.html
 */

const TokenBase = function() {};
TokenBase.prototype.toString = function() {
   const out = [this.id, this.first, this.second].map(function(prop) {
      return prop && prop.toString();
   }, this).filter(function(prop) {
      return prop;
   }, this);
   return "(" + out.join(" ") + ")";
};

/**
  Infix
 */
const InfixOperator = function(bp, func) {
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
};

const infix = function(bp, func) {
   return (function infixFactory() {
      const infixOperator = new InfixOperator(bp, func);
      infixOperator.id = infixFactory.id;
      return infixOperator;
   });
};

/**
 Prefix
 */
const PrefixOperator = function(bp, func) {
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
PrefixOperator.prototype.led = function() {
   throw new TemplateSyntaxError('Not expecting "' + this.id + '" as infix operator in iftag');
};
PrefixOperator.prototype.eval = function(context) {
  try {
      return this.func(context, this.first);
  } catch (e) {
      return false;
  }
};

const prefix = function(bp, func) {
   return (function prefixFactory() {
      const prefixOperator = (new PrefixOperator(bp, func));
      prefixOperator.id = prefixFactory.id;
      return prefixOperator;
   });
};

const OPERATORS = {
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
      const yEvaled = y.eval(context);
      return !!(yEvaled && yEvaled.indexOf(x.eval(context)) > -1);
   }),
   'not in': infix(9, function(context, x, y) {
      const yEvaled = y.eval(context);
      return !!(yEvaled && yEvaled.indexOf(x.eval(context)) === -1);
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
   '<=': infix(10, function(context, x, y) {
      return x.eval(context) <= y.eval(context);
   }),
};

for (let key in OPERATORS) {
   OPERATORS[key].id = key;
}

const Literal = exports.Literal = function(value) {
   this.id = 'literal';
   this.value = value;
   this.lbp = 0;
   return this;
};
Literal.prototype.toString = function() {
   return "(" + this.id + " " + this.value + ")"
};
Literal.prototype.display = function() {
   return this.value.toString();
};
Literal.prototype.nud = function(parser) {
   return this;
};
Literal.prototype.eval = function(context) {
   return this.value;
};

const EndToken = function() {
   this.lbp = 0;

};
EndToken.prototype.nud = function(parser) {
   throw new TemplateSyntaxError('Unexpected end of expression in "if" tag');
};

const endToken = new EndToken();

/**
 * IfParser
 */
const IfParser = exports.IfParser = function(tokens, createVar) {
   const len = tokens.length;
   // pre-pass necessary to turn  'not','in' into single token
   let i = 0;
   const mappedTokens = [];
   while (i < len) {
      let token = tokens[i];
      if (token === 'not' && i + 1 < len && tokens[i+1] === 'in') {
         token = 'not in';
         i += 1; // skip 'in'
      }
      let translated = this.translateToken(token);
      mappedTokens.push(translated);
      i++;
   }
   this.tokens = mappedTokens;
   this.pos = 0;
   this.currentToken = this.nextToken();
   return this;
};

IfParser.prototype.translateToken = function(token) {
   const op = OPERATORS[token];
   if (op === undefined) {
      return this.createVar(token);
   }
   return op();
};

IfParser.prototype.nextToken = function() {
   if (this.pos >= this.tokens.length) {
      return endToken;
   } else {
      const retVal = this.tokens[this.pos];
      this.pos += 1;
      return retVal;
   }
};

IfParser.prototype.parse = function() {
   const retVal = this.expression();
   if (this.currentToken !== endToken) {
      throw new TemplateSyntaxError('Unused "' + this.currentToken + '" at end of if expression.');
   }
   return retVal;
};

IfParser.prototype.expression = function(rbp) {
   if (rbp === undefined) {
      rbp = 0;
   }
   let t = this.currentToken;
   this.currentToken = this.nextToken();
   let left = t.nud(this);
   while (rbp < this.currentToken.lbp) {
      t = this.currentToken;
      this.currentToken = this.nextToken();
      left = t.led(left, this);
   }
   return left;
};

IfParser.prototype.createVar = function(value) {
   return new Literal(value);
};