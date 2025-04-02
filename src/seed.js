var Emitter       = require('./Emitter'),
    config      = require('./config'),
    DirectiveParser   = require('./directive-parser'),
    TextNodeParser  = require('./textnode-parser');

var slice = Array.prototype.slice,
    ctrlAttr = config.prefix + '-controller',
    eachAttr = config.prefix + '-each'

var depsObserver    = new Emitter(),
    parsingDeps     = false

/*
 *  The main ViewModel class
 *  scans a node and parse it to populate data bindings
 */
function Seed (el, options) {

    if (typeof el === 'string') {
        el = document.querySelector(el)
    }

    this.el         = el
    el.seed         = this
    this._bindings  = {}
    this._computed  = []

    // copy options
    options = options || {}
    for (var op in options) {
        this[op] = options[op]
    }
    this.emmitTime = Math.floor(Math.random()*Math.pow(10,10))
    // check if there's passed in data
    var dataAttr = config.prefix + '-data',
        dataId = el.getAttribute(dataAttr),
        data = (options && options.data) || config.datum[dataId]
    el.removeAttribute(dataAttr)
    
    // if the passed in data is the scope of a Seed instance,
    // make a copy from it
    if (data && data.$seed instanceof Seed) {
        data = data.$dump()
    }

    // initialize the scope object
    var scope = this.scope = {}
    scope.$el       = el
    scope.$seed    = this
    scope.$destroy = this._destroy.bind(this)
    scope.$dump    = this._dump.bind(this)
    scope.$on       = this.on.bind(this)
    scope.$emit     = this.emit.bind(this)
    scope.$index   = options.index
    scope.$parent  = options.parentSeed && options.parentSeed.scope

    // add event listener to update corresponding binding
    // when a property is set
    this.on('set'+this.emmitTime, this._updateBinding.bind(this))

    // now parse the DOM
    this._compileNode(el, true)

    // copy data
    if (data) {
        for (var key in data) {
            scope[key] = data[key]
        }
    }

    // if has controller function, apply it
    var ctrlID = el.getAttribute(ctrlAttr)
    if (ctrlID) {
        el.removeAttribute(ctrlAttr)
        var factory = config.controllers[ctrlID]
        if (factory) {
            factory.call(this, this.scope)
        } else {
            console.warn('controller ' + ctrlID + ' is not defined.')
        }
    }
    // extract dependencies for computed properties
    parsingDeps = true
    this._computed.forEach(this._parseDeps.bind(this))
    delete this._computed
    parsingDeps = false
}
/*
 *  Compile a DOM node (recursive)
 */
Seed.prototype._compileNode = function (node, root) {
    var seed = this

    if (node.nodeType === 3) {
        // text node
        seed._compileTextNode(node)
    } else if (node.nodeType === 1) { // exclude comment nodes
        var eachExp = node.getAttribute(eachAttr),
            ctrlExp = node.getAttribute(ctrlAttr)
        if (eachExp) {
            // each block
            var directive = DirectiveParser.parse(eachAttr, eachExp)
            if (directive) {
                directive.el = node
                seed._bind(directive)
            }
        } else if (ctrlExp && !root) { // nested controllers

            new Seed(node, {
                child: true,
                parentSeed: seed
            })

        }  else { // normal node
            // parse if has attributes
            if (node.attributes && node.attributes.length) {
                slice.call(node.attributes).forEach(function (attr) {
                    if (attr.name === ctrlAttr) return
                    var valid = false
                    attr.value.split(',').forEach(function (exp) {
                        var directive = DirectiveParser.parse(attr.name, exp)
                        if (directive) {
                            valid = true
                            directive.el = node
                            seed._bind(directive)
                        }
                    })
                    if (valid) node.removeAttribute(attr.name)
                })
            }
            // recursively compile childNodes
            if (node.childNodes.length) {
                slice.call(node.childNodes).forEach(function (child) {
                    seed._compileNode(child)
                })
            }
        }
    }
}
/*
 *  Compile a text node
 */
Seed.prototype._compileTextNode = function (node) {
    return TextNodeParser.parse(node)
}
/*
 *  Add a directive instance to the correct binding & scope
 */
Seed.prototype._bind = function (directive) {
    directive.seed = this

    var key = directive.key,
        seed = this
    
    if (this.each) {
        if (this.eachPrefixRE.test(key)) {
            key = directive.key = key.replace(this.eachPrefixRE, '')
        } else {
            seed = this.parentSeed
        }
    }
    var ownerScope = determinScope(directive, seed),
        binding = ownerScope._bindings[key] || ownerScope._createBinding(key)

    // add directive to this binding
    binding.instances.push(directive)
    directive.binding = binding

    // invoke bind hook if exists
    if (directive.bind) {
        directive.bind(binding.value)
    }
}
/*
 *  Create binding and attach getter/setter for a key to the scope object
 */
Seed.prototype._createBinding = function (key) {

    var binding = new Binding()

    this._bindings[key] = binding

    var seed = this
    Object.defineProperty(this.scope, key, {
        get: function () {
            if (parsingDeps) {
                depsObserver.emit('get', binding)
            }
            seed.emit('get'+seed.emmitTime, key)
            return binding.isComputed
                ? binding.value.get()
                : binding.value
        },
        set: function (value) {
            if (value === binding.value) return
            seed.emit('set'+seed.emmitTime, key, value)
        }
    })

    return binding
}
/*
 *  Update a binding with a new value.
 *  Triggered in the binding's setter.
 */
Seed.prototype._updateBinding = function (key, value) {

    var binding = this._bindings[key],
        type = binding.type = typeOf(value)
    if (!binding) {
        return
    }
    // preprocess the value depending on its type
    if (type === 'Object') {
        if (value.get) { // computed property
            this._computed.push(binding)
            binding.isComputed = true
        } else { // normal object
            // TODO watchObject
        }
    } else if (type === 'Array') {
        watchArray(value)
        value.on('mutate', function () {
            binding.emitChange()
        })
    }

    binding.update(value)

    if (type === 'Array') {
        for (var key1 in this._bindings) {
            var binding1 = this._bindings[key1]
            if (typeof binding1.value === 'function') {
                binding1.update()
            }
        }
    }
}
/*
 *  Auto-extract the dependencies of a computed property
 *  by recording the getters triggered when evaluating it
 */
Seed.prototype._parseDeps = function (binding) {
    depsObserver.on('get', function (dep) {
        if (!dep.dependents) {
            dep.dependents = []
        }
        dep.dependents.push.apply(dep.dependents, binding.instances)
    })
    binding.value.get()
    depsObserver.off('get')
}
/*
 *  Call unbind() of all directive instances
 *  to remove event listeners, destroy child seeds, etc.
 */
Seed.prototype._unbind = function () {
    var unbind = function (instance) {
        if (instance.unbind) {
            instance.unbind()
        }
    }
    for (var key in this._bindings) {
        this._bindings[key].instances.forEach(unbind)
    }
}
/*
 *  Unbind and remove element
 */
Seed.prototype._destroy = function () {
    this._unbind()
    delete this.el.seed
    this.el.parentNode.removeChild(this.el)
    if (this.parentSeed && this.id) {
        delete this.parentSeed['$' + this.id]
    }
}
/*
 *  Dump a copy of current scope data, excluding seed-exposed properties.
 */
Seed.prototype._dump = function () {
    var dump = {}, binding, val,
        subDump = function (scope) {
            return scope.$dump()
        }
    for (var key in this._bindings) {
        binding = this._bindings[key]
        val = binding.value
        if (!val) continue
        if (Array.isArray(val)) {
            dump[key] = val.map(subDump)
        } else if (typeof val !== 'function') {
            dump[key] = val
        } else if (binding.isComputed) {
            dump[key] = val.get()
        }
    }
    return dump
}
/*
 *  Binding class
 */
function Binding() {
    this.value = undefined
    this.instances = []
    this.dependents = []
}

Binding.prototype.update = function (value) {
    if (value === undefined) {
       value = this.value
   } else {
       this.value = value
   }
    this.instances.forEach(function (instance) {
        instance.update(value)
    })
    this.emitChange()
}

Binding.prototype.emitChange = function () {
    this.dependents.forEach(function (dept) {
        dept.refresh()
    })
}

// Helpers --------------------------------------------------------------------

/*
 *  determine which scope a key belongs to based on nesting symbols
 */
function determinScope (key, seed) {
    if (key.nesting) {
        var levels = key.nesting
        while (seed.parentSeed && levels--) {
            seed = seed.parentSeed
        }
    } else if (key.root) {
        while (seed.parentSeed) {
            seed = seed.parentSeed
        }
    }
    return seed
}

/* 
 *  get accurate type of an object
 */
var OtoString = Object.prototype.toString
function typeOf (obj) {
    return OtoString.call(obj).slice(8, -1)
}

/*
 *  augment an Array so that it emit events when mutated
 */
var arrayMutators = ['push','pop','shift','unshift','splice','sort','reverse']
var arrayAugmentations = {
    remove: function (scope) {
        this.splice(scope.$index, 1)
    },
    replace: function (index, data) {
        if (typeof index !== 'number') {
            index = index.$index
        }
        this.splice(index, 1, data)
    }
}
function watchArray (collection) {
    Emitter(collection)
    arrayMutators.forEach(function (method) {
        collection[method] = function () {
            var result = Array.prototype[method].apply(this, arguments)
            collection.emit('mutate', {
                method: method,
                args: Array.prototype.slice.call(arguments),
                result: result
            })
        }
    })
    for (var method in arrayAugmentations) {
        collection[method] = arrayAugmentations[method]
    }
}

Emitter(Seed.prototype)

module.exports = Seed
