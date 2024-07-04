document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('translate-button').addEventListener('click', async () => {
    chrome.storage.sync.get('selectedText', async (data) => {
      if (data.selectedText) {
        // const response = await fetch('YOUR_API_URL', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json'
        //   },
        //   body: JSON.stringify({ text: data.selectedText })
        // });
        // const result = await response.json();
        //alert(`Translated Text: ${result.translatedText}`);
        alert(`hello ${data.selectedText}`)
      } else {
        alert('No text selected');
      }
    });
  });
});
