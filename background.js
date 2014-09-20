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
						url:vidLinks[0].link,
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
					url:vidLinks[vidInd].link,
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
					url:vidLinks[vidInd].link,
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
					url:vidLinks[vidInd].link,
					active:false,
				});
				console.log("prev");
				break;
			case "songChanged":
				vidInd=request.newInd;
				if(!pageExists && vidLinks.length>0){
					console.log("playClicked");
					chrome.tabs.create({
						url:vidLinks[vidInd].link,
						active:false,					
						},  tabCreated );
					pageExists = true;
					chrome.browserAction.setIcon({path:"iconCol.png"});
					playing = true;
				}
				else{
					chrome.tabs.update(tabId,{
						url:vidLinks[vidInd].link,
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
						url:vidLinks[vidInd].link,
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

	var urlink = e.linkUrl;
	var name; 

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("GET", e.linkUrl, true);
	xmlhttp.send();
	xmlhttp.onreadystatechange=function(){
		if(xmlhttp.readyState==4 && xmlhttp.status==200){
			var temp = document.createElement('div');
			temp.innerHTML = xmlhttp.response;
			name = temp.getElementsByTagName('title');
			name = name[0].text;
			var toAdd = {
				"link" : urlink,
				"name" : name
			};
			vidLinks.push(toAdd);
		}
	}
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
