chrome.action.onClicked.addListener((tab) => {
  if (tab.url) {
      // Inject a content script to analyze the page
      chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: analyzeJobContent
      }, (results) => {
          if (results && results[0].result) {
              chrome.runtime.sendMessage({
                  action: "bookmark",
                  url: tab.url,
                  title: tab.title
              });
          } else {
              alert("❌ This site is not recognized as a job-related site.");
          }
      });
  }
});

// Function to analyze job-related content
function analyzeJobContent() {
  const bodyText = document.body.innerText.toLowerCase();
  const jobKeywords = ["career", "vacancy", "apply", "job openings", "employment opportunities", "join our team"];
  return jobKeywords.some(keyword => bodyText.includes(keyword));
}

// Listen for bookmark request
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "bookmark") {
    const { url, title } = message;
    const domain = new URL(url).hostname; // Extracts the site's domain (e.g., linkedin.com)

    const folderName = "Job Sites"; // Parent folder for job-related sites

    // First, find or create the "Job Sites" folder
    chrome.bookmarks.search({ title: folderName }, function (folders) {
      if (folders.length === 0) {
        // "Job Sites" folder doesn't exist, create it
        chrome.bookmarks.create({ title: folderName }, function (newFolder) {
          createSubfolderAndBookmark(newFolder.id, domain, title, url);
        });
      } else {
        // "Job Sites" folder exists, use its ID
        createSubfolderAndBookmark(folders[0].id, domain, title, url);
      }
    });
  }
});

// Function to find or create a site-specific subfolder and add the bookmark
function createSubfolderAndBookmark(parentFolderId, domain, title, url) {
  chrome.bookmarks.search({ title: domain }, function (siteFolders) {
    let siteFolder = siteFolders.find(folder => folder.parentId === parentFolderId);

    if (!siteFolder) {
      // Site-specific folder doesn't exist, create it
      chrome.bookmarks.create({ parentId: parentFolderId, title: domain }, function (newSiteFolder) {
        // Now add the bookmark inside the newly created site folder
        chrome.bookmarks.create({ parentId: newSiteFolder.id, title: title, url: url });
      });
    } else {
      // Site-specific folder exists, directly add the bookmark
      chrome.bookmarks.create({ parentId: siteFolder.id, title: title, url: url });
    }
  });
}

// Helper function to add a bookmark
function addBookmark(folderId, title, url) {
  chrome.bookmarks.create({ parentId: folderId, title: title, url: url }, () => {
      console.log(`✅ Bookmarked ${title}`);
  });
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "clear_job_bookmarks") {
      const folderName = "Job Sites";

      // Find the main "Job Sites" folder
      chrome.bookmarks.search({ title: folderName }, function (folders) {
          if (folders.length > 0) {
              // Delete the entire "Job Sites" folder
              chrome.bookmarks.removeTree(folders[0].id, function () {
                  console.log("🗑️ All job-related bookmarks have been deleted.");
              });
          } else {
              alert("⚠️ No job bookmarks found!");
          }
      });
  }
});
