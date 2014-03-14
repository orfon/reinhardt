How undefined variables are handled
=============================

Generally, if a variable is not defined, the template system inserts the
value of the `stringIfUndefined` setting, which is set to
`''` (the empty string) by default.

Filters that are applied to an undefined variable will only be applied if 
`stringIfUndefined` is set to `''` (the empty string). If
`stringIfUndefined` is set to any other value, variable
filters will be ignored.

This behavior is slightly different for the `if` and `for`
template tags. If an undefined variable is provided to one of these template 
tags, the variable will be interpreted as `undefined`. Filters are always 
applied to undefined variables within these template tags.

If `stringIfUndefined` contains a `'%s'`, the format marker will
be replaced with the name of the invalid variable.
