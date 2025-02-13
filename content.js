// Function to check if the page is job-related based on certain keywords
function analyzeJobContent() {
  // List of job-related keywords (you can expand this list)
  const jobKeywords = [
    "career", "vacancy", "apply", "job openings", "employment opportunities",
    "join our team", "we're hiring", "job opportunities", "work with us", "recruitment"
  ];

  // Get all text content from the page
  const bodyText = document.body.innerText.toLowerCase();

  // Check if any of the keywords are present in the page content
  let isJobRelated = jobKeywords.some(keyword => bodyText.includes(keyword));

  // Return the result
  return isJobRelated;
}

// Check if the current page is job-related
const isJobSite = analyzeJobContent();

// Send the result back to the popup or background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "checkJobSite") {
    sendResponse({ isJobSite });
  }
});
