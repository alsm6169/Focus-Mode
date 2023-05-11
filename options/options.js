let block_urls = []

const timeOption = document.getElementById("time-option")
timeOption.addEventListener("change", (event) => {
    const val = event.target.value
    if (val < 1 || val > 60) {
        timeOption.value = 25
    }
})

chrome.storage.local.get(["timeOption", "block_urls"], (res) => {
    timeOption.value = res.timeOption
    block_urls = "block_urls" in res ? res.block_urls : []
    // console.log('chrome.storage.local.get: ', block_urls)
    drawUrlList()
})

const saveBtn = document.getElementById("save-btn")
saveBtn.addEventListener("click", () => {
    chrome.storage.local.set({
        timer: 0,
        timeOption: timeOption.value,
        isRunning: false,
        block_urls: block_urls
    })
    console.log('save-btn:click:: block_urls', block_urls)
    chrome.runtime.sendMessage({ type: "NewURL"})
    alert('Settings Saved!')
})

const urlInElem = document.getElementById("url-input")
urlInElem.addEventListener('keypress', (e) => {
    //console.log(e.key, urlInput.innerText)
    if (e.key === "Enter") {
        saveUrlToList()
    }
})

function saveUrlToList() {
    // console.log('saveUrlToList(urlInElem.value): ', urlInElem.value)
    if (!block_urls.includes(urlInElem.value)) {
        let maxIndex = 1
        if (block_urls.length > 0) {
            const indices = block_urls.map((urlItem) => urlItem.index)
            // console.log('indices', indices)
            maxIndex = Math.max(...indices);
            maxIndex += 1
        }
        // console.log('saveUrlToList(maxIndex new): ', maxIndex)
        block_urls.push({index: Number(maxIndex), url: urlInElem.value})
        urlInElem.value = ''
        // console.log('saveUrlToList(block_urls): ', block_urls)
    }
    drawUrlList()
}

const blockListDom = document.getElementById('blocklist-containter')
function drawUrlList() {
    blockListDom.innerHTML = "";
    const urlRow = document.createElement("div")

    block_urls.forEach((urlItem) => {
        let idx = urlItem.index
        let url = urlItem.url
        let text = document.createElement("input")
        text.type = "text"
        text.value = `${url}`
        text.id = idx
        text.className = "blocked-url-input"
        text.readOnly = true

        const deleteBtn = document.createElement("input")
        deleteBtn.type = "button"
        deleteBtn.value = "X"
        deleteBtn.className = "blocked-url-delete"
        deleteBtn.addEventListener("click", () => {
            deleteUrl(idx)
        })

        urlRow.appendChild(text)
        urlRow.appendChild(deleteBtn)
        let linebreak = document.createElement('br');
        urlRow.appendChild(linebreak);

    })
    blockListDom.appendChild(urlRow)

}


function deleteUrl(idx) {
    // console.log('deleteUrl(idx): ', idx, ', block_urls: ', block_urls)
    // let idx = this.getAttribute("id")
    // console.log(`Button with id: ${idx} clicked`)
    // this.parentNode.remove();
    block_urls = block_urls.filter((urlItem) => {
        return urlItem.index != idx;
    })
    // console.log('removeItem: ', block_urls)
    drawUrlList()
}
