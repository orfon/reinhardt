const kwargRe = /(?:(\w+)=)?(.+)/;

// FIXME: apparently not used anywhere
const split = (/*String|RegExp?*/ splitter, /*Integer?*/ limit) => {
    splitter || (splitter = /\s+/g);
    if (!(splitter instanceof RegExp)) {
        splitter = new RegExp(splitter, "g");
    }
    if (!splitter.global) {
        throw new Error("You must use a globally flagged RegExp with split " + splitter);
    }
    splitter.lastIndex = 0; // Reset the global

    const parts = [];
    let lastIndex = 0;
    let i = 0;
    let part;
    while ((part = splitter.exec(this))) {
        parts.push(this.slice(lastIndex, splitter.lastIndex - part[0].length));
        lastIndex = splitter.lastIndex;
        if (limit && (++i > limit - 1)) {
            break;
        }
    }
    parts.push(this.slice(lastIndex));
    return parts;
};

const Token = exports.Token = function(tokenType, contents) {
    Object.defineProperties(this, {
        tokenType: {value: tokenType},
        // @@ should we trim or not?
        // current unit tests assume we do NOT trim
        contents: {value: "" + contents}
    })
    // FIXME: doesn't look like this is needed anywhere:
    // this.contents.split = split;
    return this;
};

Token.prototype.split = function() {
    return String.prototype.split.apply(this.contents, arguments);
};

Token.prototype.splitContents = function(limit) {
    const smart_split_re = /([^\s'"]*(?:(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')[^\s'"]*)+|\S+)/g;
    const bits = [];
    let i = 0;
    let bit;
    limit = limit || 999;
    while (i++ < limit && (bit = smart_split_re.exec(this.contents))) {
        bit = bit[0];
        if (bit.charAt(0) === '"' && bit.slice(-1) === '"') {
            bits.push('"' + bit.slice(1, -1).replace('\\"', '"').replace('\\\\', '\\') + '"');
        } else if (bit.charAt(0) === "'" && bit.slice(-1) === "'") {
            bits.push("'" + bit.slice(1, -1).replace("\\'", "'").replace('\\\\', '\\') + "'");
        } else {
            bits.push(bit);
        }
    }
    return bits;
};

/**
 A utility method for parsing token keyword arguments.

 :param bits: A list containing remainder of the token (split by spaces)
 that is to be checked for arguments. Valid arguments will be removed
 from this list.

 :returns: A dictionary of the arguments retrieved from the ``bits`` token
 list.

 There is no requirement for all remaining token ``bits`` to be keyword
 arguments, so the dictionary will be returned as soon as an invalid
 argument format is reached.
 */
exports.tokenKwargs = (bits, parser, support_legacy) => {
    if (!bits) {
        return {};
    }

    let match = kwargRe.exec(bits[0]);
    const kwargFormat = match && match[1];
    if (!kwargFormat && bits.length < 3) {
        return {};
    }
    const kwargs = {};
    while (bits.length) {
        match = kwargRe.exec(bits[0]);
        if (!match || !match[1]) {
            return kwargs;
        }
        let [_, key, value] = match;
        bits.shift();
        kwargs[key] = parser.compileFilter(value);
    }
    return kwargs;
};