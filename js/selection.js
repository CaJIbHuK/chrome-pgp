//данный код инжектируется в загруженную страницу (см параметры в манифесте content_scripts)
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.method === "getSelection")
    sendResponse({data: window.getSelection().toString()});
  else
    sendResponse({}); 
});