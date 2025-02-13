chrome.bookmarks.getTree((bookmarkTreeNodes) => {
    const bookmarks = extractBookmarks(bookmarkTreeNodes);
    chrome.storage.local.set({ savedBookmarks: bookmarks }, () => {
        console.log("Bookmarks saved:", bookmarks);
    });
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
