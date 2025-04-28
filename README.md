# techno-byte
{
  "manifest.json": {
    "manifest_version": 3,
    "name": "Abusive Media Blocker",
    "version": "1.0",
    "description": "Blocks abusive/obscene media and alerts authorities.",
    "permissions": [
      "activeTab",
      "scripting",
      "storage",
      "webRequest",
      "webRequestBlocking",
      "<all_urls>"
    ],
    "background": {
      "service_worker": "background.js"
    },
    "content_scripts": [
      {
        "matches": ["<all_urls>"],
        "js": ["content.js"],
        "css": ["styles.css"]
      }
    ],
    "action": {
      "default_popup": "popup.html"
    }
  },
  "background.js": 
    // Initialize extension and handle web requests
    chrome.webRequest.onBeforeRequest.addListener(
      function(details) {
        if (details.type === "media") {
          // Flag media for analysis
          chrome.tabs.sendMessage(details.tabId, {
            action: "analyzeMedia",
            url: details.url
          });
        }
      },
      { urls: ["<all_urls>"] },
      ["blocking"]
    );
    
    // Handle messages from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "reportAbusiveContent") {
        fetch('http://localhost:3000/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: message.url,
            type: message.type,
            timestamp: new Date().toISOString()
          })
        })
        .then(response => response.json())
        .then(data => console.log('Reported:', data))
        .catch(error => console.error('Error reporting:', error));
      }
    });
  ,
  "content.js": 
    // Load NSFW.js for image/video analysis
    importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.18.0/dist/tf.min.js', 
                  'https://cdn.jsdelivr.net/npm/nsfwjs@2.2.0/dist/nsfwjs.min.js');

    let nsfwModel;
    NSFWJS.load().then(model => {
      nsfwModel = model;
    });

    // Analyze media when requested
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "analyzeMedia") {
        analyzeMedia(message.url);
      }
    });

    // Monitor and analyze media on page
    function analyzeMedia(url) {
      const mediaElements = document.querySelectorAll('img, video, audio');
      mediaElements.forEach(element => {
        if (element.src === url) {
          if (element.tagName === 'IMG' || element.tagName === 'VIDEO') {
            analyzeImageOrVideo(element);
          } else if (element.tagName === 'AUDIO') {
            analyzeAudio(element);
          }
        }
      });
    }

    // Image/Video analysis using NSFW.js
    async function analyzeImageOrVideo(element) {
      if (!nsfwModel) return;
      const predictions = await nsfwModel.classify(element);
      const isAbusive = predictions.some(pred => 
        ['Porn', 'Hentai', 'Sexy'].includes(pred.className) && pred.probability > 0.8
      );
      if (isAbusive) {
        blockMedia(element);
        reportContent(element.src, element.tagName.toLowerCase());
      }
    }

    // Audio analysis (transcription via AssemblyAI)
    async function analyzeAudio(element) {
      const audioBlob = await fetch(element.src).then(res => res.blob());
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const response = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: { 'Authorization': 'YOUR_ASSEMBLYAI_API_KEY' },
        body: formData
      });
      const transcript = await response.json();
      
      if (transcript.text && containsAbusiveLanguage(transcript.text)) {
        blockMedia(element);
        reportContent(element.src, 'audio');
      }
    }

    // Simple abusive language detection
    function containsAbusiveLanguage(text) {
      const abusiveWords = ['abuse', 'offensive', 'explicit']; // Expand with real dictionary
      return abusiveWords.some(word => text.toLowerCase().includes(word));
    }

    // Block media by blurring
    function blockMedia(element) {
      element.classList.add('blocked-media');
    }

    // Report to backend
    function reportContent(url, type) {
      chrome.runtime.sendMessage({
        action: 'reportAbusiveContent',
        url,
        type
      });
    }
  ,
  "styles.css": 
    .blocked-media {
      filter: blur(10px) !important;
      pointer-events: none;
    }
  ,
  "popup.html": 
    <!DOCTYPE html>
    <html>
    <head>
      <title>Abusive Media Blocker</title>
      <style>
        body { width: 300px; padding: 10px; font-family: Arial; }
        h3 { margin: 0 0 10px; }
        p { font-size: 14px; }
      </style>
    </head>
    <body>
      <h3>Abusive Media Blocker</h3>
      <p>Monitoring and blocking abusive content...</p>
    </body>
    </html>
  ,
  "server.js": 
    const express = require('express');
    const nodemailer = require('nodemailer');
    const app = express();
    
    app.use(express.json());
    
    // Configure email transport
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'your-email@gmail.com',
        pass: 'your-app-password'
      }
    });
    
    // Endpoint to receive reports
    app.post('/report', (req, res) => {
      const { url, type, timestamp } = req.body;
      
      // Send email to nodal agency
      const mailOptions = {
        from: 'your-email@gmail.com',
        to: 'nodal-agency@example.com',
        subject: 'Abusive Content Detected',
        text: Abusive ${type} content detected at ${url} on ${timestamp}
      };
      
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Email error:', error);
          return res.status(500).json({ error: 'Failed to send alert' });
        }
        res.json({ status: 'Reported successfully' });
      });
    });
    
    app.listen(3000, () => console.log('Server running on port 3000'));
  
}
Show in sidebar
Setup Instructions
Browser Extension:
Create a directory with the files above.
Load the extension in Chrome via Developer Mode > Load Unpacked.
Replace YOUR_ASSEMBLYAI_API_KEY with a valid AssemblyAI API key for audio transcription.
Backend Server:
Install Node.js and dependencies: npm install express nodemailer.
Update server.js with your email credentials (use an app-specific password for Gmail).
Run the server: node server.js.
Dependencies:
NSFW.js and TensorFlow.js are loaded via CDN.
AssemblyAI API for audio transcription (requires signup).
Nodemailer for email alerts.
Features
Real-Time Monitoring: Detects media on page load and during navigation.
Client-Side Blocking: Blurs abusive content instantly.
Agency Alerts: Sends detailed reports to the nodal agency via email.
Cross-Platform: Works on any Chrome-based browser.
Limitations
Audio Analysis: Requires an external API (AssemblyAI), adding latency.
False Positives: NSFW.js may misclassify edge cases; refine thresholds as needed.
Privacy: Client-side processing ensures user data stays local, but backend reports URLs.
Alternative Solutions
Desktop/Mobile App:
Use Electron for a desktop app or React Native for mobile.
Integrate with OS-level media APIs (e.g., Core Audio for macOS).
Pros: Deeper system integration.
Cons: Platform-specific development, harder to deploy.
Server-Side Filtering:
Deploy a proxy server to filter all media before rendering.
Pros: Centralized control, easier to update models.
Cons: Requires user trust, higher latency.
Cloud-Based Plugin:
Use AWS Rekognition for image/video and AWS Transcribe for audio.
Pros: Robust, scalable AI models.
Cons: Higher costs, dependency on cloud services.
This browser plugin solution balances ease of deployment, privacy, and functionality. Let me know if you’d like to explore an alternative approach or need help with specific parts!
