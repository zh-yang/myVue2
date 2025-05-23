function delegateCheck (current, top, marker) {
    if (current[marker]) {
        return current
    } else if (current === top) {
        return false
    } else {
        return delegateCheck(current.parentNode, top, marker)
    }
}

module.exports = {

    expectFunction : true,

    bind: function () {
        if (this.seed.each) {
            this.el[this.expression] = true
            this.el.seed = this.seed
        }
    },

    update: function (handler) {
        this.unbind()
        if (!handler) return
        var self  = this,
            event = this.arg

        if (this.seed.each && event !== 'blur' && event !== 'focus') {

            // for each blocks, delegate for better performance
            //  focus and blur events dont bubble so exclude them
            var delegator = this.seed.delegator
            if (!delegator) return
            var marker    = this.expression,
                dHandler  = delegator.sdDelegationHandlers[marker]
            // this only gets run once!!!
            if (!dHandler) {
                dHandler = delegator.sdDelegationHandlers[marker] = function (e) {
                    var target = delegateCheck(e.target, delegator, marker)
                    if (target) {
                        handler({
                            originalEvent : e,
                            el            : target,
                            scope         : target.seed.scope
                        })
                    }
                }
                dHandler.event = event
                delegator.addEventListener(event, dHandler)
            }
        } else {
            // a normal handler
            this.handler = function (e) {
                handler({
                    originalEvent : e,
                    el            : e.currentTarget,
                    scope         : self.seed.scope
                })
            }
            this.el.addEventListener(event, this.handler)
        }
    },

    unbind: function () {
        this.el.removeEventListener(this.arg, this.handler)
    }
}