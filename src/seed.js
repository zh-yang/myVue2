var Emitter       = require('./Emitter'),
    config      = require('./config'),
    DirectiveParser   = require('./directive-parser');

var slice = Array.prototype.slice

var ancestorKeyRE = /\^/g,
    rootKeyRE = /^\$/,
    ctrlAttr = config.prefix + '-controller',
    eachAttr = config.prefix + '-each'

function Seed (el, options) {

    if (typeof el === 'string') {
        el = document.querySelector(el)
    }

    el.seed        = this
    this.el         = el
    this._bindings  = {}

    // copy options
    if (options) {
        for (var op in options) {
            this[op] = options[op]
        }
    }

    // initialize the scope object
    var dataPrefix = config.prefix + '-data'
    this.scope =
            (options && options.data)
            || config.datum[el.getAttribute(dataPrefix)]
            || {}
    el.removeAttribute(dataPrefix)

    // if has controller
    var ctrlID = el.getAttribute(ctrlAttr),
        controller = null
    if (ctrlID) {
        controller = config.controllers[ctrlID]
        if (!controller) throw new Error('controller ' + ctrlID + ' is not defined.')
        el.removeAttribute(ctrlAttr)
    }

    this._controller = controller

    // recursively process nodes for directives
    this._compileNode(el, true)

    this._updateController()
}

Emitter(Seed.prototype)

Seed.prototype._updateController = function() {
    // copy in methods from controller
    var self = this
    setTimeout(function () {
        if (self._controller) {
            self._controller(self.scope, self)
        }
    });
}

Seed.prototype._compileNode = function (node, root) {
    var self = this

    if (node.nodeType === 3) {
        // text node
        self._compileTextNode(node)
    } else {
        var eachExp = node.getAttribute(eachAttr),
            ctrlExp = node.getAttribute(ctrlAttr)
        if (eachExp) {
            // each block
            var binding = DirectiveParser.parse(eachAttr, eachExp)
            if (binding) {
                self._bind(node, binding)
            }
        } else if (ctrlExp && !root) { // nested controllers

            var id = node.id,
                seed = new Seed(node, {
                    parentSeed: self
                })
            if (id) {
                self['$' + id] = seed
            }

        }  else if (node.attributes && node.attributes.length) { // normal node
            slice.call(node.attributes).forEach(function (attr) {
                var valid = false
                attr.value.split(',').forEach(function (exp) {
                    var binding = DirectiveParser.parse(attr.name, exp)
                    if (binding) {
                        valid = true
                        self._bind(node, binding)
                    }
                })
                if (valid) node.removeAttribute(attr.name)
            })
        }
        // recursively parse child nodes
        if (!eachExp && !ctrlExp) {
            if (node.childNodes.length) {
                slice.call(node.childNodes).forEach(function (child) {
                    self._compileNode(child)
                })
            }
        }
    }
}

Seed.prototype._compileTextNode = function (node) {
    return node
}

Seed.prototype._bind = function (node, directive) {
    directive.seed = this
    directive.el = node

    var key = directive.key,
        snr = this.eachPrefix,
        isEachKey = snr && snr.test(key),
        scopeOwner = this
    
    if (isEachKey) {
        key = key.replace(snr, '')
    }

    // handle scope nesting
    if (snr && !isEachKey) {
        scopeOwner = this.parentSeed
    } else {
        var ancestors = key.match(ancestorKeyRE),
            root      = key.match(rootKeyRE)
        if (ancestors) {
            key = key.replace(ancestorKeyRE, '')
            var levels = ancestors.length
            while (scopeOwner.parentSeed && levels--) {
                scopeOwner = scopeOwner.parentSeed
            }
        } else if (root) {
            key = key.replace(rootKeyRE, '')
            while (scopeOwner.parentSeed) {
                scopeOwner = scopeOwner.parentSeed
            }
        }
    }

    directive.key = key

    var binding  = scopeOwner._bindings[key] || scopeOwner._createBinding(key)

    // add directive to this binding
    binding.instances.push(directive)

    // invoke bind hook if exists
    if (directive.bind) {
        directive.bind(binding.value)
    }

    // set initial value
    if (binding.value) {
        directive.update(binding.value)
    }

}

Seed.prototype._createBinding = function (key) {

    var binding = {
        value: this.scope[key],
        instances: []
    }

    this._bindings[key] = binding

    // bind accessor triggers to scope
    Object.defineProperty(this.scope, key, {
        get: function () {
            return binding.value
        },
        set: function (value) {
            binding.value = value
            binding.instances.forEach(function (instance) {
                instance.update(value)
            })
        }
    })

    return binding
}

Seed.prototype.destroy = function () {
    for (var key in this._bindings) {
        this._bindings[key].instances.forEach(unbind)
    }
    this.el.parentNode.removeChild(this.el)
    function unbind (instance) {
        if (instance.unbind) {
            instance.unbind()
        }
    }
}


module.exports = Seed
