chrome.bookmarks.getTree((bookmarkTreeNodes) => {
    const bookmarks = extractBookmarks(bookmarkTreeNodes);
    
    // Save to local storage
    chrome.storage.local.set({ savedBookmarks: bookmarks }, () => {
        console.log("Bookmarks saved:", bookmarks);
    });

    // Send to Flask backend
    fetch('http://localhost:5000/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookmarks)
    })
    .then(response => response.json())
    .then(data => console.log("Sent to Flask:", data))
    .catch(error => console.error("Error sending to Flask:", error));
});

function extractBookmarks(nodes, results = []) {
    for (let node of nodes) {
        if (node.url) {
            results.push({ title: node.title, url: node.url });
        }
        if (node.children) {
            extractBookmarks(node.children, results);
        }
    }
    return results;
}
