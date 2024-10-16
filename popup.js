// popup.js

document.addEventListener('DOMContentLoaded', () => {
  // 获取已保存的颜色并设置为颜色选择器的初始值
  chrome.storage.sync.get(['themeColor'], (result) => {
    // Default color if none is set
    document.getElementById('color-picker').value = result.themeColor || '#006f62';
  });

  // 监听颜色选择器的变化
  document.getElementById('color-picker').addEventListener('input', () => {
    const color = document.getElementById('color-picker').value;
    chrome.storage.sync.set({ themeColor: color }, () => {
      console.log('Color saved:', color);
    });
  });

  // 获取并设置插件状态开关
  chrome.storage.sync.get(['pluginEnabled'], (result) => {
    // Default to true if not set
    document.getElementById('status-switch').checked = result.pluginEnabled !== undefined ? result.pluginEnabled : true;
  });

  // 监听插件状态开关的变化
  document.getElementById('status-switch').addEventListener('change', () => {
    const enabled = document.getElementById('status-switch').checked;
    chrome.storage.sync.set({ pluginEnabled: enabled }, () => {
      console.log('Plugin enabled status:', enabled);
    });
  });

  // 获取并设置强力翻译开关
  chrome.storage.sync.get(['transEnabled'], (result) => {
    // Default false if none is set
    document.getElementById('trans-switch').checked = result.transEnabled || false;
  });

  // 监听强力翻译开关的变化
  document.getElementById('trans-switch').addEventListener('change', () => {
    const enabled = document.getElementById('trans-switch').checked;
    chrome.storage.sync.set({ transEnabled: enabled }, () => {
      console.log('Strong translation enabled status:', enabled);
    });
  });
});
