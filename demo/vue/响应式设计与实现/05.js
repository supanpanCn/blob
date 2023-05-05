let actEffect;

const effectStack = [];

const bucket = new WeakMap();

const obj = {
  age: 28,
  name: "",
  isOk: true,
};

const proxyObj = new Proxy(obj, {
  get(target, key) {
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
    return target[key];
  },
  set(target, key, value) {
    target[key] = value;
    const reactiveObj = bucket.get(target);
    if (reactiveObj) {
      const effects = reactiveObj.get(key) || [];
      const t = new Set(effects); // 遍历阶段添加的成员会被forEach访问
      t.forEach((v) => {
        actEffect !== v && v();
      });
    }
    return true;
  },
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

module.exports = function () {
  effect(() => {
    // bug:更新无法合并
    console.log(proxyObj.age);
  });

  proxyObj.age++;
  proxyObj.age++;
  proxyObj.age++;
  proxyObj.age++;
};
