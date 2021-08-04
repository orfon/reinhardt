const assert = require("assert");
const {Context} = require("../lib/context");
const {Reinhardt} = require("../lib/reinhardt");
const {Template} = require("../lib/template");
const CacheLoader = require("../lib/loaders/cached").Loader;
const FsLoader = require("../lib/loaders/filesystem").Loader;

exports.testExtendNormal = () => {
    const env = new Reinhardt({
        loader: [module.resolve("./templatedir/recursive/fs")]
    });
    const template = env.getTemplate("one.html");
    assert.strictEqual(template.render().trim(), "three two one");
};

exports.testExtendRecursive = () => {
    const env = new Reinhardt({
        loader: [
            module.resolve("./templatedir/recursive/fs"),
            module.resolve("./templatedir/recursive/fs2"),
            module.resolve("./templatedir/recursive/fs3"),
        ]
    });
    const template = env.getTemplate("recursive.html");
    assert.strictEqual(template.render().trim(), "fs3/recursive fs2/recursive fs/recursive");
};

exports.testExtendMissing = () => {
    const env = new Reinhardt({
        loader: [module.resolve("./templatedir/recursive/fs")]
    });
    const template = env.getTemplate("extend-missing.html");
    assert.throws(() => template.render());
};

exports.testExtendSelf = () => {
    const env = new Reinhardt({
        loader: [module.resolve("./templatedir/recursive/fs")]
    });
    const template = env.getTemplate("self.html");
    assert.throws(() => template.render());
};

/* TODO
exports.testExtendCached = () => {
    const env = new Reinhardt({
        loader: new CacheLoader(
            new FsLoader([
                module.resolve("./templatedir/recursive/fs"),
                module.resolve("./templatedir/recursive/fs2"),
                module.resolve("./templatedir/recursive/fs3"),
            ])
        )
    });
    const template = env.getTemplate("recursive.html");
    assert.strictEqual(template.render().trim(), "fs3/recursive fs2/recursive fs/recursive");
};
*/

exports.testBlockOverrideInExtendedIncludedTemplate = () => {
    const env = new Reinhardt({
        loader: [
            module.resolve("./templatedir/recursive/block-override/fs"),
            module.resolve("./templatedir/recursive/block-override/fs2")
        ]
    });
    const template = env.getTemplate("base.html");
    assert.strictEqual(template.render().trim(), "12AB");
};

//start the test runner if we're called directly from command line
if (require.main == module.id) {
    require("system").exit(require("test").run(exports, arguments[1]));
}
