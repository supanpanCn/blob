
const root = {
    type:'Root',
    children:[]
}

class Node{
    constructor(type,tag){
        this.type = type
        this.tag = tag
        this.children = []
    }
    setContent(content){
        this.content = content
    }
}

function scanTokens(tokens){
    const stack = [root]
    while(tokens.length){
        const p = stack[stack.length - 1]
        const act = tokens.shift()
        switch(act.type){
            case 'tag':{
                const e = new Node('Element',act.name)
                p.children.push(e)
                stack.push(e)
                break
            }
            case 'text':{
                const e = new Node('text')
                e.setContent(act.content)
                p.children.push(e)
                break
            }
            case 'tagEnd':{
                stack.pop()
            }
        }
    }
    return root
}


module.exports = scanTokens