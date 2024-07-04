let translateButton;
let translatePopup;
let translatedTextElement;
let flag;
let pageX;
let pageY;
let tmp;

document.addEventListener('mouseup', (event) => {
    if (flag === 1 || flag === 2 || flag === 3) {
        flag = 0;
        return;
    }
    const selection = window.getSelection();
    console.log(selection.toString().length)
    console.log(selection.toString())

    if (selection.toString().length > 0 && selection.toString() !== tmp) {
        if (translateButton) {
            document.body.removeChild(translateButton);
        }
        tmp = selection.toString()
        pageX = event.pageX;
        pageY = event.pageY;
        translateButton = document.createElement('button');
        translateButton.textContent = '翻译';
        Object.assign(translateButton.style, {
            position: 'absolute',
            top: `${pageY}px`,
            left: `${pageX + 10}px`,
            zIndex: 2147483647,
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            padding: '5px 10px',
            cursor: 'pointer',
            borderRadius: '5px',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
            fontFamily: 'Arial, sans-serif'
        });

        translateButton.onclick = async () => {
            if (translatePopup) {
                document.body.removeChild(translatePopup);
            }
            await getTranslatedText(selection.toString());
            document.body.removeChild(translateButton);
            translateButton = null;
            initTranslationPopup(pageX, pageY, '加载中，请稍候😴')
        };


        if (translateButton) {
            document.body.appendChild(translateButton);
            translatePopup = null;
        }
    }
});

document.addEventListener('mousedown', (event) => {

    if (translatePopup && !translatePopup.contains(event.target)) {
        document.body.removeChild(translatePopup)
        translatePopup = null
        return;
    }
    if (translatePopup && translatePopup.contains(event.target)) {
        flag = 3;
        return;
    }
    if (translateButton) {
        if (event.target !== translateButton) {
            //flag = 1;
            document.body.removeChild(translateButton);
            translateButton = null;
        } else {

            flag = 2;
        }
    }
});

async function getTranslatedText(text) {
    const port = chrome.runtime.connect({ name: "translationStream" });
    port.postMessage({
        action: "fetchData",
        url: "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
        data: {
            "model": "qwen2-7b-instruct",
            "input": {
                "messages": [
                    {
                        "role": "system",
                        "content": "您是一位语言专家。请将以下文本准确、专业且流畅地翻译成中文。在翻译过程中，请确保不仅传递原文的信息内容，而且保持语句通顺，符合中文表达习惯，使读者能够顺畅理解。"
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

    port.onMessage.addListener((response) => {
        // if(translatePopup && !response.done){
        //     console.log("saddqwdqwdef")
        //     document.body.removeChild(translatePopup);
        //     translatePopup = null;
        //     initTranslationPopup(pageX, pageY,"......")
        // }
        if (response.error) {
            updateTranslationPopup(translatedTextElement,response.error);
            port.disconnect();
        } else if (response.done){
            finalizeTranslationPopup();
            port.disconnect();
        }else {
            console.log(response)
            updateTranslationPopup(translatedTextElement,response.data.output?.text);
        }
    })
}

//构造并展示翻译窗口
// function showTranslationPopup(x, y, translatedText, isResult) {
//     translatePopup = document.createElement('div');
//
//     Object.assign(translatePopup.style, {
//         position: 'absolute',
//         top: `${y + 20}px`, // Slightly below the button
//         left: `${x}px`,
//         zIndex: 2147483647,
//         backgroundColor: '#fff',
//         border: '1px solid #ccc',
//         padding: '10px',
//         boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
//         maxWidth: '300px',
//         wordWrap: 'break-word',
//         fontFamily: 'Arial, sans-serif',
//         fontSize: '14px',
//         color: '#000'
//     });
//
//
//     let translatedTextElement = document.createElement('div');
//     translatedTextElement.textContent = translatedText;
//     translatePopup.appendChild(translatedTextElement);
//
//     if(isResult){
//         const closeButton = document.createElement('button');
//         closeButton.textContent = '我知道啦👌';
//         Object.assign(closeButton.style, {
//             display: 'block',
//             marginTop: '10px',
//             backgroundColor: '#007bff',
//             color: '#fff',
//             border: 'none',
//             padding: '5px 10px',
//             cursor: 'pointer',
//             borderRadius: '5px',
//             boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
//             fontFamily: 'Arial, sans-serif'
//         });
//         closeButton.onclick = () => {
//             document.body.removeChild(translatePopup);
//             translatePopup = null;
//         };
//         translatePopup.appendChild(closeButton);
//     }
//
//     document.body.appendChild(translatePopup);
// }


function initTranslationPopup(x, y, translatedText) {
    translatePopup = document.createElement('div');

    Object.assign(translatePopup.style, {
        position: 'absolute',
        top: `${y + 20}px`, // Slightly below the button
        left: `${x}px`,
        zIndex: 2147483647,
        backgroundColor: '#fff',
        border: '1px solid #ccc',
        padding: '10px',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
        maxWidth: '300px',
        wordWrap: 'break-word',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#000'
    });
    translatedTextElement = document.createElement('div');
    translatedTextElement.textContent = translatedText;
    translatePopup.appendChild(translatedTextElement);
    document.body.appendChild(translatePopup);
}

function updateTranslationPopup(element, text) {
    element.innerText = text;
}

function finalizeTranslationPopup(){
    const closeButton = document.createElement('button');
        closeButton.textContent = '我知道啦👌';
        Object.assign(closeButton.style, {
            display: 'block',
            marginTop: '10px',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            padding: '5px 10px',
            cursor: 'pointer',
            borderRadius: '5px',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
            fontFamily: 'Arial, sans-serif'
        });
        closeButton.onclick = () => {
            document.body.removeChild(translatePopup);
            translatePopup = null;
        };
        translatePopup.appendChild(closeButton);
}