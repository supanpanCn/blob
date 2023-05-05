
let actEffect
const bucket = new Set();

const obj = {
  age:28
}

const proxyObj = new Proxy(obj, {
  get(target, key) {
    actEffect && bucket.add(actEffect);
    return target[key];
  },
  set(target, key, value) {
    bucket.forEach((v) => v());
    target[key] = value;
    return true;
  },
});

function effect(func){
  actEffect = func
  func()
}



module.exports = function () {
  let year = 2023
  effect(()=>{
    if(proxyObj.age === 28){
      const timer = setTimeout(()=>{
        year++
        proxyObj.age = proxyObj.age+1
        // bug:与整个proxyObj关联
        // proxyObj.someKey = (proxyObj.someKey || 0)+1
        clearTimeout(timer)
      },1000)
    }
  })
};
