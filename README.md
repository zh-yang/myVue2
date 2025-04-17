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


# 0.0.6 初步实现循环渲染
> 有一定的局限性，如：只支持对象列表循环渲染
```html
<li sd-each-todo="todos">
    <span class="todo" sd-text="todo.title" sd-class-done="todo.done"></span>   
</li>
```
```js
// 循环渲染的元素，用新的Seed示例维护，每一条都有一个实例
new Seed(rootEl)
`sd-each-todo="todos"` /*--->*/ bind() {
    this.el['sd-block'] = true
    this.prefixRE = 'todo.'
    this.el.remove()
    this.childSeeds = []
} /*--->*/ setScope() {
    this.scope.todos = [ {  } ]
} /*--->*/ update() {
    todos/*this.value*/.forEach((item, i) => {
        const spore = new Seed(cnode = this.el.cloneNode)
        this.el.parentNode.insertBefore(cnode)
        todos[i] = spore.scope
        this.childSeeds.push(spore)
    })
}
```

# Seed (WIP)
## a mini MVVM framework

- 5kb gzipped!
- DOM based templates with precise and efficient manipulation
- POJSO (Plain Old JavaScript Objects) FTW.
- Auto dependency extraction for computed properties.
- Auto event delegation on repeated items.
- [Component](https://github.com/component/component) based, can be used as a CommonJS module but can also be used alone.

[Doc under construction...]

### Template

### Controller

- Nested Controllers and accessing parent scope
- Controller inheritance

### Data

### Data Binding

### Filters

### Computed Properties

### Custom Filter

### Custom Directive