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
                    sendStopMsgToAllTabs()
                            }
                chrome.storage.local.set({
                    timer,
                    isRunning,
                })
            }
        })
    }
})

// initialization of the chrome.storage variables
chrome.storage.local.get(["timer", "isRunning", "timeOption", "block_urls", "injectedTabs"], (res) => {
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
        // console.log('background.js::onMessage> NewURL')
        sendStopMsgToAllTabs()
        injectJS()
    }else if(message.type === "StartTimer") {
        // console.log('background.js::onMessage> StartTimer')
        // injectJS()
        sendStartMsgToRelevantTabs()
    }else if(message.type ==="StopTimer") {
        // console.log('background.js::onMessage> StopTimer')
        sendStopMsgToAllTabs()
    }
})

async function getRelevantTabs() {
    try {
        let blockUrlList = []
        const res = await chrome.storage.local.get(["block_urls"])
        blockUrlList = "block_urls" in res ? res.block_urls : []
        blockUrlList = blockUrlList.map((obj) => obj.url)
        // console.log('getRelevantTabs:blockUrlList> ', blockUrlList)

        const qryOptions = { "url": blockUrlList.map(p => `*://*.${p}/*`)}
        const tabs = await chrome.tabs.query(qryOptions)
        console.log('getRelevantTabs:tabs> ', tabs)
        return tabs
    } catch (err) {
        console.log('getRelevantTabs: No matching tab', err)
    }

}
async function injectJS() {
    try {
        let tabs = await getRelevantTabs()
        // console.log('injectJS all matching tabs', tabs)
        tabs.forEach(async(tab) => {
            try {
                console.log('EXISTING TAB: injecting into tab', tab.id, tab.url)
                chrome.scripting.executeScript({
                    target: {tabId: tab.id},
                    files: ['content/injected.js']
                })
                // resp = await insertIntoInjectedTabList(tab.id)
            } catch(err2) {
                console.log('injectJS: err2', err2)
            }
        })
    } catch (err) {
        console.log('injectJS: err', err)
    }
}

/*
 * Filter array items based on search criteria (query)
 */
async function checkTabUrlInBlockUrlList(blockUrlList, tabUrl) {
    // console.log('blockUrlList> ', blockUrlList, 'tabUrl> ', tabUrl)
    matchList = blockUrlList.filter((blockUrl) => tabUrl.toLowerCase().includes(blockUrl.toLowerCase()));
    // console.log('matchList.length', matchList.length, 'matchList', matchList)
    retVal = matchList.length > 0 ? true : false
    // console.log('retVal', retVal)
    return retVal
  }


// Listen for UPDATE in all the tabs, in case the new URL matches the block URL inject the script
chrome.tabs.onUpdated.addListener(async function(tabId, changeInfo, tab) {
    try {
        // console.log('onUpdated:tabId>', tabId, ', changeInfo>', changeInfo, ', tab>', tab)
        let blockUrlList = []
        let res = await chrome.storage.local.get(["block_urls"])
        blockUrlList = "block_urls" in res ? res.block_urls : []
        blockUrlList = blockUrlList.map((obj) => obj.url)
        // console.log('onUpdated:blockUrlList>',blockUrlList)

        if (blockUrlList.length > 0 && changeInfo.status === "complete" && await checkTabUrlInBlockUrlList(blockUrlList,tab.url)) {
                console.log('UPDATE TAB: injecting into tab', tab.id, tab.url)
                let resp = await chrome.scripting.executeScript({
                    target: {tabId: tab.id},
                    files: ['content/injected.js']
                    })
                console.log('response from injecting>', resp)
        }

        res = await chrome.storage.local.get(["isRunning"])
        if(res.isRunning) {
            sendStartMsgToRelevantTabs()
        }

    } catch (err) {
        console.log('onUpdated: err', err)
    }
})
/*
// Listen for CLOSE TAB and remove it from injected tab, if it existed
chrome.tabs.onRemoved.addListener(function(tabid, removed) {
    removeFromInjectedTabList(tabid)
})
*/

async function sendStartMsgToRelevantTabs() {
    try {
        let tabs = await getRelevantTabs()
        tabs.forEach(async (tab) => {
            try {
                console.log('sendStartMsgToRelevantTabs:tab', tab.id, tab.url)
                const resp = chrome.tabs.sendMessage(tab.id, {type : "StartTimer"})
                // console.log('sendStartMsgToRelevantTabs: resp', resp)
            } catch (err2) {
                console.log('sendStartMsgToRelevantTabs: err2', err2)
            }
        })
    } catch (err) {
        console.log('sendStartMsgToRelevantTabs: err', err)
    }
}

async function sendStopMsgToAllTabs() {
    try {
        // we send stpo message to all tabs
        let tabs = await chrome.tabs.query({}) // all the tabs
        // tabs.forEach((tab) => {
        for (const tab of tabs) {
            console.log('sendStopMsgToAllTabs:tab', tab.id, tab.url)
            try {
                const resp = await chrome.tabs.sendMessage(tab.id, {type : 'StopTimer'})
                // console.log(resp)
            } catch(err2) {
                //don't care about this error
                console.log('sendStopMsgToAllTabs:err2 for tab', tab.id)
            }
        }
    } catch (err) {
        console.log('sendStopMsgToAllTabs: err', err)
    }
}

