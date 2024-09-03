document.addEventListener('DOMContentLoaded', () => {
  // 获取已保存的颜色并设置为颜色选择器的初始值
  chrome.storage.sync.get(['themeColor'], (result) => {
     // Default color if none is set
    document.getElementById('color-picker').value = result.themeColor || '#006f62';
  });


  document.getElementById('color-picker').addEventListener('input', () => {
    const color = document.getElementById('color-picker').value;
    //document.getElementById('color-display').style.backgroundColor = color;
    chrome.storage.sync.set({themeColor: color}, () => {
      console.log('Color saved:', color);
    });
  });

  chrome.storage.sync.get(['transEnabled'], (result) => {
     // Default false if none is set
    document.getElementById('trans-switch').checked = result.transEnabled || false;
  });

  // 关闭插件按钮的点击事件
  document.getElementById('trans-switch').addEventListener('change', () => {
    const enabled = document.getElementById('trans-switch').checked;
    chrome.storage.sync.set({ transEnabled: enabled }, () => {
      console.log('Extension enabled status:', enabled);
      //chrome.runtime.sendMessage({ action: 'setTransStatus', enabled: enabled });
    });
  });
})


  // 关闭插件按钮的点击事件
  //   document.getElementById('disable-button').addEventListener('click', () => {
  //     chrome.runtime.sendMessage({ action: 'disableExtension' }, (response) => {
  //       console.log('Message sent to Service Worker:', response);
  //     });
  //   });
  // });


// document.addEventListener('DOMContentLoaded', () => {
//   // 获取已保存的颜色并设置为颜色选择器的初始值
//   chrome.storage.sync.get(['themeColor', 'extensionEnabled'], (result) => {
//     const themeColor = result.themeColor || '#006f62'; // Default color if none is set
//     document.getElementById('color-picker').value = themeColor;
//     document.getElementById('color-display').style.backgroundColor = themeColor;
//
//     const extensionEnabled = result.extensionEnabled !== undefined ? result.extensionEnabled : true;
//     document.getElementById('status-switch').checked = extensionEnabled;
//   });
//
//   // 显示颜色选择器
//   document.getElementById('color-display').addEventListener('click', () => {
//     document.getElementById('color-picker').click();
//   });
//
//   // 保存颜色按钮的点击事件
//   document.getElementById('color-picker').addEventListener('input', () => {
//     const color = document.getElementById('color-picker').value;
//     document.getElementById('color-display').style.backgroundColor = color;
//     chrome.storage.sync.set({ themeColor: color }, () => {
//       console.log('Color saved:', color);
//     });
//   });
//

// });
