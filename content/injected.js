//let docHtml = ""
if (window.contentScriptInjected !== true) {
    window.contentScriptInjected = true; // global scope
    const focus_event_listner = () => {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log('injected.js:', message)
            if (message.type === "StartTimer") {
                //docHtml = document.body.innerHTML
                //console.log('injected.js: StartTimer, docHtml.length', docHtml.length)
                fetch(chrome.runtime.getURL("content/injected.html"))
                .then((response) => response.text())
                .then((html) => {
                    // Replace the webpage's innerHTML with the local blocked.html content
                    console.log('injected.html', html)
                    document.body.innerHTML = html;
                });
                //document.body.innerHTML = blockMsg
            } else if(message.type === "StopTimer"){
                // Reload the original page
                location.reload();
                /*
                console.log('injected.js: StopTimer, docHtml.length', docHtml.length)
                if (docHtml.length > 0) {
                    document.body.innerHTML = docHtml
                }*/
            }
        })
        console.log(document.title, ": has now been injected")
        return true
    }
    focus_event_listner()
    chrome.runtime.sendMessage({ type: document.title + ": has now been injected"})
} else {
    console.log(document.title, ": was already injected")
    chrome.runtime.sendMessage({ type: document.title + ": was already injected"})

}