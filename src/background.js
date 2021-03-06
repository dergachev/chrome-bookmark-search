var urlGoMatch = /^go (https?|ftp|file|chrome(-extension)?):\/\/.+/i;
var jsGoMatch = /^go javascript:.+/i;
var urlMatch = /^(https?|ftp|file|chrome(-extension)?):\/\/.+/i;
var jsMatch = /^javascript:.+/i;

function createTab(url){
	chrome.tabs.create({
		'url': url
	});
}

function nav(url){
	if(jsMatch.test(url)){
		console.error("Internal code error");
	}else if(localStorage["tabbed"]){
		chrome.tabs.create({
			'url': url
		});
	}else{
		chrome.tabs.update({
			'url': url
		});
	}
}

function execJS(js){
	chrome.tabs.update({
		'url': "javascript:" + js
	});
}

function escapeXML(str){
	return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Check whether new version is installed
chrome.runtime.onInstalled.addListener(function(details){
	// Set default options and check existing options

	// Links open in new tab? (=false)
	if(localStorage["tabbed"] != "true"){
		localStorage["tabbed"] = "";
	}
	// Automatically match full name? (=true)
	if('matchname' in localStorage){
		if(localStorage["matchname"] != "true"){
			localStorage["matchname"] = "";
		}
	}else{
		localStorage["matchname"] = true;
	}
	// Supports bookmarklets? (=false, by default doesn't have permission)
	chrome.permissions.contains({
		'origins': ["<all_urls>"]
	}, function(result){
		if(result){
			localStorage["jsbm"] == "true";
		}else{
			localStorage["jsbm"] = "";
		}
	});
	// Maximum displayed items (=5)
	if(!localStorage["maxcount"] || parseInt(localStorage["maxcount"]) < 2){
		localStorage["maxcount"] = 5;
	}
	// Search algorithm (=v2)
	if(["builtin", "v2"].indexOf(localStorage["searchalgorithm"] == -1)){
		localStorage["searchalgorithm"] = "v2";
		if(localStorage["searchsortv2"] === ""){
			localStorage["searchalgorithm"] = "builtin";
		}
		if("searchsortv2" in localStorage){
			localStorage.removeItem("searchsortv2");
		}
	}else{
		localStorage["searchsortv2"] = true;
	}

	// Shows the installed/updated prompt
	if(details.reason == "install"){
		createTab(chrome.runtime.getURL("options.html"));
		webkitNotifications.createHTMLNotification(chrome.runtime.getURL("notification_install.html")).show();
	}else if(details.reason == "update"){
		webkitNotifications.createHTMLNotification(chrome.runtime.getURL("notification_update.html?v" + details.previousVersion)).show();
	}
});

chrome.omnibox.onInputChanged.addListener(function(text, suggest){
	searchInput(text, localStorage["searchalgorithm"], suggest, chrome.omnibox.setDefaultSuggestion, function(url){
		localStorage["s_automatchUrl"] = url;
	});
});

chrome.omnibox.onInputEntered.addListener(function(text){
	if(localStorage["s_automatchUrl"]){
		text = "go " + localStorage["s_automatchUrl"];
		localStorage["s_automatchUrl"] = "";
	}
	if(jsGoMatch.test(text)){ // is "go jsbm"
		if(localStorage["jsbm"]){
			execJS(text.substr(14));
		}else{
			if(confirm("JavaScript bookmarklet support is not enabled. Do you wish to enable it in the options page now?")){
				createTab(chrome.runtime.getURL("options.html"));
			}
		}
	}else if(urlGoMatch.test(text)){ // is "go addr"
		nav(text.substr(3));
	}else if(text.substr(0, 1) == "?"){
		nav("chrome://bookmarks/#q=" + text.substr(1));
	}else{
		nav("chrome://bookmarks/#q=" + text);
	}
});

chrome.omnibox.onInputStarted.addListener(function(){
	localStorage["s_automatchUrl"] = "";
});

chrome.omnibox.onInputCancelled.addListener(function(){
	localStorage["s_automatchUrl"] = "";
});
