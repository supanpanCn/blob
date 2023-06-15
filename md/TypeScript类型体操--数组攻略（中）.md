大家好，我是苏先生，一名热爱钻研、乐于分享的前端工程师，跟大家分享一句我很喜欢的话：人活着，其实就是一种心态，你若觉得快乐，幸福便无处不在

## 前言

前边三篇文章我们一共实现了**22**个工具类型，按照本专栏的规划，还差**77**个...

本节我们继续学习数组相关的类型编程

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6fac406acaea48c3b8522e44e5820034~tplv-k3u1fbpfcp-watermark.image?)

## 提示

对于语法层面的知识点[本系列（类型体操开头的标题）](https://juejin.cn/column/7233765235953205304)不会展开说明哈，可以自行搜索学习其他大佬的优质文章或者等我后续更新补充

## isTuple

*   功能

判断一个类型是否是元组

*   实现

首先它接收一个泛型参数T

```ts
type IsTuple<T>
```

我们不应该限制T的类型，如果T是一个非元组，则直接返回false就好了

```ts
type IsTuple<T> = T extends any[] ? true : false
```

目前，对于readonly修饰符，我们的IsTuple会返回false

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/80c2fcbde67c4f13ac93110bb740985c~tplv-k3u1fbpfcp-watermark.image?)

要解决这个问题，我们只需要将条件类型相应的增加readonly修饰符就可以了，这是因为带有修饰符的元组表示的范围更小，你可以认为它是没有修饰符的父类型

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/161e01b977b44107b43f4433d4ffd753~tplv-k3u1fbpfcp-watermark.image?)

最后，我们思考数组和元组的区别，看下图，一个数组类型的length的返回类型为number

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7ad57733485348bd87a23841733121ae~tplv-k3u1fbpfcp-watermark.image?)

但是对于元组，length取到的却是一个具体的数字

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8aea3f25c32e4ddfa2d765d15a344f08~tplv-k3u1fbpfcp-watermark.image?)

为此，我们需要对length进行单独的处理

```ts
type IsTuple<T> = T extends readonly any[] ? 
                    number extends T['length'] 
                    ?
                    false
                    : true
                    : false
```

*   使用示例

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6939a5c7d9d444d0915805c804eebe0d~tplv-k3u1fbpfcp-watermark.image?)

## lastIndexOf

*   功能

找到元素在元组中的位置，找不到返回-1

*   实现

首先，它接收两个泛型参数T、U

```ts
type LastIndexOf<T,U>
```

接着，我们对泛型参数进行约束：对于泛型T，应该是一个数组类型，而泛型U则是any类型

```ts
type LastIndexOf<T exyends any[],U>
```

然后，我们要想办法拿到最后一个元素，在上一节中我们介绍过，通过扩展运算可以达到该目的，如下，L即是最后一个元素，此时我们只需要借助infer关键字就可以拿到元素对应的类型了

```ts
[...infer F,infer L]
```

既然我们已经拿到了最后一个元素，那就可以与U进行比较判断了，我们知道，当两个类型一样或具有父子关系时，通过extends可以得到true，伪代码如下

```ts
L extends U ? '得到其对应的位置' : '递归'
```

我们分别来思考extends分两个分支：

1-成立时，取位置

上一节我们在分析Last工具类型时介绍过，T\["length"]能够取到当前数组的长度，且它与元素对应的位置的T\["length"]的取值减去1,这恰好是F的长度

2-不成立时，进行递归

这个比较简单，我们只需要将数组的最后一位删掉重新调用LastIndexOf就行了，好巧不巧的是，它又刚好是F

综上所述，最终实现如下

```ts
type LastIndexOf<T extends any[],U> = T extends [...infer F,infer L] ? 
                                        L extends U 
                                            ?
                                            F['length']
                                            : LastIndexOf<F,U>
                                        : -1
```

*   使用示例

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6766f6f9e0eb42d68fd2da3ef868361b~tplv-k3u1fbpfcp-watermark.image?)

## includes

*   功能

判断元素是否在元组中

*   实现

首先，它接收两个泛型参数T、U

```ts
type Includes<T,U>
```

泛型T的参数需要约束为数组类型

```ts
type Includes<T extends any[],U> 
```

接着我们要想办法拿到数组中的每一个元素与U进行比较，正如前文分析的那样，这肯定要用到类型递归

```ts
T extends [...infer F,infer L] ? '判断是否存在' : '递归'
```

事实上，按照上文LastIndexOf的实现思路这会变得很容易，不过由于多个条件类型会让代码变得难以阅读。所以，我们选择提取出一个公共类型来专门负责两个元素的比较

```ts
type IsEqual<V,Item> = V extends Item ? true : false
```

最后按照LastIndexOf的套路，我们比较完一个，就把已经比较过的元素丢弃掉，并重新调用includes，最终实现如下

```ts
type Includes<Value extends any[], Item> =
	IsEqual<Value[0], Item> extends true
		? true
		: Value extends [Value[0], ...infer rest]
			? Includes<rest, Item>
			: false;
```

*   使用示例

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c77e4b944e1b4766b74a2c4fb6e8f69c~tplv-k3u1fbpfcp-watermark.image?)
## 下期预告

最后一个就当作是一个随堂练习啦，我们放在下一节中进行实现（ps：欢迎在评论区晒出你的实现思路🤩）

### Fill

*   功能

类型版本的数组填充

*   示例

```ts
type Result = Fill<[1, 2, 3], 'a'> // ['a', 'a', 'a']
type Result2 = Fill<[1, 2, 3], 'a',1> // [1, 2, 'a']
type Result3 = Fill<[1, 2, 3], 'a',1,2> // [1, 'a', 3]
```

*   提示

类型递归

***

如果本文对您有用，希望能得到您的star

***
