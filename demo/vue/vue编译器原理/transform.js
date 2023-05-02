

function transform(tAst,ctx){
    const cbs = []
    // 当前的节点树
    ctx.act = tAst
    const transforms = ctx.nodeTransforms
    for(let i=0;i<transforms.length;i++){
        if(typeof transforms[i] === 'function'){
            const cb = transforms[i](ctx.act,ctx)
            if(typeof cb === 'function'){
                cbs.push(cb)
            }
            // 如果删除了当前节点，则后续不再处理
            if(!ctx.act) return
        }
    }
    const children = ctx.act.children
    if(Array.isArray(children)){
        // 当前节点的父节点
        ctx.parent = ctx.act
        for(let i=0;i<children.length;i++){
            // 当前节点树是父节点的第几个子节点
            ctx.index = i
            // 当前节点的兄弟节点
            ctx.siblings = [children[i-1],children[i+1]].map(v=>v||null)
            transform(children[i],ctx)
        }
    }

    // 退出节点
    let i = cbs.length
    while(i--){
        cbs[i]()
    }
}

function _replaceNode(newNode){
    this.act = newNode
    this.parent.children[this.index] = newNode
}

function _newType(type,value,arguments){
    const o = {
        type,
    }
    switch(type){
        case 'StringLiteral':
            o.value = value
            break
        case 'Identifier':
            o.name = value
            break
        case 'ArrayExpression':
            o.elements = value
            break
        case 'CallExpression':
            o.callee = _newType('Identifier',value)
            o.arguments = arguments
            break
    }
    return o
}

function transformElement(node){
    return ()=>{
        if(node.type === 'Element'){
            const callee = _newType('CallExpression','h',[
                _newType('StringLiteral',node.tag)
            ])

            node.children.length === 1 
            ? callee.arguments.push(node.children[0].jsCode)
            : callee.arguments.push(_newType('ArrayExpression',node.children.map(v=>v.jsCode)))

            node.jsCode = callee
        }

        if(node.type === 'text'){
            node.jsCode = _newType('StringLiteral',node.content)
        }
    }
}

function transformRoot(node){
    return ()=>{
        if(node.type === 'Root'){
            node.jsCode = {
                type:"FunctionDecl",
                id:_newType("Identifier","render"),
                params:[],
                body:[
                    {
                        type:"ReturnStatement",
                        return:node.children[0].jsCode
                    }
                ]
            }
        }
    }
}

module.exports = function(ast){
    transform(ast,{
        nodeTransforms:[
            transformElement,
            transformRoot
        ]
    })
    return ast
}