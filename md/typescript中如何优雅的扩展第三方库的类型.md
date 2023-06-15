大家好，我是苏先生，一名热爱钻研、乐于分享的前端工程师，跟大家分享一句我很喜欢的话：人活着，其实就是一种心态，你若觉得快乐，幸福便无处不在

## 前言

当我们基于某个库做上层封装时，会遇到某个ts类型不满足当前需求的情况，这时候就需要我们基于其做二次的类型扩展，当然，你要是非得any走天下就当我没说

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9f7315dc275b4811af6fdaf456b7b22a~tplv-k3u1fbpfcp-watermark.image?)

## 背景

我个人目前正在开发一个[unplugin-router](https://github.com/supanpanCn/unplugin-router/tree/master)的项目,它是一个约定式路由生成的库，目前已支持在webpack和vite中使用，也已完成对vue-router3.x和vue-router4.x的支持

嗯......，请允许我多说两句，毕竟这个标题所陈述的内容其实只是类型体操中最基础的部分，所以占不了多大的篇幅

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/36b311b2768b451199e29b5cbba111a2~tplv-k3u1fbpfcp-watermark.image?)

我觉得人这一辈子总要给世人留下点什么，尤其咱们程序员的寿命这么短，短到35就要回家种地了。所以我才突发奇想一定要留下一个比较完整的前端某一个方向的解决方案，它能证明我在这世上真真切切的走过一遭，所以诞生了这个项目

不过平时忙于上班，进度也确实有点慢，想想功能开发完后还要加单元测试就觉得遥遥无期，所以如果你感兴趣，可以联系我，我们一起合作完成这件事情

## 需求描述

在将基础功能开发完成后，我打算进行下优化，因为路由由[unplugin-router](https://github.com/supanpanCn/unplugin-router/tree/master)接手后，本地就看不到对应的路由定义了，总不可能让用户对着文件系统来编写路由跳转的代码，这样就有点太难用了

于是我找到了我要重写的useRouter函数，它是一个无入参且返回值为Router的函数

```ts
export declare function useRouter(): Router;
```

所以找到Router的定义

```ts
export declare interface Router{
    ...
    push(to: RouteLocationRaw): Promise<NavigationFailure | void | undefined>;
    removeRoute(name: RouteRecordName): void;
    ...
}
```

这里包含了我想要重写的函数，比如push函数，我希望在用户调用router.push时，编辑器能将[unplugin-router](https://github.com/supanpanCn/unplugin-router/tree/master)内部生成的路由地址弹出来供用户选择，就像这样

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/dd95e9a57f8a4442a976e718a64fabfd~tplv-k3u1fbpfcp-watermark.image?)

## 需求实现

### 版本一

这挺简单的，我心想它既然是一个interface，那我不就可以利用typescript的同名接口自动合并的特性来做嘛，于是有了如下的代码

```ts
interface Router{
    push(to: RouteLocationRaw & '/爱水文的前端苏'): Promise<NavigationFailure | void | undefined>;
}
```

### 版本二

首先，版本一是可行的（**男人不能说自己不行！！！**），只不过我需要导出十几二十个类型，然后按照原ts定义进行相应的书写，之后再在想要扩展的地方通过&进行拼接，这要是一通搞下来，我还怎么带妹子上分嘞

![af296c48a2cd0fac0b18cf700de2ba65.gif](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/57bc4d965224428393b323f17196a4bb~tplv-k3u1fbpfcp-watermark.image?)

于是我开始想：我能不能过滤掉非函数类型，然后拿到函数的参数和返回值进行进行处理呢？

显然：

- in关键字可以帮我们遍历接口，配合keyof我们就能拿到Router中的每一个keyName

```ts
type UnRouter<T> = {
    [K in keyof T]: any;
};
```

- extends关键字可以帮我们过滤掉非函数类型

```ts
type UnRouter<T> = {
    [K in keyof T]: T[K] extends (...args: any) => any
      ? any
      : T[K];
};
```

- Parameters工具类型可以帮我们获取函数的参数类型

```ts
Parameters<T[K]>
```

- ReturnType工具类型可以帮我们获取函数的返回值

```ts
ReturnType<T[K]>
```

有了以上这些已知知识点，我们就可以写一个Process类型来进行函数部分的处理啦

```ts
type Process<P extends [], R> = (
  payload: P[number] extends never
    ? never
    : P[number] extends RouteLocationRaw
    ? DyPathParam & P[number]
    : P[number] extends RouteRecordName
    ? DyNameParam & P[number]
    : P[number]
) => R;
```

***

如果本文对您有用，希望能得到您的star

***


