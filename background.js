var vidInd = -1;
var tabId;
var playing = false;
var pageExists = false;
var authToken='';
var vidLinks = [];
var listList = [];
var listListETag = '';
var listIndex = -1;
var loggedIn = false;


function tabCreated(tab){
	tabId = tab.id;
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
				if(!pageExists && vidLinks.length>0){
					vidInd = 0;
					chrome.tabs.create({
						url:"https://www.youtube.com/watch?v="+vidLinks[0].link,
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
					url:"https://www.youtube.com/watch?v="+vidLinks[vidInd].link,
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
					url:"https://www.youtube.com/watch?v="+vidLinks[vidInd].link,
					active:false,
				});
				break;
			case "prevClicked":
				vidInd--;
				if(vidInd==-1){
					vidInd=vidLinks.length-1;
				}
				chrome.tabs.update(tabId,{
					url:"https://www.youtube.com/watch?v="+vidLinks[vidInd].link,
					active:false,
				});
				break;
			case "songChanged":
				vidInd=request.newInd;
				if(!pageExists && vidLinks.length>0){
					chrome.tabs.create({
						url:"https://www.youtube.com/watch?v="+vidLinks[vidInd].link,
						active:false,					
						},  tabCreated );
					pageExists = true;
					chrome.browserAction.setIcon({path:"iconCol.png"});
					playing = true;
				}
				else{
					chrome.tabs.update(tabId,{
						url:"https://www.youtube.com/watch?v="+vidLinks[vidInd].link,
						active:false,
					});
				}			
				break;	
			case "clear":
				vidLinks=[];
				vidInd = -1;
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
				window.alert("removing from vidLinks background, id " + id)
				vidLinks.splice(id,1);
				if(id==vidInd){
					vidInd=(vidInd)%vidLinks.length;
					chrome.tabs.update(tabId,{
						url:"https://www.youtube.com/watch?v="+vidLinks[vidInd].link,
						active:false,
					});
				}
				if(id<vidInd){
					vidInd=(vidInd-1)%vidLinks.length;
				}
				break;
			case "listChanged":
				//Sortable List changed
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
				makeRequest({"type":"auth", "life":2, "first":1});	
				//window.alert("Logging In")				
				break;
			case "listSel":
				// A list os selected from the playlists. 
				listIndex = request.index;
				makeRequest({"type":"getVids","life":2, "nextPageToken":'', "listID":listList[listIndex].id});
				vidInd = -1;
				break;
			case "createNewPlaylist":
				postRequest({"type":"makeNewPlaylist", "name":request.name});
				//window.alert("Calling Saving Function")
				break
			case "addToPlayList":
				listIndex = request.id;
				//window.alert("Update Youtube playlist message recieved by BackGround")
				updatePlaylist(listList[listIndex].id)
				break
			case "delPlaylist":
				//window.alert("del playlist message received, removing: "+listList[request.index].id);
				delRequest({"type":"delList", "listID":listList[request.index].id, "arrayID":request.index})
		}
	}
);

function delRequest(input){
	var url;

	switch(input.type){
		case  "delList":
			listID = input.listID;
			url = "https://www.googleapis.com/youtube/v3/playlists?id="+listID+"&access_token="+authToken;
			var xmlhttp = new XMLHttpRequest();
			xmlhttp.open("DELETE",url,true);
			xmlhttp.send();
				xmlhttp.onreadystatechange=function(){
				if(xmlhttp.readyState==4){
					//switch (xmlhttp.status){
					//	case 200:
							//window.alert("Playlist Deleted");
							listList.splice(input.arrayID,1);
							chrome.runtime.sendMessage({
								"type":"playListDeltd",
								"id" : input.arrayID
							})
					//	break;
					//}
				}
			}
		break;	
	}
}

function updatePlaylist(ytListID){
	vidCount = vidLinks.length;
	for(var i = 0; i<vidCount; i++){
		postRequest({"type":"addToPlayList", "listID":ytListID, "resourceId":vidLinks[i].link, "count":vidCount-i})
	}
}

function updateListList(){
	makeRequest({"type":"listETag", "life":2});		
};

var handle = function(e) {
	var urlink = e.linkUrl;

	var video_id = urlink.split('v=')[1];
	var ampersandPosition = video_id.indexOf('&');
	if(ampersandPosition != -1) {
	  video_id = video_id.substring(0, ampersandPosition);
	}

	//window.alert("Adding Id" + video_id)

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
				"link" : video_id,
				"name" : name
			};
			vidLinks.push(toAdd);
		}
	}
};


chrome.runtime.onInstalled.addListener(function() {
    var title = "Add to YouTube Queue";
    var id = chrome.contextMenus.create({"title": title, "contexts":["link"],
                                         "id": "context" ,
										 "onclick" : handle,
										 "targetUrlPatterns": ["https://*.youtube.com/watch?v=*"]										 
										 }
									    );
 
});

function postRequest(input){
	var postData;
	var url
	switch(input.type){
		case "makeNewPlaylist":
			url = "https://www.googleapis.com/youtube/v3/playlists?part=id%2Csnippet&fields=id%2Csnippet(title)&access_token="+authToken;
			postData = {snippet:{title:input.name}};
			//window.alert(url)
			//window.alert(postData)
			break;
		case "addToPlayList":
			//window.alert("PostRequest function ID of updateing playlist"+input.listID)
			url = "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&fields=snippet(playlistId%2C+resourceId)&access_token="+authToken;
			//window.alert(input.resourceId)
			postData = {snippet:{playlistId: input.listID, resourceId: {kind: "youtube#video" , videoId: input.resourceId }}};
			//window.alert(postData)
			break;
	}

	//window.alert(JSON.stringify(postData))
	var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST",url,true);
    xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	xmlhttp.send(JSON.stringify(postData));

	xmlhttp.onreadystatechange=function(){
		if(xmlhttp.readyState==4){
			switch (xmlhttp.status){
			case 401:
				break;
			case 400:
				break;
			case 200:
				//window.alert(xmlhttp.response)
				switch(input.type){
					case "makeNewPlaylist":
						parseCreatePlaylistJSON(xmlhttp.response)
						break
					case "addToPlayList":
						if(input.count==1){
							chrome.runtime.sendMessage({
								type:"listUpdated"
							})
						}
						break
				}
				break;
			default:
				return 0;
			}
		}
	}
}	

function makeRequest(input){

	input.life = input.life - 1;
	var url;

	if (input.life<0) return;
	if(authToken=='' & input.type!="auth") {
		makeRequest({"type":"auth", "life":input.life});		
		return;
	}

	switch (input.type){
		case "auth":
			chrome.identity.getAuthToken({interactive:true}, function(token){
				if(token){
					var firstAuth;
					if(authToken==''){
						firstAuth = true;
					}
					authToken = token;
					loggedIn = true;
					if(firstAuth){
						updateListList();
					}
				}
			})
			return 0;
			break;
		case "getLists":
			url = "https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&";
			if(input.nextPageToken!=''){
				url = url+"pageToken="+input.nextPageToken;
			}
			url = url + "&fields=items(id%2Csnippet%2Ftitle)%2CnextPageToken&access_token="+authToken;
			break;
		case "getVids":
			url = "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId="
			url = url + input.listID + "&fields=items(snippet(title%2CresourceId))%2CnextPageToken&access_token="+authToken;
			break;
		case "listETag":
			url = "https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&fields=etag&access_token="+authToken;
			break;
	}

	var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET",url,true);
    xmlhttp.send();

	xmlhttp.onreadystatechange=function(){
		if(xmlhttp.readyState==4){
			switch (xmlhttp.status){
				case 401:
					makeRequest({"type":"auth", "life":1});					
					makeRequest(input);
					return;
					break;
				case 400:
					makeRequest({"type":"auth", "life":1});
					makeRequest(input);
					return;
					break;
				case 403:
					makeRequest({"type":"auth", "life":1});
					makeRequest(input);
					return;
					break;
				case 200:
					switch (input.type){

						case "getLists":
							parseListJSON(xmlhttp.response)
							break;
						case "getVids":
							parseVidListJSON(xmlhttp.response)
							break;
						case "listETag":
							var obj = $.parseJSON(xmlhttp.response);
							if(obj.etag!=listListETag){
								listListETag = obj.etag;
								listList=[];
								makeRequest( {"type":"getLists","life":2, "nextPageToken":''} );
							}
							break;
					}
					break;
			}
		}		
	}
}

function parseCreatePlaylistJSON(input){
	var obj = $.parseJSON(input);
	var temp = {
		"id" : obj.id,
		"name" : obj.snippet.title
	}	
	listList.unshift(temp);
	chrome.runtime.sendMessage({
		type:"listListUp"
	});
	updatePlaylist(obj.id)
}


function parseVidListJSON(input){
	
	var obj = $.parseJSON(input);
	for (var i = 0; i<obj.items.length; i++){
		// window.alert(obj.items[i].snippet.resourceId.kind)
		// window.alert(obj.items[i].snippet.resourceId.videoId)
		if(obj.items[i].snippet.resourceId.kind=="youtube#video"){
			vidLinks.push({			
				"link" : obj.items[i].snippet.resourceId.videoId,
				"name" : obj.items[i].snippet.title
			});
		}
	}
	if(obj.nextPageToken){
		makeRequest({"type":"getLists","life":2,"nextPageToken":obj.nextPageToken})
	}
	chrome.runtime.sendMessage({
		type:"vidLinksUp"}
	);
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
		type:"listListUp"}
		);
	}
}

function playlistClicked(event,ui){
	makeRequest({"type":"getLists","nextPageToken":'', "life":2})
}