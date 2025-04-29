function detectAbusiveContent(mediaElement, mediaType) {
    // Example heuristic: media file name or metadata includes abusive keyword
    const src = mediaElement.src || '';
    if (src.includes("abuse") || src.includes("explicit")) {
      mediaElement.style.filter = "blur(10px)";
  
      const reportBtn = document.createElement("button");
      reportBtn.textContent = "🚨 Report this content";
      reportBtn.style.cssText = `
        position: absolute;
        z-index: 9999;
        background: red;
        color: white;
        font-weight: bold;
        border: none;
        padding: 5px 10px;
        cursor: pointer;
      `;
  
      mediaElement.parentElement.style.position = "relative";
      mediaElement.parentElement.appendChild(reportBtn);
  
      reportBtn.addEventListener("click", () => {
        chrome.runtime.sendMessage({
          type: "user_reported_content",
          url: window.location.href,
          mediaType,
          timestamp: new Date().toISOString()
        });
  
        alert("Content reported successfully.");
      });
    }
  }
  
  const images = document.querySelectorAll("img");
  images.forEach(img => detectAbusiveContent(img, "Image"));
  
  const videos = document.querySelectorAll("video");
  videos.forEach(video => detectAbusiveContent(video, "Video"));
  
  const audios = document.querySelectorAll("audio");
  audios.forEach(audio => detectAbusiveContent(audio, "Audio"));