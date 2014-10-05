var loggedIn = -1;
var listList = [];
var listInd = -1;

$(function(){
	updateLoginSpan();
})

function login(){
	chrome.runtime.sendMessage({
		type:"login"
	});
};

function updateLoginSpan(){
	back = chrome.extension.getBackgroundPage();
	if(back.loggedIn){		
		//window.alert("Logged in")
		listInd = back.listIndex;
		listList = back.listList;
		var currentLength = back.vidLinks.length;

		// var text = "";
		// if(currentLength>0){
		// 	text = text + "<div id=\"saveDiv\"><button id='saveButton'>Save Queue</button></div>";
		// }
		
		text = "<div id=\"saveDiv\"></div><div style-\"float:bottom\"><ul id=\"playlistList\">"

		if(listList.length<1){
			text = text + "No playlist found in your YouTube account. Save the current queue to create your first playlist."
		}
             
		for (var i=0; i<listList.length; i++){
			text=text+"<li id=\""+i+"\" class=\"listItem ui-state-default\" style=\"overflow:hidden\" >"+listList[i].name+"<button class=\"delPlay\"  style=\"float:right; margin: 6px 0px 0px 0px; visibility:hidden;\"></li>";
		}
		text = text + "</ul></div>"
		document.getElementById('tabPlaylist').innerHTML = text;
    	$( "#playlistList" ).disableSelection();
    	$(".listItem").click(playListSel);
    	$("#saveButton").button()

    	$( ".delPlay" ).button({
			text: "remove",
			icons: {
			  primary: "ui-icon-close"
			}
		});
		$(".delPlay").mouseenter(function(){
				$(".listItem").unbind("click")
		})
		
		$(".delPlay").mouseleave(function(){
				$(".listItem").click(playListSel)
		})
      

      	$(".delPlay").click(function(){
	    	//$(this).parent().remove(0);
	    	id = $(this).parent().attr("id");
	    	delPlaylist(id);
    	});    	

    	$(".listItem").mouseenter(
	      function(){ 
	        $(this).removeClass("ui-state-default");
	        $(this).addClass("ui-state-hover");
	        $(this).children("button")[0].style.visibility="visible";
	    });
	    $(".listItem").mouseleave(
	      function(){
	        $(this).addClass("ui-state-default");
	        $(this).removeClass("ui-state-hover");
	        $(this).children("button")[0].style.visibility="hidden";
	    });
	}
	else{
		document.getElementById('tabPlaylist').innerHTML = "<button id='loginButton'>YouTube Login</button>";
		$( "#loginButton" ).button({
	      text: true,
    	});
    	document.getElementById("loginButton").onclick=login;
	}
}


function delPlaylist(id){
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
				if(currentLength>0){
					$("#saveButton")[0].style.visibility = "visible";
				}
				break;
			case "playListDeltd":				
				updateLoginSpan();
				break;
			case "listUpdated":
				window.alert("Updated the list.")
				updateLoginSpan();

		}
	}
)


function playListSel(event, ui){
	listInd = $(this).attr('id')
	if(currentLength>0){
		var response = confirm("Add playlist to current queue?");
		if(!response){
			return;
		}
	}
	$( "#playlists" ).selectmenu({select:playListSel});	
	chrome.runtime.sendMessage({
		"type":"listSel",
		"index":listInd
	})
	$( "#tabs" ).tabs({"active":1});
}

function addToPlaylist(event, ui){
	//window.alert("Calling add YouTube playlist function")
	var temp = $(this).attr('id')
	chrome.runtime.sendMessage({
		type:"addToPlayList",
		id:temp
	});
	$(".listItem").unbind("click")
	$(".listItem").click(playListSel);
}

function saveQueue(){
	$( "#tabs" ).tabs({"active":0});
	var text = "Create new playlist: <input type=\"text\" id=\"playListName\" >";
	text = text + "<button id=\"newPlaylistButton\">Create</button>"
	text = text +"OR<br> Add to:";
	document.getElementById("saveDiv").innerHTML = text;

	$("#playListName").focus();
	$("#newPlaylistButton").click(createNewPlaylist);
	$(".listItem").unbind("click");
	$(".listItem").click(addToPlaylist);
	$(".delPlay").each(function(i){
		this.style.visibility="hidden";
	})
}


function createNewPlaylist(){
	var name = document.getElementById("playListName").value;
	if(name.length<1){
		//window.alert("Please Enter a Name or Select an existing playlist");
	}
	else{
		//window.alert(name);
		chrome.runtime.sendMessage({
			type:"createNewPlaylist",
			"name":name
		});
	}
}