大家好，我是苏先生，一名热爱钻研、乐于分享的前端工程师，跟大家分享一句我很喜欢的话：人活着，其实就是一种心态，你若觉得快乐，幸福便无处不在

## 前言

当一个npm包功能开发完毕之后，想要给别人用，就需要发布到npm中，同时在github中创建对应的tag和release。这并不是一件具有难度的工作，却极其麻烦和繁琐：

*   我总是在提交代码的时候忘记先发布到npm，这导致我需要额外的再修改一次version版本，然后发布，最后重新push

*   我总是需要在本地先创建好tag并推送到远程，然后还要登陆到github并切换到指定的选项区域后才能进行release的创建

基于此，如果能够将其流程规范化，通过问答的形式让程序自动帮我们完成这些工作就真的太棒了

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/bf9991ca80234601b2ebfeb7331e1e45~tplv-k3u1fbpfcp-watermark.image?)

## 效果展示图

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/05d0cbc495314c54a08ebe093fa6d033~tplv-k3u1fbpfcp-watermark.image?)

## 实现

### 明确流程或需求

我想要的效果是，每次运行cli.ts这个脚本，它能够自动帮我发布到npm中，接着帮我创建github tag，最后帮我自动在github中生成release

### [集成cli-pkg](https://github.com/supanpanCn/cli-pkg)

*   简介

这个包将npm的发布、git tag和git release的生成进行了内置，并且提供了对应的编程接口供外部调用。同时基于其插件化能力，我们也可以对其进行二次补充和扩展

*   安装包

```js
yarn add cli-pkg -D
```

*   在package.json文件的scripts中新增命令行

```json
{
    "scripts":{
        "cli":"esno scripts/cli"
    }
}
```

*   在scripts文件夹下新增cli.ts文件

```ts
import { cli, TPlugin } from "cli-pkg";
...
const befores: TPlugin[] = [...];
const afters:TPlugin[] = [...];
...
(async () => {
  await cli([...befores,...afters]);
})();
```

### 自定义配置

根据[cli-pkg](https://github.com/supanpanCn/cli-pkg)的文档说明，我们注册config钩子并将配置项设置如下：

```ts
const config: TPlugin = async (ctx: TContext) => {
  ctx.config.runAt = "unplugin-router";
  ctx.config.allowedBranch = ["master"];
  ctx.config.packageManage = "yarn";
  ctx.config.ignoreGitChangeFiles.push(
    ...["scripts/publish.ts", "package.json", "yarn.lock"]
  );
  ctx.config.registry = "https://registry.npmjs.org/";
  ctx.config.pkgName = "unplugin-router-test";
  ctx.config.firstCall = "publishNpm";
};
config.lifecycle = "config";
```

### 发布npm

[cli-pkg](https://github.com/supanpanCn/cli-pkg)已经将发布到npm的一些必要的校验都帮我们做过了：

1-本地改动文件是否已经commit

2-当前是否处于合法的发布分支上

3-自动切换到npm源

4-登陆npm

除此之外，为了功能更加完整与好用，我们还需要对此进行下扩展：

1-本地分支和远程分支是否匹配

2-是否执行打包

然后，我们只需要注册`publishBefore`钩子即可

```ts
const publishBefore: TPlugin = async (ctx: TContext) => {
  let isNotSync = false;
  if (await ctx.prompt.confirm(msgs.isSyncGit)) {
    ctx.spinner.start();
    const regs: RegExp[] = [];
    runArr<string>(ctx.config.allowedBranch, (branch) => {
      regs.push(
        new RegExp(
          `\\W${branch}\\W.*(?:fast-forwardable|local out of date)`,
          "i"
        )
      );
    });
    const diffInfo = await ctx.exec("git", ["remote", "show", "origin"], {
      stdio: "pipe",
    });
    runArr<RegExp>(regs, (reg) => {
      if (reg.test(diffInfo)) {
        isNotSync = true;
        return "break";
      }
    });
    if (isNotSync) {
      ctx.log?.("CUSTOM", "red", "当前分支与远程分支不匹配");
      ctx.quit();
    }
  }

  ctx.spinner.stop();

  if (await ctx.prompt.confirm(msgs.isBuild, false)) {
    const buildScript = await ctx.prompt.select(Object.keys(ctx.pkg?.scripts), {
      message: msgs.selectScripts,
    });
    await ctx.exec(ctx.config.packageManage, ["run", buildScript]);
  }
};
publishBefore.lifecycle = "before:publish";
```

最后，由于我们期望的下一个动作是生成tag，然[cli-pkg](https://github.com/supanpanCn/cli-pkg)内部并不帮我们自动进行流程流转，所以我们还需要在发布完成后，手动调用`createTag`接口

```ts
const publishAfter: TPlugin = async (ctx: TContext) => {
  await ctx.createTag();
};
publishAfter.lifecycle = "after:publish";
```

### 生成tag

[cli-pkg](https://github.com/supanpanCn/cli-pkg)内部并没有去限制tag应该是怎样的，原因应该是其无法确认每个人期望生成的tag的格式，因此我们注册`before:tag`钩子对tag的格式进行下校验

```ts
const beforeTag: TPlugin = async (ctx: TContext) => {
  const latestTag = ctx.shared.latestTag;
  if (!latestTag?.startsWith("v")) {
    ctx.log?.("CUSTOM", "red", "tag名称必须以v开头");
    ctx.quit();
  }
  const NaNArr = latestTag
    ?.split("")
    .slice(1)
    .filter((v) => v !== ".")
    .map((v) => Number(v))
    .filter((n) => isNaN(n));
  if (NaNArr?.length) {
    ctx.log?.("CUSTOM", "red", "tag必须由v加数字组成，如v1.0.0");
    ctx.quit();
  }
};

beforeTag.lifecycle = "before:tag";
```

同样的，在tag生成完成后，我们手动调用[cli-pkg](https://github.com/supanpanCn/cli-pkg)提供的编程接口跳转的下一个状态

即在`after:tag`阶段调用`createRelease`

```ts
const tagAfter: TPlugin = async (ctx: TContext) => {
  await ctx.createRelease();
};

tagAfter.lifecycle = "after:tag";
```

### 生成release

与前边两个任务大同小异，我们也不必关心github的release本身应该如何实现，我们只需要对其进行部分扩展以满足当前的需求即可，比如：在`before:release`钩子里我们校验下远程仓库是否已经存在该Release版本

```ts
const releaseBefore: TPlugin = async (ctx: TContext) => {
  const remoteUrl = ctx.shared.gitRepoUrl;
  const nextVersion = ctx.shared.nextVersion;
  if (remoteUrl && nextVersion) {
    const prefix = remoteUrl.replace(extname(remoteUrl), "");
    const url = join(prefix, "releases", "tag", nextVersion);
    ctx.spinner.start();
    const text = await fetch(url).then((r) => r.text());
    ctx.spinner.stop();
    if (!text.includes(NotFount)) {
      ctx.log?.("CUSTOM", "red", `${nextVersion}在远程仓库中已存在`);
      ctx.quit();
    }
  }
};

releaseBefore.lifecycle = "before:release";
```

最后，可选的，我们可以对`success`钩子进行下注册，并在将来在最后生成变动日志

***

打call时间：

目前为止，我们已经实现了自动化执行npm包发布、release、tag的创建的工作，以后就只需要执行下`npm run cli`就可以啦，现在我们中场休息一下：

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a3e950062fb94af0802fc43931253b0b~tplv-k3u1fbpfcp-watermark.image?)

我目前正在开发一个名为[unplugin-router](https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2FsupanpanCn%2Funplugin-router%2Ftree%2Fmaster "https://github.com/supanpanCn/unplugin-router/tree/master")的项目,它是一个约定式路由生成的库，目前已支持在webpack和vite中使用，也已完成对vue-router3.x和vue-router4.x的支持，且已经接入到公司的一个vite3+vue3的项目中

不过受限于工作时间进度比较慢，在此寻找志同道合的朋友一起来完成这件事，后续计划对功能做进一步的完善，比如支持@hmr注解、支持权限路由等，也有对react路由和svelte路由的支持计划，以及除了webpack和vite这两个之外的构建工具的支持，还有单元测试的编写.....

***

*   github源码

代码实现在[unplugin-router](https://github.com/supanpanCn/unplugin-router)中的scripts文件夹下的publish.ts文件

## 总结

本文主要介绍了如何借助[cli-pkg](https://github.com/supanpanCn/cli-pkg)为npm包做自动化脚本管理，cli-pkg是一个专为工程化而诞生的辅助库，除了现阶段支持的npm publish、github tag和github release外，后续还将提供对前端项目初始化工程的一键式生成、变更日志等...

***

如果本文对您有用，希望能得到您的star

***