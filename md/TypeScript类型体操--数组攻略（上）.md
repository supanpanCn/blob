大家好，我是苏先生，一名热爱钻研、乐于分享的前端工程师，跟大家分享一句我很喜欢的话：人活着，其实就是一种心态，你若觉得快乐，幸福便无处不在

## 前言

前边两篇文章我们一共实现了**15**个工具类型，按照本小册的规划，还差**84**个...

本节将探讨元组相关的类型编程

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6fac406acaea48c3b8522e44e5820034~tplv-k3u1fbpfcp-watermark.image?)

## 提示

对于语法层面的知识点[本系列（类型体操开头的标题）](https://juejin.cn/column/7233765235953205304)不会展开说明哈，可以自行搜索学习其他大佬的优质文章或者等我后续更新补充

## push

*   功能

将元素合并进元组，返回一个新的元组

*   实现

首先需要两个泛型参数接收合并类型和被合并类型

```ts
type Push<T,U>
```

泛型T作为被合并类型，应该是一个元组类型，因此我们需要对其进行约束

```ts
type Push<T extends any[],U>
```

TypeScript作为js的超集，本身就支持js的表达形式，因此，对于生成的类型，我们使用扩展符取出T，并于U合并为一个新的元组即可

```ts
type Push<T extends any[],U> = [...T,U]
```

*   使用示例

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/659099fead8245428acc1ab1eadaac24~tplv-k3u1fbpfcp-watermark.image?)

## 获取元组长度

*   功能

返回元组中的元素个数

*   实现

主要考察对T\['length']的使用，它和js中一样返回的实际的个数，而不是number类型

```ts
type Len<T extends any[]> = T['length']
```

*   使用示例

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d4c161be8e1e47e9b2bf79341a2f594a~tplv-k3u1fbpfcp-watermark.image?)

## 元组转对象

*   功能

将元组类型转为对象类型

*   实现

首先，它接收一个泛型参数T

```ts
type TupleToObject<T>
```

该泛型应该是只读的元组类型，并且由于对象类型的key只能是string|number|symbol，所以对元组中的元素我们也应该进行约束

```ts
type TupleToObject<T extends readonly (string|number|symbol)[]>
```

最后我们需要获取到key的集合，在TypeScript，元组类型的结合key通过T\[number]获取。有了集合key之后我们只需要遍历这个集合，拿到每一个key重新进行映射即可

```ts
type TupleToObject<T extends readonly (string|number|symbol)[]> = {
    [K in T[number]]:K
}
```

*   使用示例

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a9761677c3b74c599ff893486a9f610c~tplv-k3u1fbpfcp-watermark.image?)

## unshift

*   功能

向元组的第一个位置添加一个元素

*   实现

和Push的实现一样，只是顺序进行了调换

```ts
type Unshift<T extends readonly any[],U> = [U,...T]
```

*   使用示例

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b6f25298cc1c4c91ac442a6e2c673781~tplv-k3u1fbpfcp-watermark.image?)

## concat

*   功能

将两个类型合并为元组类型

*   实现

首先，其接收两个泛型参数U、T

```ts
type Concat<T,U>
```

结合前文的Push，我们可以知道，如果T和U是元组，则可以直接使用扩展运算符，不是元组是则直接默认填充即可，因此，我们需要使用extends构建条件类型来分情况讨论

```ts
type Concat<T,U> = T extends any[] 
            ? 
            U extends any[]
                ?
                [...T,...U]
                :
                [...T,U]
            : [T,U extends any[] ? U[number]: U]
```

*   使用示例

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/968367f8a4804020919a3e5077f57f3e~tplv-k3u1fbpfcp-watermark.image?)

## first

*   功能

获取数组的第一个元素

*   实现

首先，我们对唯一的泛型参数做约束

```ts
type First<T extends any[]>
```

接着通过索引0来取值

```ts
type First<T extends any[]> = T[0]
```

但是当元组为空时，取的是undefined，因此，需要对空元组进行校验

```ts
type First<T extends any[]> = T extends [] ? never : T[0]
```

*   使用示例

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ca6db7261d8844a3a6452008cd097f53~tplv-k3u1fbpfcp-watermark.image?)

## last

*   功能

获取数组的最后一个元素

*   实现

同样，我们对泛型参数T按数组类型进行约束

```ts
type Last<T extends any[]>
```

我们知道T\[number]能够拿到指定索引位置的成员，而T\["length"]是元组的个数，这刚好比索引位置多一位，因此我们可以来构造一个与T\["length"]的取值相等的元组

```ts
type Last<T extends any[]> = [never,...T]
```

如此一来，我们就可以通过T\["length"]来进行获取了

```ts
type Last<T extends any[]> = [never,...T][T["length"]]
```

*   使用示例

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/baaff37e42a64e54a8e83d9915f81d19~tplv-k3u1fbpfcp-watermark.image?)

## 下期预告

最后一个就当作是一个随堂练习啦，我们放在下一节中进行实现（ps：欢迎在评论区晒出你的实现思路🤩）

### includes

*   功能

判断元素是否在元组中

*   示例

```ts
type isPillarMen = Includes<['Kars', 'Esidisi', 'Wamuu', 'Santana'], 'Dio'> // 得到： `false`
```

*   提示

类型递归

***

如果本文对您有用，希望能得到您的star

***
