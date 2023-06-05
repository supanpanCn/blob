大家好，我是爱水文的苏先生，一名从业5年+的前端爱好者，致力于用最通俗的文字分享前端知识的酸菜鱼

## 前言

TypeScript作为一个图灵完备的类型系统，可以帮助我们提高项目的可维护性并在开发阶段就能帮助发现一些潜在的错误。时至今日，无论是我们平时工作中在项目里使用还是学习一些第三方的库源码，都能看到它的身影。因此学习它也已经成为了一种必然

实际上，当所有人都会而你不会的时候，你便是那个被时代抛弃的人。你要非说前端最重要的是业务实现能力，是js。那我要拿出"你js这么秀，为啥还学不会ts？"，你又当如何应对？

## APIS

### **Partial**

*   功能

将源类型中的key全部变成可选并返回一个新的类型

*   实现

我们知道，一个可选的属性定义大致长这样，也就是说，我们只需要给属性名后边增加个?标记就可以了

```ts
interface Person{
    name?:string;
    age?:number;
}
```

对于Partial的接收参数来说，其拥有的key是不固定的，所以我们必须要想办法拿到每一个key。在TypeScript中，keyof关键字可以将interface转换成由键名组成的联合类型。如下，我们拿到的新的联合类型为T='name'|'age'

```ts
type T = keyof Person
```

现在我们只需要对联合类型进行遍历就能拿到每一个key了，在TypeScript中这对应in关键字。至此，我们只需要为每次拿到的key添加?标记就可以将原来的key变成可选了,最后再使用T\[K]将对应的类型从Person中取出即可

```ts
type Partial<T> = {
   [K in keyof T]?: T[K];
};
```

### **Required**

*   功能

与Partial相反，将key变成必选，并返回新的类型

*   实现

这和Partial的实现思路一样，我们只需要消掉?即可，这在TypeScript中使用-来进行消除

```ts
type Partial<T> = {
   [K in keyof T]-?: T[K];
};
```

### **Readonly**

*   功能

将key变成只读的，并返回一个新的类型

*   实现

这和Partial的实现思路也一样，我们只需要为其添加readonly关键字即可

```ts
type Partial<T> = {
   readonly [K in keyof T]: T[K];
};
```

### **Pick**

*   功能

挑选指定的key，并返回一个新的类型

*   实现

想要从源类型中挑选指定的值，首先我们需要将其作为参数传递给Pick，如下，我们通过泛形K来标识将来要挑选的值，至于泛形T，自然就是源类型了

```ts
type Pick<T,K>{}
```

比较好理解的是，我们的K不能是随意的，它受到T的约束，这个我们使用extends来实现，可以看到我们的K实际上是一个联合类型

```ts
type Pick<T,K extends keyof T>{}
```

最后我们只需要遍历这个联合类型，并重新生成一个新的类型就可以了，至于k的类型，和前边一样从源类型中提取即可

```ts
type Pick<T,K extends keyof T>{
    [P in K]:T[P]
}
```

### **Omit**

*   功能

从一个指定的对象类型中排除指定的key

*   实现

首先，它包含两个泛形参数T和U，T是源类型，U是要排除的key

```ts
type Omit<T,U> 
```

第二步，我们来思考U是否需要约束，它应且本应只包含T中的key，传递不存在的实际上并不参与类型运算

```ts
type Omit<T,U extends keyof T>
```

第三步，我们拿到所有的key，至于对应的类型，由于我们已经约束了U，所以可以放心通过key从T中取即可

```ts
type Omit<T,U extends keyof T> = {
    [K in keyof T]:T[K]
}
```

最后就是对K进行类型判断，如果它是U的子类型我们就排除，否则就保留

```ts
type Omit<T,U extends keyof T> = {
    [K in keyof T as P extends U ? never : P]:T[P]
}
```

*   扩展解法

使用Pick和下文实现的Exclude也可以实现同样的功能，有兴趣的可以自己动手写一下哦

### **Exclude**

*   功能

这个从功能上讲和Omit有点像，不过它主要用于联合类型。从第一个联合类型参数中，将第二个联合类型中出现的联合项排除

*   实现

首先我们确定了Exclude接收两个参数

```ts
type Exclude<T,U>
```

我们在功能解释中说明了这两个泛形一般为联合类型，那么是否需要对T和U进行约束呢？答案是不需要！因为尺有所短，寸有所长，它善于处理联合类型不代表它只能处理联合类型

那么我们如何做到和interface中那样拿到每一个key呢？只有拿到了每一个key值我们才有机会去进行比较以确定排除。在TypeScript中，当使用extends对一个联合类型执行判断时，它会拿每一个key来分别比较，故我们拿每一个T中的key判断是否是U的子类型，是就设置为nerver标识排除就好了

```ts
type Exclude<T,U> = T extends U ? never : T
```

***

打call时间：

至此，十二个内置工具类型我们已经学完一半了，我想你一定累了，所以我们休息一下

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a3e950062fb94af0802fc43931253b0b~tplv-k3u1fbpfcp-watermark.image?)

我目前正在开发一个名为[unplugin-router](https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2FsupanpanCn%2Funplugin-router%2Ftree%2Fmaster "https://github.com/supanpanCn/unplugin-router/tree/master")的项目,它是一个约定式路由生成的库，目前已支持在webpack和vite中使用，也已完成对vue-router3.x和vue-router4.x的支持，且已经接入到公司的一个vite3+vue3的项目中

不过受限于工作时间进度比较慢，在此寻找志同道合的朋友一起来完成这件事，后续计划对功能做进一步的完善，比如支持@hmr注解、支持权限路由等，也有对react路由和svelte路由的支持计划，以及除了webpack和vite这两个之外的构建工具的支持，还有单元测试的编写.....

***

### **Extract**

*   功能

从T类型中提取可以赋值给U的类型，返回一个联合类型

*   实现

同样的它应有两个泛形，不过不需要对其进行类型约束

```ts
type Extract<T,U>
```

前文我们已经说过了，对于泛形是联合类型时，extends关键字会进行分配比较，所以我们相当于在拿T中的每一个key去判断是否是U的子类型，不是就过滤掉

```ts
type Extract<T,U> = T extends U ? T : never
```

### **Record**

*   作用

构造具有类型T的一组属性K的类型，返回新的对象类型

*   实现

同样接受两个泛形

```ts
type Record<T,U>
```

这里需要对泛形进行约束，对于泛形T，必须为联合类型

```ts
type Record<T extends keyof any,U>
```

然后只需要遍历每一个key并为其设置类型为U即可

```ts
type Record<T,U> = {
    [k in T]:U
}
```

### **NonNullable**

*   功能

从给定的类型T中排除undefined和null

*   实现

我们通过条件判断是否是null或undefined，是就设置为never就好了

```ts
type NonNullable<T> = T extends null|undefined ? never : T
```

*   扩展解法

通过空类型取交叉也可以达到同样的效果，感兴趣的可以自己尝试下哦

### **Parameters**

*   功能

提取函数参数的类型

*   实现

首先，它接受一个函数的ts定义

```ts
type Parameters<T extends (...args:any)=>any>
```

接着，我们对args进行推断，这需要用到infer关键字

```ts
type Parameters<T extends (...args:any)=>any> T extends (...args:infer P)=>any ? P : never
```

### **ReturnType**

*   功能

获取函数的返回值类型

*   实现

和Parameters一样，在返回值位置处进行推断

```ts
type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;
```

### **ThisParameterType**

*   功能

获取函数的this类型

*   实现

和Parameters一样，同样借助infer关键字在条件类型中推断

```ts
type ThisParameterType<T extends (this:any,...args: any) => any> = T extends (this infer S,...args: any) => infer S ? S : any;
```
