大家好，我是爱水文的苏先生，一名从业5年的前端爱好者，致力于用最通俗的文字分享前端知识的酸菜鱼

## 前言

不论是vue2中实现的双端比较算法，还是vue3中优化过的快速比较算法，它们的核心痛点都是相通的：存在哪些必须要解决的问题

我们只有知晓了完成diff要解决哪些问题，才能在实现过程中去一点点优化

## 为什么要有diff

这世界就是一个因果轮回，没有平白无故的爱，你可能喜欢他有钱，也可能希望他能给你工作中带来帮助，又或者，他总是能逗你笑，反正，总要图点什么

因为操作虚拟dom带来的性能损耗一定是大于直接操作真实dom的，所以才要尽可能的减少虚拟dom操作的次数以达到性能更优

由此diff算法诞生

## 什么是diff

当需要对一组节点进行更新时，为了以最小的性能开销完成更新操作，需要对新旧两组节点进行比较，用于比较的算法就是diff算法

## 对比

假设有如下两组新旧节点

```js
const olds = {
    type:"div",
    el:"DOM引用",
    children:[
        {type:"p",children:"a"},
        {type:"p",children:"b"},
        {type:"p",children:"c"},
    ]
}
const news = {
    type:"div",
    el:"DOM引用",
    children:[
        {type:"p",children:"d"},
        {type:"p",children:"e"},
        {type:"p",children:"f"},
    ]
}
```

*   no diff

在无diff的情况下，由于框架只能追溯到文件级别，我们不得不卸载全部的旧节点，然后后重新去挂载全部的新节点，伪代码如下

```js
function patchChildren(n1,n2){
    if(n1 && Array.isArray(n1.children)){
        for(let i=0;i<n1.children.length;i++){
            n1.el.removeChild(n1.children[i])
        }
    }
    if(n2 && Array.isArray(n2.children)){
        for(let i=0;i<n2.children.length;i++){
            n2.el.removeChild(n2.children[i])
        }
    }
}
```

可以看到，我们遍历新旧节点分别进行for循环，一共进行了3次卸载操作和三次添加操作，3+3理论上就是6次

*   diff

先别急，我们先分析下示例节点的特点：

1-更新前后的标签元素不变，都是p标签

2-只有p标签的子节点在发生变化

可以看出，只有p标签的子节点不老实，一直在变，所以我们要做的是找到哪些不安分的点替换掉，老实人自当留下来好好为公司创造价值才对，为此，只需要进行三次dom操作就够了，我掐指一算，6除以3，好家伙，性能直接翻倍

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/078dd99b8e4f402abbbf8ddfa11d58cd~tplv-k3u1fbpfcp-watermark.image?)

伪代码如下，我们新增了patch函数来对新旧子节点进行比对，该函数会仅在发现不同节点时才会执行dom操作

```js
function patchChildren(n1, n2) {
  if (n2 && Array.isArray(n2.children)) {
    const oChildrens = n1.children || [];
    const nChildrens = n2.children;
    for (let i = 0; i < nChildrens.length; i++) {
      patch(oChildrens[i], nChildrens[i]);
    }
  }
}
```

## 核心原理讲解

### 确认遍历主体

在对比章节中，我们通过一个可能算得上比较糟粕的例子说明了diff可以更快，但忘了规定一个前置条件了：新旧节点的数量变化相同。

这这这......，有点草率了

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/950c975d3e4c4e0abcbaf46e5a460363~tplv-k3u1fbpfcp-watermark.image?)

在实际情况中，新旧节点的数量变化好似脱缰的野马，数量难料：

1-新节点的children数量 = 旧节点的children数量

2-新节点的children数量 > 旧节点的children数量

3-新节点的children数量 < 旧节点的children数量

我们针对上述情况来进行讨论

*   当=的情况下，它总是能兼顾到新旧两组的每一个子节点，此时我们选择谁都无所谓

*   当>或<的情况下：

1-如果选择较小的节点集合，则剩下的节点不是新增就是需要执行卸载的节点

```js
function patchChildren(n1, n2) {
  const oLen = n1.children.length;
  const nLen = n2.children.length;
  const len = Math.min(oLen, nLen);
  for (let i = 0; i < len; i++) {
    // 执行比对更新
    path(n1.children[i],n2.children[i])
  }
  if(oLen < nLen){
    // 执行挂载
  } else if(oLen > nLen){
    // 执行卸载
  }
}
```

2-如果选择较大的节点集合，则剩下的节点不是新增就是需要执行卸载的节点。看如下伪代码，我们为了patch函数能正常工作，**额外**增加了守卫条件，同时为了避免不必要的for循环，又**额外**增加了break代码

```js
function patchChildren(n1, n2) {
  const oLen = n1.children.length;
  const nLen = n2.children.length;
  const len = Math.max(oLen, nLen);
  for (let i = 0; i < len; i++) {
    if(n1.children[i] && n2.children[i]){
        // 执行比对更新
        path(n1.children[i],n2.children[i])
    }
    if(i >= Max.min(oLen,nLen)) break
  }
  if(oLen < nLen){
    // 执行挂载
  } else if(oLen > nLen){
    // 执行卸载
  }
}
```

我们可是连注释都懒得写的程序员啊，当然要选具有更精炼代码实现的更小节点集合咯

### 用于身份标记的key值

*   type标记的局限性

那个......，先道个歉，因为我又又又忘记规定一个前提了，那就是我们patch函数比对判断复用的前提是type字段相同

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/28b1e468831845c58e21146605b66250~tplv-k3u1fbpfcp-watermark.image?)

好了，现在，我们通过type字段来标记节点，它很好的帮助我们识别了节点身份。但问题又来了，我要是不给你玩36变，我就是天生活泼好动，没事爱到处逛逛呢？

```js
// 旧节点列表
[
 {type:"p",children:"a"},
 {type:"div",children:"b"},
 {type:"span",children:"c"},
]
// 新节点列表
[
 {type:"span",children:"2"},
 {type:"p",children:"1"},
 {type:"div",children:"3"},
]
```

好了，鉴于你这个人技术真的很强，又无可替代的，我苏某人忍了！！！

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/54c4d4e5721f436ea01d9f4e6e6e476e~tplv-k3u1fbpfcp-watermark.image?)

可是由于每次比对更新传入的是同一位置的节点，并且判断复用的条件是n1.type === n2.type，因此，每次都会被判断为不同节点从而从新创建，那应该怎么避免误判呢？

*   key的作用

为了避免误判，我想到了身份证，它让我们在整个中国都是最与众不同独一无二的存在（ps：实际上平庸的一p），于是我们为每一个节点增加具有唯一性的key值

```js
// 旧节点列表
[
 {type:"p",children:"a",key:"1"},
 {type:"div",children:"b",key:"2"},
 {type:"span",children:"c",key:"3"},
]
// 新节点列表
[
 {type:"span",children:"2",key:"3"},
 {type:"p",children:"1",key:"1"},
 {type:"div",children:"3",key:"2"},
]
```

于是加钱哥他来了

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6e22cb2685f04458bddb26cae1ad9599~tplv-k3u1fbpfcp-watermark.image?)

我管你是谁，只要在每次比对时在长列表中能找到key值，我就认为你是可复用的节点（那个活泼好动，没事瞎逛的人），伪代码如下

```js
function patchChildren(n1, n2) {
  let runArr = n1.children
  let restArr = n2.children
  const len = Math.min(runArr.length, restArr.length);
  if(restArr.length === len){
      const temp = runArr
      runArr = restArr
      restArr = runArr
  }
  for (let i = 0; i < len; i++) {
     const exist = restArr.find(v=>v.key === runArr[i].key)
     if(exist){
         // 执行比对更新
         path(runArr[i],exist)
     }  
  }
  if(runArr.length < nLen){
    // 执行挂载
  } else if(restArr > nLen){
    // 执行卸载
  }
}
```

### 处理移动节点

#### 判定节点发生移动

通过身份标记key，我们成功找到了可复用的节点并如愿通过patch函数对其子节点进行了更新，譬如：将元素标签为p的子节点由a更新为3

但问题又又又来了

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e44d309be5224ed394b5046e9527f3ad~tplv-k3u1fbpfcp-watermark.image?)

因为我们直接复用了节点，只更新了它的子节点，页面中的dom的顺序还是旧的，即p标签仍然在子元素列表的第一个位置

```html
<p>3</p>
...div...
...span...
```

我们希望将它改变到第二个位置上

```html
...div...
<p>3</p>
...span...
```

*   如何判定节点发生移动

我们先逆向思考一波来寻找规律，如果节点位置不变则可复用的节点一定在新旧节点列表中的位置是一一对应的

那反过来说，是不是当节点位置发生变化时，可复用的节点一定在新旧节点列表中的位置对不上了呢：

以前文的p标签为例，发生改变前，其位置索引为0，发生改变后，其位置索引为1，**0!==1**

以如下的p标签为例，发生改变前，其位置索引为2，发生改变后，其位置索引为0，**2!==0**

```html
// 旧的
...div...
...span...
<p>3</p>
// 新的
<p>3</p>
...div...
...span...
```

*   代码表示

我们在明确节点可复用后，即news\[i].key === olds\[j].key后，再通过比对索引位置的大小关系来判断是否发生了位置迁移，这里lastIndex是一个动态更新的值，我们用它来记录当前遇到的最大索引位置

```js
function checkPosChanged(news,olds){
    let lastIndex = 0
    for(let i=0;i<news.length;i++){
        for(let j=0;j<olds.length;j++){
            if(news[i].key === olds[j].key){
                if(j < lastIndex){
                    // 节点发生了移动
                }else{
                    lastIndex = j
                }
            }
        }
    }
}
```

然后我们用如下示例再手动演示一遍checkPosChanged的执行流程：

```html
// 旧
<p></p>
<span></span>
<div></div>
// 新
<div></div>
<span></span>
<p></p>
```

第一次，咱们取一个参照物，后边都基于此做相对位置计算，因此把初始的lastIndex设置为0，从而在运行时进入else分支获取参照位置；

第二次，**已知条件：1-span节点在新列表中的索引位置 > div节点在新列表中的索引位置；2-div节点的在旧列表中的索引位置为2**。仍是取新列表的span节点，并在旧列表中找到的索引位置为1\
此时1<2，即**span节点在旧列表中的索引位置 < div节点在旧列表中的索引位置**，此时位置关系对不上，说明位置发生变动；

第三次，**已知条件：1-p节点在新列表中的索引位置 > span节点在新列表中的索引位置；2-span节点的在旧列表中的索引位置为1**。仍是取新列表的p节点，并在旧列表中找到的索引位置为0\
此时0<1，即**p节点在旧列表中的索引位置 < p节点在旧列表中的索引位置**，此时位置关系对不上，说明位置发生变动；

#### 更新虚拟节点到实际的dom节点

现在，我们已经掌握了更新节点的核心条件，接下来就是当条件满足时去执行更新逻辑，不过在此之前，我想先把一些公共的辅助函数定义一下，目前它大概长这样:

```js
const helpers = {
    insert(){}
}
```

如上，我用一个对象来承载更新操作，但目前它什么都做不了。那该如何去实现它，且容我想一哈......

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/148e992b12094d4c910b030c7917f8de~tplv-k3u1fbpfcp-watermark.image?)

由于操作的是真实的DOM，所以必然绕不开insertBefore，既然是insertBefore，那参数就明了了

```js
const helpers = {
    insert(parent,el,sibling=null){
        parent.insertBefore(el,sibling)
    }
}
```

所以，就只需要在判定到需要移动时喊它来处理一下就ok了

```js
function patchChildren(n1,n2,continer){
    const oldChildren = n1.children
    const newChildren = n2.children
    let lastIndex = 0
    for(let i=0;i<newChildren.length;i++){
        const v = newChildren[i]
        let j = 0
        for(j;j<oldChildren.length;j++){
            const k = oldChildren[j]
            if(v.key === k.key){
                // 对当前节点进行比对更新
                ...
                // 判断节点变动
                if(j<lastIndex){
                    const pre = v[i-1]
                    if(pre){
                        const anchor = pre.el.nextSibling
                        helpers.insert(k.el,continer,anchor)
                    }
                }else{
                    lastIndex = j
                }
            }
        }
    }
}
```

由于for循环的遍历顺序正好代表着新节点在DOM中的顺序，即v\[i-1]标识当前节点的前一个兄弟节点。而lastIndex = j恰好就是前一个兄弟节点在旧列表中的位置，因此，我们已经确定了当前节点和前一个兄弟节点在新列表中的对应位置

此时只需要推断出当前节点和前一个兄弟节点在旧列表中的位置关系与新列表不等即可证明移动，结合前文的分析，即j < lastIndex时

### 处理新增节点

要想处理新增，有两个迫切需要解决的点：

1-如何判断是新增节点

2-如何挂载到正确的位置

为了防止你懒得向上翻，我把前一小节的代码拷贝一份

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/26e1c5d8ce154420a6023971cfef7dfc~tplv-k3u1fbpfcp-watermark.image?)

```js
function patchChildren(n1,n2,continer){
    const oldChildren = n1.children
    const newChildren = n2.children
    let lastIndex = 0
    for(let i=0;i<newChildren.length;i++){
        const v = newChildren[i]
        let j = 0
        for(j;j<oldChildren.length;j++){
            const k = oldChildren[j]
            if(v.key === k.key){
                ...
            }
        }
    }
}
```

如上，我们从新节点中依次取值并判断v.key === k.key时进行复用，那反过来说，v.key !== k.key时，不就说明是新增嘛！！！

好！现在咱们来分析第二个点，即如何挂载到正确的位置？这也不难，我们在前文中其实一直在强调一个概念，即：**相对位置**，所以，我们只需要将其挂载到前一个节点的后边就ok啦

解决了以上两个关键点，代码就好写了

```js
function patchChildren(n1,n2,continer){
    const oldChildren = n1.children
    const newChildren = n2.children
    let lastIndex = 0
    for(let i=0;i<newChildren.length;i++){
        const v = newChildren[i]
        let j = 0
        let isHave = false
        for(j;j<oldChildren.length;j++){
            const k = oldChildren[j]
            if(v.key === k.key){
                isHave = true
                ...
                break
            }
        }
        if(!isHave){
            const pre = v[i-1]
            let anchor = null
            if(pre){
                anchor = pre.nextSibling
            }else{
                anchor = continer.firstChild
            }
        }
        // 执行path进行挂载
    }
}
```

如上，我们增加了变量isHave来标记是否找到了可复用的节点，为false时执行新增，默认我们把容器（列表的父节点）中的第一个DOM节点作为参考位置

### 处理删除节点

终于要翻过diff算法这座大山啦，不过人生嘛，哪有一帆风顺的，所以我打算先为自己打个call

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a3e950062fb94af0802fc43931253b0b~tplv-k3u1fbpfcp-watermark.image?)

***

我目前正在开发一个名为[unplugin-router](https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2FsupanpanCn%2Funplugin-router%2Ftree%2Fmaster "https://github.com/supanpanCn/unplugin-router/tree/master")的项目,它是一个约定式路由生成的库，目前已支持在webpack和vite中使用，也已完成对vue-router3.x和vue-router4.x的支持，且已经接入到公司的一个vite3+vue3的项目中

不过受限于工作时间进度比较慢，在此寻找志同道合的朋友一起来完成这件事，后续计划对功能做进一步的完善，比如支持@hmr注解、支持权限路由等，也有对react路由和svelte路由的支持计划，以及除了webpack和vite这两个之外的构建工具的支持，还有单元测试的编写.....

***

好了，咱们书接上文！！！

要想搞清楚删除，其实咱们只需要明白当前已经做好的功能是什么样的就可以了。在现有逻辑中，如果不出意外，代码执行结束后，除了需要删除的，新旧节点一定是相同的，如果想明白了这一点，那代码应该就信手拈来了吧

```js
function patchChildren(n1,n2,continer){
    const oldChildren = n1.children
    const newChildren = n2.children
    let lastIndex = 0
    for(let i=0;i<newChildren.length;i++){
       ...
    }
    for(let i=0;i<oldChildren.length;i++){
        const v = oldChildren[i]
        const has = newChildren.find(c=>v.key === v.key)
        if(!has){
            // 执行卸载
        }
    }
}
```

如上，我们新增了for循环拿旧列表的节点到新列表中匹配，匹配不到就说明是需要进行删除的节点
