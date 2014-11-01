var loggedIn = -1;
var listList = [];
var listInd = -1;
var cl;

$(function(){
	updateLoginSpan();
})

function login(){
	chrome.runtime.sendMessage({
		type:"login"
	});
	showWaitPL({type:"logging"})
};

function hideWaitPL(){
	document.getElementById("completedText").className = "show";	
	document.getElementById("loadingProgressG_1").style.visibility = "hidden";
	setTimeout(function(){document.getElementById("completedText").className="hide"}, 1000);
}

function showWaitPL(input){
	document.getElementById("loadingProgressG_1").style.visibility = "visible";
	var text = "default";
	switch(input.type){
		case "logging":
			text = "Logged In";
			break;
		case "deleting":
			text = "Playlist Deleted";
			break
		case "loading":
			text = "Playlists Loaded"
			break;
		case "creating":
			text = "New Playlist Created";
			break;
		case "updating":
			text = "Playlist Updated";
			break;
	}
	document.getElementById("completedText").innerHTML = text
}

function updateLoginSpan(){
	$("#tabPlaylistContent").css("height","370px")
	back = chrome.extension.getBackgroundPage();
	if(back.loggedIn){		
		//window.alert("Logged in")
		listInd = back.listIndex;
		listList = back.listList;
		var currentLength = back.vidLinks.length;
		
		$("#saveDiv").html("");
		text = "<div><ul id=\"playlistList\">"


		if(listList.length<1){
			text = text + "<div id=\"noticePl\">No playlist found in your YouTube account</div>"
		}
             
		for (var i=0; i<listList.length; i++){
			text=text+"<li id=\""+i+"\" class=\"listItem ui-state-default\" ><span class=\"ui-icon ui-icon-grip-dotted-horizontal\"></span><span><div>"+listList[i].name+"</div></span><span><button class=\"fa-trash delPlay\"></span></li>";
		}
		text = text + "</ul></div>"
		document.getElementById('tabPlaylistContent').innerHTML = text;
    	$( "#playlistList" ).disableSelection();
    	$(".listItem").click(playListSel);

    	$( ".delPlay" ).button({
			text: "remove"
		});
		$(".delPlay").mouseenter(function(){
				$(".listItem").unbind("click")
		})
		
		$(".delPlay").mouseleave(function(){
				$(".listItem").click(playListSel)
		})
      

      	$(".delPlay").click(function(){
	    	//$(this).parent().remove(0);
	    	id = $(this).parent().parent().attr("id");
	    	delPlaylist(id);
    	});    	

    	$(".listItem").mouseenter(
	      function(){ 
	        $(this).removeClass("ui-state-default");
	        $(this).addClass("ui-state-hover");
	        $(this).children("span").children("button")[0].style.visibility="visible";
	    });
	    $(".listItem").mouseleave(
	      function(){
	        $(this).addClass("ui-state-default");
	        $(this).removeClass("ui-state-hover");
	        $(this).children("span").children("button")[0].style.visibility="hidden";
	    });
	}
	else{
		document.getElementById('tabPlaylistContent').innerHTML = "<button id='loginButton'>YouTube Login</button>";
		$( "#loginButton" ).button({
	      text: true,
    	});
    	document.getElementById("loginButton").onclick=login;
	}
}


function delPlaylist(id){
	showWaitPL({type:"deleting"})
	chrome.runtime.sendMessage({
		"type":"delPlaylist",
		"index":id
	})
}

chrome.runtime.onMessage.addListener( 
	function(request,sender,sendResponse){
		switch(request.type){
			case "listListUp":
				updateLoginSpan();
				if(!request.status){
					hideWaitPL();
				}
				if(currentLength>0){
					$("#saveButton")[0].style.visibility = "visible";
				}
				break;
			case "playListDeltd":				
				updateLoginSpan();
				hideWaitPL();
				break;
			case "listUpdated":
				//window.alert("Updated the list.")
				hideWaitPL();
				updateLoginSpan();
				break;
			case "loadingLists":
				showWaitPL({type:"loading"});
				break

		}
	}
)


function playListSel(event, ui){
	listInd = $(this).attr('id')
	$( "#playlists" ).selectmenu({select:playListSel});	
	chrome.runtime.sendMessage({
		"type":"listSel",
		"index":listInd
	})
	showWaitQ({type:"loading"})
	$( "#tabs" ).tabs({"active":1});
}

function addToPlaylist(event, ui){
	showWaitPL({type:"updating"})
	var temp = $(this).attr('id')
	chrome.runtime.sendMessage({
		type:"addToPlayList",
		id:temp
	});
	
	$(".listItem").unbind("click")
	$(".listItem").click(playListSel);
}

function saveQueue(){
	$("#tabPlaylistContent").css("height", "227px")
	$( "#tabs" ).tabs({"active":0});
	var text = "<input type=\"text\" id=\"playListName\" placeholder=\"Save to a new playlist...\" >";
	text = text + "<div id=\"newPlaylistButton\">Save</div>"
	text = text + "<button id=\"cancelSaveButton\" class=\"fa-remove\" title=\"Cancel save\"></button>"
	if(listList.length>0){
		text = text +" <div id=\"choiceText\"> Or add to existing playlists:</div>";		
	}
	else{
		$("#noticePl").css("visibility","hidden");
	}
	document.getElementById("saveDiv").innerHTML = text;
	$("#cancelSaveButton").click(updateLoginSpan);
	setTimeout(function(){
		$("#playListName").focus();
	}, 300);
	// $("#playListName").focus();



	$("#newPlaylistButton").click(createNewPlaylist);


	$("#playListName").keyup(function(event){
	    if(  event.keyCode == 13 & $("#playListName").val().length > 0  ){
	    	createNewPlaylist();
    	}
    });

	$(".listItem").unbind("click");
	$(".listItem").click(addToPlaylist);
	$(".delPlay").each(function(i){
		this.style.visibility="hidden";
	})
}


function createNewPlaylist(){
	var name = document.getElementById("playListName").value;
	if(name.length<1){
		window.alert("Please Enter a Name or Select an existing playlist");
	}
	else{
		//window.alert(name);
		showWaitPL({type:"creating"})
		chrome.runtime.sendMessage({
			type:"createNewPlaylist",
			"name":name
		});
	}
}