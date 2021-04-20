// NOTE this is like default_if_none in django
exports.defaultifnull = (value, arg) => {
    return (value === null) ? arg : value;
};

exports.default = (value, arg) => {
    return value || arg;
};

/**
 Given a string mapping values for true, false and (optionally) null,
 returns one of those strings according to the value:

 ==========  ======================  ==================================
 Value       Argument                Outputs
 ==========  ======================  ==================================
 ``True``    ``"yeah,no,maybe"``     ``yeah``
 ``False``   ``"yeah,no,maybe"``     ``no``
 ``null``    ``"yeah,no,maybe"``     ``maybe``
 ``null``    ``"yeah,no"``           ``"no"`` (converts null to False
 if no mapping for null is given.
 */
exports.yesno = (value, arg) => {
    arg = arg || 'yes,no,maybe';
    const bits = arg.split(',');
    if (bits.length < 2) {
        return value;
    }
    const [yes, no, maybe] = bits;
    if (value === null) {
        return maybe;
    } else if (value) {
        return yes;
    }
    return no;
};