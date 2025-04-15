// Get references to popup elements
const bookmarkBtn = document.getElementById("bookmark-btn");
const messageElem = document.getElementById("message");
const clearBookmarksBtn = document.getElementById("clear-bookmarks-btn");

// Ensure elements exist before adding event listeners
if (bookmarkBtn && messageElem) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (chrome.runtime.lastError) {
            console.error("Error querying tabs:", chrome.runtime.lastError);
            return;
        }

        const tab = tabs[0];

        // Inject a script to check if it's a job-related page
        chrome.scripting.executeScript(
            {
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
            },
            (results) => {
                if (chrome.runtime.lastError) {
                    console.error("Error executing script:", chrome.runtime.lastError);
                    return;
                }

                if (results && results[0]?.result) {
                    messageElem.textContent = "✅ This is a job-related site! You can bookmark it.";
                    bookmarkBtn.disabled = false;
                } else {
                    messageElem.textContent = "❌ This site doesn't seem to be job-related.";
                    bookmarkBtn.disabled = true;
                }
            }
        );
    });

    // 💾 Save bookmark to Flask API
    bookmarkBtn.addEventListener("click", function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (chrome.runtime.lastError) {
                console.error("Error querying tabs:", chrome.runtime.lastError);
                return;
            }

            const tab = tabs[0];

            // ✅ Check if bookmark exists in Flask API
            fetch("http://127.0.0.1:5000/api/bookmarks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: tab.title, url: tab.url })
            })
                .then(response => response.json())
                .then(data => {
                    console.log("Response from API:", data); // Debugging line
                    if (data.message && data.message.includes("Bookmark saved")) {
                        messageElem.textContent = "✅ Bookmark added successfully!";
                    } else {
                        messageElem.textContent = "⚠️ Error adding bookmark.";
                    }
                })
                .catch(error => {
                    console.error("Error saving bookmark:", error);
                    messageElem.textContent = "⚠️ Failed to save bookmark.";
                });
        });
    });
}

// 🗑️ Clear job-related bookmarks from Flask API
if (clearBookmarksBtn) {
    clearBookmarksBtn.addEventListener("click", function () {
        if (confirm("⚠️ Are you sure you want to delete all job-related bookmarks?")) {
            fetch("http://127.0.0.1:5000/api/bookmarks", {
                method: "DELETE"
            })
                .then(response => response.json())
                .then(data => {
                    if (data.message === "All bookmarks deleted") {
                        alert("✅ All job-related bookmarks deleted!");
                    } else {
                        alert("⚠️ No job bookmarks found!");
                    }
                })
                .catch(error => {
                    console.error("Error clearing bookmarks:", error);
                    alert("⚠️ Failed to clear bookmarks.");
                });
        }
    });
}