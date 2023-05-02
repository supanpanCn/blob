const fs = require('node:fs')
const path = require('node:path')
const code =  fs.readFileSync(path.resolve(process.cwd(),'demo','vue.txt'),'utf-8')
const tokenize = require('./tokenize')
const genTAst = require('./tAst')
const transform = require('./transform')
const generate = require('./generate')

function parse(code){
    const tokens = tokenize(code)
    const ast = genTAst(tokens)
    return ast
}

const tAst = parse(code)

const jsAst = transform(tAst)

const resultCode = generate(jsAst.jsCode)

console.log(resultCode)

module.exports = parse