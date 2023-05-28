let actEffect;

const UNI_KEY_FOR_IN = Symbol()

const effectStack = [];

const taskQueue = new Set();

const resolve = Promise.resolve();

let isFlushing = false;
function flushTask() {
  if (isFlushing) return;
  isFlushing = true;
  resolve
    .then(() => taskQueue.forEach((task) => task()))
    .finally(() => (isFlushing = false));
}

const bucket = new WeakMap();

const obj = {
  age: 28,
  name: "",
  isOk: true,
};

function trace(target,key){
    if (!actEffect) return target[key];
    // 获取响应对象
    let reactiveObj = bucket.get(target);
    if (!reactiveObj) bucket.set(target, (reactiveObj = new Map()));
    // 获取响应对象中的key注册的副作用函数列表
    let effects = reactiveObj.get(key);
    if (!effects) reactiveObj.set(key, (effects = new Set()));
    // 建立关联
    effects.add(actEffect);
    actEffect.deps.push(effects);
}

function trigger(target, key, type){
    const reactiveObj = bucket.get(target);
    if (reactiveObj) {
      const effects = reactiveObj.get(key) || new Set();
      const t = new Set(effects); // 遍历阶段添加的成员会被forEach访问

      // 当为新增时，取出UNI_KEY_FOR_IN，兼容for...in
      if(type === 'add' || type === 'delete'){
        const forInEffects = reactiveObj.get(UNI_KEY_FOR_IN) || new Set()
        forInEffects.forEach(v=>t.add(v))
      }

      t.forEach((v) => {
        if(actEffect !== v){
            taskQueue.add(v)
            flushTask()
        }
      });
    }
}

const proxyObj = new Proxy(obj, {
  get(target, key) {
    trace(target,key)
    return target[key];
  },
  set(target, key, value,receiver) {
    const type = Object.prototype.hasOwnProperty(target,key) ? 'edit' : 'add'
    Reflect.set(target,key,value,receiver)
    trigger(target, key, type)
    return true;
  },
  has(target,key){
    trace(target,key)
    return Reflect.has(target,key)
  },
  ownKeys(target){
    trace(target,UNI_KEY_FOR_IN)
    return Reflect.ownKeys(target)
  },
  deleteProperty(target,key){
    const exist = Object.prototype.hasOwnProperty(target,key)
    if(exist){
        const isDel = Reflect.deleteProperty(target,key)
        if(isDel){
            trigger(target,key,'delete')
            return true
        }
    }
    return false
  }
});

function reset(_effect) {
  _effect.deps.forEach((v) => {
    const effects = v;
    effects.delete(_effect);
  });
  _effect.deps.length = 0;
}

function effect(func) {
  function _effect() {
    reset(_effect);
    actEffect = _effect;
    effectStack.push(_effect);
    func();
    effectStack.pop();
    actEffect = effectStack[effectStack.length - 1];
  }
  _effect.deps = [];
  _effect();
}
// TODO:处理for...in和in
module.exports = function () {
  effect(() => {
    for(let key in proxyObj){
        console.log(key)
    }
    console.log('cx')
  });
  proxyObj.newName = 'sp'
};
