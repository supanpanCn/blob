大家好，我是苏先生，一名热爱钻研、乐于分享的前端工程师，跟大家分享一句我很喜欢的话：人活着，其实就是一种心态，你若觉得快乐，幸福便无处不在

## 前言

在[这么卷的2023，你还搞不懂vue响应式？](https://juejin.cn/post/7229691976605696059)一文中，我们通过手写的形式实现了响应式的核心内容，了解了响应式的核心实现思路。但文章只进行了横向实现，对其实现细节并未提及。

本篇我们纵向深入，将关注点放到数据本身，来进一步探讨对Object类型的处理细节，并补充上一节中对属性删除和编辑逻辑的处理缺失

## 拦截器的选择

[前文](https://juejin.cn/post/7229691976605696059)中我们直接使用Proxy来进行实现，这也是vue3中的方案，但在vue2中使用的其实是Object.defineProperty。至于原因嘛，网上已经被人说烂了，不过为了文章的完整性，我也简单总结下：

*   对数据类型的非原生支持，需要提供补救api，比如this.\$set
*   需要在初始化阶段执行全量递归，影响性能

## Proxy与Reflect

在分析数据类型的处理之前，我们还需要搞懂Proxy和Reflect这两个的一些关键点问题，不过我不打算去长篇大论它们，我只会对与本文相关的特性或概念进行阐述说明，因为这对于后文的理解很重要

### Proxy

Proxy可以创建一个代理对象，它允许我们拦截并重新定义对一个对象的基本操作，而所谓基本操作即一个动作，反过来说，如果一个操作由两个动作完成，那就不是基本操作，而叫复合操作了

以如下代码来说明，我们定义了对象obj，它包含一个名称为say的属性，并且其值为一个函数。当我们执行p.say时是一个基本操作，因为它只包含了获取这一个动作，如果我们执行的是p.say()，那它就是一个复合操作了，因为这包含了两个动作：1-获取p.say；2-对p.say的结果进行调用

```js
const obj = {
    say:function(){}
}
const p = new Proxy(obj,{
    get(){
        ...
    }
})
```

### Reflect

如果你阅读过它的相关文档，你会发现任何能够在Proxy中找到的方法，都能够在Reflect中找到同名的函数。对于本文来说，我们只关注它的第三个参数：receiver

我们先回顾下[这么卷的2023，你还搞不懂vue响应式？](https://juejin.cn/post/7229691976605696059)一文中我们实现的代码

```js
const obj = {
    name:'spp'
}
const p = new Proxy(obj,{
    get(target,key){
        ...
        return target[key]
    },
    set(target,key,newValue){
        target[key] = newValue
        ...
    }
})
```

现在我把obj对象进行下改造,为其增加get访问器，并在内部打印this是否就是代理对象p

```js
const obj = {
    get getName(){
        console.log(this === p)
    }
}
const p = new Proxy(obj,{...})
```

如果你运行该示例，你会发现其结果为fasle，这意味着，我们如果在get访问器中通过this访问对象上的name属性时，是无法正确触发依赖收集的

那么是什么原因导致的呢？我们来分析一下，在Proxy内我们是通过target\[key]获取返回值的，我们知道在JavaScript中，谁调用this就会指向谁，所以this指向的原始对象，而原始对象我们是不进行依赖追踪的

因此，我们要利用第三个参数修正下this指向，就像call、apply、bind所做的事情一样

```js
const obj = {
    get getName(){
        console.log(this === p)
    }
}
const p = new Proxy(obj,{
    get(target,key,receiver){
        ...
        return Reflect.get(target,key,receiver)
    }
})
```

可以看到，我们使用Reflect进行映射而不再直接返回target，此时再次打印你会发现结果就为true了

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a973b6aaa4d54bad99fe862c8f301e58~tplv-k3u1fbpfcp-watermark.image?)

## 抽离依赖追踪与更新派发

先不要着急嘛，小伙子！在真正开始之前，我们还需要填个坑

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e4c64c54aea14a788d9ef7e171deac73~tplv-k3u1fbpfcp-watermark.image?)

在[这么卷的2023，你还搞不懂vue响应式？](https://juejin.cn/post/7229691976605696059)一文中我们将依赖追踪和派发更新的代码内置到了get和set内，为了代码的可复用与可维护性，我们需要先将其进行下抽离（见demo\vue\响应式设计与实现\07.js）

### trace

```js
function trace(target,key){
    if (!actEffect) return target[key];
    let reactiveObj = bucket.get(target);
    if (!reactiveObj) bucket.set(target, (reactiveObj = new Map()));
    let effects = reactiveObj.get(key);
    if (!effects) reactiveObj.set(key, (effects = new Set()));
    effects.add(actEffect);
    actEffect.deps.push(effects);
}
```

### trigger

```js
function trigger(target, key, value){
    target[key] = value;
    const reactiveObj = bucket.get(target);
    if (reactiveObj) {
      const effects = reactiveObj.get(key) || [];
      const t = new Set(effects); 
      t.forEach((v) => {
        if(actEffect !== v){
            taskQueue.add(v)
            flushTask()
        }
      });
    }
}
```

## 代理Object类型（见demo\vue\响应式设计与实现\08.js）

[这么卷的2023，你还搞不懂vue响应式？](https://juejin.cn/post/7229691976605696059)一文中我们假设对象读取操作只有一种，即obj.keyName,但实际上in操作符和for...in循环都是对象访问的形式

### 处理in操作符

由于Proxy上并没有一眼就能看出来是哪个拦截函数与之相对应，所以理论上来说我们需要去查阅相关规范才行。不过我比较懒，我选择先去看下阮一峰的es6教程，事实上，还真被我找到了

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/61821e4b89b34349a359ab4d4133029b~tplv-k3u1fbpfcp-watermark.image?)

因此，对于in操作符，我们使用has拦截器来实现依赖追踪，并通过Reflect来判定是否存在

```js
const obj = {
    name:'spp'
}
const p = new Proxy(obj,{
    has(target,key){
        trace(target,key)
        return Reflect.has(target,key)
    }
})
```

### 处理for...in循环

同理，我们找到关于for...in的拦截器

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3b38cd55350d448d9808ffbda54fd211~tplv-k3u1fbpfcp-watermark.image?)

#### 模拟key

仔细观察我们发现，ownKeys拦截器只提供了target而缺失了key属性，而key恰恰是我们构造bucket数据结构中最最重要的一环，它与具体的effect进行关联

因此，我们需要自己去构造一个唯一的值并当作key值使用，显然Symbol很适合

```js
const UNI_KEY_FOR_IN = Symbol()
```

为此，我们需要在依赖追踪时向trace函数传入该UNI\_KEY\_FOR\_IN

```js
const proxyObj = new Proxy(obj, {
  ...
  ownKeys(target){
    trace(target,UNI_KEY_FOR_IN)
    return Reflect.ownKeys(target)
  }
});
```

***

#### 确认关联关系

上一小节，我们使用一个Symbol值解决了ownKeys缺失key属性的问题，但是这又引出了一个新的问题：什么时候应该触发Symbol值对应的副作用函数重新执行？

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c98f17abd2704095b7161cd9e8022ff1~tplv-k3u1fbpfcp-watermark.image?)

这个问题其实等价于，哪些情况是需要进行依赖追踪的？现在我们分情况来进行下讨论：

*   新增

当新增属性时，我们希望能追踪到依赖，为此我们需要在trigger中将与Symbol值关联的effect取出执行一遍

```js
function trigger(target, key, value){
    ...
    // 取出UNI_KEY_FOR_IN，兼容for...in
    const forInEffects = reactiveObj.get(UNI_KEY_FOR_IN) || new Set()
    forInEffects.forEach(v=>t.add(v))
    ...
}
```

*   修改

当修改时，由于属性已经被依赖收集过，所以我们不需要再次进行收集。不过对于Proxy而言，对象属性的新增和删除统称为对象的设置，因此我们需要能够区分出当前是在进行哪种操作，这一点，我们只需要通过判断对象上是否已经存在即可做出区分，并且将其作为trigger的第三个参数传入

```js
...
const p = new Proxy(obj,{
    set(target,key,value){
        const type = target[key] ? 'edit' : 'add'
        trigger(target, key, type)
        ...
    }
})
```

然后在trigger中，我们根据type的类型为for...in的追踪逻辑添加守卫

```js
function trigger(target, key, value){
    ...
    // 当为新增时，取出UNI_KEY_FOR_IN，兼容for...in
    if(type === 'add'){
      const forInEffects = reactiveObj.get(UNI_KEY_FOR_IN) || new Set()
      forInEffects.forEach(v=>t.add(v))
    }
    ...
}
```

*   删除

在[这么卷的2023，你还搞不懂vue响应式？](https://juejin.cn/post/7229691976605696059)一文中我们当时为了解决dead code问题实现了reset用于重新进行依赖收集，这刚好也可以用于属性删除上

鉴于目前我们还没有处理过属性值的删除，因此老规矩，我们先查阅下阮的文档并找到deleteProperty拦截器

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/aacb42a435d140c68ca93c4857e57bd2~tplv-k3u1fbpfcp-watermark.image?)

这里我们使用Object.property.hasOwnProperty来过滤原型上的属性，当删除成功后重新收集依赖，这样在reset中就会切断删除的那个key所对应的effect了

```js
...
const p = new Proxy(obj,{
  deleteProperty(target,key){
    const exist = Object.prototype.hasOwnProperty(target,key)
    if(exist){
        const isDel = Reflect.deleteProperty(target,key)
        if(isDel){
            trigger(target,key,'delete')
            return true
        }
    }
    return false
  }
})
```

另外，你可能也注意到了，trigger函数的第三个参数类型我们新增了delete类型，这主要对应for...in循环的兼容处理

```js
function trigger(target, key, value){
    ...
    // 当为新增或删除时，取出UNI_KEY_FOR_IN，兼容for...in
    if(type === 'add' || type === 'delete'){
      const forInEffects = reactiveObj.get(UNI_KEY_FOR_IN) || new Set()
      forInEffects.forEach(v=>t.add(v))
    }
    ...
}
```

*   代码实现

代码比较多，感兴趣的可以到根据前文提示到对应的文件下查看完整的实现哈，我这里就不再贴了

## 总结

本文，我们通过引出[前文](https://juejin.cn/post/7229691976605696059)对in和for...in处理的缺失，从而在对应的解决过程中顺道实现了一个对象除了新增之外，对删除、编辑的处理。至此，关于Object类型的处理就基本完成了。下一节，我们将继续探究关于Array类型的处理

***

如果本文对您有用，希望能得到您的star

***