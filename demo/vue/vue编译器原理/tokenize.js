const State = {
    // 初始
    initial:1,
    // 标签开始
    start:2,
    // 标签名称
    startName:3,
    // 标签文本
    text:4,
    // 标签结束
    end:5,
    // 标签结束名称
    endName:6
}

const isAlpha = function(char){
    return /[a-zA-Z1-6]/.test(char)
}

function tokenize(code){
    let currentState = State.initial
    const tokens = []
    const chars = []
    while(code.length){
        const act = code[0]
        switch(currentState){
            case State.initial:
                if(act === '<'){
                    currentState = State.start
                }else if(isAlpha(act)){
                    currentState = State.text
                    chars.push(act)
                }
                break
            case State.start:
                if(isAlpha(act)){
                    currentState = State.startName
                    chars.push(act)
                }else if(act === '/'){
                    currentState = State.end
                }
                break
            case State.startName:
                if(isAlpha(act)){
                    chars.push(act)
                }else if(act === '>'){
                    // 切到初始状态，形式闭环，记录token
                    currentState = State.initial
                    tokens.push({
                        type:'tag',
                        name:chars.join('')
                    })
                    chars.length = 0
                }
                break
            case State.text:
                /**
                 * 1.<div></div>  act = i
                 * 2.<div>我爱前端</div> act = 爱
                 */
                if(isAlpha(act)){
                    chars.push(act)
                }else if(act === '<'){
                    currentState = State.start
                    tokens.push({
                        type:'text',
                        content:chars.join('')
                    })
                    chars.length = 0
                }
                break
            case State.end:
                // 当遇到/才会切换到结束标签状态
                if(isAlpha(act)){
                    currentState = State.endName
                    chars.push(act)
                }
                break
            case State.endName:
                if(isAlpha(act)){
                    chars.push(act)
                }else if(act === '>'){
                    currentState = State.initial
                    tokens.push({
                        type:'tagEnd',
                        name:chars.join('')
                    })
                    chars.length = 0
                }
                break
        }
        code = code.substring(1)
    }
    return tokens
}

module.exports = tokenize