/* Chrome Extension Core Logic & Text Analysis Engine */

const RED_FLAG_CONFIGS = {
  "Data Sharing & Sale": {
    pattern: /\b(sells?|selling|sold|shares?|shared|sharing|third-part(y|ies)|partners?|advertisers?|monetiz(e|ing|ed)|affiliates?|vendors?|brokers?|marketing partners?)\b/gi,
    keywords: ["sell", "share", "third-party", "partners", "advertisers", "monetize", "affiliates", "vendors", "brokers"],
    severity: "High"
  },
  "Surveillance & Tracking": {
    pattern: /\b(locations?|background|cookies?|device\s+ids?|microphones?|cameras?|gps|tracks?|tracking|tracked|surveillance|ip\s+address(es)?|browsing\s+history|keystrokes?|biometrics?|faceprints?|voiceprints?)\b/gi,
    keywords: ["location", "background", "cookies", "device ID", "microphone", "camera", "gps", "track", "surveillance", "ip address", "browsing history", "keystroke", "biometrics"],
    severity: "High"
  },
  "Account Rights & Waivers": {
    pattern: /\b(terminat(e|ing|ed|ion)|ownership|waives?|waived|arbitration|class\s+action(s)?|liabilit(y|ies)|sole\s+discretion|indemnif(y|ied|ication)|irrevocable|perpetual|forfeits?|forfeited|disclaimers?|disclaim(s|ed)?)\b/gi,
    keywords: ["terminate", "ownership", "waive", "arbitration", "class action", "liability", "sole discretion", "indemnify", "irrevocable", "perpetual"],
    severity: "Medium"
  },
  "Retention & Deletion": {
    pattern: /\b(retain(s|ed)?\s+indefinitely|no\s+mechanism|cannot\s+delete|hold\s+forever|keep\s+your\s+data|backup(s)?\s+persist|retain\s+all\s+data|retain\s+for\s+analytical)\b/gi,
    keywords: ["retain indefinitely", "no mechanism", "cannot delete", "hold forever", "keep your data", "backup persist", "retain all data"],
    severity: "Medium"
  }
};

// ----------------- NLP Helper Functions -----------------

function splitIntoSentences(text) {
  if (!text) return [];
  
  // Normalize whitespace and newlines
  const normalized = text.replace(/\s+/g, ' ');
  
  // Protect legal abbreviations from being split
  const abbrevMap = {
    "e.g.": "___EG___",
    "i.e.": "___IE___",
    "u.s.": "___US___",
    "co.": "___CO___",
    "inc.": "___INC___",
    "ltd.": "___LTD___",
    "dr.": "___DR___",
    "mr.": "___MR___",
    "ms.": "___MS___",
    "vs.": "___VS___",
    "etc.": "___ETC___"
  };
  
  let tempText = normalized;
  for (const [abbrev, placeholder] of Object.entries(abbrevMap)) {
    const escaped = abbrev.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    tempText = tempText.replace(regex, placeholder);
  }
  
  // Split on sentence terminals followed by space
  const rawSentences = tempText.split(/(?<=[.!?])\s+/);
  
  const sentences = [];
  for (let s of rawSentences) {
    s = s.trim();
    if (!s) continue;
    
    // Restore abbreviations
    for (const [abbrev, placeholder] of Object.entries(abbrevMap)) {
      s = s.replaceAll(placeholder, abbrev);
    }
    
    if (s.length > 8) {
      sentences.push(s);
    }
  }
  
  return sentences;
}

function highlightKeywords(sentence, pattern) {
  pattern.lastIndex = 0;
  return sentence.replace(pattern, (match) => {
    return `<span style="color:#ef4444; font-weight:600;">${match}</span>`;
  });
}

// ----------------- Main Controller & Scraping -----------------

const statusBadge = document.getElementById('status-badge');
const tabScan = document.getElementById('tab-scan');
const tabPaste = document.getElementById('tab-paste');
const scanView = document.getElementById('scan-view');
const pasteView = document.getElementById('paste-view');

let currentScanResults = null;

// Tab Switch Logic
tabScan.addEventListener('click', () => {
  tabScan.classList.add('active');
  tabPaste.classList.remove('active');
  scanView.classList.remove('hidden');
  pasteView.classList.add('hidden');
});

tabPaste.addEventListener('click', () => {
  tabPaste.classList.add('active');
  tabScan.classList.remove('active');
  pasteView.classList.remove('hidden');
  scanView.classList.add('hidden');
});

// Click Handlers
document.getElementById('btn-scan-page').addEventListener('click', async () => {
  try {
    statusBadge.innerText = "Extracting";
    const text = await getActiveTabContent();
    if (!text || text.trim().length < 50) {
      alert("No significant text content was found on this webpage. Make sure you are on a webpage containing Terms of Service or Privacy Policy text.");
      statusBadge.innerText = "Ready";
      return;
    }
    runScan(text);
  } catch (err) {
    console.error(err);
    statusBadge.innerText = "Error";
    alert("Extraction Failed: Chrome prevents script execution on system pages (chrome://) and Web Store pages. To test, please copy the text manually and use the 'Paste Text' tab!");
  }
});

document.getElementById('btn-scan-paste').addEventListener('click', () => {
  const text = document.getElementById('tos-input').value;
  if (!text || text.trim().length < 10) {
    alert("Please paste some text to analyze.");
    return;
  }
  runScan(text);
});

// Active Tab Scraping Method
async function getActiveTabContent() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) throw new Error("No active tab.");
  
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => document.body.innerText
  });
  
  if (!results || !results[0]) throw new Error("Scraping failed.");
  return results[0].result;
}

// Scanning Orchestrator
function runScan(text) {
  statusBadge.innerText = "Analyzing";
  document.getElementById('loading-area').classList.remove('hidden');
  document.getElementById('results-area').classList.add('hidden');
  
  setTimeout(() => {
    try {
      const sentences = splitIntoSentences(text);
      const results = {
        totalClauses: sentences.length,
        flaggedCount: 0,
        highRiskCount: 0,
        mediumRiskCount: 0,
        categories: {
          "Data Sharing & Sale": [],
          "Surveillance & Tracking": [],
          "Account Rights & Waivers": [],
          "Retention & Deletion": []
        }
      };
      
      for (const sentence of sentences) {
        let isFlagged = false;
        let sentenceFlags = [];
        
        for (const [category, config] of Object.entries(RED_FLAG_CONFIGS)) {
          config.pattern.lastIndex = 0;
          const matches = sentence.match(config.pattern);
          
          if (matches) {
            isFlagged = true;
            const uniqueMatches = [...new Set(matches.map(m => m.toLowerCase()))];
            const highlighted = highlightKeywords(sentence, config.pattern);
            
            const flagEntry = {
              original: sentence,
              highlighted: highlighted,
              category: category,
              severity: config.severity,
              keywords: uniqueMatches
            };
            
            results.categories[category].push(flagEntry);
            sentenceFlags.push(flagEntry);
          }
        }
        
        if (isFlagged) {
          results.flaggedCount++;
          if (sentenceFlags.some(f => f.severity === "High")) {
            results.highRiskCount++;
          } else {
            results.mediumRiskCount++;
          }
        }
      }
      
      renderResults(results);
      currentScanResults = results;
    } catch (err) {
      console.error(err);
      alert("Error scanning text: " + err.message);
    } finally {
      document.getElementById('loading-area').classList.add('hidden');
      statusBadge.innerText = "Done";
    }
  }, 100);
}

// ----------------- DOM Rendering & Accordion -----------------

function renderResults(results) {
  document.getElementById('results-area').classList.remove('hidden');
  
  // Set Counts
  document.getElementById('count-high').innerText = results.highRiskCount;
  document.getElementById('count-medium').innerText = results.mediumRiskCount;
  document.getElementById('count-total').innerText = results.flaggedCount;
  
  // Determine Grade
  let grade = "A";
  let label = "Very Safe";
  let desc = "No privacy red flags were detected. Excellent transparency.";
  let color = "var(--green-safe)";
  
  const high = results.highRiskCount;
  const medium = results.mediumRiskCount;
  
  if (high === 0 && medium === 0) {
    grade = "A";
    label = "Very Safe";
    desc = "No privacy red flags were detected. Excellent transparency.";
    color = "var(--green-safe)";
  } else if (high === 0 && medium <= 2) {
    grade = "B";
    label = "Safe";
    desc = "Only a few minor rights waivers or tracking clauses. Generally safe.";
    color = "var(--accent-blue)";
  } else if (high === 1 || (high === 0 && medium > 2)) {
    grade = "C";
    label = "Caution";
    desc = "Contains data sharing or location tracking. Proceed with care.";
    color = "var(--orange-warn)";
  } else if (high <= 3) {
    grade = "D";
    label = "Warning";
    desc = "Multiple high-risk tracking or third-party sharing clauses found.";
    color = "var(--red-alert)";
  } else {
    grade = "F";
    label = "Danger";
    desc = "Extremely invasive clauses. Highly predatory rights waivers and background data sales.";
    color = "var(--red-alert)";
  }
  
  // Update Grade Circle
  const gc = document.getElementById('grade-circle');
  gc.innerText = grade;
  gc.style.backgroundColor = color;
  
  // Update Labels
  const gl = document.getElementById('grade-label');
  gl.innerText = label;
  gl.style.color = color;
  document.getElementById('grade-desc').innerText = desc;
  
  // Populate Accordion Sections
  for (const [category, clauses] of Object.entries(results.categories)) {
    let catId = "sharing";
    if (category.includes("Tracking")) catId = "tracking";
    else if (category.includes("Rights")) catId = "rights";
    else if (category.includes("Retention")) catId = "retention";
    
    // Set Badge Count
    document.getElementById(`badge-${catId}`).innerText = clauses.length;
    
    const panel = document.getElementById(`cat-${catId}`);
    const emptyMsg = panel.querySelector('.empty-message');
    const listContainer = panel.querySelector('.clause-list');
    
    listContainer.innerHTML = '';
    
    if (clauses.length === 0) {
      emptyMsg.classList.remove('hidden');
    } else {
      emptyMsg.classList.add('hidden');
      
      clauses.forEach(c => {
        const entry = document.createElement('div');
        entry.className = `clause-entry ${c.severity.toLowerCase()}`;
        
        const p = document.createElement('p');
        p.innerHTML = c.highlighted;
        entry.appendChild(p);
        
        const meta = document.createElement('div');
        meta.className = 'clause-meta';
        
        const tag = document.createElement('span');
        tag.className = `tag tag-${c.severity.toLowerCase()}`;
        tag.innerText = `${c.severity} Risk`;
        meta.appendChild(tag);
        
        c.keywords.forEach(kw => {
          const kwTag = document.createElement('span');
          kwTag.className = 'tag tag-keyword';
          kwTag.innerText = kw;
          meta.appendChild(kwTag);
        });
        
        entry.appendChild(meta);
        listContainer.appendChild(entry);
      });
    }
  }
}

// Accordion Toggles
document.querySelectorAll('.accordion-header').forEach(header => {
  header.addEventListener('click', () => {
    const targetId = header.getAttribute('data-target');
    const content = document.getElementById(targetId);
    
    // Toggle active state
    header.classList.toggle('active');
    content.classList.toggle('open');
  });
});

// Report Exporter
document.getElementById('btn-export-report').addEventListener('click', () => {
  if (!currentScanResults) return;
  
  let report = "Terms of Service Privacy Scan Report\n";
  report += "==================================\n\n";
  report += `Safety Grade: ${document.getElementById('grade-circle').innerText} (${document.getElementById('grade-label').innerText})\n`;
  report += `Summary: ${document.getElementById('grade-desc').innerText}\n\n`;
  report += `Audited Clauses: ${currentScanResults.totalClauses}\n`;
  report += `Flagged Clauses: ${currentScanResults.flaggedCount}\n`;
  report += `High Severity Flags: ${currentScanResults.highRiskCount}\n`;
  report += `Medium Severity Flags: ${currentScanResults.mediumRiskCount}\n\n`;
  
  report += "Matched Clauses Breakdown:\n";
  report += "-------------------------\n";
  
  for (const [category, clauses] of Object.entries(currentScanResults.categories)) {
    report += `\nCategory: ${category}\n`;
    if (clauses.length === 0) {
      report += "  - No flags matched.\n";
    } else {
      clauses.forEach(c => {
        report += `  - [${c.severity} RISK] Keywords matched: ${c.keywords.join(', ')}\n`;
        report += `    Clause: "${c.original}"\n`;
      });
    }
  }
  
  const blob = new Blob([report], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tos_privacy_audit_report.txt';
  a.click();
  URL.revokeObjectURL(url);
});
