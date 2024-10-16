chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({
        pluginEnabled: true,           // 默认插件开启
        themeColor: '#008c7d',         // 默认主题颜色
        transEnabled: false            // 默认强力翻译关闭
    }, () => {
        console.log('默认设置已初始化。');
    });
});

chrome.runtime.onConnect.addListener((port) => {
    console.assert(port.name === "translationStream")
    port.onMessage.addListener((message) => {
        if (message.action === "fetchData") {
            fetch(message.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": "Bearer sk-19399ce60ef648f483ee4f99e3a2b072",
                    "X-DashScope-SSE": "enable"
                },
                body: JSON.stringify(message.data)
            })
                .then(response => {
                    console.log(response)
                    if (!response.body) {
                        throw new Error('流响应未启用或服务器不支持SSE。');
                    }

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder("utf-8");

                    async function readStream() {
                        let completeText = "";
                        let jsonString = "";
                        while (true) {
                            const {done, value} = await reader.read();
                            if (done) {
                                port.postMessage({data: {output: {text: completeText}}, done: true})
                                break;
                            }

                            const chunk = decoder.decode(value, {stream: true});
                            const events = chunk.split('\n\n'); // SSE 事件以两个换行符分隔

                            for (let event of events) {
                                if (event === "") continue;
                                // 使用正则表达式去除 `data:` 之前的字符串
                                jsonString = event.replace(/^.*data:/s, '');
                                // 解析 JSON 字符串为对象
                                //console.log(jsonString)
                                completeText = JSON.parse(jsonString).output.text;
                                port.postMessage({data: {output: {text: completeText}}, done: false});
                            }
                        }
                    }

                    readStream().catch(error => {
                        console.error('获取翻译时出错', error);
                        port.postMessage({error: error.message});
                    });

                    return true; // 表示 sendResponse 是异步调用
                })
                .catch(error => {
                    console.error('fetch请求出错', error);
                    port.postMessage({error: error.message});
                });

            return true; // 表示 sendResponse 是异步调用
        }

    })

});

