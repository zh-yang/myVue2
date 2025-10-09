;(function (undefined) {
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("vue/src/main.js", Function("exports, require, module",
"var config     = require('./config'),\r\n\
    Seed       = require('./seed'),\r\n\
    directives = require('./directives'),\r\n\
    filters    = require('./filters'),\r\n\
    textParser  = require('./text-parser')\r\n\
\r\n\
var controllers = config.controllers,\r\n\
    datum       = config.datum,\r\n\
    api         = {},\r\n\
    reserved    = ['datum', 'controllers'],\r\n\
    booted      = false\r\n\
\r\n\
/*\r\n\
 *  Store a piece of plain data in config.datum\r\n\
 *  so it can be consumed by sd-data\r\n\
 */\r\n\
api.data = function (id, data) {\r\n\
    if (!data) return datum[id]\r\n\
    datum[id] = data\r\n\
}\r\n\
/*\r\n\
 *  Store a controller function in config.controllers\r\n\
 *  so it can be consumed by sd-controller\r\n\
 */\r\n\
api.controller = function (id, extensions) {\r\n\
    if (!extensions) return controllers[id]\r\n\
    controllers[id] = extensions\r\n\
}\r\n\
/*\r\n\
 *  Allows user to create a custom directive\r\n\
 */\r\n\
api.directive = function (name, fn) {\r\n\
    if (!fn) return directives[name]\r\n\
    directives[name] = fn\r\n\
}\r\n\
/*\r\n\
 *  Allows user to create a custom filter\r\n\
 */\r\n\
api.filter = function (name, fn) {\r\n\
    if (!fn) return filters[name]\r\n\
    filters[name] = fn\r\n\
}\r\n\
/*\r\n\
 *  Bootstrap the whole thing\r\n\
 *  by creating a Seed instance for top level nodes\r\n\
 *  that has either sd-controller or sd-data\r\n\
 */\r\n\
api.bootstrap = function (opts) {\r\n\
    if (booted) return\r\n\
    if (opts) {\r\n\
        config.prefix = opts.prefix || config.prefix\r\n\
        for (var key in opts) {\r\n\
            if (reserved.indexOf(key) === -1) {\r\n\
                config[key] = opts[key]\r\n\
            }\r\n\
        }\r\n\
    }\r\n\
    textParser.buildRegex()\r\n\
    var el,\r\n\
        ctrlSlt = '[' + config.prefix + '-controller]',\r\n\
        dataSlt = '[' + config.prefix + '-data]',\r\n\
        seeds   = []\r\n\
    /* jshint boss: true */\r\n\
    while (el = document.querySelector(ctrlSlt) || document.querySelector(dataSlt)) {\r\n\
        seeds.push((new Seed(el)).scope)\r\n\
    }\r\n\
    booted = true\r\n\
    return seeds.length > 1 ? seeds : seeds[0]\r\n\
}\r\n\
\r\n\
module.exports = api\r\n\
//@ sourceURL=vue/src/main.js"
));
require.register("vue/src/config.js", Function("exports, require, module",
"module.exports = {\r\n\
    prefix      : 'sd',\r\n\
    debug       : false,\r\n\
    datum       : {},\r\n\
    controllers : {},\r\n\
\r\n\
    interpolateTags : {\r\n\
        open  : '{{',\r\n\
        close : '}}'\r\n\
    },\r\n\
\r\n\
    log: function (msg) {\r\n\
        if (this.debug) console.log(msg)\r\n\
    },\r\n\
    \r\n\
    warn: function(msg) {\r\n\
        if (this.debug) console.warn(msg)\r\n\
    }\r\n\
}//@ sourceURL=vue/src/config.js"
));
require.register("vue/src/utils.js", Function("exports, require, module",
"var Emitter       = require('./Emitter'),\r\n\
    toString      = Object.prototype.toString,\r\n\
    aproto        = Array.prototype,\r\n\
    arrayMutators = ['push','pop','shift','unshift','splice','sort','reverse']\r\n\
\r\n\
var arrayAugmentations = {\r\n\
    remove: function (index) {\r\n\
        if (typeof index !== 'number') index = index.$index\r\n\
        this.splice(index, 1)\r\n\
    },\r\n\
    replace: function (index, data) {\r\n\
        if (typeof index !== 'number') index = index.$index\r\n\
        this.splice(index, 1, data)\r\n\
    }\r\n\
}\r\n\
\r\n\
/*\r\n\
 *  get accurate type of an object\r\n\
 */\r\n\
function typeOf (obj) {\r\n\
    return toString.call(obj).slice(8, -1)\r\n\
}\r\n\
\r\n\
/*\r\n\
 *  Recursively dump stuff...\r\n\
 */\r\n\
function dumpValue (val) {\r\n\
    var type = typeOf(val)\r\n\
    if (type === 'Array') {\r\n\
        return val.map(dumpValue)\r\n\
    } else if (type === 'Object') {\r\n\
        if (val.get) { // computed property\r\n\
            return val.get()\r\n\
        } else { // object / child scope\r\n\
            var ret = {}\r\n\
            for (var key in val) {\r\n\
                if (val.hasOwnProperty(key) &&\r\n\
                    typeof val[key] !== 'function' &&\r\n\
                    key.charAt(0) !== '$')\r\n\
                {\r\n\
                    ret[key] = dumpValue(val[key])\r\n\
                }\r\n\
            }\r\n\
            return ret\r\n\
        }\r\n\
    } else if (type !== 'Function') {\r\n\
        return val\r\n\
    }\r\n\
}\r\n\
\r\n\
module.exports = {\r\n\
\r\n\
    typeOf: typeOf,\r\n\
    dumpValue: dumpValue,\r\n\
\r\n\
    /*\r\n\
     *  Get a value from an object based on a path array\r\n\
     */\r\n\
    getNestedValue: function (obj, path) {\r\n\
        if (path.length === 1) return obj[path[0]]\r\n\
        var i = 0\r\n\
        /* jshint boss: true */\r\n\
        while (obj[path[i]]) {\r\n\
            obj = obj[path[i]]\r\n\
            i++\r\n\
        }\r\n\
        return i === path.length ? obj : undefined\r\n\
    },\r\n\
\r\n\
    /*\r\n\
     *  augment an Array so that it emit events when mutated\r\n\
     */\r\n\
    watchArray: function (collection) {\r\n\
        Emitter(collection)\r\n\
        arrayMutators.forEach(function (method) {\r\n\
            collection[method] = function () {\r\n\
                var result = aproto[method].apply(this, arguments)\r\n\
                collection.emit('mutate', {\r\n\
                    method: method,\r\n\
                    args: aproto.slice.call(arguments),\r\n\
                    result: result\r\n\
                })\r\n\
            }\r\n\
        })\r\n\
        for (var method in arrayAugmentations) {\r\n\
            collection[method] = arrayAugmentations[method]\r\n\
        }\r\n\
    }\r\n\
}//@ sourceURL=vue/src/utils.js"
));
require.register("vue/src/seed.js", Function("exports, require, module",
"var config         = require('./config'),\r\n\
    Scope           = require('./scope'),\r\n\
    Binding        = require('./binding'),\r\n\
    DirectiveParser      = require('./directive-parser'),\r\n\
    TextParser = require('./text-parser'),\r\n\
    depsParser = require('./deps-parser');\r\n\
\r\n\
var slice = Array.prototype.slice,\r\n\
    ctrlAttr = config.prefix + '-controller',\r\n\
    eachAttr = config.prefix + '-each'\r\n\
\r\n\
/*\r\n\
 *  The main ViewModel class\r\n\
 *  scans a node and parse it to populate data bindings\r\n\
 */\r\n\
function Seed (el, options) {\r\n\
\r\n\
    config.log('\\n\
created new Seed instance.\\n\
')\r\n\
\r\n\
    if (typeof el === 'string') {\r\n\
        el = document.querySelector(el)\r\n\
    }\r\n\
\r\n\
    this.el               = el\r\n\
    el.seed               = this\r\n\
    this._bindings        = {}\r\n\
    // list of computed properties that need to parse dependencies for\r\n\
    this._computed        = []\r\n\
    // list of bindings that has dynamic context dependencies\r\n\
    this._contextBindings = []\r\n\
\r\n\
    // copy options\r\n\
    options = options || {}\r\n\
    for (var op in options) {\r\n\
        this[op] = options[op]\r\n\
    }\r\n\
    this.emmitTime = Math.floor(Math.random()*Math.pow(10,10))\r\n\
    // check if there's passed in data\r\n\
    var dataAttr = config.prefix + '-data',\r\n\
        dataId = el.getAttribute(dataAttr),\r\n\
        data = (options && options.data) || config.datum[dataId]\r\n\
    if (dataId && !data) {\r\n\
        config.warn('data \"' + dataId + '\" is not defined.')\r\n\
    }\r\n\
    data = data || {}\r\n\
    el.removeAttribute(dataAttr)\r\n\
    \r\n\
    // if the passed in data is the scope of a Seed instance,\r\n\
    // make a copy from it\r\n\
    if (data.$seed instanceof Seed) {\r\n\
        data = data.$dump()\r\n\
    }\r\n\
\r\n\
    // initialize the scope object\r\n\
    var key,\r\n\
        scope = this.scope = new Scope(this, options)\r\n\
\r\n\
    // copy data\r\n\
    for (key in data) {\r\n\
        scope[key] = data[key]\r\n\
    }\r\n\
\r\n\
    // if has controller function, apply it so we have all the user definitions\r\n\
    var ctrlID = el.getAttribute(ctrlAttr)\r\n\
    if (ctrlID) {\r\n\
        el.removeAttribute(ctrlAttr)\r\n\
        var factory = config.controllers[ctrlID]\r\n\
        if (factory) {\r\n\
            factory(this.scope)\r\n\
        } else {\r\n\
            config.warn('controller \"' + ctrlID + '\" is not defined.')\r\n\
        }\r\n\
    }\r\n\
\r\n\
    // now parse the DOM\r\n\
    this._compileNode(el, true)\r\n\
\r\n\
    // for anything in scope but not binded in DOM, create bindings for them\r\n\
    for (key in scope) {\r\n\
        if (key.charAt(0) !== '$' && !this._bindings[key]) {\r\n\
            this._createBinding(key)\r\n\
        }\r\n\
    }\r\n\
\r\n\
    // extract dependencies for computed properties\r\n\
    if (this._computed.length) depsParser.parse(this._computed)\r\n\
    delete this._computed\r\n\
\r\n\
    if (this._contextBindings.length) this._bindContexts(this._contextBindings)\r\n\
    delete this._contextBindings\r\n\
}\r\n\
\r\n\
// for better compression\r\n\
var SeedProto = Seed.prototype\r\n\
\r\n\
/*\r\n\
 *  Compile a DOM node (recursive)\r\n\
 */\r\n\
SeedProto._compileNode = function (node, root) {\r\n\
    var seed = this\r\n\
\r\n\
    if (node.nodeType === 3) {\r\n\
        // text node\r\n\
        seed._compileTextNode(node)\r\n\
    } else if (node.nodeType === 1) { // exclude comment nodes\r\n\
        var eachExp = node.getAttribute(eachAttr),\r\n\
            ctrlExp = node.getAttribute(ctrlAttr)\r\n\
        // deal with each block\r\n\
        if (eachExp) {\r\n\
            // each block\r\n\
            var directive = DirectiveParser.parse(eachAttr, eachExp)\r\n\
            if (directive) {\r\n\
                directive.el = node\r\n\
                seed._bind(directive)\r\n\
            }\r\n\
        } else if (ctrlExp && !root) { // nested controllers\r\n\
\r\n\
            new Seed(node, {\r\n\
                child: true,\r\n\
                parentSeed: seed\r\n\
            })\r\n\
\r\n\
        }  else { // normal node\r\n\
            // parse if has attributes\r\n\
            if (node.attributes && node.attributes.length) {\r\n\
                // forEach vs for loop perf comparison: http://jsperf.com/for-vs-foreach-case\r\n\
                // takeaway: not worth it to wrtie manual loops.\r\n\
                slice.call(node.attributes).forEach(function (attr) {\r\n\
                    if (attr.name === ctrlAttr) return\r\n\
                    var valid = false\r\n\
                    attr.value.split(',').forEach(function (exp) {\r\n\
                        var directive = DirectiveParser.parse(attr.name, exp)\r\n\
                        if (directive) {\r\n\
                            valid = true\r\n\
                            directive.el = node\r\n\
                            seed._bind(directive)\r\n\
                        }\r\n\
                    })\r\n\
                    if (valid) node.removeAttribute(attr.name)\r\n\
                })\r\n\
            }\r\n\
            // recursively compile childNodes\r\n\
            if (node.childNodes.length) {\r\n\
                slice.call(node.childNodes).forEach(seed._compileNode, seed)\r\n\
            }\r\n\
        }\r\n\
    }\r\n\
}\r\n\
/*\r\n\
 *  Compile a text node\r\n\
 */\r\n\
SeedProto._compileTextNode = function (node) {\r\n\
    var tokens = TextParser.parse(node)\r\n\
    if (!tokens) return\r\n\
    var seed = this,\r\n\
        dirname = config.prefix + '-text',\r\n\
        el, token, directive\r\n\
    for (var i = 0, l = tokens.length; i < l; i++) {\r\n\
        token = tokens[i]\r\n\
        el = document.createTextNode('')\r\n\
        if (token.key) {\r\n\
            directive = DirectiveParser.parse(dirname, token.key)\r\n\
            if (directive) {\r\n\
                directive.el = el\r\n\
                seed._bind(directive)\r\n\
            }\r\n\
        } else {\r\n\
            el.nodeValue = token\r\n\
        }\r\n\
        node.parentNode.insertBefore(el, node)\r\n\
    }\r\n\
    node.parentNode.removeChild(node)\r\n\
}\r\n\
/*\r\n\
 *  Add a directive instance to the correct binding & scope\r\n\
 */\r\n\
SeedProto._bind = function (directive) {\r\n\
\r\n\
    var key = directive.key,\r\n\
        seed = directive.seed = this\r\n\
    \r\n\
    if (this.each) {\r\n\
        if (key.indexOf(this.eachPrefix) === 0) {\r\n\
            key = directive.key = key.replace(this.eachPrefix, '')\r\n\
        } else {\r\n\
            seed = this.parentSeed\r\n\
        }\r\n\
    }\r\n\
    // deal with nesting\r\n\
    seed = traceOwnerSeed(directive, seed)\r\n\
    var binding = seed._bindings[key] || seed._createBinding(key)\r\n\
    \r\n\
    binding.instances.push(directive)\r\n\
    directive.binding = binding\r\n\
\r\n\
    // invoke bind hook if exists\r\n\
    if (directive.bind) {\r\n\
        directive.bind(binding.value)\r\n\
    }\r\n\
\r\n\
    // set initial value\r\n\
    directive.update(binding.value)\r\n\
    if (binding.isComputed) {\r\n\
        directive.refresh()\r\n\
    }\r\n\
}\r\n\
/*\r\n\
 *  Create binding and attach getter/setter for a key to the scope object\r\n\
 */\r\n\
SeedProto._createBinding = function (key) {\r\n\
    config.log('  created binding: ' + key)\r\n\
    var binding = new Binding(this, key)\r\n\
    this._bindings[key] = binding\r\n\
    if (binding.isComputed) this._computed.push(binding)\r\n\
    return binding\r\n\
}\r\n\
\r\n\
/*\r\n\
 *  Process subscriptions for computed properties that has\r\n\
 *  dynamic context dependencies\r\n\
 */\r\n\
SeedProto._bindContexts = function (bindings) {\r\n\
    var i = bindings.length, j, binding, depKey, dep\r\n\
    while (i--) {\r\n\
        binding = bindings[i]\r\n\
        j = binding.contextDeps.length\r\n\
        while (j--) {\r\n\
            depKey = binding.contextDeps[j]\r\n\
            dep = this._bindings[depKey]\r\n\
            dep.subs.push(binding)\r\n\
        }\r\n\
    }\r\n\
}\r\n\
\r\n\
/*\r\n\
 *  Call unbind() of all directive instances\r\n\
 *  to remove event listeners, destroy child seeds, etc.\r\n\
 */\r\n\
SeedProto._unbind = function () {\r\n\
    var i, ins\r\n\
    for (var key in this._bindings) {\r\n\
        ins = this._bindings[key].instances\r\n\
        i = ins.length\r\n\
        while (i--) {\r\n\
            if (ins[i].unbind) ins[i].unbind()\r\n\
        }\r\n\
    }\r\n\
}\r\n\
/*\r\n\
 *  Unbind and remove element\r\n\
 */\r\n\
SeedProto._destroy = function () {\r\n\
    this._unbind()\r\n\
    delete this.el.seed\r\n\
    this.el.parentNode.removeChild(this.el)\r\n\
    if (this.parentSeed && this.id) {\r\n\
        delete this.parentSeed['$' + this.id]\r\n\
    }\r\n\
}\r\n\
\r\n\
// Helpers --------------------------------------------------------------------\r\n\
\r\n\
/*\r\n\
 *  determine which scope a key belongs to based on nesting symbols\r\n\
 */\r\n\
function traceOwnerSeed (key, seed) {\r\n\
    if (key.nesting) {\r\n\
        var levels = key.nesting\r\n\
        while (seed.parentSeed && levels--) {\r\n\
            seed = seed.parentSeed\r\n\
        }\r\n\
    } else if (key.root) {\r\n\
        while (seed.parentSeed) {\r\n\
            seed = seed.parentSeed\r\n\
        }\r\n\
    }\r\n\
    return seed\r\n\
}\r\n\
\r\n\
module.exports = Seed\r\n\
//@ sourceURL=vue/src/seed.js"
));
require.register("vue/src/scope.js", Function("exports, require, module",
"var utils   = require('./utils')\r\n\
\r\n\
function Scope (seed, options) {\r\n\
    this.$seed     = seed\r\n\
    this.$el       = seed.el\r\n\
    this.$index    = options.index\r\n\
    this.$parent   = options.parentSeed && options.parentSeed.scope\r\n\
    this.$watchers = {}\r\n\
}\r\n\
\r\n\
var ScopeProto = Scope.prototype\r\n\
\r\n\
/*\r\n\
 *  watch a key on the scope for changes\r\n\
 *  fire callback with new value\r\n\
 */\r\n\
ScopeProto.$watch = function (key, callback) {\r\n\
    var self = this\r\n\
    // yield and wait for seed to finish compiling\r\n\
    setTimeout(function () {\r\n\
        var scope   = self.$seed.scope,\r\n\
            binding = self.$seed._bindings[key],\r\n\
            watcher = self.$watchers[key] = {\r\n\
                refresh: function () {\r\n\
                    callback(scope[key])\r\n\
                },\r\n\
                deps: binding.deps\r\n\
            }\r\n\
        binding.deps.forEach(function (dep) {\r\n\
            dep.subs.push(watcher)\r\n\
        })\r\n\
    }, 0)\r\n\
}\r\n\
\r\n\
/*\r\n\
 *  remove watcher\r\n\
 */\r\n\
ScopeProto.$unwatch = function (key) {\r\n\
    var self = this\r\n\
    setTimeout(function () {\r\n\
        var watcher = self.$watchers[key]\r\n\
        if (!watcher) return\r\n\
        watcher.deps.forEach(function (dep) {\r\n\
            dep.subs.splice(dep.subs.indexOf(watcher))\r\n\
        })\r\n\
        delete self.$watchers[key]\r\n\
    }, 0)\r\n\
}\r\n\
\r\n\
/*\r\n\
 *  Dump a copy of current scope data, excluding seed-exposed properties.\r\n\
 *  @param key (optional): key for the value to dump\r\n\
 */\r\n\
ScopeProto.$dump = function (key) {\r\n\
    var bindings = this.$seed._bindings\r\n\
    return utils.dumpValue(key ? bindings[key].value : this)\r\n\
}\r\n\
\r\n\
/*\r\n\
 *  stringify the result from $dump\r\n\
 */\r\n\
ScopeProto.$serialize = function (key) {\r\n\
    return JSON.stringify(this.$dump(key))\r\n\
}\r\n\
\r\n\
/*\r\n\
 *  unbind everything, remove everything\r\n\
 */\r\n\
ScopeProto.$destroy = function () {\r\n\
    this.$seed._destroy()\r\n\
}\r\n\
\r\n\
module.exports = Scope//@ sourceURL=vue/src/scope.js"
));
require.register("vue/src/binding.js", Function("exports, require, module",
"var utils    = require('./utils'),\r\n\
    observer = require('./deps-parser').observer,\r\n\
    def      = Object.defineProperty\r\n\
\r\n\
/*\r\n\
 *  Binding class.\r\n\
 *\r\n\
 *  each property on the scope has one corresponding Binding object\r\n\
 *  which has multiple directive instances on the DOM\r\n\
 *  and multiple computed property dependents\r\n\
 */\r\n\
function Binding (seed, key) {\r\n\
    this.seed = seed\r\n\
    this.scope = seed.scope\r\n\
    this.key  = key\r\n\
    var path = key.split('.')\r\n\
    this.inspect(utils.getNestedValue(seed.scope, path))\r\n\
    this.def(seed.scope, path)\r\n\
    this.instances    = []\r\n\
    this.subs   = []\r\n\
    this.deps = []\r\n\
}\r\n\
\r\n\
var BindingProto = Binding.prototype\r\n\
\r\n\
/*\r\n\
 *  Pre-process a passed in value based on its type\r\n\
 */\r\n\
BindingProto.inspect = function (value) {\r\n\
    var type = utils.typeOf(value),\r\n\
        self = this\r\n\
    // preprocess the value depending on its type\r\n\
    if (type === 'Object') {\r\n\
        if (value.get || value.set) { // computed property\r\n\
            self.isComputed = true\r\n\
        }\r\n\
    } else if (type === 'Array') {\r\n\
        utils.watchArray(value)\r\n\
        value.on('mutate', function () {\r\n\
            self.pub()\r\n\
        })\r\n\
    }\r\n\
    self.value = value\r\n\
}\r\n\
\r\n\
/*\r\n\
 *  Define getter/setter for this binding on scope\r\n\
 *  recursive for nested objects\r\n\
 */\r\n\
BindingProto.def = function (scope, path) {\r\n\
    var self = this,\r\n\
        key = path[0]\r\n\
    if (path.length === 1) {\r\n\
        // here we are! at the end of the path!\r\n\
        // define the real value accessors.\r\n\
        def(scope, key, {\r\n\
            get: function () {\r\n\
                if (observer.isObserving) {\r\n\
                    observer.emit('get', self)\r\n\
                }\r\n\
                return self.isComputed\r\n\
                    ? self.value.get({\r\n\
                        el: self.seed.el,\r\n\
                        scope: self.seed.scope\r\n\
                    })\r\n\
                    : self.value\r\n\
            },\r\n\
            set: function (value) {\r\n\
                if (self.isComputed) {\r\n\
                    // computed properties cannot be redefined\r\n\
                    // no need to call binding.update() here,\r\n\
                    // as dependency extraction has taken care of that\r\n\
                    if (self.value.set) {\r\n\
                        self.value.set(value)\r\n\
                    }\r\n\
                } else if (value !== self.value) {\r\n\
                    self.update(value)\r\n\
                }\r\n\
            }\r\n\
        })\r\n\
    } else {\r\n\
        // we are not there yet!!!\r\n\
        // create an intermediate subscope\r\n\
        // which also has its own getter/setters\r\n\
        var subScope = scope[key]\r\n\
        if (!subScope) {\r\n\
            subScope = {}\r\n\
            def(scope, key, {\r\n\
                get: function () {\r\n\
                    return subScope\r\n\
                },\r\n\
                set: function (value) {\r\n\
                    // when the subScope is given a new value,\r\n\
                    // copy everything over to trigger the setters\r\n\
                    for (var prop in value) {\r\n\
                        subScope[prop] = value[prop]\r\n\
                    }\r\n\
                }\r\n\
            })\r\n\
        }\r\n\
        this.def(subScope, path.slice(1))\r\n\
    }\r\n\
}\r\n\
\r\n\
/*\r\n\
 *  Process the value, then trigger updates on all dependents\r\n\
 */\r\n\
BindingProto.update = function (value) {\r\n\
    this.inspect(value)\r\n\
    var i = this.instances.length\r\n\
    while (i--) {\r\n\
        this.instances[i].update(value)\r\n\
    }\r\n\
    this.pub()\r\n\
}\r\n\
\r\n\
BindingProto.refresh = function () {\r\n\
    var i = this.instances.length\r\n\
    while (i--) {\r\n\
        this.instances[i].refresh()\r\n\
    }\r\n\
}\r\n\
\r\n\
/*\r\n\
 *  Notify computed properties that depend on this binding\r\n\
 *  to update themselves\r\n\
 */\r\n\
BindingProto.pub = function () {\r\n\
    var i = this.subs.length\r\n\
    while (i--) {\r\n\
        this.subs[i].refresh()\r\n\
    }\r\n\
}\r\n\
\r\n\
module.exports = Binding//@ sourceURL=vue/src/binding.js"
));
require.register("vue/src/directive-parser.js", Function("exports, require, module",
"var config     = require('./config'),\r\n\
    directives = require('./directives'),\r\n\
    filters    = require('./filters')\r\n\
\r\n\
var KEY_RE          = /^[^\\|<]+/,\r\n\
    ARG_RE          = /([^:]+):(.+)$/,\r\n\
    FILTERS_RE      = /\\|[^\\|<]+/g,\r\n\
    FILTER_TOKEN_RE = /[^\\s']+|'[^']+'/g,\r\n\
    INVERSE_RE      = /^!/,\r\n\
    NESTING_RE      = /^\\^+/,\r\n\
    ONEWAY_RE       = /-oneway$/\r\n\
\r\n\
\r\n\
/*\r\n\
 *  Directive class\r\n\
 *  represents a single directive instance in the DOM\r\n\
 */\r\n\
function Directive (directiveName, expression, oneway) {\r\n\
\r\n\
    var prop,\r\n\
        definition = directives[directiveName]\r\n\
\r\n\
    // mix in properties from the directive definition\r\n\
    if (typeof definition === 'function') {\r\n\
        this._update = definition\r\n\
    } else {\r\n\
        this._update = definition.update\r\n\
        for (prop in definition) {\r\n\
            if (prop !== 'update') {\r\n\
                this[prop] = definition[prop]\r\n\
            }\r\n\
        }\r\n\
    }\r\n\
\r\n\
    this.oneway        = !!oneway\r\n\
    this.directiveName = directiveName\r\n\
    this.expression    = expression.trim()\r\n\
    this.rawKey        = expression.match(KEY_RE)[0].trim()\r\n\
\r\n\
    this.parseKey(this.rawKey)\r\n\
    \r\n\
    var filterExps = expression.match(FILTERS_RE)\r\n\
    this.filters = filterExps\r\n\
        ? filterExps.map(parseFilter)\r\n\
        : null\r\n\
}\r\n\
\r\n\
var DirProto = Directive.prototype\r\n\
\r\n\
/*\r\n\
 *  called when a new value is set \r\n\
 *  for computed properties, this will only be called once\r\n\
 *  during initialization.\r\n\
 */\r\n\
DirProto.update = function (value) {\r\n\
    if (value && (value === this.value)) return\r\n\
    this.value = value\r\n\
    this.apply(value)\r\n\
}\r\n\
\r\n\
/*\r\n\
 *  called when a dependency has changed\r\n\
 *  computed properties only\r\n\
 */\r\n\
DirProto.refresh = function () {\r\n\
    // pass element and scope info to the getter\r\n\
    // enables powerful context-aware bindings\r\n\
    var value = this.value.get({\r\n\
        el: this.el,\r\n\
        scope: this.seed.scope\r\n\
    })\r\n\
    if (value === this.computedValue) return\r\n\
    this.computedValue = value\r\n\
    this.apply(value)\r\n\
    this.binding.pub()\r\n\
}\r\n\
\r\n\
/*\r\n\
 *  Actually invoking the _update from the directive's definition\r\n\
 */\r\n\
DirProto.apply = function (value) {\r\n\
    if (this.inverse) value = !value\r\n\
    this._update(\r\n\
        this.filters\r\n\
        ? this.applyFilters(value)\r\n\
        : value\r\n\
    )\r\n\
}\r\n\
\r\n\
/*\r\n\
 *  pipe the value through filters\r\n\
 */\r\n\
DirProto.applyFilters = function (value) {\r\n\
    var filtered = value\r\n\
    this.filters.forEach(function (filter) {\r\n\
        if (!filter.apply) throw new Error('Unknown filter: ' + filter.name)\r\n\
        filtered = filter.apply(filtered, filter.args)\r\n\
    })\r\n\
    return filtered\r\n\
}\r\n\
/*\r\n\
 *  parse a key, extract argument and nesting/root info\r\n\
 */\r\n\
DirProto.parseKey = function (rawKey) {\r\n\
\r\n\
    var argMatch = rawKey.match(ARG_RE)\r\n\
\r\n\
    var key = argMatch\r\n\
        ? argMatch[2].trim()\r\n\
        : rawKey.trim()\r\n\
\r\n\
    this.arg = argMatch\r\n\
        ? argMatch[1].trim()\r\n\
        : null\r\n\
\r\n\
    this.inverse = INVERSE_RE.test(key)\r\n\
    if (this.inverse) {\r\n\
        key = key.slice(1)\r\n\
    }\r\n\
\r\n\
    var nesting = key.match(NESTING_RE)\r\n\
    this.nesting = nesting\r\n\
        ? nesting[0].length\r\n\
        : false\r\n\
\r\n\
    this.root = key.charAt(0) === '$'\r\n\
\r\n\
    if (this.nesting) {\r\n\
        key = key.replace(NESTING_RE, '')\r\n\
    } else if (this.root) {\r\n\
        key = key.slice(1)\r\n\
    }\r\n\
\r\n\
    this.key = key\r\n\
}\r\n\
/*\r\n\
 *  parse a filter expression\r\n\
 */\r\n\
function parseFilter (filter) {\r\n\
\r\n\
    var tokens = filter.slice(1)\r\n\
        .match(FILTER_TOKEN_RE)\r\n\
        .map(function (token) {\r\n\
            return token.replace(/'/g, '').trim()\r\n\
        })\r\n\
\r\n\
    return {\r\n\
        name  : tokens[0],\r\n\
        apply : filters[tokens[0]],\r\n\
        args  : tokens.length > 1\r\n\
                ? tokens.slice(1)\r\n\
                : null\r\n\
    }\r\n\
}\r\n\
module.exports = {\r\n\
\r\n\
    /*\r\n\
     *  make sure the directive and expression is valid\r\n\
     *  before we create an instance\r\n\
     */\r\n\
    parse: function (dirname, expression) {\r\n\
\r\n\
        var prefix = config.prefix\r\n\
        if (dirname.indexOf(prefix) === -1) return null\r\n\
        dirname = dirname.slice(prefix.length + 1)\r\n\
\r\n\
        var oneway = ONEWAY_RE.test(dirname)\r\n\
        if (oneway) {\r\n\
            dirname = dirname.slice(0, -7)\r\n\
        }\r\n\
\r\n\
        var dir   = directives[dirname],\r\n\
            valid = KEY_RE.test(expression)\r\n\
\r\n\
        if (!dir) config.warn('unknown directive: ' + dirname)\r\n\
        if (!valid) config.warn('invalid directive expression: ' + expression)\r\n\
\r\n\
        return dir && valid\r\n\
            ? new Directive(dirname, expression, oneway)\r\n\
            : null\r\n\
    }\r\n\
}\r\n\
//@ sourceURL=vue/src/directive-parser.js"
));
require.register("vue/src/text-parser.js", Function("exports, require, module",
"var config    = require('./config'),\r\n\
    ESCAPE_RE = /[-.*+?^${}()|[\\]\\/\\\\]/g,\r\n\
    BINDING_RE\r\n\
\r\n\
/*\r\n\
 *  Escapes a string so that it can be used to construct RegExp\r\n\
 */\r\n\
function escapeRegex (val) {\r\n\
    return val.replace(ESCAPE_RE, '\\\\$&')\r\n\
}\r\n\
\r\n\
module.exports = {\r\n\
\r\n\
    /*\r\n\
     *  Parse a piece of text, return an array of tokens\r\n\
     */\r\n\
    parse: function (node) {\r\n\
        var text = node.nodeValue\r\n\
        if (!BINDING_RE.test(text)) return null\r\n\
        var m, i, tokens = []\r\n\
        do {\r\n\
            m = text.match(BINDING_RE)\r\n\
            if (!m) break\r\n\
            i = m.index\r\n\
            if (i > 0) tokens.push(text.slice(0, i))\r\n\
            tokens.push({ key: m[1] })\r\n\
            text = text.slice(i + m[0].length)\r\n\
        } while (true)\r\n\
        if (text.length) tokens.push(text)\r\n\
        return tokens\r\n\
    },\r\n\
\r\n\
    /*\r\n\
     *  Build interpolate tag regex from config settings\r\n\
     */\r\n\
    buildRegex: function () {\r\n\
        var open = escapeRegex(config.interpolateTags.open),\r\n\
            close = escapeRegex(config.interpolateTags.close)\r\n\
        BINDING_RE = new RegExp(open + '(.+?)' + close)\r\n\
    }\r\n\
}//@ sourceURL=vue/src/text-parser.js"
));
require.register("vue/src/deps-parser.js", Function("exports, require, module",
"var Emitter  = require('./Emitter'),\r\n\
    config   = require('./config'),\r\n\
    observer = new Emitter()\r\n\
\r\n\
var dummyEl = document.createElement('div'),\r\n\
    ARGS_RE = /^function\\s*?\\((.+?)\\)/,\r\n\
    SCOPE_RE_STR = '\\\\.scope\\\\.[\\\\.A-Za-z0-9_][\\\\.A-Za-z0-9_$]*',\r\n\
    noop = function () {}\r\n\
\r\n\
/*\r\n\
 *  Auto-extract the dependencies of a computed property\r\n\
 *  by recording the getters triggered when evaluating it.\r\n\
 *\r\n\
 *  However, the first pass will contain duplicate dependencies\r\n\
 *  for computed properties. It is therefore necessary to do a\r\n\
 *  second pass in injectDeps()\r\n\
 */\r\n\
function catchDeps (binding) {\r\n\
    observer.on('get', function (dep) {\r\n\
        binding.deps.push(dep)\r\n\
    })\r\n\
    parseContextDependency(binding)\r\n\
    binding.value.get({\r\n\
        scope: createDummyScope(binding),\r\n\
        el: dummyEl\r\n\
    })\r\n\
    observer.off('get')\r\n\
}\r\n\
\r\n\
/*\r\n\
 *  The second pass of dependency extraction.\r\n\
 *  Only include dependencies that don't have dependencies themselves.\r\n\
 */\r\n\
function filterDeps (binding) {\r\n\
    var i = binding.deps.length, dep\r\n\
    config.log('\\n\
─ ' + binding.key)\r\n\
    while (i--) {\r\n\
        dep = binding.deps[i]\r\n\
        if (!dep.deps.length) {\r\n\
            config.log('  └─' + dep.key)\r\n\
            dep.subs.push(binding)\r\n\
        } else {\r\n\
            binding.deps.splice(i, 1)\r\n\
        }\r\n\
    }\r\n\
}\r\n\
\r\n\
/*\r\n\
 *  We need to invoke each binding's getter for dependency parsing,\r\n\
 *  but we don't know what sub-scope properties the user might try\r\n\
 *  to access in that getter. To avoid thowing an error or forcing\r\n\
 *  the user to guard against an undefined argument, we staticly\r\n\
 *  analyze the function to extract any possible nested properties\r\n\
 *  the user expects the target scope to possess. They are all assigned\r\n\
 *  a noop function so they can be invoked with no real harm.\r\n\
 */\r\n\
function createDummyScope (binding) {\r\n\
    var scope = {},\r\n\
        deps = binding.contextDeps\r\n\
    if (!deps) return scope\r\n\
    var i = binding.contextDeps.length,\r\n\
        j, level, key, path\r\n\
    while (i--) {\r\n\
        level = scope\r\n\
        path = deps[i].split('.')\r\n\
        j = 0\r\n\
        while (j < path.length) {\r\n\
            key = path[j]\r\n\
            if (!level[key]) level[key] = noop\r\n\
            level = level[key]\r\n\
            j++\r\n\
        }\r\n\
    }\r\n\
    return scope\r\n\
}\r\n\
\r\n\
/*\r\n\
 *  Extract context dependency paths\r\n\
 */\r\n\
function parseContextDependency (binding) {\r\n\
    var fn   = binding.value.get,\r\n\
        str  = fn.toString(),\r\n\
        args = str.match(ARGS_RE)\r\n\
    if (!args) return null\r\n\
    var argRE = new RegExp(args[1] + SCOPE_RE_STR, 'g'),\r\n\
        matches = str.match(argRE),\r\n\
        base = args[1].length + 7\r\n\
    if (!matches) return null\r\n\
    var i = matches.length,\r\n\
        deps = [], dep\r\n\
    while (i--) {\r\n\
        dep = matches[i].slice(base)\r\n\
        if (deps.indexOf(dep) === -1) {\r\n\
            deps.push(dep)\r\n\
        }\r\n\
    }\r\n\
    binding.contextDeps = deps\r\n\
    binding.seed._contextBindings.push(binding)\r\n\
}\r\n\
\r\n\
module.exports = {\r\n\
\r\n\
    /*\r\n\
     *  the observer that catches events triggered by getters\r\n\
     */\r\n\
    observer: observer,\r\n\
\r\n\
    /*\r\n\
     *  parse a list of computed property bindings\r\n\
     */\r\n\
    parse: function (bindings) {\r\n\
        config.log('\\n\
parsing dependencies...')\r\n\
        observer.isObserving = true\r\n\
        bindings.forEach(catchDeps)\r\n\
        bindings.forEach(filterDeps)\r\n\
        observer.isObserving = false\r\n\
        config.log('\\n\
done.')\r\n\
    }\r\n\
}//@ sourceURL=vue/src/deps-parser.js"
));
require.register("vue/src/filters.js", Function("exports, require, module",
"var keyCodes = {\r\n\
    enter    : 13,\r\n\
    tab      : 9,\r\n\
    'delete' : 46,\r\n\
    up       : 38,\r\n\
    left     : 37,\r\n\
    right    : 39,\r\n\
    down     : 40,\r\n\
    esc      : 27\r\n\
}\r\n\
\r\n\
module.exports = {\r\n\
    trim: function (value) {\r\n\
        return value ? value.toString().trim() : ''\r\n\
    },\r\n\
    capitalize: function (value) {\r\n\
        if (!value) return ''\r\n\
        value = value.toString()\r\n\
        return value.charAt(0).toUpperCase() + value.slice(1)\r\n\
    },\r\n\
    uppercase: function (value) {\r\n\
        return value ? value.toString().toUpperCase() : ''\r\n\
    },\r\n\
    lowercase: function (value) {\r\n\
        return value ? value.toString().toLowerCase() : ''\r\n\
    },\r\n\
    currency: function (value, args) {\r\n\
        if (!value) return ''\r\n\
        var sign = (args && args[0]) || '$',\r\n\
            i = value % 3,\r\n\
            f = '.' + value.toFixed(2).slice(-2),\r\n\
            s = Math.floor(value).toString()\r\n\
        return sign + s.slice(0, i) + s.slice(i).replace(/(\\d{3})(?=\\d)/g, '$1,') + f\r\n\
    },\r\n\
\r\n\
    key: function (handler, args) {\r\n\
        if (!handler) return\r\n\
        var code = keyCodes[args[0]]\r\n\
        if (!code) {\r\n\
            code = parseInt(args[0], 10)\r\n\
        }\r\n\
        return function (e) {\r\n\
            if (e.keyCode === code) {\r\n\
                handler.call(this, e)\r\n\
            }\r\n\
        }\r\n\
    }\r\n\
}//@ sourceURL=vue/src/filters.js"
));
require.register("vue/src/directives/index.js", Function("exports, require, module",
"module.exports = {\r\n\
\r\n\
    on   : require('./on'),\r\n\
    each : require('./each'),\r\n\
\r\n\
    attr: function (value) {\r\n\
        this.el.setAttribute(this.arg, value)\r\n\
    },\r\n\
\r\n\
    text: function (value) {\r\n\
        this.el.textContent =\r\n\
            (typeof value === 'string' || typeof value === 'number')\r\n\
            ? value : ''\r\n\
    },\r\n\
\r\n\
    html: function (value) {\r\n\
        this.el.innerHTML =\r\n\
            (typeof value === 'string' || typeof value === 'number')\r\n\
            ? value : ''\r\n\
    },\r\n\
\r\n\
    show: function (value) {\r\n\
        this.el.style.display = value ? '' : 'none'\r\n\
    },\r\n\
\r\n\
    visible: function (value) {\r\n\
        this.el.style.visibility = value ? '' : 'hidden'\r\n\
    },\r\n\
\r\n\
    focus: function (value) {\r\n\
        var el = this.el\r\n\
        setTimeout(function () {\r\n\
            el[value ? 'focus' : 'blur']()\r\n\
        }, 0)\r\n\
    },\r\n\
\r\n\
    class: function (value) {\r\n\
        if (this.arg) {\r\n\
            this.el.classList[value ? 'add' : 'remove'](this.arg)\r\n\
        } else {\r\n\
            this.el.classList.remove(this.lastVal)\r\n\
            this.el.classList.add(value)\r\n\
            this.lastVal = value\r\n\
        }\r\n\
    },\r\n\
    // 双向绑定\r\n\
    value: {\r\n\
        bind: function () {\r\n\
            if (this.oneway) return\r\n\
            var el = this.el, self = this\r\n\
            this.change = function () {\r\n\
                self.seed.scope[self.key] = el.value\r\n\
            }\r\n\
            el.addEventListener('change', this.change)\r\n\
        },\r\n\
        update: function (value) {\r\n\
            this.el.value = value ? value : ''\r\n\
        },\r\n\
        unbind: function () {\r\n\
            if (this.oneway) return\r\n\
            this.el.removeEventListener('change', this.change)\r\n\
        }\r\n\
    },\r\n\
\r\n\
    checked: {\r\n\
        bind: function () {\r\n\
            if (this.oneway) return\r\n\
            var el = this.el,\r\n\
                self = this\r\n\
            this.change = function () {\r\n\
                self.seed.scope[self.key] = el.checked\r\n\
            }\r\n\
            el.addEventListener('change', this.change)\r\n\
        },\r\n\
        update: function (value) {\r\n\
            this.el.checked = value\r\n\
        },\r\n\
        unbind: function () {\r\n\
            if (this.oneway) return\r\n\
            this.el.removeEventListener('change', this.change)\r\n\
        }\r\n\
    },\r\n\
    if: {\r\n\
        bind: function () {\r\n\
            this.parent = this.el.parentNode\r\n\
            this.ref = document.createComment('sd-if-' + this.key)\r\n\
            var next = this.el.nextSibling\r\n\
            if (next) {\r\n\
                this.parent.insertBefore(this.ref, next)\r\n\
            } else {\r\n\
                this.parent.appendChild(this.ref)\r\n\
            }\r\n\
        },\r\n\
        update: function (value) {\r\n\
            if (!value) {\r\n\
                if (this.el.parentNode) {\r\n\
                    this.parent.removeChild(this.el)\r\n\
                }\r\n\
            } else {\r\n\
                if (!this.el.parentNode) {\r\n\
                    this.parent.insertBefore(this.el, this.ref)\r\n\
                }\r\n\
            }\r\n\
        }\r\n\
    },\r\n\
    style: {\r\n\
        bind: function () {\r\n\
            this.arg = convertCSSProperty(this.arg)\r\n\
        },\r\n\
        update: function (value) {\r\n\
            this.el.style[this.arg] = value\r\n\
        }\r\n\
    }\r\n\
}\r\n\
\r\n\
/*\r\n\
 *  convert hyphen style CSS property to Camel style\r\n\
 */\r\n\
var CONVERT_RE = /-(.)/g\r\n\
function convertCSSProperty (prop) {\r\n\
    if (prop.charAt(0) === '-') prop = prop.slice(1)\r\n\
    return prop.replace(CONVERT_RE, function (m, char) {\r\n\
        return char.toUpperCase()\r\n\
    })\r\n\
}//@ sourceURL=vue/src/directives/index.js"
));
require.register("vue/src/directives/each.js", Function("exports, require, module",
"var config = require('../config')\r\n\
\r\n\
var mutationHandlers = {\r\n\
    push: function (m) {\r\n\
        var self = this\r\n\
        m.args.forEach(function (data, i) {\r\n\
            self.buildItem(self.ref, data, self.collection.length + i)\r\n\
        })\r\n\
    },\r\n\
    pop: function (m) {\r\n\
        m.result.$destroy()\r\n\
    },\r\n\
    unshift: function (m) {\r\n\
        var self = this\r\n\
        m.args.forEach(function (data, i) {\r\n\
            var ref  = self.collection.length > m.args.length\r\n\
                     ? self.collection[m.args.length].$el\r\n\
                     : self.ref\r\n\
            self.buildItem(ref, data, i)\r\n\
        })\r\n\
        self.updateIndexes()\r\n\
    },\r\n\
    shift: function (m) {\r\n\
        m.result.$destroy()\r\n\
        var self = this\r\n\
        self.updateIndexes()\r\n\
    },\r\n\
    splice: function (m) {\r\n\
        var self    = this,\r\n\
            index   = m.args[0],\r\n\
            removed = m.args[1],\r\n\
            added   = m.args.length - 2\r\n\
        m.result.forEach(function (scope) {\r\n\
            scope.$destroy()\r\n\
        })\r\n\
        if (added > 0) {\r\n\
            m.args.slice(2).forEach(function (data, i) {\r\n\
                var pos  = index - removed + added + 1,\r\n\
                    ref  = self.collection[pos]\r\n\
                         ? self.collection[pos].$el\r\n\
                         : self.ref\r\n\
                self.buildItem(ref, index + i)\r\n\
            })\r\n\
        }\r\n\
        if (removed !== added) {\r\n\
            self.updateIndexes()\r\n\
        }\r\n\
    },\r\n\
    sort: function () {\r\n\
        var self = this\r\n\
        self.collection.forEach(function (scope, i) {\r\n\
            scope.$index = i\r\n\
            self.container.insertBefore(scope.$el, self.ref)\r\n\
        })\r\n\
    }\r\n\
}\r\n\
mutationHandlers.reverse = mutationHandlers.sort\r\n\
\r\n\
module.exports = {\r\n\
\r\n\
    bind: function () {\r\n\
        this.el.removeAttribute(config.prefix + '-each')\r\n\
        var ctn = this.container = this.el.parentNode\r\n\
        // create a comment node as a reference node for DOM insertions\r\n\
        this.ref = document.createComment('sd-each-' + this.arg)\r\n\
        ctn.insertBefore(this.ref, this.el)\r\n\
        ctn.removeChild(this.el)\r\n\
    },\r\n\
\r\n\
    update: function (collection) {\r\n\
        this.unbind(true)\r\n\
        if (!Array.isArray(collection)) return\r\n\
        this.collection = collection\r\n\
        // attach an object to container to hold handlers\r\n\
        this.container.sd_dHandlers = {}\r\n\
\r\n\
        // listen for collection mutation events\r\n\
        // the collection has been augmented during Binding.set()\r\n\
        var self = this\r\n\
        collection.on('mutate', function (mutation) {\r\n\
            mutationHandlers[mutation.method].call(self, mutation)\r\n\
        })\r\n\
        // create child-seeds and append to DOM\r\n\
        collection.forEach(function (data, i) {\r\n\
            self.buildItem(self.ref, data, i)\r\n\
        })\r\n\
    },\r\n\
\r\n\
    buildItem: function (ref, data, index) {\r\n\
        var node = this.el.cloneNode(true)\r\n\
        this.container.insertBefore(node, ref)\r\n\
        var Seed = require('../seed'),\r\n\
            spore = new Seed(node, {\r\n\
                each: true,\r\n\
                eachPrefix: this.arg + '.',\r\n\
                parentSeed: this.seed,\r\n\
                index: index,\r\n\
                data: data,\r\n\
                delegator: this.container\r\n\
            })\r\n\
        this.collection[index] = spore.scope\r\n\
    },\r\n\
\r\n\
    updateIndexes: function () {\r\n\
        this.collection.forEach(function (scope, i) {\r\n\
            scope.$index = i\r\n\
        })\r\n\
    },\r\n\
\r\n\
    unbind: function (reset) {\r\n\
        if (this.collection && this.collection.length) {\r\n\
            var fn = reset ? '_destroy' : '_unbind'\r\n\
            this.collection.forEach(function (scope) {\r\n\
                scope.$seed[fn]()\r\n\
            })\r\n\
            this.collection = null\r\n\
        }\r\n\
        var ctn = this.container,\r\n\
            handlers = ctn.sd_dHandlers\r\n\
        for (var key in handlers) {\r\n\
            ctn.removeEventListener(handlers[key].event, handlers[key])\r\n\
        }\r\n\
        delete ctn.sd_dHandlers\r\n\
    }\r\n\
}//@ sourceURL=vue/src/directives/each.js"
));
require.register("vue/src/directives/on.js", Function("exports, require, module",
"function delegateCheck (current, top, identifier) {\r\n\
    if (current[identifier]) {\r\n\
        return current\r\n\
    } else if (current === top) {\r\n\
        return false\r\n\
    } else {\r\n\
        return delegateCheck(current.parentNode, top, identifier)\r\n\
    }\r\n\
}\r\n\
\r\n\
module.exports = {\r\n\
\r\n\
    expectFunction : true,\r\n\
\r\n\
    bind: function () {\r\n\
        if (this.seed.each) {\r\n\
            // attach an identifier to the el\r\n\
            // so it can be matched during event delegation\r\n\
            this.el[this.expression] = true\r\n\
            // attach the owner scope of this directive\r\n\
            this.el.sd_scope = this.seed.scope\r\n\
        }\r\n\
    },\r\n\
\r\n\
    update: function (handler) {\r\n\
        this.unbind()\r\n\
        if (!handler) return\r\n\
        var seed  = this.seed,\r\n\
            event = this.arg\r\n\
\r\n\
        if (seed.each && event !== 'blur' && event !== 'blur') {\r\n\
\r\n\
            // for each blocks, delegate for better performance\r\n\
            //  focus and blur events dont bubble so exclude them\r\n\
            var delegator  = seed.delegator,\r\n\
                identifier = this.expression,\r\n\
                dHandler   = delegator.sd_dHandlers[identifier]\r\n\
\r\n\
            if (dHandler) return\r\n\
\r\n\
            // the following only gets run once for the entire each block\r\n\
            dHandler = delegator.sd_dHandlers[identifier] = function (e) {\r\n\
                var target = delegateCheck(e.target, delegator, identifier)\r\n\
                if (target) {\r\n\
                    e.el = target\r\n\
                    e.scope = target.sd_scope\r\n\
                    handler.call(seed.scope, e)\r\n\
                }\r\n\
                dHandler.event = event\r\n\
                delegator.addEventListener(event, dHandler)\r\n\
            }\r\n\
            dHandler.event = event\r\n\
            delegator.addEventListener(event, dHandler)\r\n\
        } else {\r\n\
            // a normal, single element handler\r\n\
            this.handler = function (e) {\r\n\
                e.el = e.currentTarget\r\n\
                e.scope = seed.scope\r\n\
                handler.call(seed.scope, e)\r\n\
            }\r\n\
            this.el.addEventListener(event, this.handler)\r\n\
        }\r\n\
    },\r\n\
\r\n\
    unbind: function () {\r\n\
        this.el.removeEventListener(this.arg, this.handler)\r\n\
    }\r\n\
}//@ sourceURL=vue/src/directives/on.js"
));
require.register("vue/src/Emitter.js", Function("exports, require, module",
"function Emitter(object) {\r\n\
\tif (object) {\r\n\
\t\treturn mixin(object);\r\n\
\t}\r\n\
\r\n\
\tthis._callbacks = new Map();\r\n\
}\r\n\
\r\n\
function mixin(object) {\r\n\
\tObject.assign(object, Emitter.prototype);\r\n\
\tobject._callbacks = new Map();\r\n\
\treturn object;\r\n\
}\r\n\
\r\n\
Emitter.prototype.on = function (event, listener) {\r\n\
\tvar callbacks = this._callbacks.get(event) || [];\r\n\
\tcallbacks.push(listener);\r\n\
\tthis._callbacks.set(event, callbacks);\r\n\
\treturn this;\r\n\
};\r\n\
\r\n\
Emitter.prototype.once = function (event, listener) {\r\n\
\tvar on = function (){\r\n\
\t\tthis.off(event, on);\r\n\
\t\tlistener.apply(this, arguments);\r\n\
\t}.bind(this);\r\n\
\r\n\
\ton.fn = listener;\r\n\
\tthis.on(event, on);\r\n\
\treturn this;\r\n\
};\r\n\
\r\n\
Emitter.prototype.off = function (event, listener) {\r\n\
\tif (event === undefined && listener === undefined) {\r\n\
\t\tthis._callbacks.clear();\r\n\
\t\treturn this;\r\n\
\t}\r\n\
\r\n\
\tif (listener === undefined) {\r\n\
\t\tthis._callbacks.delete(event);\r\n\
\t\treturn this;\r\n\
\t}\r\n\
\r\n\
\tvar callbacks = this._callbacks.get(event);\r\n\
\tif (callbacks) {\r\n\
        var entries = callbacks.entries()\r\n\
\t\tfor (var key in entries) {\r\n\
            var index = entries[key].index,\r\n\
                callback = entries[key].callback;\r\n\
\t\t\tif (callback === listener || callback.fn === listener) {\r\n\
\t\t\t\tcallbacks.splice(index, 1);\r\n\
\t\t\t\tbreak;\r\n\
\t\t\t}\r\n\
\t\t}\r\n\
\r\n\
\t\tif (callbacks.length === 0) {\r\n\
\t\t\tthis._callbacks.delete(event);\r\n\
\t\t} else {\r\n\
\t\t\tthis._callbacks.set(event, callbacks);\r\n\
\t\t}\r\n\
\t}\r\n\
\r\n\
\treturn this;\r\n\
};\r\n\
\r\n\
Emitter.prototype.emit = function (event) {\r\n\
\tvar callbacks = this._callbacks.get(event);\r\n\
\tif (callbacks) {\r\n\
\t\t// Create a copy of the callbacks array to avoid issues if it's modified during iteration\r\n\
\t\tvar callbacksCopy = callbacks.slice();\r\n\
\r\n\
\t\tfor (var key in callbacksCopy) {\r\n\
\t\t\tcallbacksCopy[key].apply(this, [].slice.call(arguments, 1));\r\n\
\t\t}\r\n\
\t}\r\n\
\r\n\
\treturn this;\r\n\
};\r\n\
\r\n\
Emitter.prototype.listeners = function (event) {\r\n\
\treturn this._callbacks.get(event) || [];\r\n\
};\r\n\
\r\n\
Emitter.prototype.listenerCount = function (event) {\r\n\
\tif (event) {\r\n\
\t\treturn this.listeners(event).length;\r\n\
\t}\r\n\
\r\n\
\tvar totalCount = 0;\r\n\
    var values = this._callbacks.values();\r\n\
\tfor (var key in values) {\r\n\
\t\ttotalCount += values[key].length;\r\n\
\t}\r\n\
\r\n\
\treturn totalCount;\r\n\
};\r\n\
\r\n\
Emitter.prototype.hasListeners = function (event) {\r\n\
\treturn this.listenerCount(event) > 0;\r\n\
};\r\n\
\r\n\
// Aliases\r\n\
Emitter.prototype.addEventListener = Emitter.prototype.on;\r\n\
Emitter.prototype.removeListener = Emitter.prototype.off;\r\n\
Emitter.prototype.removeEventListener = Emitter.prototype.off;\r\n\
Emitter.prototype.removeAllListeners = Emitter.prototype.off;\r\n\
\r\n\
if (typeof module !== 'undefined') {\r\n\
\tmodule.exports = Emitter;\r\n\
}//@ sourceURL=vue/src/Emitter.js"
));
require.alias("vue/src/main.js", "vue/index.js");window.Seed = window.Seed || require('vue')
Seed.version = 'dev'
})();