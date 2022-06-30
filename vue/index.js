class Vue {

  constructor(options) {
    this.type = ['v-if', 'v-show', 'v-model']//便于拓展
    this.event = ['@click',]
    this.el = document.querySelector(options.el)
    this.$options = options
    this.data = options.data()
    this.domPool = new Map()
    this.init()
  }

  init () {
    this.initData()
    this.initDomPool(this.el)
    this.initDom(this.el)
    this.initMethods();
    this.initEventPool(this.el);
  }
  observe (obj, key, value) {
    const that = this
    Object.defineProperty(obj, key, {
      get () {
        return value
      },
      set (newV) {
        value = newV
        for (let [k, v] of that.domPool) {
          this.changeDom(k, v, key, newV)
        }
      }
    })

  }
  initData () {
    for (let key in this.data) {
      this.observe(this, key, this.data[key])
    }
  }

  initDom (el) {
    // 初始化 v-if v-show 和 模板文本
    for (let [k, v] of this.domPool) {
      switch (k.nodeType) {
        case 1:
          this.changeDom(k, v, v.bind, null)
          break;
        case 3:
          k.nodeValue = this[v]
          break;
        default:
          break;
      }
    }
  }

  changeDom (k, v, key, value) {

    if (value === null) {
      switch (v.type) {
        case 'v-if':
          !v.value && k.parentNode.replaceChild(v.commont, k)
          break;
        case 'v-show':
          v.value ? k.style.display = 'block' : k.style.display = 'none'
          break;
        case 'v-model':
          k.value = this[v.bind]
          k.addEventListener('keyup', () => {
            this[v.bind] = k.value
          })
          break;
        default:
          break;
      }
      return
    }
    if (v.bind === key) {
      v.value = value
      switch (v.type) {
        case 'v-if':
          v.value
            ? v.commont.parentNode.replaceChild(k, v.commont)
            : k.parentNode.replaceChild(v.commont, k)
          break;
        case 'v-show':
          v.value ? k.style.display = 'block' : k.style.display = 'none'
          break;
        default:
          break;
      }
    }
    // 模板的文本节点
    else {
      if (v === key) {
        k.nodeValue = value
      }
    }
  }
  initDomPool (el) {
    if (!el.childNodes.length) {
      return
    }

    const _childNodes = el.childNodes
    _childNodes.forEach(item => {
      switch (item.nodeType) {
        // 如果他是一个节点 就判断身上有没有操作符
        case 1:

          this.type.forEach(t => {
            let bindValue = item.getAttribute(t)

            if (bindValue) {
              switch (t) {
                case 'v-if':
                  this.domPool.set(item, { type: 'v-if', bind: bindValue, 'value': this[bindValue], 'commont': document.createComment('v-if') })
                  break;
                case 'v-show':
                  this.domPool.set(item, { type: 'v-show', bind: bindValue, 'value': this[bindValue] })
                  break;
                case 'v-model':
                  this.domPool.set(item, { type: 'v-model', bind: bindValue })
                  break;
                default:
                  break;
              }
            }
          })
          break;
        //递归到最后一项就是文本
        case 3:
          //如果子节点直接是模板 就添加到domPool
          const code = /\{\{(.+?)\}\}/
          const _value = item.nodeValue
          const match = code.test(_value)
          if (match) {
            const _key = _value.match(code)[1].trim()
            this.domPool.set(item, _key)
          }
          break;

        default:
          break;
      }
      this.initDomPool(item)
    })


  }

  initMethods () {
    for (let [k, i] of Object.entries(this.$options.methods)) {
      this[k] = i
    }
  }
  // @操作
  initEventPool (el) {
    const _childNodes = el.childNodes
    if (el.nodeType !== 1) {
      return
    }

    _childNodes.forEach(item => {
      if (item.nodeType === 1) {

        for (let i of this.event) {
          const eventName = item.getAttribute(i)

          if (eventName) {
            item.addEventListener('click', this[eventName].bind(this))
          }
        }
        this.initEventPool(item)
      }
    })
  }
}