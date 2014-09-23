var vidInd = -1;
var tabId;
var playing = false;
var pageExists = false;
var authToken='';
var vidLinks = [];
var listList = [];


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
			case "login":
				listList=[];
				makeRequest( {"type":"getLists","life":2, "nextPageToken":''} );
				break;
		}
	}
);

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

function onAuthorised(token){
	window("Tokenis"+token);
}

chrome.runtime.onInstalled.addListener(function() {


    var title = "Add to YouTube Playlist";
    var id = chrome.contextMenus.create({"title": title, "contexts":["link"],
                                         "id": "context" ,
										 "onclick" : handle,
										 "targetUrlPatterns": ["https://*.youtube.com/*"]										 
										 }
									    );
 
});



function makeRequest(input){

	var url;

	if (input.life<0) return;
	if(authToken=='' & input.type!="auth") {
		makeRequest({"type":"auth", "life":1});		
		return;
	}

	switch (input.type){
		case "auth":
			chrome.identity.getAuthToken({interactive:true}, function(input){
				authToken = input;
				makeRequest( {"type":"getLists","life":2, "nextPageToken":''} );
			})
			return;
			break;
		case "getLists":
			url = "https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&";
			if(input.nextPageToken!=''){
				url = url+"pageToken="+input.nextPageToken;
			}
			url = url + "&fields=items(id%2Csnippet%2Ftitle)%2CnextPageToken&access_token="+authToken;
			break;
		case "getItems":
			break;
	}

	var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET",url,true);
    xmlhttp.send();
	xmlhttp.onreadystatechange=function(){
		if(xmlhttp.readyState==4)
			switch (xmlhttp.status){
				case 400:
					makeRequest({"type":"auth", "life":1});
					input.life = input.life - 1;
					makeRequest(input);
					return;
					break;
				case 403:
					makeRequest({"type":"auth", "life":1});
					input.life = input.life - 1;
					makeRequest(input);
					return;
					break;
				case 200:
					switch (input.type){
						case "getLists":
							parseListJSON(xmlhttp.response)
							break;
						case "getItems":
							break;
					}
					return(xmlhttp.response);
			}	
	}


}

function parseListJSON(input){
	var obj = $.parseJSON(input);
	for (var i = 0; i<obj.items.length; i++){
		listList.push({"id":obj.items[i].id,'name':obj.items[i].snippet.title});
	}
	
	if(obj.nextPageToken){
		makeRequest({"type":"getLists","life":2,"nextPageToken":obj.nextPageToken})
	}
	else{
		chrome.runtime.sendMessage({
		type:"listListUp", "data":listList}
		);
	}
}

function playlistClicked(event,ui){
	makeRequest({"type":"getLists","nextPageToken":'', "life":2})
}