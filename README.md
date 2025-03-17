# myVue2
learn vue2

# 0.0.1 第一次实现双向绑定

```js
// 简略的流程
VueCop = {
    bindings: {
        'msg': {
            value: 'hello',
            directives: [
                {
                    argument: null,
                    attr: { name: 'sd-text', value: 'msg | capitalize' },
                    definition: () => {}, // function | object
                    filters: ['capitalize'],
                    key: 'msg',
                    update: () => {},
                    el: {  }, // dom
                }
            ]
        },
        'changeMessage': {
            value(e) { console.log('click'); },
            directives: [
                {
                    attr: {
                        name: "sd-on-click",
                        value: "changeMessage | .button"
                    },
                    key: "changeMessage",
                    filters: [".button"], // 实际触发节点，没有这个，触发节点就是绑定节点
                    definition: {},
                    argument: "click",
                    el: {  }, // dom
                }
            ]
        }
    },
    scope: {
        'msg': {
            get: () => VueCop.bindings['msg'].value,
            set(newVal) {
                const binding = VueCop.bindings['msg'];
                binding.value = newVal;
                binding.directives.forEach(directive => {
                    directive.update(directive.el, binding.value); // 更新dom
                })
            }
        },
        'changeMessage': {
            get: () => VueCop.bindings['changeMessage'].value,
            set(newVal) {
                const binding = VueCop.bindings['changeMessage'];
                binding.value = newVal;
                binding.directives.forEach(directive => {
                    directive.update(directive.el, binding.value, directive.argument, directive, VueCop); // 触发事件
                })
            }
        }
    }
}
```