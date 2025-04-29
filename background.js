chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'user_reported_content') {
      fetch('https://your-nodal-agency-server.com/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: message.url,
          mediaType: message.mediaType,
          timestamp: message.timestamp
        })
      })
      .then(response => response.json())
      .then(data => console.log('Report sent successfully:', data))
      .catch(error => console.error('Error sending report:', error));
    }
  });