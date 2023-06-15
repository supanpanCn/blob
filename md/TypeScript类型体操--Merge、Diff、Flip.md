大家好，我是苏先生，一名热爱钻研、乐于分享的前端工程师，跟大家分享一句我很喜欢的话：人活着，其实就是一种心态，你若觉得快乐，幸福便无处不在

## 前言

[上一节](https://juejin.cn/post/7240112966174343205)，我们通过**12**个内置工具类型初步感受了下类型体操是个啥：通过对一个已知类型编程生成一个新的类型

按照本小册的规划，还差**87**个...

本节，我们增加下难度，一起来实现下Merge、Diff、Flip

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6fac406acaea48c3b8522e44e5820034~tplv-k3u1fbpfcp-watermark.image?)

## 提示

对于语法层面的知识点[本系列（类型体操开头的标题）](https://juejin.cn/column/7233765235953205304)不会展开说明哈，可以自行搜索学习其他大佬的优质文章或者等我后续更新补充

## Merge

### 功能

合并两个已知类型，对于同名的key，向前进行覆盖，最后返回一个新类型

### 实现

它接收两个泛型参数：T、U

```ts
type Merge<T,U>
```

我们要判断的是key是否重复，因此我们必须拿到每一个key值，这在TypeScript中可以通过keyof来获取，并且它返回的是一个联合类型

```ts
type KOfT = keyof T
type KOfU = keyof U
```

然后，我们需要将KOfT和KOfU进行合并，生成一个具有不重复key的联合类型

```ts
type UniKey = KOfT | KOfU
```

我们使用|生成一个新的联合类型，在这一过程中，TypeScript会自动将重名的key进行剔除，如图所示

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8d4c0129740c42fa945f4558744ad696~tplv-k3u1fbpfcp-watermark.image?)

接着，我们需要拿到T中的每一个key到U中判断是否存在，因此我们还需要使用in关键字进行遍历

```ts
type UniKey = K in KOfT | KOfU
```

然后，我们使用extends关键字来构建条件类型，并分情况讨论：

1-K是KOfU的子类型，则直接使用KOfU的key作为合并后的结果

2-如果不是，则判断是否是KOfT的子类型，不是则使用never进行过滤

```ts
K extends KOfU ? S[K] : K extends KOfT ? T[K] : never
```

最后我们只需要借助映射类型进行下组装就可以啦：

```ts
type Merge<T, U> = {
  [K in keyof T | keyof U]: K extends keyof U
    ? U[K]
    : K extends keyof T
    ? T[K]
    : never;
};
```

## Diff

### 功能

找出两个对象类型的差异，并将差异部分组成一个新的类型返回

### 实现

它接收两个泛型参数

```ts
type Diff<T,U>
```

这两个泛形应该是对象类型，因此我们需要对其进行约束

```ts
type Diff<T extends object,U extends object>
```

同样的，我们要先将获取到两个类型的所有的key，然后才能考虑进行比较判断，关于key的获取，按照前文的实现，我们可以使用keyof先将其转换为联合类型再通过|来得到，但是这里我们换一种实现方式，我们先对接口进行合并然后再keyof取值

```ts
type UniKey = keyof (T&U)
```

接着我们拿到新类型UniKey中的每一个key，即K

```ts
K in UniKey
```

此时，如果我们能拿到两个类型共有的部分，那就可以使用在[手写12个TypeScript内置工具类型](https://juejin.cn/post/7240112966174343205)中实现的Exclude工具类型进行排除：

1-获取类型的公共部分

```ts
type Com = keyof (T|U)
```

2-使用Exclude工具类型将key排除

```ts
type Excluded = Exclude<K,Com>
```

接着我们将其断言为新的类型Excluded

```ts
K in UniKey as Excluded
```

至于key对应的原泛型中的类型，我们使用索引访问类型直接从接口合并结果中取就好了

```ts
(T&U)[K]
```

最后，老规矩，我们通过映射类型进行下组装：

```ts
type Diff<T extends object,U extends object> = {
    [K in keyof (T & U) as Exclude<K,keyof (T|U)>]:(T&U)[K]
}
```

***

推广时间：

我本来一直在推我的[约定式路由库](https://github.com/supanpanCn/unplugin-router)，不过目前看来收效甚微。如果它是我的人间理想的话，那挣票子则是我的面包，所以我选了几个我认为是我们大多数前端开发者容易忽略但又很重要的小册并把链接贴到下边，它们可能对你当下工作不会产生很重大的影响，但是当你面试或者想要长期在编程领域发展时，它们一定是必须的。有需求的掘友自行购买哈

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a3e950062fb94af0802fc43931253b0b~tplv-k3u1fbpfcp-watermark.image?)

*   [深入剖析 Node.js 底层原理](https://s.juejin.cn/ds/UbfptvJ/)

*   [图解网络协议](https://s.juejin.cn/ds/UbPm5ek/)

*   [javascript设计模式原理与实战](https://s.juejin.cn/ds/UbPKeMG/)

*   [前端调试通关秘籍](https://s.juejin.cn/ds/Ub52SEL/)

***

## Flip

### 功能

交换一个对象类型的key和value，并返回一个新的类型

### 实现

它接受一个泛型类型T

```ts
type Flip<T>
```

由于对象类型的key只能是基本类型，但是其value却可以是任意类型，那就意味着，当我们使用索引类型T\[K]来取value作为新的key时，将会有报错风险，因此，我们对key进行下约束

```ts
type Flip<T extends Record<string|number|boolean,any>>
```

接着我们获取到每一个key

```ts
K in keyof T
```

然后对其进行断言

```ts
type NewKey = K as T[K]
```

最后使用映射进行组装，并将K作为value即可

```ts
type Flip<T extends Record<string|number|boolean,any>> = {
    [K in keyof T K as T[K]] : K
}
```

关于“理想很丰满，现实很骨感”这句话，许是对的！！！上文的写法会被TypeScript推断出错误

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4ce450579caf4c42a0a352ab50ba4352~tplv-k3u1fbpfcp-watermark.image?)

按照错误提示，我们将boolean修改为symbol后的最终代码实现如下

```ts
type Flip<T extends Record<string|number|symbol,any>> = {
    [K in keyof T as T[K]] : K
}
```

***

如果本文对您有用，希望能得到您的star
