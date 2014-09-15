function onClickHandler(info, tab) {
  if (info.menuItemId == "radio1" || info.menuItemId == "radio2") {
    console.log("radio item " + info.menuItemId +
                " was clicked (previous checked state was "  +
                info.wasChecked + ")");
  } else if (info.menuItemId == "checkbox1" || info.menuItemId == "checkbox2") {
    console.log(JSON.stringify(info));
    console.log("checkbox item " + info.menuItemId +
                " was clicked, state is now: " + info.checked +
                " (previous state was " + info.wasChecked + ")");

  } else {
    console.log("item " + info.menuItemId + " was clicked");
    console.log("info: " + JSON.stringify(info));
    console.log("tab: " + JSON.stringify(tab));
  }
};

var vidInd = -1;
var tabId;

function tabCreated(tab){
	tabId = tab.id;
	console.log(tabId);
};

chrome.tabs.onRemoved.addListener(tabClosed);

function tabClosed(tabIdin, info){
	if(tabIdin == tabId){
		playing = false;
		pageExists = false;
		chrome.browserAction.setIcon({path:"icon.png"});
	}
}

var playing = false;
var pageExists = false;

chrome.runtime.onMessage.addListener( 
	function(request,sender,sendResponse){
		switch(request.type){
			case "playClick":
				console.log("background: playCLicked");
				if(!pageExists && vidLinks.length>0){
					console.log("playClicked");
					vidInd = 0;
					chrome.tabs.create({
						url:vidLinks[0],
						active:false,					
						},  tabCreated );
					pageExists = true;
					chrome.browserAction.setIcon({path:"iconCol.png"});
					playing = true;
				}
				else{
					chrome.tabs.sendMessage(tabId,
						{type:"resumePlaying"}
					);
					chrome.browserAction.setIcon({path:"iconCol.png"});
					playing = true;
				}					
				break;
			case "videoEnded":
				vidInd++;
				playing = true;
				if(vidInd==vidLinks.length){
					vidInd=0;
				}
				chrome.tabs.update(tabId,{
					url:vidLinks[vidInd],
					active:false,
				});
				chrome.browserAction.setIcon({path:"iconCol.png"});
				break;	
			case "pauseClicked":
				chrome.browserAction.setIcon({path:"iconBw.png"});
				playing = false;
				chrome.tabs.sendMessage(tabId,
				{type:"pausePlaying"}
				);
				break;
			case "nextClicked":
				vidInd++;
				if(vidInd==vidLinks.length){
					vidInd=0;
				}
				chrome.tabs.update(tabId,{
					url:vidLinks[vidInd],
					active:false,
				});
				console.log("next");
				break;
			case "prevClicked":
				vidInd--;
				if(vidInd==-1){
					vidInd=vidLinks.length-1;
				}
				chrome.tabs.update(tabId,{
					url:vidLinks[vidInd],
					active:false,
				});
				console.log("prev");
				break;
			case "songChanged":
				vidInd=request.newInd;
				if(!pageExists && vidLinks.length>0){
					console.log("playClicked");
					chrome.tabs.create({
						url:vidLinks[vidInd],
						active:false,					
						},  tabCreated );
					pageExists = true;
					chrome.browserAction.setIcon({path:"iconCol.png"});
					playing = true;
				}
				else{
					chrome.tabs.update(tabId,{
						url:vidLinks[vidInd],
						active:false,
					});
				}			
				break;	
			case "clear":
				vidLinks=[];
			    playing=false;
				chrome.tabs.remove(tabId);
				break;
			case "pausedFromWindow":
				if(sender.tab.id==tabId){
					chrome.browserAction.setIcon({path:"iconBw.png"});
					playing = false;
				}
				break;
			case "playedFromWindow":
				if(sender.tab.id==tabId){
					chrome.browserAction.setIcon({path:"iconCol.png"});
					playing = true;
				}
				break;
			case "removeItem":
				id = request.id;
				vidLinks.splice(id,1);
				if(id==vidInd){
					vidInd=(vidInd)%vidLinks.length;
					chrome.tabs.update(tabId,{
						url:vidLinks[vidInd],
						active:false,
					});
				}
				if(id<vidInd){
					vidInd=(vidInd-1)%vidLinks.length;
				}
				chrome.runtime.sendMessage({
					type:"removed",
				})
				break;
			case "listChanged":
				bef = request.before;
				aft = request.after;
				if(bef<aft){
					temp = vidLinks[bef];
					for(ind = bef+1; ind < aft+1; ind++ ){
						vidLinks[ind-1]=vidLinks[ind];
					}
					vidLinks[aft]=temp;
				}
				else{
					temp = vidLinks[bef];
					for(ind = bef; ind > aft; ind--){
						vidLinks[ind]=vidLinks[ind-1];
					}
					vidLinks[aft]=temp;
				}
				vidInd=parseInt(request.nowPlay);
				break;

		}
	}
);

var vidLinks = [];
var handle = function(e) {	
	vidLinks.push(e.linkUrl);
	console.log(e.editable);
	console.log(e.linkUrl);
	console.log(e.mediaType);
	console.log(e.menuItemId);
	console.log(e.pageUrl);
	console.log(e.srcUrl);
};


chrome.runtime.onInstalled.addListener(function() {

	/* var oauth = ChromeExOAuth.initBackgroundPage({
	  'request_url': 'https://www.google.com/accounts/OAuthGetRequestToken',
	  'authorize_url': 'https://www.google.com/accounts/OAuthAuthorizeToken',
	  'access_url': 'https://www.google.com/accounts/OAuthGetAccessToken',
	  'consumer_key': 'anonymous',
	  'consumer_secret': 'anonymous',
	  'scope': 'https://docs.google.com/feeds/',
	  'app_name': 'My Google Docs Extension'
		}); */

	  // Create one test item for each context type.
		var contexts = ["page","selection","link","editable","image","video",
	                  "audio"];
	    var title = "Add to YouTube Playlist";
	    var id = chrome.contextMenus.create({"title": title, "contexts":["link"],
	                                         "id": "context" ,
											 "onclick" : handle,
											 "targetUrlPatterns": ["https://*.youtube.com/*"]										 
											 }
											 );
	    console.log(" item:" + id);

    /* oauth.authorize(function() {
  		// ... Ready to fetch private data ...
  		window.alert("connected");
	}); */

});
