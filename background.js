
function filePicker() {
    window.showOpenFilePicker();
  }
  
chrome.action.onClicked.addListener(async function(tab) { 
    chrome.tabs.create({ url: "ecg_viewer.html" }, (ecgTab)=>{
        chrome.scripting.executeScript({
            target : {tabId : ecgTab.id},
            func : filePicker,
          })
          .then(() => console.log("injected file picker"));
    });
  });
  