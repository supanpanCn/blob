## never类型特性

- never类型是任何类型的子类型，但没有任何类型可以赋值给never
- 联合类型中的never类型会被剔除
- 交叉类型中的never类型会覆盖其他同名类型

## 应用

- 属性互斥

当需要二选一时，可以通过联合类型，将互斥的两个属性分别标注为可选的never类型

```ts
interface A{
    name:string;
    id?:never;
}

interface B{
    id:string;
    name?:never;
}

const useT1:A|B = {
    name:'spp',
    id:''
}  //error

const useT2:A|B = {
    name:'spp'
}

const useT3:A|B = {
    id:'28'
}
```

- 属性联动

开发组件库时，常需要多个属性进行配合来使用某一个功能，比如elementPlus的Select组件，当绑定的值为对象类型时，必须传入value-key属性

假设如下类型表示Select组件的PropsType

```ts
interface Select{
    model?:object;
    key?:string;
    size?:string;
    multiple?:boolean;
}
```

则

1.将model和key挑选出来，并变成必选

```ts
type A = Required<Pick<Select,'model'|'key'>>
```

2.使用model和key创建一个可选且值为never的类型（这里不可以是any，当为any时，最后一步取联合类型会被判定合法）

```ts
type B = Partial<Record<'model'|'key',never>>
```

3.从Select中剔除model和key

```ts
type C = Omit<Select,'model'|'key'>
```

4.使用类型C分别与A和B进行合并，则当使用key时，A&C时，model必选，B&C时，不可能存在key，此时冲突

```ts
type D = (A|B) & C
```

- 类型过滤

```ts
type FilterType<T,U> = T extends U ? never : T
```

- 属性过滤

首先通过in keyof获取并对属性进行遍历，借助上文的类型过滤，对取得的属性K做筛选

```ts
type FilterInterface<T,U> = {
    [K in keyof T as FilterType<K,U>]:T[K]
}

type Result = FilterInterface<{
    a:string;
    b:string;
},'b'> 
```

- 类型埋点

如下，当对name类型进行扩展后，对never类型的赋值将会引发类型报错

```ts
function getType(name:'a'|'b'){
    switch(name){
        case 'a':
        break
        case 'b':
        break
        default:
        const n:never = name 
        return n
    }
    return 
}
```
