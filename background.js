chrome.alarms.create("pomodoroTimer", {
    periodInMinutes: 1 / 60,
})

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "pomodoroTimer") {
        chrome.storage.local.get(["timer", "isRunning", "timeOption"], (res) => {
            if (res.isRunning) {
                let timer = res.timer + 1
                let isRunning = true
                if (timer === 60 * res.timeOption) {
                    this.registration.showNotification("Pomodoro Timer", {
                        body: `${res.timeOption} minutes has passed!`,
                        icon: "icon.png",
                    })
                    timer = 0
                    isRunning = false
                }
                chrome.storage.local.set({
                    timer,
                    isRunning,
                })
            }
        })
    }
})

chrome.storage.local.get(["timer", "isRunning", "timeOption", "block_urls"], (res) => {
    chrome.storage.local.set({
        timer: "timer" in res ? res.timer : 0,
        timeOption: "timeOption" in res ? res.timeOption : 25,
        isRunning: "isRunning" in res ? res.isRunning : false,
        block_urls: "block_urls" in res ? res.block_urls : []
    })
})


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('chrome.runtime.onMessage.addListener: ', message)
    if (message.type === "NewURL") {
        console.log('background.js: NewURL')
        injectJS()
    }else if(message.type === "StartTimer") {
        console.log('background.js: StartTimer')
        sendMsgToTabs("StartTimer")
    }else if(message.type ==="StopTimer") {
        console.log('background.js: StopTimer')
        sendMsgToTabs("StopTimer")
    }
})

async function sendMsgToTabs(msg) {
    try {
        let tabs = await getRelevantTabs()
        tabs.forEach((tab) => {
            console.log('sending message to tab', tab.id, tab.url)
            const resp = chrome.tabs.sendMessage(tab.id, {type : msg})
            console.log(resp)
        })
    } catch (err) {
        console.log('No matching tab', err)
    }
}

async function getRelevantTabs() {
    try {
        let blockUrlList = []
        const res = await chrome.storage.local.get(["block_urls"])
        blockUrlList = "block_urls" in res ? res.block_urls : []
        blockUrlList = blockUrlList.map((obj) => obj.url)
        // console.log('injectJS: ', blockUrlList)

        const qryOptions = { "url": blockUrlList.map(p => `*://*.${p}/*`)}
        const tabs = await chrome.tabs.query(qryOptions)
        return tabs
    } catch (err) {
        console.log('No matching tab', err)
    }

}
async function injectJS() {
    // further simplification of injectJS_v1 below in terms of code readability
    try {
        let tabs = await getRelevantTabs()
        // console.log('injectJS all matching tabs', tabs)
        tabs.forEach((tab) => {
            console.log('EXISTING TAB: injecting into tab', tab.id, tab.url)
            chrome.scripting.executeScript({
                target: {tabId: tab.id},
                files: ['content/injected.js']
            })
        })
    } catch (err) {
        console.log('No matching tab', err)
    }
}



// Listen NEW tab with matching URL
/*
chrome.tabs.onCreated.addListener(async function(tab) {
    try {
        console.log('onCreated:tab>', tab)
        let blockUrlList = []
        const res = await chrome.storage.local.get(["block_urls"])
        blockUrlList = "block_urls" in res ? res.block_urls : []
        blockUrlList = blockUrlList.map((obj) => obj.url)
        console.log('onCreated:blockUrlList>',blockUrlList)

        if (blockUrlList.length > 0 && blockUrlList.includes(tab.url)) {
            if(tab.status === "complete") {
                console.log('NEW TAB: injecting into tab', tab.id, tab.url)
                chrome.scripting.executeScript({
                    target: {tabId: tab.id},
                    files: ['content/injected.js']
                })
            }
        }
    } catch (err) {
        console.log('No matching tab', err)
    }
})
*/

/*
 * Filter array items based on search criteria (query)
 */
async function filterItems(blockUrlList, tabUrl) {
    // console.log('blockUrlList> ', blockUrlList, 'tabUrl> ', tabUrl)
    matchList = blockUrlList.filter((blockUrl) => tabUrl.toLowerCase().includes(blockUrl.toLowerCase()));
    // console.log('matchList.length', matchList.length, 'matchList', matchList)
    retVal = matchList.length > 0 ? true : false
    // console.log('retVal', retVal)
    return retVal
  }


// Listen for UPDATE in the active tab URL
chrome.tabs.onUpdated.addListener(async function(tabId, changeInfo, tab) {
    try {
        console.log('onUpdated:tabId>', tabId, ', changeInfo>', changeInfo, ', tab>', tab)
        let blockUrlList = []
        const res = await chrome.storage.local.get(["block_urls"])
        blockUrlList = "block_urls" in res ? res.block_urls : []
        blockUrlList = blockUrlList.map((obj) => obj.url)
        // console.log('onUpdated:blockUrlList>',blockUrlList)

        if (blockUrlList.length > 0 && changeInfo.status === "complete" && await filterItems(blockUrlList,tab.url)) {
                console.log('UPDATE TAB: injecting into tab', tab.id, tab.url)
                let resp = await chrome.scripting.executeScript({
                    target: {tabId: tab.id},
                    files: ['content/injected.js']
                    })
                console.log('response from injecting>', resp)
        }
    } catch (err) {
        console.log('No matching tab', err)
    }
})

async function injectJS_backup() {
    // further simplification of injectJS_v1 below in terms of code readability
    let blockUrlList = []

    try {
        const res = await chrome.storage.local.get(["block_urls"])
        blockUrlList = "block_urls" in res ? res.block_urls : []
        blockUrlList = blockUrlList.map((obj) => obj.url)
        // console.log('injectJS: ', blockUrlList)

        const qryOptions = { "url": blockUrlList.map(p => `*://*.${p}/*`)}
        let tabs = await chrome.tabs.query(qryOptions)
        // console.log('injectJS all matching tabs', tabs)
        tabs.forEach((tab) => {
            console.log('injecting into tab', tab.id, tab.url)
            chrome.scripting.executeScript({
                target: {tabId: tab.id},
                files: ['content/injected.js']
            })
        })
    } catch (err) {
        console.log('No matching tab', err)
    }
}
function injectJS_v1() {
    //uses callback approach
    let blockUrlList = []
    chrome.storage.local.get(["block_urls"], (res) => {
        blockUrlList = "block_urls" in res ? res.block_urls : []
        blockUrlList = blockUrlList.map((obj) => obj.url)
        // console.log('injectJS: ', blockUrlList)
        chrome.tabs.query({ "url": blockUrlList.map(p => `*://*.${p}/*`)}, (tabs) => {
            tabs.forEach((tab) => {
                console.log('tab.id: ',tab.id, 'tab.url:', tab.url)
            })
        })
    })
}
