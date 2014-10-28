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
var searchNextPageToken;
var publicKey = "AIzaSyAz5ndOWI74hpgbrC9IZJmx-YxyLehdgl0";
var lastVideoID
var lastQuerry
var shuffle


function tabCreated(tab){
	tabId = tab.id;
	chrome.tabs.executeScript(tab.id, {file:"js/inject.js"})
};

chrome.tabs.onRemoved.addListener(tabClosed);
makeRequest({"type":"auth", "life":2, "first":1});	


function tabClosed(tabIdin, info){
	if(tabIdin == tabId){
		playing = false;
		pageExists = false;
		chrome.browserAction.setIcon({path:"img/iconBw.png"});
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
					chrome.browserAction.setIcon({path:"img/iconCol.png"});
					playing = true;
				}
				else{
					chrome.tabs.sendMessage(tabId,
						{type:"resumePlaying"}
					);
					chrome.browserAction.setIcon({path:"img/iconCol.png"});
					playing = true;
				}					
				break;
			case "videoEnded":
				vidInd++;
				playing = true;
				if(vidInd==vidLinks.length){
					vidInd=0;
				}
				if(shuffle){
					vidInd = Math.floor((Math.random() * vidLinks.length));
				}
				chrome.runtime.sendMessage({
					type:"changedToNextSong",
					id:vidInd
				})
				chrome.tabs.update(tabId,{
					url:"https://www.youtube.com/watch?v="+vidLinks[vidInd].link,
					active:false,
				});
				chrome.browserAction.setIcon({path:"img/iconCol.png"});
				chrome.tabs.executeScript(tabId, {file:"js/inject.js"})
				break;	
			case "pauseClicked":
				chrome.browserAction.setIcon({path:"img/iconBw.png"});
				playing = false;
				chrome.tabs.sendMessage(tabId,
					{type:"pausePlaying"}
				);
				break;
			case "nextClicked":
				if(playing){
					vidInd++;
					if(vidInd==vidLinks.length){
						vidInd=0;
					}
					if(shuffle){
						vidInd = Math.floor((Math.random() * vidLinks.length));
					}
					chrome.runtime.sendMessage({
						type:"changedToNextSong",
						id:vidInd
					})
					chrome.tabs.update(tabId,{
						url:"https://www.youtube.com/watch?v="+vidLinks[vidInd].link,
						active:false,
					});
					chrome.tabs.executeScript(tabId, {file:"js/inject.js"})
					chrome.browserAction.setIcon({path:"img/iconCol.png"});
				}
				else{
					chrome.runtime.sendMessage(
						{type : "playClick"}
					);
					chrome.runtime.sendMessage({
						type:"changedToNextSong",
						id:vidInd
					})
				}
				break;
			case "shuffle":
				shuffle = request.shuffle;
				break
			case "prevClicked":
				if(playing){
					vidInd--;
					if(vidInd==-1){
						vidInd=vidLinks.length-1;
					}
					chrome.tabs.update(tabId,{
						url:"https://www.youtube.com/watch?v="+vidLinks[vidInd].link,
						active:false,
					});
					chrome.tabs.executeScript(tabId, {file:"js/inject.js"})
					chrome.browserAction.setIcon({path:"img/iconCol.png"});
				}
				else{
					chrome.runtime.sendMessage(
						{type : "playClick"}
					);
				}
				break;
			case "songChanged":
				vidInd=request.newInd;
				if(!pageExists && vidLinks.length>0){
					chrome.tabs.create({
						url:"https://www.youtube.com/watch?v="+vidLinks[vidInd].link,
						active:false,					
						},  tabCreated );
					pageExists = true;
					chrome.browserAction.setIcon({path:"img/iconCol.png"});
					playing = true;
				}
				else{
					chrome.tabs.update(tabId,{
						url:"https://www.youtube.com/watch?v="+vidLinks[vidInd].link,
						active:false,
					});
					chrome.tabs.executeScript(tabId, {file:"js/inject.js"})
				}			
				chrome.browserAction.setIcon({path:"img/iconCol.png"});
				break;	
			case "clear":
				vidLinks=[];
				vidInd = -1;
			    playing=false;
			    console.log("Removing tab with id: "+tabId)
				chrome.tabs.remove(tabId);
				break;
			case "pausedFromWindow":
				if(sender.tab.id==tabId){
					chrome.browserAction.setIcon({path:"img/iconBw.png"});
					playing = false;
				}
				break;
			case "playedFromWindow":
				if(sender.tab.id==tabId){
					chrome.browserAction.setIcon({path:"img/iconCol.png"});
					playing = true;
				}
				break;
			case "removeItem":
				id = request.id;
				vidLinks.splice(id,1);
				if(id==vidInd){
					vidInd=(vidInd)%vidLinks.length;
					chrome.tabs.update(tabId,{
						url:"https://www.youtube.com/watch?v="+vidLinks[vidInd].link,
						active:false,
					});
					chrome.tabs.executeScript(tabId, {file:"js/inject.js"})
				}
				chrome.runtime.sendMessage({
						type:"changedToNextSong",
						id:vidInd
				})
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
				break;
			case "listSel":
				listIndex = request.index;
				makeRequest({"type":"getVids","life":2, "nextPageToken":'', "listID":listList[listIndex].id});
				vidInd = -1;
				break;
			case "createNewPlaylist":
				postRequest({"type":"makeNewPlaylist", "name":request.name});
				break
			case "addToPlayList":
				listIndex = request.id;
				updatePlaylist(listList[listIndex].id)
				break
			case "delPlaylist":
				delRequest({"type":"delList", "listID":listList[request.index].id, "arrayID":request.index})
				break
			case "searchQuery":
				makeRequest({"type":"searchQuery", "life":2, "query":request.text})
				break
			case "searchRelated":
				makeRequest({"type":"searchRelated", "life":2})
				break;
			case "searchQueryonScroll":
				makeRequest({"type":"searchQueryonScroll", "nextType":request.nextType, "life":2})
				break;
			case "addVideo":
				var toAdd = {
					"link" : request.link,
					"name" : request.name
				};
				vidLinks.push(toAdd);
				chrome.runtime.sendMessage({type:"vidLinksUp", status:0, from:"searchAdd"})
				break;
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
							listList.splice(input.arrayID,1);
							chrome.runtime.sendMessage({
								"type":"playListDeltd",
								"id" : input.arrayID
							})
				}
			}
		break;	
	}
}

function updatePlaylist(ytListID){
	vidCount = vidLinks.length;
	for(var i = 0; i<vidCount; i++){
		temp = vidLinks[i]
		postRequest({"type":"addToPlayList", "listID":ytListID, "resourceId":temp.link, "count":vidCount-i})
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
			break;
		case "addToPlayList":
			url = "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&fields=snippet(playlistId%2C+resourceId)&access_token="+authToken;
			postData = {snippet:{playlistId: input.listID, resourceId: {kind: "youtube#video" , videoId: input.resourceId }}};
			break;
	}
	var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST",url,true);
    xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	xmlhttp.send(JSON.stringify(postData));

	xmlhttp.onreadystatechange=function(){
		if(xmlhttp.readyState==4){
			console.log("response: " + xmlhttp.status)
			switch (xmlhttp.status){
			case 401:
				makeRequest({"type":"auth", "life":1});					
				postRequest(input);
				return;
				break;
			case 400:
				makeRequest({"type":"auth", "life":1});
				postRequest(input);
				return;
				break;
			case 403:
				makeRequest({"type":"auth", "life":1});
				postRequest(input);
				return;
				break;
			case 200:
				switch(input.type){
					case "makeNewPlaylist":
						parseCreatePlaylistJSON(xmlhttp.response)
						break
					case "addToPlayList":
						console.log(input.count + xmlhttp.response)
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
						chrome.runtime.sendMessage({
							type:"loadingLists"
						})
					}
				}
			})
			return 0;
			break;
		case "getLists":
			if(authToken=='') {
				makeRequest({"type":"auth", "life":input.life});		
				return;
			}
			url = "https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&";
			if(input.nextPageToken!=''){
				url = url+"pageToken="+input.nextPageToken;
			}
			url = url + "&fields=items(id%2Csnippet%2Ftitle)%2CnextPageToken&access_token="+authToken;
			break;
		case "getVids":
			if(authToken=='') {
				makeRequest({"type":"auth", "life":input.life});		
				return;
			}
			url = "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId="
			url = url + input.listID + "&fields=items(snippet(title%2CresourceId))%2CnextPageToken&access_token="+authToken;
			break;
		case "listETag":
			if(authToken=='') {
				makeRequest({"type":"auth", "life":input.life});		
				return;
			}
			url = "https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&fields=etag&access_token="+authToken;
			break;
		case "searchQuery":
			url = "https://www.googleapis.com/youtube/v3/search?part=snippet&q="
			url = url + encodeURIComponent(input.query);
			lastQuerry = encodeURIComponent(input.query);
			url = url + "&type=video&videoEmbeddable=true&fields=items(id%2Csnippet(title%2Cthumbnails%2Fdefault%2Furl))%2CnextPageToken&key="+publicKey;
			break;
		case "searchRelated":
			url = "https://www.googleapis.com/youtube/v3/search?part=snippet&relatedToVideoId="
			url = url + vidLinks[vidInd].link
			lastVideoID = vidLinks[vidInd].link
			url = url + "&type=video&fields=items(id%2Csnippet(title%2Cthumbnails%2Fdefault%2Furl))%2CnextPageToken&key="+publicKey;
			break;
		case "searchQueryonScroll":
			url = "https://www.googleapis.com/youtube/v3/search?part=snippet&pageToken="
			url = url + searchNextPageToken
			if(input.nextType=="query"){
				url = url + "&q=" + lastQuerry;
			}
			else if(input.nextType=="related"){
				url = url + "&relatedToVideoId=" + lastVideoID;
			}
			url = url + "&fields=items(id%2Csnippet(title%2Cthumbnails%2Fdefault%2Furl))%2CnextPageToken&key="+publicKey;
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
						case "searchQuery":
							parseSearchJSON({"type":"query", "text":xmlhttp.response});
							break;
						case "searchRelated":
							parseSearchJSON({"type":"related", "text":xmlhttp.response});
							break;
						case "searchQueryonScroll":
							parseSearchJSON({"type":"scroll", "text":xmlhttp.response})
					}
					break;
			}
		}		
	}
}


function parseSearchJSON(input){
	

	var obj = $.parseJSON(input.text);

	searchNextPageToken = obj.nextPageToken;	


	var searchResults=[];
	for (var i = 0; i<obj.items.length; i++){
		if(obj.items[i].id.kind=="youtube#video"){
			searchResults.push({			
				"link" : obj.items[i].id.videoId,
				"name" : obj.items[i].snippet.title,
				"thumbNail" : obj.items[i].snippet.thumbnails.default.url
			});
		}
	}
	chrome.runtime.sendMessage({
		type:input.type+"ResUp",
		results:searchResults
	})
}

function parseCreatePlaylistJSON(input){
	var obj = $.parseJSON(input);
	var temp = {
		"id" : obj.id,
		"name" : obj.snippet.title
	}	
	listList.unshift(temp);
	chrome.runtime.sendMessage({
		type:"listListUp",
		status:0
	});
	updatePlaylist(obj.id)
}


function parseVidListJSON(input){
	
	var obj = $.parseJSON(input);
	for (var i = 0; i<obj.items.length; i++){
		if(obj.items[i].snippet.resourceId.kind=="youtube#video"){
			vidLinks.push({			
				"link" : obj.items[i].snippet.resourceId.videoId,
				"name" : obj.items[i].snippet.title
			});
		}
	}
	var waiting = 0;
	if(obj.nextPageToken){
		makeRequest({"type":"getVids","life":2,"nextPageToken":obj.nextPageToken})
		waiting = 1;
	}
	chrome.runtime.sendMessage({
		type:"vidLinksUp",
		status:waiting
	});
}

function parseListJSON(input){
	var obj = $.parseJSON(input);
	for (var i = 0; i<obj.items.length; i++){
		listList.push({"id":obj.items[i].id,'name':obj.items[i].snippet.title});
	}
	
	var waiting = 0;
	if(obj.nextPageToken){
		makeRequest({"type":"getLists","life":2,"nextPageToken":obj.nextPageToken})
		waiting = 1;
	}
	chrome.runtime.sendMessage({
		type:"listListUp",
		status:waiting
	});
}

function playlistClicked(event,ui){
	makeRequest({"type":"getLists","nextPageToken":'', "life":2})
}



var tag = document.createElement('script');

var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
function onYouTubeIframeAPIReady() {
player = new YT.Player('player', {
  height: '390',
  width: '640',
  videoId: 'M7lc1UVf-VE',
  events: {
    'onReady': onPlayerReady,
    'onStateChange': onPlayerStateChange
  }
});
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
event.target.playVideo();
}

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
var done = false;
function onPlayerStateChange(event) {
if (event.data == YT.PlayerState.PLAYING && !done) {
  setTimeout(stopVideo, 6000);
  done = true;
}
}
function stopVideo() {
player.stopVideo();
}