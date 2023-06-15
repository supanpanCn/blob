大家好，我是苏先生，一名热爱钻研、乐于分享的前端工程师，跟大家分享一句我很喜欢的话：人活着，其实就是一种心态，你若觉得快乐，幸福便无处不在

## 问题描述与复现

*   问题描述

最近在写一个表单编辑的需求，当点击编辑按钮时跳转到新页面，并调用接口对部分表单进行初始值设置，由于还涉及到dom操作，干脆我就一起写到mounted里边了

当点击重置按钮时，我是希望它把值恢复到我一开始进入页面时设置的值，但是它却将所有表单都进行了清空

*   复现

进入element-plus官网，找到form表单，选择带有重置按钮的示例，并点击下图中的按钮进入到在线代码

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fe01ac5cf6fd49ee953ae28d3d46e62f~tplv-k3u1fbpfcp-zoom-1.image)

对示例源码进行修改，从vue中导入`onMounted`，并在该生命周期内对email表单项进行设置值，如下，我使用setTimeout来模拟接口成功后设置初始值。进行该修改后，点击重置，你会发现Email表单项被清空

```ts
import {...,onMounted } from 'vue'
...
onMounted(()=>{
    setTimeout(()=>{
      dynamicValidateForm.email = '1372978934@qq.com'
    },200)
})
...
```

## 问题分析

首先，我们找到点击重置时执行的代码

```ts
const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
}
```

我们找到源码的form文件夹下的form.vue文件，并找到对应的`resetFields`方法定义，可以看到它执行了一个方法名称为`resetField`的函数

```ts
const resetFields: FormContext['resetFields'] = (properties = []) => {
  if (!props.model) {
    debugWarn(COMPONENT_NAME, 'model is required for resetFields to work.')
    return
  }
  filterFields(fields, properties).forEach((field) => field.resetField())
}
```

我们按照引用路径，找到form-item.vue文件，并找到`resetField`方法定义。可以看出，它从form表单上下文对象上根据表单上设置的prop找到对应的属性，`getProp`拿到的应当是当前的最新的表单项的值，接着它直接使用`initialValue`对该computedValue进行了覆盖

```ts
const resetField: FormItemContext['resetField'] = async () => {
  const model = formContext?.model
  if (!model || !props.prop) return

  const computedValue = getProp(model, props.prop)

  // prevent validation from being triggered
  isResettingField = true

  computedValue.value = clone(initialValue)

  await nextTick()
  clearValidate()

  isResettingField = false
}
```

所以问题的关键就是initialValue是什么？`initialValue`是当前文件下的一个全局变量，并且它在onMounted中被设置了初始值

```ts
let initialValue: any = undefined
onMounted(() => {
  if (props.prop) {
    formContext?.addField(context)
    initialValue = clone(fieldValue.value)
  }
})
```

看到这里我想你应该就明白了，由于form表单是作为业务组件的子组件，因此它会比业务组件早patched，这就意味着，这里的onMounted会先被执行，我们后续设置的值对element的form来说并不作为初始值被认可

因此，我好像冤枉人家element-plus了，根本原因好像是我们自己写的代码有问题

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b5a0a8cae41e41098ad82b6a84a4f103~tplv-k3u1fbpfcp-zoom-1.image)

## 思考

既然知道了根本原因，那解决起来似乎就很容易了，同样的，我们以线上的示例来说明，我们只需要将onMounted替换为onBeforeMount把值的设置前置就好了

```ts
onBeforeMount(()=>{
    dynamicValidateForm.email = '1372978934@qq.com'
})
```

可是，我这是需要从后台拉取的数据，是异步的，我怎么保证它比业务组件快呢？可能有些人会说了，你`async`一下不就完了嘛

```ts
onBeforeMount(async ()=>{
    dynamicValidateForm.email = await fetchValue()
})

const fetchValue = async ()=>{
  return new Promise((resolve)=>{
    resolve('1372978934@qq.com')
  })
}
```

人家vue凭什么要为你埋单呢？？？所以啊，我们还是需要把他当成一个bug来处理的！！！（ps：开发期间为了优先完成任务我的做法是自己在内部缓存一份初始值，然后手动的进行重新设置）

## 如何修改源码

所以，我们要如何能fix掉element-plus的这个问题呢？

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/85518507a5154822a1bf516043184c94~tplv-k3u1fbpfcp-watermark.image)

以下是我的一些思路分享：

### 通用方式

`patch-package`是我优先想到的方式，但是考虑到，它对源码的修改是针对版本号生成的，而npm包依赖的升级又会根据定义规则的不同而有所不同，要不就直接将版本号写死来杜绝这种风险，可是这又无法享受到element-plus后续的更新功能了

考虑到这种情况，我并没有去操作它，不过它使用起来也及其简单：

1-修改源码

我们需要找到node\_modules下已经打包好的element-plus项目，并找到form-item组件对应的初始化设置值的地方，然后定义一个回调函数：从props传递下来，又或者监听一下`locaStorage`的变化等

2-创建补丁文件

```js
npx patch-package element-plus
```

### vue独享

我还想到了vue的extends，它允许我们扩展或修改原组件

所以我们新建一个form-item组件，并且它继承自element-plus的form-item，然后我们将原来的mounted方法中的代码原封不动的拿过来，最后再加上我们自己的逻辑，比如监听下localStorage的变更，并在回调中重新设置initialValue

```js
delete FormItem.mounted
const FormItemPatched = {
  extends: FormItem,
  mounted() {
    if (props.prop) {
      formContext?.addField(context)
      initialValue = clone(fieldValue.value)
      window.onstorage = (payload)=>{
        initialValue = payload
      }
    }
  },
}
```

如此一来，我们就可以在业务组件中通过localStorage.setItem来将初始值传递给form-item内部了

```js
localStorage.setItem('somekey',initialValue)
```

这个方案几乎是完美的，我们只需要在我们当前这一个页面调用Vue.component进行注册，它就既能解决我们当下的问题，又不会影响到element-plus后续的更新

### 奇技淫巧

以上两种算是比较正规的思路，还有一种我觉得也是可行的方式：

我们将element-plus源仓库fork一份到我们自己的仓库，这样我们就掌握了对element-plus的控制权，那岂不是想怎么魔改都可以！！！

但问题是，我怎么去获取后续的更新呢？

创建一个工作流定期的去执行一个任务，在任务里我们去获取element-plus的最新版本号，这样就能对比出是否源仓库发生了更新，如果发生了更新，则我们重新拉取一次

那用户侧怎么知道仓库有更新呢？

同样的思路，我们可以选择为启动开发服务器设置中间件，并在此读取和对比更新，当存在更新时在控制台中打印出消息提示等动作

## 总结

本文通过一个bug引出了修改第三方库的几种实现方式，其中：对于vue项目来说，方式二是最上乘的解决方案；对于普通项目而言，方式一则是大众的实现思路。而方式三则是一个自我学习、自我提升甚至有点炫技的方式

***

如果本文对您有用，希望能得到您的star

***
