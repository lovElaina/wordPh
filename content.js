// content.js

(async function () {
    // 缓存全局状态
    const state = {
        translateButton: null,
        translatePopup: null,
        translatedTextElement: null,
        translatedWordElement: null,
        translateGrammarElement: null,
        //flag: 0,
        pageX: 0,
        pageY: 0,
        tmp: null,
        transWords: null,
        isAlreadyWord: false,
        isAlreadyGrammar: false,
        port: null, // 用于保持与后台的连接
    };

    // Utility: 获取当前主题颜色
    const getCurrentThemeColor = () => {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['themeColor'], (result) => {
                resolve(result.themeColor || '#008c7d');
            });
        });
    };

    // Utility: 获取当前翻译状态
    const getCurrentTransState = () => {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['transEnabled'], (result) => {
                resolve(result.transEnabled);
            });
        });
    };

    // Utility: 获取插件启用状态
    const getPluginEnabled = () => {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['pluginEnabled'], (result) => {
                resolve(result.pluginEnabled !== undefined ? result.pluginEnabled : true);
            });
        });
    };

    // Utility: 通用API调用函数，支持流式响应
    const fetchTranslation = async (action, text, onUpdate, onComplete, onError) => {
        if (state.port) {
            // 如果已有端口连接，先断开
            state.port.disconnect();
            state.port = null;
        }

        state.port = chrome.runtime.connect({ name: "translationStream" });

        state.port.onMessage.addListener((response) => {
            if (response.error) {
                onError(response.error);
                state.port.disconnect();
                state.port = null;
            } else if (response.done) {
                onComplete();
                state.port.disconnect();
                state.port = null;
            } else {
                onUpdate(response.data.output?.text);
            }
        });

        // 发送请求到后台
        state.port.postMessage({
            action: "fetchData",
            url: "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
            data: {
                "model": await getCurrentTransState() ? "qwen-max" : "qwen2-7b-instruct",
                "input": {
                    "messages": [
                        {
                            "role": "system",
                            "content": action === 'translate'
                                ? "您是一位语言专家。请将以下文本准确、专业且流畅地翻译成中文。在翻译过程中，请确保不仅传递原文的信息内容，而且保持语句通顺，符合中文表达习惯，使读者能够顺畅理解。请注意您的任务只需要翻译文本即可，不需要输出多余的信息，感谢您的帮助。"
                                : action === 'keywords'
                                    ? "您是一位语言专家。请仅提供用户给定的以下句子中，重难点单词及固定搭配的对照翻译，你不需要翻译整个句子。"
                                    : "您是一位语言专家。请仅提供用户给定的以下句子中的重点语法的解释，你不需要翻译整个句子。感谢您的帮助。",
                        },
                        {
                            "role": "user",
                            "content": text,
                        },
                    ],
                },
                "parameters": {}
            }
        });
    };

    // 创建翻译按钮
    const createTranslateButton = async (x, y) => {
        const themeColor = await getCurrentThemeColor();
        const button = document.createElement('button');
        button.textContent = '译';
        button.setAttribute('aria-label', '翻译选中的文本');
        button.classList.add('translate-button'); // 添加CSS类

        // 设置按钮的位置
        button.style.top = `${y}px`;
        button.style.left = `${x + 10}px`;

        // 设置CSS变量以动态调整主题颜色
        button.style.setProperty('--theme-color', themeColor);

        // 点击按钮事件
        button.onclick = async () => {
            if (state.translatePopup) {
                document.body.removeChild(state.translatePopup);
            }
            const selectedText = window.getSelection().toString().trim();
            if (selectedText) {
                state.transWords = selectedText;
                removeTranslateButton();
                initTranslationPopup(state.pageX, state.pageY, '加载中，请稍候😴');

                // 开始翻译并处理流式响应
                fetchTranslation(
                    'translate',
                    selectedText,
                    (partialText) => {
                        // 更新翻译内容
                        if (state.translatedTextElement) {
                            state.translatedTextElement.innerText = partialText;
                        }
                    },
                    () => {
                        // 翻译完成
                        finalizeTranslationPopup();
                    },
                    (error) => {
                        // 处理错误
                        if (state.translatedTextElement) {
                            state.translatedTextElement.innerText = `翻译错误: ${error}`;
                        }
                    }
                );
            }
        };

        // 添加到文档
        document.body.appendChild(button);

        // 触发动画
        requestAnimationFrame(() => {
            button.classList.add('visible');
        });

        return button;
    };

    // 移除翻译按钮
    const removeTranslateButton = () => {
        if (state.translateButton) {
            state.translateButton.classList.remove('visible');
            // 等待动画完成后移除
            setTimeout(() => {
                if (state.translateButton && state.translateButton.parentNode) {
                    state.translateButton.parentNode.removeChild(state.translateButton);
                }
                state.translateButton = null;
            }, 30);
        }
    };

    // 初始化翻译弹出框
    const initTranslationPopup = async (x, y, initialText) => {
        const themeColor = await getCurrentThemeColor();
        const popup = document.createElement('div');
        popup.classList.add('translate-popup'); // 添加CSS类

        // 设置弹出框的位置
        popup.style.top = `${y + 20}px`; // 稍微低于按钮
        popup.style.left = `${x}px`;

        // 设置CSS变量以动态调整主题颜色
        popup.style.setProperty('--theme-color', themeColor);

        // 显示弹出框
        document.body.appendChild(popup);
        requestAnimationFrame(() => {
            popup.classList.add('visible');
        });

        // 创建工具栏
        const toolbar = document.createElement('div');
        toolbar.classList.add('toolbar');

        // 使弹出框可拖拽
        makeElementDraggable(popup, toolbar);

        // 创建翻译内容元素
        const translatedTextElement = document.createElement('div');
        translatedTextElement.textContent = initialText;
        translatedTextElement.classList.add('translated-text');

        // 将工具栏和内容添加到弹出框
        popup.appendChild(toolbar);
        popup.appendChild(translatedTextElement);

        // 保存状态
        state.translatePopup = popup;
        state.translatedTextElement = translatedTextElement;
    };

    // 更新弹出框内容
    const updateTranslationPopup = (element, text) => {
        if (element) {
            element.innerText = text;
        }
    };

    // 完成翻译后添加按钮
    const finalizeTranslationPopup = () => {
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('button-container');

        // 创建按钮
        const closeButton = createButton('我知道啦👌', handleClosePopup);
        const wordButton = createButton('重点单词🔍', handleWordButton);
        const grammarButton = createButton('语法分析📊', handleGrammarButton);

        // 根据状态决定显示哪些按钮
        if (!state.isAlreadyGrammar && state.isAlreadyWord) {
            buttonContainer.appendChild(grammarButton);
        } else if (!state.isAlreadyWord && state.isAlreadyGrammar) {
            buttonContainer.appendChild(wordButton);
        } else if (!state.isAlreadyGrammar && !state.isAlreadyWord) {
            buttonContainer.appendChild(grammarButton);
            buttonContainer.appendChild(wordButton);
        }

        buttonContainer.appendChild(closeButton);
        state.translatePopup.appendChild(buttonContainer);
    };

    // 创建按钮的辅助函数
    const createButton = (text, onClick) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.classList.add('popup-button'); // 添加CSS类

        // 设置主题颜色
        button.style.setProperty('--theme-color', '#008c7d'); // 默认主题颜色，可根据需要动态设置

        // 点击事件
        button.onclick = onClick;

        return button;
    };

    // 关闭弹出框的处理函数
    const handleClosePopup = () => {
        state.isAlreadyWord = false;
        state.isAlreadyGrammar = false;
        if (state.translatePopup) {
            state.translatePopup.classList.remove('visible');
            // 等待动画完成后移除
            setTimeout(() => {
                if (state.translatePopup && state.translatePopup.parentNode) {
                    state.translatePopup.parentNode.removeChild(state.translatePopup);
                }
                state.translatePopup = null;
            }, 30);
        }
    };

    // 处理“重点单词”按钮点击
    const handleWordButton = async () => {
        if (state.transWords) {
            state.isAlreadyWord = true;
            removePopupButtons();
            state.translatedWordElement = document.createElement('div');
            state.translatedWordElement.textContent = '加载中，请稍候😴';
            state.translatedWordElement.classList.add('translated-word');
            state.translatePopup.appendChild(state.translatedWordElement);

            // 开始获取关键词并处理流式响应
            fetchTranslation(
                'keywords',
                state.transWords,
                (partialText) => {
                    if (state.translatedWordElement) {
                        state.translatedWordElement.innerText = partialText;
                    }
                },
                () => {
                    finalizeTranslationPopup();
                },
                (error) => {
                    if (state.translatedWordElement) {
                        state.translatedWordElement.innerText = `单词提取错误: ${error}`;
                    }
                }
            );
        }
    };

    // 处理“语法分析”按钮点击
    const handleGrammarButton = async () => {
        if (state.transWords) {
            state.isAlreadyGrammar = true;
            removePopupButtons();
            state.translateGrammarElement = document.createElement('div');
            state.translateGrammarElement.textContent = '加载中，请稍候😴';
            state.translateGrammarElement.classList.add('translate-grammar');
            state.translatePopup.appendChild(state.translateGrammarElement);

            // 开始获取语法分析并处理流式响应
            fetchTranslation(
                'grammar',
                state.transWords,
                (partialText) => {
                    if (state.translateGrammarElement) {
                        state.translateGrammarElement.innerText = partialText;
                    }
                },
                () => {
                    finalizeTranslationPopup();
                },
                (error) => {
                    if (state.translateGrammarElement) {
                        state.translateGrammarElement.innerText = `语法分析错误: ${error}`;
                    }
                }
            );
        }
    };

    // 移除弹出框中的按钮（在处理单词或语法按钮点击时）
    const removePopupButtons = () => {
        const buttons = state.translatePopup.querySelectorAll('.button-container button');
        buttons.forEach(button => button.remove());
    };

    // 创建可拖动的函数
    const makeElementDraggable = (element, handle) => {
        let isDragging = false;
        let startX, startY, initialX, initialY;

        const onMouseMove = (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            element.style.left = `${initialX + dx}px`;
            element.style.top = `${initialY + dy}px`;
        };

        const onMouseUp = () => {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        handle.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = parseInt(window.getComputedStyle(element).left, 10);
            initialY = parseInt(window.getComputedStyle(element).top, 10);
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    };

    // 处理鼠标抬起事件
    const handleMouseUp = async (event) => {
        // 检查是否在翻译按钮或弹出框内
        if ((state.translateButton && state.translateButton.contains(event.target)) ||
            (state.translatePopup && state.translatePopup.contains(event.target))) {
            return;
        }

        setTimeout(async () => {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();

            if (selectedText.length > 0 && state.tmp !== selectedText) {
                state.tmp = selectedText;
                state.pageX = event.pageX;
                state.pageY = event.pageY;

                // 移除已有的翻译按钮
                removeTranslateButton();

                // 创建新的翻译按钮
                state.translateButton = await createTranslateButton(state.pageX, state.pageY);
            }
        }, 30);
    };

    // 处理鼠标按下事件
    const handleMouseDown = (event) => {
        // 如果点击不在弹出框内，关闭弹出框
        if (state.translatePopup && !state.translatePopup.contains(event.target)) {
            state.isAlreadyGrammar = false;
            state.isAlreadyWord = false;
            handleClosePopup();
        }

        // 如果点击在翻译按钮内，不做任何操作
        if (state.translateButton && state.translateButton.contains(event.target)) {
            // 不需要设置 flag
            return;
        }

        // 其他情况下，移除翻译按钮
        if (state.translateButton && event.target !== state.translateButton) {
            state.tmp = null;
            removeTranslateButton();
        }
    };

    // 启用插件功能：添加事件监听
    const enablePlugin = () => {
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('mousedown', handleMouseDown);
    };

    // 禁用插件功能：移除事件监听并清理UI
    const disablePlugin = () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousedown', handleMouseDown);
            removeTranslateButton();
            handleClosePopup();
    };

    // 初始化插件状态
    const initializePlugin = async () => {
        const enabled = await getPluginEnabled();
        console.log('Plugin enabled status on initialization:', enabled);
        if (enabled) {
            if (document.readyState === 'complete') {
                console.log('Document already loaded, enabling plugin');
                enablePlugin();
            } else {
                console.log('Document not loaded yet, waiting for load event');
                window.addEventListener('load', () => {
                    console.log('Load event fired, enabling plugin');
                    enablePlugin();
                });
            }
        } else {
            console.log('Plugin is disabled');
            disablePlugin();
        }
    };

    // 监听插件启用状态的变化
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'sync') {
            if (changes.pluginEnabled) {
                if (changes.pluginEnabled.newValue) {
                    enablePlugin();
                } else {
                    disablePlugin();
                }
            }
            if (changes.themeColor) {
                // 更新现有按钮和弹出框的主题颜色
                const newColor = changes.themeColor.newValue || '#008c7d';
                document.documentElement.style.setProperty('--theme-color', newColor);
                // if (state.translateButton) {
                //     state.translateButton.style.setProperty('--theme-color', newColor);
                // }
                // if (state.translatePopup) {
                //     state.translatePopup.style.setProperty('--theme-color', newColor);
                // }
                // // 更新弹出框中的按钮颜色
                // const buttons = state.translatePopup ? state.translatePopup.querySelectorAll('.button-container button') : [];
                // buttons.forEach(button => {
                //     button.style.setProperty('--theme-color', newColor);
                // });
            }
        }
    });

    // 启动插件
    await initializePlugin();

    // 当内容脚本卸载时，清理资源
    window.addEventListener('beforeunload', () => {
        disablePlugin();
    });

})();
