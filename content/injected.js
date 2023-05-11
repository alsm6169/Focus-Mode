
/*
// DOES NOT WORK
if (typeof focus_event_listner_installed === 'undefined') {
    const focus_event_listner = () => {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === "StartTimer") {
                console.log('injected.js: start timer')
            } else if(message.type === "StopTimer"){
                console.log('injected.js: stop timer')
            }
        })
        console.log(document.title, ": has now been injected")
        focus_event_listner_installed = true
        return true
    }
    focus_event_listner()
    chrome.runtime.sendMessage({ type: document.title + ": has now been injected"})
} else {
    console.log(document.title, ": was already injected")
    chrome.runtime.sendMessage({ type: document.title + ": was already injected"})
}
let focus_event_listner_installed = false
*/

if (window.contentScriptInjected !== true) {
    window.contentScriptInjected = true; // global scope
    const focus_event_listner = () => {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === "StartTimer") {
                console.log('injected.js: start timer')
                
            } else if(message.type === "StopTimer"){
                console.log('injected.js: stop timer')
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