大家好，我是爱水文的苏先生，一名从业5年的前端爱好者，致力于用最通俗的文字分享前端知识的酸菜鱼
## 应用场景

interface用于定义引用数据类型,比如Map、Set、Class、Function等
type则通吃

## 相同点

- 都可以用于定义对象、函数、类

在如下示例的对象和函数的最后部分进行了变量的赋值，这说明两者定义的类型是等价的

1-对象

```ts
interface Iperson{
    name:string
}

type Tperson = {
    name:string
}

let n:Iperson = {
    name:'s'
}

let na:Tperson = {
    name:'sp'
}

na = n
```

2-函数

```ts
interface Iperson{
    name:string;
    (age:number):void;
}

type Tperson = {
    name:string;
    (age:number):void;
}

let n:Iperson = (age)=>{}

let na:Tperson = (age)=>{}

na = n
```

3-类

```ts
interface Iperson{
    name:string;
    getAge(age:number):void;
}

type Tperson = {
    name:string;
    getAge(age:number):void;
}

class N implements Iperson{
    name='s'
    getAge(age:number){

    }
}

class NA implements Tperson{
    name='sp'
    getAge(age:number){

    }
}
```

- 都支持泛型

```ts
interface Iperson<name>{
    name:name;
    getAge(age:number):void;
}

type Tperson<name> = {
    name:name;
    getAge(age:number):void;
}

class N implements Iperson<string>{
    name='s'
    getAge(age:number){

    }
}

class NA implements Tperson<string>{
    name='sp'
    getAge(age:number){

    }
}
```


- 都允许扩展

两者的扩展符不一样，interface是extends，type则是&

```ts
interface Iperson<name>{
    name:name;
    getAge(age:number):void;
}

type Tperson<name> = {
    name:name;
    getAge(age:number):void;
}

interface Su extends Iperson<string>{
    age:string
}

type Pan = Tperson<string> & {
    age:string
}
```

## 不同点

- 类型别名可以为基本类型、联合类型或元组类型定义别名，而接口不行

```ts
type MyBoolean = boolean;
type StringOrBoolean = string | MyBoolean;
type Collect = StringOrBoolean[];
```

- 同名接口会自动合并，type则报错

```ts
interface Person {
  name: string;
}

interface Person {
  age: number;
}

let user: Person = {
    name:'sp';
    age:28
}
```

利用这一点，我们可以对第三方包的具体的某个接口进行扩展，而不是重写，伪代码如下

```ts
import { interfaceName } from 'npmPackage'
declare module 'npmPackage' {
  export interface interfaceName {
    [o:string]:any;
  }
}
```
