// Get references to the popup elements
const bookmarkBtn = document.getElementById("bookmark-btn");
const messageElem = document.getElementById("message");

// Check if the current tab is a job-related site
chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
  const tab = tabs[0];

  // Inject content script to analyze page content
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: analyzeJobContent
  }, function(results) {
    if (results && results[0].result) {
      messageElem.textContent = "This is a job-related site! You can bookmark it.";
      bookmarkBtn.disabled = false;
    } else {
      messageElem.textContent = "This site doesn't seem to be job-related.";
      bookmarkBtn.disabled = true;
    }
  });
});

// Bookmark the page if it's job-related
bookmarkBtn.addEventListener("click", function() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const tab = tabs[0];
    
    // Send message to background script to create the bookmark
    chrome.runtime.sendMessage({ action: "bookmark", url: tab.url, title: tab.title });
    messageElem.textContent = "Bookmark added to your job-related sites!";
  });
});

// Analyze the page content to check if it's job-related
function analyzeJobContent() {
  const bodyText = document.body.innerText.toLowerCase();
  
  // Job-related keywords (expand this list as needed)
  const jobKeywords = ["career", "vacancy", "apply", "job openings", "employment opportunities", "join our team"];
  
  let isJobRelated = jobKeywords.some(keyword => bodyText.includes(keyword));
  
  return isJobRelated;
}
document.getElementById("clear-bookmarks-btn").addEventListener("click", function() {
  if (confirm("Are you sure you want to delete all job-related bookmarks?")) {
      chrome.runtime.sendMessage({ action: "clear_job_bookmarks" });
  }
});
