let translateButton;
let translatePopup;
let translatedTextElement;
let translatedWordElement;
let translateGrammarElement;
let flag;
let pageX;
let pageY;
let tmp;
let transWords;
let isAlreadyWord;
let isAlreadyGrammar;



// 函数获取当前主题颜色并执行回调
function getCurrentThemeColor(callback) {
    chrome.storage.sync.get(['themeColor'], (result) => {
        const themeColor = result.themeColor || '#008c7d';
        callback(themeColor);
    });
}

function getCurrentTransSate(callback) {
    chrome.storage.sync.get(['transEnabled'],(result) =>{
        const transEnabled = result.transEnabled;
        callback(transEnabled)
    })
}

document.addEventListener('mouseup', (event) => {
    console.log("mouse up!!!")
    console.log(flag)
    if (flag === 1 || flag === 2) {
        flag = 0;
        return;
    }
    setTimeout(()=>{
        const selection = window.getSelection();
        if (selection.toString().trim().length > 0 && tmp !== selection.toString()) {
            if (translateButton) {
                document.body.removeChild(translateButton);
            }
            tmp = selection.toString()
            pageX = event.pageX;
            pageY = event.pageY;
            translateButton = document.createElement('button');
            translateButton.textContent = '译';
            getCurrentThemeColor((themeColor) => {
                Object.assign(translateButton.style, {
                    position: 'absolute',
                    top: `${pageY}px`,
                    left: `${pageX + 10}px`,
                    zIndex: 2147483647,
                    backgroundColor: themeColor,
                    color: '#fff',
                    border: 'none',
                    padding: '10px',
                    cursor: 'pointer',
                    borderRadius: '50%',
                    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '16px',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: '0',
                    transition: 'opacity 0.3s ease, transform 0.3s ease',
                    transform: 'scale(0)'

                });


            translateButton.onclick = async () => {
                if (translatePopup) {
                    document.body.removeChild(translatePopup);
                }
                transWords = selection.toString().trim();
                await getTranslatedText(selection.toString());
                document.body.removeChild(translateButton);
                translateButton = null;
                initTranslationPopup(pageX, pageY, '加载中，请稍候😴')
            };

            setTimeout(() => {
                if(translateButton){
                    translateButton.style.opacity = '1';
                    translateButton.style.transform = 'scale(1)';
                }
            }, 50);
            document.body.appendChild(translateButton);
            //translatePopup = null;
            })
        }
    },30)


});

document.addEventListener('mousedown', (event) => {

    if (translatePopup && !translatePopup.contains(event.target)) {
        isAlreadyGrammar = false;
        isAlreadyWord = false;
        document.body.removeChild(translatePopup)
        translatePopup = null
        return;
    }
    if (translatePopup && translatePopup.contains(event.target)) {
        flag = 1;
        return;
    }
    if (translateButton) {
        if (event.target !== translateButton) {
            tmp = null;
            //console.log(window.getSelection().toString().length)
            document.body.removeChild(translateButton);
            translateButton = null;
        } else flag = 2;
    }
});

async function getTranslatedText(text) {
    const port = chrome.runtime.connect({ name: "translationStream" });
    getCurrentTransSate((transEnabled) => {
        port.postMessage({
            action: "fetchData",
            url: "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
            data: {
                "model": transEnabled ? "qwen-max" : "qwen2-7b-instruct",
                "input": {
                    "messages": [
                        {
                            "role": "system",
                            "content": "您是一位语言专家。请将以下文本准确、专业且流畅地翻译成中文。在翻译过程中，请确保不仅传递原文的信息内容，而且保持语句通顺，符合中文表达习惯，使读者能够顺畅理解。请注意您的任务只需要翻译文本即可，不需要输出多余的信息，感谢您的帮助。"
                            //"content": "You are a helpful assistant. Please translate the following text into Chinese, ensuring that the translation is accurate, professional, and fluent."
                        },
                        {
                            "role": "user",
                            "content": `${text}`
                        }
                    ]
                },
                "parameters": {}
            }
        });
    })


    port.onMessage.addListener((response) => {
        if (response.error) {
            updateTranslationPopup(translatedTextElement,response.error);
            port.disconnect();
        } else if (response.done){
            finalizeTranslationPopup(isAlreadyWord,isAlreadyGrammar);
            port.disconnect();
        }else {
            console.log(response)
            updateTranslationPopup(translatedTextElement,response.data.output?.text);
        }
    })
}



function initTranslationPopup(x, y, translatedText) {
    translatePopup = document.createElement('div');
    getCurrentThemeColor((themeColor) => {
        Object.assign(translatePopup.style, {
            position: 'absolute',
            top: `${y + 20}px`, // Slightly below the button
            left: `${x}px`,
            zIndex: 2147483647,
            backgroundColor: themeColor,
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '15px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
            maxWidth: '500px',
            wordWrap: 'break-word',
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            color: '#ffffff',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            opacity: '0',
            transform: 'translateY(-10px)'
        });


        // Trigger animation after appending to the body
        setTimeout(() => {
            translatePopup.style.opacity = '1';
            translatePopup.style.transform = 'translateY(0)';
        }, 0);

        translatedTextElement = document.createElement('div');
        translatedTextElement.textContent = translatedText;
        Object.assign(translatedTextElement.style, {
            marginTop: '10px',
            marginBottom: '10px'
        });

        translatePopup.appendChild(translatedTextElement);
        document.body.appendChild(translatePopup);

        // 创建toolbar
        const toolbar = document.createElement('div');

        Object.assign(toolbar.style, {
            backgroundColor: '#e8e8e8', // 比popup稍微深一点的颜色
            padding: '4px 15px',
            borderRadius: '6px',
            fontSize: '10px',
            color: '#ffffff',
            cursor: 'move',
            display: 'flex',
            alignItems: 'center'
        });

        toolbar.addEventListener('mouseenter', () => {
            toolbar.style.backgroundColor = '#ffffff';
        });

        toolbar.addEventListener('mouseleave', () => {
            toolbar.style.backgroundColor = '#e8e8e8';
        });

        //toolbar.appendChild(document.createElement('span')); // 占位
        // 将toolbar添加到translatePopup顶部
        translatePopup.insertBefore(toolbar, translatePopup.firstChild);
        makeElementDraggable(translatePopup, toolbar);
    })
}

function updateTranslationPopup(element, text) {
    element.innerText = text;
}


function finalizeTranslationPopup(){
    const buttonContainer = document.createElement('div-container');
    Object.assign(buttonContainer.style, {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '10px'
    });
    const closeButton = document.createElement('button');
    closeButton.textContent = '我知道啦👌';
    const wordButton = document.createElement('button');
    wordButton.textContent = '重点单词🔍';
    const grammarButton = document.createElement('button');
    grammarButton.textContent = '语法分析📊'

        getCurrentThemeColor((themeColor) => {
            Object.assign(closeButton.style, {
                margin:'5px',
                flex:1,
                padding: '5px 10px',
                backgroundColor: '#e8e8e8',
                border: 'none',
                borderRadius: '8px',
                color: themeColor,
                cursor: 'pointer',
                fontSize: '16px',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
                fontFamily: 'Arial, sans-serif'
            });

            Object.assign(wordButton.style, {
                margin:'5px',
                flex:1,
                padding: '5px 10px',
                backgroundColor: '#e8e8e8',
                border: 'none',
                borderRadius: '8px',
                color: themeColor,
                cursor: 'pointer',
                fontSize: '16px',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
                fontFamily: 'Arial, sans-serif'
            });

            Object.assign(grammarButton.style, {
                margin:'5px',
                flex:1,
                padding: '5px 10px',
                backgroundColor: '#e8e8e8',
                border: 'none',
                borderRadius: '8px',
                color: themeColor,
                cursor: 'pointer',
                fontSize: '16px',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
                fontFamily: 'Arial, sans-serif'
            });
        })


        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.backgroundColor = '#ffffff';
        });

        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.backgroundColor = '#e8e8e8';
        });

        closeButton.onclick = () => {
            isAlreadyWord = false;
            isAlreadyGrammar = false;
            translatePopup.style.opacity = '0';
            translatePopup.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                document.body.removeChild(translatePopup);
                translatePopup = null;
            }, 300);
        };
/////////////////////////单词按钮/////////////////////////
    wordButton.addEventListener('mouseenter', () => {
        wordButton.style.backgroundColor = '#ffffff';
    });

    wordButton.addEventListener('mouseleave', () => {
        wordButton.style.backgroundColor = '#e8e8e8';
    });

    wordButton.onclick = async () => {
        if (transWords) {
            isAlreadyWord = true;
            translatePopup.removeChild(buttonContainer)
            translatedWordElement = document.createElement('div')
            translatePopup.appendChild(translatedWordElement)
            await getKeyWords(transWords);
        }
    };
/////////////////////////语法按钮/////////////////////////
    grammarButton.addEventListener('mouseenter', () => {
        grammarButton.style.backgroundColor = '#ffffff';
    });

    grammarButton.addEventListener('mouseleave', () => {
        grammarButton.style.backgroundColor = '#e8e8e8';
    });

    grammarButton.onclick = async () => {
        if (transWords) {
            isAlreadyGrammar = true;
            translatePopup.removeChild(buttonContainer)
            translateGrammarElement = document.createElement('div')
            translatePopup.appendChild(translateGrammarElement)
            await getKeyGrammar(transWords);
        }
    };

    if(!isAlreadyGrammar && isAlreadyWord){
        console.log("is already word")
        buttonContainer.appendChild(grammarButton);
    }
    if(!isAlreadyWord && isAlreadyGrammar){
        console.log("is already grammar")
        buttonContainer.appendChild(wordButton);
    }
    if(!isAlreadyGrammar && !isAlreadyWord){
        console.log("hhhhhhhh")
        buttonContainer.appendChild(grammarButton);
        buttonContainer.appendChild(wordButton);
    }
    buttonContainer.appendChild(closeButton);
    translatePopup.appendChild(buttonContainer)
}



// 创建可拖动的函数
// 修改makeElementDraggable函数，只允许拖动toolbar
function makeElementDraggable(element, handle) {
    let isDragging = false;
    let startX, startY, initialX, initialY;

    handle.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialX = parseInt(window.getComputedStyle(element).left, 10);
        initialY = parseInt(window.getComputedStyle(element).top, 10);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        element.style.left = `${initialX + dx}px`;
        element.style.top = `${initialY + dy}px`;
    }

    function onMouseUp() {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }
}



async function getKeyWords(text) {
    const port = chrome.runtime.connect({ name: "translationStream" });
    getCurrentTransSate((transEnabled) => {
        port.postMessage({
            action: "fetchData",
            url: "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
            data: {
                "model": transEnabled ? "qwen-max" : "qwen2-7b-instruct",
                "input": {
                    "messages": [
                        {
                            "role": "system",
                            "content": "您是一位语言专家。请仅提供用户给定的以下句子中，重难点单词及固定搭配的对照翻译，你不需要翻译整个句子。"
                            //"content": "You are a helpful assistant. Please translate the following text into Chinese, ensuring that the translation is accurate, professional, and fluent."
                        },
                        {
                            "role": "user",
                            "content": `${text}`
                        }
                    ]
                },
                "parameters": {}
            }
        });
    })


    port.onMessage.addListener((response) => {
        if (response.error) {
            updateTranslationPopup(translatedWordElement,response.error);
            port.disconnect();
        } else if (response.done){
            finalizeTranslationPopup();
            port.disconnect();
        }else {
            updateTranslationPopup(translatedWordElement,response.data.output?.text);
        }
    })
}

async function getKeyGrammar(text) {
    const port = chrome.runtime.connect({ name: "translationStream" });
    getCurrentTransSate((transEnabled) => {
        port.postMessage({
            action: "fetchData",
            url: "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
            data: {
                "model": transEnabled ? "qwen-max" : "qwen2-7b-instruct",
                "input": {
                    "messages": [
                        {
                            "role": "system",
                            "content": "您是一位语言专家。请仅提供用户给定的以下句子中的重点语法的解释，你不需要翻译整个句子。感谢您的帮助。"
                            //"content": "You are a helpful assistant. Please translate the following text into Chinese, ensuring that the translation is accurate, professional, and fluent."
                        },
                        {
                            "role": "user",
                            "content": `${text}`
                        }
                    ]
                },
                "parameters": {}
            }
        });
    })


    port.onMessage.addListener((response) => {
        if (response.error) {
            updateTranslationPopup(translateGrammarElement,response.error);
            port.disconnect();
        } else if (response.done){
            finalizeTranslationPopup();
            port.disconnect();
        }else {
            updateTranslationPopup(translateGrammarElement,response.data.output?.text);
        }
    })
}
