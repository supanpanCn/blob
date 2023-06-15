大家好，我是苏先生，一名热爱钻研、乐于分享的前端工程师，跟大家分享一句我很喜欢的话：人活着，其实就是一种心态，你若觉得快乐，幸福便无处不在

## 什么是插件

所谓插件，是一种可以把某些能力或特性添加到某个已有主体程序的程序，它通常遵循一定的编写规范，并只能运行在特定的主体程序中

实现了插件化的主体应用程序更容易被扩展、具有更佳的稳定性、更方便维护。他们往往只包含核心功能的实现，而在插件化的加持下，后续的个性化能力的定制，则交由开发者自己实现。像vue、webpack、babel、rullup等无不是这样

## 插件化的核心

想要为主体程序赋予插件化能力，个人认为有以下几个绕不开的问题需要解决，虽然在实际实现上并不一定都必须包含，不过一个完整的具有插件化的应用程序一定是绕不开的点，而且搞清楚这一点很重要，后文的代码讲解中均会基于此来进行实现：

*   生命周期

我们必须将整个主体程序的运行阶段进行划分，并以此确定在什么阶段应该让插件程序参与。这本质上是在划分任务，拿vite来说：

如果想在vite处理配置之前混入一些自己的配置项，则需要调用config钩子；

如果想要参与根文件index.html的处理，则需要调用transformIndexHtml钩子；

*   通信

我们必须能够将主体程序现阶段运行的结果及程序运行的相关状态传递给插件程序，并且需要能够接受插件程序的返回值并根据其结果决定下一阶段任务的导向，还是以vite进行举例：

当我们在resolveId钩子中修改了当前正在被vite处理的文件url时，就意味着我们要将此url的控制权从vite手中进行转移，因此我们需要在load钩子中对该url进行相应的拦截处理

## 插件化方案的实现案例

### 基于function形式

#### [web-localstorage-plus](https://github.com/supanpanCn/web-localstorage-plus)

1-简介

该npm包是对原生localStorage的封装，使其支持批量操作、命名空间、加解密、过期时间、onChange、bus、onExpire等特性

2-生命周期划分

我们按照功能来进行划分，即setItem、getItem、removeItem和clear

3-通信

根据约定的四个生命周期阶段，我们分别在其执行之后，对用户注册的plugin做调用，被调用的函数接受payload作为上下文对象，其返回值被主程序内部获取并使用

4-代码实现

*   约定plugin

我们约定plugin应该是一个函数，并且以参数形式接收主程序的上下文，最后通过返回值可以对实际存入localStorage的值进行修改

```ts
function userPlugin(payload){
    const { key, wark, value, namespace, ctx } = params;
    if(wark === 'setItem'){
        // do somting
    }
    return value
}
storage.use(userPlugin)
```

*   提供plugin注册机制

我们模拟vuejs，实现use接口，统一将接收到的插件存放起来以等待调用

```ts
function use(userCallback: PluginCb, framework?: "customer" | "buildIn") {
  native.plugins.push({
    framework: framework || "customer",
    apis: setApis(userCallback),
  });
}

```

*   调用

在我们约定的四个api被实际调用后，取出存放的plugin列表进行执行

```js
v.value = runPlugin(
  {
    ...v,
    ctx: native,
  },
  "setItem"
);
```

*   插件开发

该包所提供的onChange、onExpire和加解密均由插件形式进行开发完成，可参考[src/plugin](https://github.com/supanpanCn/web-localstorage-plus/tree/main/src/plugin)下的文件代码

#### [cli-pkg](https://github.com/supanpanCn/cli-pkg)

（目前该npm包还不能被访问，因为相对应的功能尚在开发中，不过也不影响我们对于本篇文章的分享）

1-简介

该npm包通过命令行交互的形式提供了npm包的发布、git release的生成、打包日志以及前端项目的初始化模板下载等能力

2-生命周期划分

这里我们仍是对生命周期按照功能进行划分，考虑到在具体的功能执行前后可能都会想要执行一些自定义逻辑，所以我们再细分为before和after两类，比如：before:publish、after:publish

3-通信

我们需要向插件传递上下文，以允许插件内部调用主程序中的功能接口，比如在插件内部调用release或生成tag

4-代码实现

*   约定plugin

我们约定，plugin是一个函数，并且其必须包含一个lifecycle的属性来标识生命周期

```ts
const config: TPlugin = async (ctx: TContext) => {
    ...
};
config.lifecycle = "config";
```

*   提供plugin注册机制

这里我们仿照vite，接收一个plugin组成的数组，并在初始化阶段与内置的plugin合并后挂载到上下文

```ts
async function createContext(userPlugins?: TPlugin[]) {
  const outPlugins = userPlugins || [];
  const buildInPlugins: TPlugin[] = [...];
  const plugins: TPlugin[] = [...buildInPlugins, ...outPlugins];
  const ctx: TInnerContext = {
    plugins,
    ...
  };
  return ctx as Required<TInnerContext>;
}
export async function cli(userPlugins?: TPlugin[]) {
  const ctx = await createContext(userPlugins);
  ...
  return ctx;
}
```

*   调用

在功能被触发前后分别按照before和after类型进行调用

```ts
export default async function (this: TContext) {
  await this.runPluginTasks("before:publish");
  ...
  await this.runPluginTasks("after:publish");
}
...

```

*   插件开发

该包只包含了实现npm包发布的最小实现，而且其被开发的初始目的是为[unplugin-router](https://github.com/supanpanCn/unplugin-router/tree/master/scripts)服务的，因此可以在这里的publish.ts文件中查看到完整的使用详情（ps：目前只实现了自动发布npm包后自动更新package.json文件的能力，且改动还在本地，感兴趣可以点亮一下项目等后续查看哦）

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9433ecc726fe4ab98756792a211dd440~tplv-k3u1fbpfcp-watermark.image?)

***

打call时间：

在分析class形式的插件化应该如何实现之前，我想先为自己正在开发的npm包做一波宣传

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a3e950062fb94af0802fc43931253b0b~tplv-k3u1fbpfcp-watermark.image?)

我目前正在开发一个名为[unplugin-router](https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2FsupanpanCn%2Funplugin-router%2Ftree%2Fmaster "https://github.com/supanpanCn/unplugin-router/tree/master")的项目,它是一个约定式路由生成的库，目前已支持在webpack和vite中使用，也已完成对vue-router3.x和vue-router4.x的支持，且已经接入到公司的一个vite3+vue3的项目中

不过受限于工作时间进度比较慢，在此寻找志同道合的朋友一起来完成这件事，后续计划对功能做进一步的完善，比如支持@hmr注解、支持权限路由等，也有对react路由和svelte路由的支持计划，以及除了webpack和vite这两个之外的构建工具的支持，还有单元测试的编写.....

***

### 基于class形式

乍一想，基于class形式实现插件化难度似乎要更大一点，这一点，我想webpack可以为我证明（ps：其实是一样的）

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ffda0ed4b0fa41c2806490ba0370c9e6~tplv-k3u1fbpfcp-watermark.image?)

这里我们对[cli-pkg](https://github.com/supanpanCn/cli-pkg)中的实现进行重构，并尝试从中找到class形式开发插件化的范式

1-定义baseClass

我们将原来的index.ts文件抽离改写成一个基类，而我们为插件约定的lifecycle属性则作为它身上的属性定义，另外还要定义apply接口来运行插件

```ts
class Plugin{
    public lifecycle:TLifycycle = 'config'
    constructor(lifecycle:TLifycycle){
        this.lifecycle = lifecycle
    }
    apply(ctx:TContext){
        // 执行具体的插件逻辑
    }
}
```

2-实现插件

```ts
class ConfigPlugin extends Plugin{
    constructor(){
        super('config')
    },
    apply(ctx:TContext){
        // 执行具体的插件逻辑
    }
}
```

3-封装一个函数来遍历执行插件的初始化

```ts
const initPlugins = (plugins:Tplugin[])=>{
    return plugins.map(v=>new p())
}
```

4-封装一个函数来挑选命中生命周期的插件做执行

```ts
async function (lifecycle: TLifycycle) {
   ctx.lifecycle = lifecycle;
   const willDo = ctx.plugins
      .filter((p) => p.lifecycle === lifecycle)
      .map((d) => () => d.apply(ctx as TContext));
   await pSeries<()=>TPlugin>(willDo);
};
```

## 总结

以上就是npm包插件化的最简单实现思路，在实际实现中要额外考虑的东西可能更多一些，比如，提供给插件的上下文是否需要做一层包装处理以避免在插件中恶意删除某些关键属性或方法等

***

如果本文对您有用，希望能得到您的star

***