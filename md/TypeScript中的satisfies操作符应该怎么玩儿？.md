大家好，我是苏先生，一名热爱钻研、乐于分享的前端工程师，跟大家分享一句我很喜欢的话：人活着，其实就是一种心态，你若觉得快乐，幸福便无处不在

## 前言

TypeScript4.9中新引入了satisfies操作符，按照官方的说法，它用于在确保某些表达式与某种类型匹配的同时保留该表达式的最特定类型以进行推理

在我看来，它和as关键字的用法差不多，或者说它的出现是对as关键字的一种优化。下边我们以几个示例来切身感受下satisfies的不同之处

## 示例一

之前，我们想要去复用一个类型时，为了使其满足当下的需求，常常需要借助as帮我们完成类型改造

```ts
interface MyElement{
    class:string;
    src:string;
}
const a = {
    class:'test'
} as Partial<MyElement>

```

上边的代码，当你尝试从a.class上调用toString()方法时，TypeScript会报错，因为src是此时是一个可选的属性，我们必须在调用前添加?以安全的访问它。除此之外，我们对a.src的访问也不会引起TypeScript的类型错误提示

```ts
a.class?.toString()
a.src
```

对于前者，大多数情况下这都是可以接受的，无非就是每次调用的时候麻烦一点。但是对于后者则有可能导致致命性错误。比如你开发了某个npm包，它进行了[插件化设计](<https://juejin.cn/post/7237697495110074428>)，那么此时这个src属性就有可能对第三方开发者产生误导

现在，我们使用satisfies来进行改造，它会对原类型与实际值结合后推断出一个新的类型

```ts
const a = {
    class:'http://'
} satisfies Partial<MyElement> 
```

此时，当我们再次访问a.src时，TypeScript就能够正确推断出类型错误。并且我们对toString的调用也不需要再添加?符号来进行守卫了

## 示例二

由于类型推倒的存在，我们不需要去手动定义类型

```ts
const sp = {
    name:'spp',
    id:410324
}
```

但这无法限制a中存在的key的个数，这简单，我们去创建类型并做断言即可，就像下边这样

```ts
interface Person{
    name:string;
    id:number;
}

const sp = {
    name:'spp'
} as Person
```

现在，我们想让id能够灵活一点，除了number外，传string也可以，所以改造后长这样

```ts
interface Person{
    name:string;
    id:number | string;
}

const sp = {
    name:'spp',
    id:410324
} as Person
```

此时当我们去读取id做处理时，由于TypeScript无法判断当前到底是number还是string类型，导致在调用toFixed时就会被推断出类型错误了

```ts
sp.id.toFixed()
```

以前我们需要利用括号的优先级再一次进行断言来解决这个问题

```ts
(sp as number).id.toFixed()
```

现在，我们通过satisfies操作符就可以从根源上杜绝该问题

```ts
const sp = {
    name:'spp',
    id:410324
} satisfies Person

sp.id.toFixed()
```

## 总结

通过两个示例的讲解，我们可以总结如下：

*   能使用as的地方，也可以使用satisfies

*   satisfies兼顾了类型声明和类型推导

***

如果本文对您有用，希望能得到您的star

***

