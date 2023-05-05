const genMap = new Map([
    ["FunctionDecl", genFunctionDecl],
    ["ReturnStatement", genReturnStatement],
    ["StringLiteral", genStringLiteral],
    ["CallExpression", genCallExpression],
    ["ArrayExpression", genArrayExpression],
]);

function genParams(nodes,ctx) {
    nodes = nodes.filter(v=>v)
    nodes.forEach((v,i)=>{
        genMap.get(v.type)(v,ctx)
        if(i<nodes.length-1){
            ctx.append(',')
        }
    })
}

function genFunctionDecl(node, ctx) {
    ctx.append(`function ${node.id.name}(`);
    genParams(node.params, ctx);
    ctx.append("){");
    ctx.newLine();
    node.body.forEach((v) => genMap.get(v.type)(v, ctx));
    ctx.newLine(0)
    ctx.append('}')
}

function genReturnStatement(node,ctx) {
    ctx.append('return ')
    genMap.get(node.return.type)(node.return,ctx)
}

function genStringLiteral(node,ctx) {
    ctx.append(`'${node.value}'`)
}

function genCallExpression(node,ctx) {
    ctx.append(`${node.callee.name}(`)
    genParams(node.arguments,ctx)
    ctx.append(')')
}

function genArrayExpression(node,ctx) {
    ctx.append('[')
    genParams(node.elements,ctx)
    ctx.append(']')
}

function generate(node) {
    const ctx = {
        code: "",
        append(code) {
            this.code += code;
        },
        newLine(indent = 1) {
            this.code += "\n" + " ".repeat(indent * 2);
        },
    };
    const createCode = genMap.get(node.type);
    createCode(node, ctx);

    return ctx.code
}

module.exports = generate;