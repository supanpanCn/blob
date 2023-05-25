大家好，我是爱水文的苏先生，一名从业5年的前端爱好者，致力于用最通俗的文字分享前端知识的酸菜鱼
## 前言 

在之前工作的几年里，localStorage由于其存在大小的限制我是不怎么用的，现在新公司项目对这个应用较多，在使用过程中让我深感其"难用"，一开始秉持着不重复造轮子的想法在github上溜达了一圈，确实是有已经封装过的，但是要么功能不满足要求，要么年代久远不支持typescript，于是自己花了一天半的时间自己进行了实现  

[点击这里](https://github.com/supanpanCn/web-localstorage-plus)，进入github查看完整实现，如果觉得好用，希望能得到您的star

## 开始

- 安装

    
```js
    yarn add web-localstorage-plus
```

- 在入口文件main.ts中引入并初始化，我这里将根仓库名称命名为h5-storage


```js
    import createStorage from 'web-localstorage-plus'
    const storage = createStorage('h5-storage')
```

一共提供了9个接口，如下

![22517122-5f16c7a214888ad3.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/240d2f1c64f8499abbc834551c638bcf~tplv-k3u1fbpfcp-watermark.image?)

每一个都利用ts的函数重载说明了使用细节

![1.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e541b2a3e8aa4c22a1f7266d456f7917~tplv-k3u1fbpfcp-watermark.image?)

- apis

#### setItem

1.基本使用


```js
    storage.setItem('username','spp')
```

2.存储到指定命名空间


```js
    storage.setItem('username','spp','system')
```

3.对值进行加密


```js
    storage.setItem('password',123456,true)
```

4.设置过期时间（3s后过期）


```js
    storage.setItem('token',{key:1,value:2},3000)
```

5.完整使用


```js
    storage.setItem('filter',{type:1},'detail',10000,false)
```

6.批量操作


```js
    storage.setItem([{
        namespace:'space1',
        key:'a',
        value:'34',
        expireTime:30000
    },{
        key:'b',
        value:34,
        encrypt:true
    }],'space2')
```

存储结果如下

![2.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/55c58abbe5ed4563a69356003b36bb07~tplv-k3u1fbpfcp-watermark.image?)

#### getItem

1.基本使用


```js
    storage.getItem('username') // "spp"
```

2.按命名空间读取


```js
    storage.getItem('a','space1') // "34"
```

3.读取加密的存储值


```js
    storage.getItem('b','space2') // 34
```

4.批量从指定的命名空间读取多个值（不指定参数3，则返回的是由{key:'',namespace:''}组成数组）


```js
    storage.getItem(['a'],'space1',true) // ["34"]
```

5.批量从不同的命名空间读取


```js
    storage.getItem(['username',{
        namespace:'space1',
        key:'a'
    },{
        namespace:'space2',
        key:'b'
    }],true) //["spp","34",34]
```

#### removeItem

1.基本使用


```js
    storage.removeItem('a')
```

2.删除指定命名空间下的值


```js
    storage.removeItem('username','system')
```

3.批量删除单个命名空间下的多个值（参数二不指定则为默认命名空间）


```js
    storage.removeItem(['username','password'])
```

4.批量删除不同命名空间下的指定值


```js
    storage.removeItem([{
        namespace:'space1',
        key:'a'
    }])
```

#### clear

1.基本使用


```js
    storage.clear()
```

2.指定命名空间不清空


```js
    storage.clear(['space1'])
```

#### onChange

监听位置必须在修改发生前才会生效

![3.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c0cfc85abcf940ad9fdce2fbf480d2be~tplv-k3u1fbpfcp-watermark.image?)

#### onExpire

只有设置了过期时间的key才能被监听到

![4.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a090c66b7dc14639af75ea92597c1e4c~tplv-k3u1fbpfcp-watermark.image?)

#### postMessage与onMessage

![5.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fcef0d8a4f7648d384c8f8b7a1d034b0~tplv-k3u1fbpfcp-watermark.image?)

#### use

这个接口应该几乎用不到，其作用和vue中的use差不多，其注入的函数会分别在setItem、getItem、removeItem和clear时被调用,其中的wark参数标识当前正在运行的api

![6.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e81dd1b7f3a443629b82e55dada7d8ee~tplv-k3u1fbpfcp-watermark.image?)


































