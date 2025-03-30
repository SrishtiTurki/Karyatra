chrome.action.onClicked.addListener((tab) => {
  if (tab.url) {
    // Check if the bookmark already exists in Chrome
    chrome.bookmarks.search({ url: tab.url }, function (results) {
      if (results.length > 0) {
        alert("⚠️ You have already bookmarked this page!");
      } else {
        // Inject a content script to check if it's a job-related page
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const bodyText = document.body.innerText.toLowerCase();
            const jobKeywords = [
              "career", "vacancy", "apply", "job openings", 
              "employment opportunities", "join our team", "recruitment",
              "work with us", "hiring", "internship", "job listings"
            ];
            return jobKeywords.some(keyword => bodyText.includes(keyword));
          }
        }, (results) => {
          if (results && results[0]?.result) {
            saveBookmark(tab);
          } else {
            alert("❌ This site is not recognized as a job-related site.");
          }
        });
      }
    });
  }
});

// Function to save a job bookmark
function saveBookmark(tab) {
  const { url, title } = tab;
  const domain = new URL(url).hostname; // Extract domain name

  const parentFolderName = "Job Sites";

  // Step 1: Check if "Job Sites" parent folder exists
  chrome.bookmarks.search({ title: parentFolderName }, (folders) => {
    if (folders.length === 0) {
      // If "Job Sites" doesn't exist, create it
      chrome.bookmarks.create({ title: parentFolderName }, (newFolder) => {
        createSiteFolderAndBookmark(newFolder.id, domain, title, url);
      });
    } else {
      // Use existing "Job Sites" folder ID
      createSiteFolderAndBookmark(folders[0].id, domain, title, url);
    }
  });
}

// Function to create a subfolder for a job site and bookmark the page
function createSiteFolderAndBookmark(parentFolderId, domain, title, url) {
  // Step 2: Check if a folder for this specific site exists
  chrome.bookmarks.search({ title: domain }, (siteFolders) => {
    let siteFolder = siteFolders.find(folder => folder.parentId === parentFolderId);

    if (!siteFolder) {
      // Create a subfolder for the site if it doesn't exist
      chrome.bookmarks.create({ parentId: parentFolderId, title: domain }, (newSiteFolder) => {
        createBookmark(newSiteFolder.id, title, url);
      });
    } else {
      // Use existing site folder
      createBookmark(siteFolder.id, title, url);
    }
  });
}

// Function to create a bookmark
function createBookmark(folderId, title, url) {
  chrome.bookmarks.create({ parentId: folderId, title: title, url: url }, () => {
    console.log(`✅ Bookmark added in folder ID ${folderId}`);
  });
}

// Function to clear all job bookmarks
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "clear_job_bookmarks") {
    clearJobBookmarks(sendResponse);
    return true; 
  }
});

// Function to delete all job-related bookmarks
function clearJobBookmarks(sendResponse) {
  const folderName = "Job Sites";

  chrome.bookmarks.search({ title: folderName }, (folders) => {
    if (folders.length > 0) {
      chrome.bookmarks.removeTree(folders[0].id, () => {
        console.log("🗑️ All job-related bookmarks deleted.");
        sendResponse({ status: "cleared" });
      });
    } else {
      alert("⚠️ No job bookmarks found!");
      sendResponse({ status: "none" });
    }
  });
}
