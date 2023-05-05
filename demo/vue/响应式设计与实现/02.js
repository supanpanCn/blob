



let actEffect
const bucket = new WeakMap();

const obj = {
  age:28,
  name:'',
  isOk:true
}

const proxyObj = new Proxy(obj, {
  get(target, key) {
    if(!actEffect) return target[key]
    // 获取响应对象
    let reactiveObj = bucket.get(target)
    if(!reactiveObj) bucket.set(target,(reactiveObj = new Map()))

    // 获取响应对象中的key注册的副作用函数列表
    let effects = reactiveObj.get(key)
    if(!effects) reactiveObj.set(key,(effects = new Set()))

    // 建立关联
    effects.add(actEffect)
    return target[key];
  },
  set(target, key, value) {
    target[key] = value;
    const reactiveObj = bucket.get(target)
    if(reactiveObj){
        const effects = reactiveObj.get(key) || []
        effects.forEach(v=>v())
    }
    return true;
  },
});

function effect(func){
  actEffect = func
  func()
}



module.exports = function () {
  let name = ''
  effect(()=>{
    console.log('执行')
    name = proxyObj.isOk ? proxyObj.name : ''
  })
  proxyObj.isOk = false
  // bug：遗留的副作用函数   
  proxyObj.name = 'sp'
  proxyObj.name = 'spp'
};
