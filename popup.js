document.addEventListener('DOMContentLoaded', async () => {
    const data = await chrome.storage.local.get('lastDetected');
    if (data.lastDetected) {
      document.getElementById('mediaType').innerText = data.lastDetected.mediaType;
    }
  
    document.getElementById('reportBtn').addEventListener('click', async () => {
      const payload = {
        url: window.location.href,
        mediaType: data.lastDetected?.mediaType || "Unknown",
        timestamp: new Date().toISOString()
      };
  
      fetch('https://your-nodal-agency-server.com/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
        .then(() => alert('Reported Successfully!'))
        .catch(() => alert('Failed to report.'));
    });
  });
  