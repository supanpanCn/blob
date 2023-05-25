大家好，我是爱水文的苏先生，一名从业5年的前端爱好者，致力于用最通俗的文字分享前端知识的酸菜鱼

## 角色分类
在js版本的[访问者模式](https://www.jianshu.com/p/ee3992b37e0a?utm_campaign=hugo&utm_medium=reader_share&utm_content=note&utm_source=weixin-friends)中，我们将角色分为了访问者、元素和集合，实际上，完整的角色分类应该类似下面这样：

1-VIsitor：抽象的访问者，定义了对Element的访问行为
2-ConcreteVisitor：具体的访问者，定义了对Elemeny的具体的访问行为
3-Element：抽象的元素类，它包含一个accept方法，表示可被访问者访问
4-ConcreteElement：具体的元素类，定义accept的具体实现
5-ObjectStructure：集合类（对象结构类），用于迭代元素并进行访问者访问

## 需求说明

写一段转换代码，将对象转换为对应的html代码

```ts
{
  type:string,//对应html中的标签名称
  data:{
    [other:string]:any
  }
}
```

## 角色定义

- 抽象访问者

```ts
abstract class V{
  abstract visitorPElement(e:PElement):void;
  abstract visitorDivElement(e:DivElement):void;
  abstract visitorSpanElement(e:SpanElement):void;
}
```

- 具体访问者类

实现对具体元素的处理，比如p元素拿到text拼接，img元素拿url做拼接

```ts
class HtmlVisitor extends V{
  htmlStr=''
  visitorPElement(e:PElement){
    const { text } = e.data
    this.htmlStr += `<p>${text}</p>`
  }
  visitorDivElement(e:DivElement){
    const { text } = e.data
    this.htmlStr += `<div>${text}</div>`
  }
  visitorSpanElement(e:SpanElement){
    const { text } = e.data
    this.htmlStr += `<span>${text}</span>`
  }
}
```

- 抽象元素

```ts
abstract class E{
  abstract type:string
  abstract data:{
    [o:string]:any;
  }
  abstract accept(visitor:V):void;
}
```

- 具体的元素类

```ts
class PElement extends E{
  type='p'
  data={
    text:'这是一个段落'
  }
  accept(visitor:HtmlVisitor){
    visitor.visitorPElement(this)
  }
}

class DivElement extends E{
  type='p'
  data={
    text:'这是一个div'
  }
  accept(visitor:HtmlVisitor){
    visitor.visitorDivElement(this)
  }
}

class SpanElement extends E{
  type='p'
  data={
    text:'这是一个span'
  }
  accept(visitor:HtmlVisitor){
    visitor.visitorSpanElement(this)
  }
}
```

- 集合

```ts
class Collect{
  elements:E[]=[]
  add(e:E){
    this.elements.push(e)
  }
  accept(visitor:V){
    this.elements.forEach(e=>{
      e.accept(visitor)
    })
  }
}

```

## 使用

```ts
const c = new Collect()
c.add(new DivElement())
c.add(new PElement())
c.add(new SpanElement())
c.accept(new HtmlVisitor())
```

## 需求迭代

现在，要求在保留原有html转换的基础上，还可以做md文档的转换，此时，在访问者模式下，我们只需要新创建一个新的具体的访问者类即可，对其其余的四个角色不需要进行关注或修改，伪代码如下

```ts
class MdVisitor extends V{
  mdStr=''
  visitorPElement(e:PElement){
    //todo
  }
  visitorDivElement(e:DivElement){
    //todo
  }
  visitorSpanElement(e:SpanElement){
    //todo
  }
}
//只需要采用MdVisitor作为访问者即可
c.accept(new MdVisitor())
```

