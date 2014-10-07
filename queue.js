window.onload=loadThings;
var currentLength;
var canChange = true;
var nowPlay;
var listInd;
var noticeText = "No songs in the queue. Add a new playlist from the Playlists tab or right click on any YouTube video link in any window to Add to Queue."

// function test(){
// 	var text = "nowPlay: "+nowPlay
// 	// $("#queueSortable").children("li").each(function(i){
// 	// 	text = text + "_"+ $(this).attr("id")
// 	// })
// 	// text = text+("/n CurrLen,Popup "+currentLength)
// 	// text = text+("/n CurrLen,backgrnd "+chrome.extension.getBackgroundPage().vidLinks.length)
// 	window.alert(text)
// }

function hideWaitQ(){
	queueWaitLoop.hide();
	document.getElementById("queueWaitText").innerHTML = "";
}

function showWaitQ(input){
	queueWaitLoop.show();
	switch(input.type){
		case "loading":
			text = "Loading...";
			break;
	}

	document.getElementById("queueWaitText").innerHTML = text;
}

function playClicked(){

	if(currentLength>0){
		$( "#play" ).button({
	      text: false,
	      icons: {
	      	primary: "ui-icon-pause"
      	  }
    	});
		
		playButton = document.getElementById("play");	
		playButton.onclick = pauseClicked;

		back = chrome.extension.getBackgroundPage();
		nowPlay = back.vidInd;

		if( !nowPlay || nowPlay==-1){
			nowPlay = 0
		}
		$("#"+nowPlay).addClass('ui-state-active');
		$("#"+nowPlay).removeClass('ui-state-default');

		chrome.runtime.sendMessage(
			{type : "playClick"}
		);
		("#")
	};
};

$(function() {
    $( "#queueSortable" ).sortable( {	
    	"axis": "y",
    	opacity: 0.5,
    	containment: "parent",
    	handle: 'span',
    	start: function(event, ui){
    		before = ui.item.index();
    	},
    	stop: function(event,ui){
    		updateID();
    		nowPlay = $("#queueSortable").children(".ui-state-active").attr("id")
    		chrome.runtime.sendMessage({
    			type: "listChanged",
    			"before": before,
    			"after": ui.item.index(),
    			"nowPlay":nowPlay
    		})
    	},
    });
    $( "#queueSortable" ).disableSelection();
 });

function updateID(){
	items = $("#queueSortable").children("li")
	//window.alert(items.length)
	var countID=0
	for(ind=0; ind<items.length; ind++){
		items[ind].id=ind;
		countID++;
	};
};

function pauseClicked(){

	back = chrome.extension.getBackgroundPage();
	nowPlay = back.vidInd;
	$("#"+nowPlay).removeClass('ui-state-active');
	$("#"+nowPlay).addClass('ui-state-default');
	$( "#play" ).button({
	      text: false,
	      icons: {
	      	primary: "ui-icon-play"
      	  }
    	});
	console.log("pauseClicked");
	playButton = document.getElementById("play");
	playButton.onclick = playClicked;

	chrome.runtime.sendMessage(
		{type:"pauseClicked"}	
	);
};

function prevClicked(){
	chrome.runtime.sendMessage({
		type:"prevClicked"}
	);

	if(nowPlay==0){
		var clicked = currentLength-1;
	}
	else{
		var clicked = nowPlay-1;
	}
	$("#"+nowPlay).removeClass('ui-state-active');
	$("#"+nowPlay).addClass('ui-state-default');
	$("#"+clicked).addClass('ui-state-active');
	$("#"+clicked).removeClass('ui-state-default');

	nowPlay = clicked;
};

function nextClicked(){
	chrome.runtime.sendMessage({
		type:"nextClicked"}
	);
	
	if(nowPlay==currentLength-1){
		var clicked = 0;
	}
	else{
		var clicked = parseInt(nowPlay)+1;
	}
	$("#"+nowPlay).removeClass('ui-state-active');
	$("#"+nowPlay).addClass('ui-state-default');
	$("#"+clicked).addClass('ui-state-active');
	$("#"+clicked).removeClass('ui-state-default');

	nowPlay = clicked;
};


function clearClicked(){
	if(currentLength>0){
		var response = confirm("Clear the playlist?");
		if(response==true){
			clearQueue();
		}
	}
};

function clearQueue(){
	$(".vidItem").remove();
		chrome.runtime.sendMessage({
			type:"clear"
	});

	$( "#play" ).button({
      text: false,
      icons: {
      	primary: "ui-icon-play"
  	  }
	});
	currentLength = 0;
	$("#saveButton")[0].style.visibility="hidden"
	$("#notice").html(noticeText);
	//updateTable();
};


function loadThings() {
	updateTable()
;}

function updateTable(){
	back = chrome.extension.getBackgroundPage();
	var vidLinks = back.vidLinks;
	nowPlay = back.vidInd;
	currentLength = vidLinks.length;

	if(back.loggedIn){
		if(currentLength>0){
			$("#saveButton")[0].style.visibility = "visible";
		}
		else{
			$("#saveButton")[0].style.visibility = "hidden";
		}
	}
	else{
		$("#saveButton")[0].style.visibility = "hidden";	
	}

	playBut = document.getElementById("play");		

	//document.getElementById("test").onclick=test;
    document.getElementById("saveButton").onclick=saveQueue;
	document.getElementById("forward").onclick=nextClicked;
	document.getElementById("rewind").onclick=prevClicked;
	document.getElementById("clear").onclick=clearClicked;
	//$("#test").click( testFunction);


	var table="<div id=\"notice\"></div>";
	//ui-state-default

	for (i = 0; i < currentLength; i++) {
		table += "<li id = \"" +i +"\" style=\"overflow:hidden; cursor:pointer; margin-left:-45px\" class=\"vidItem ui-state-default\" ><span class=\"ui-icon ui-icon-grip-dotted-horizontal\" style=\"float:left\"></span>"+
		"<div style=\"width:96%; position:relative; float:left; overflow:hidden; white-space: nowrap; margin: 0px 0px 4px 0px;\">"
		 + (vidLinks[i].name) + "</div><button class=\"remove\"  style=\"float:right; margin: 6px 0px 0px 0px; visibility:hidden\"></button></li>";
	}
	document.getElementById('queueSortable').innerHTML = table;

	if(currentLength<1){
			$("#notice").html(noticeText)
	}

	//// Vid Item changes
	$(".vidItem").click(songChosen);
	$( ".remove" ).button({
      text: "remove",
      icons: {
        primary: "ui-icon-close"
      }
    });

	$(".remove").mouseenter(function(){
    	 canChange = false;
	});

	$(".remove").mouseleave(function(){
		 canChange = true;
	});

    $(".remove").click(function(){
    	$(this).parent().remove(0);
    	id = $(this).parent().attr("id");
    	id = $(this).parent().attr("id");
    	//vidLinks.splice(id,1);
    	removeItem(id);
    	currentLength--;
    });
    $(".vidItem").mouseenter(
      function(){ 
        $(this).removeClass("ui-state-default");
        $(this).addClass("ui-state-hover");
        $(this).children("button")[0].style.visibility="visible";
        //window.alert($(this).attr("id"))
      });
    $(".vidItem").mouseleave(
      function(){
        $(this).addClass("ui-state-default");
        $(this).removeClass("ui-state-hover");
        $(this).children("button")[0].style.visibility="hidden";
      });
     ///////////////////////////////////////

    //// Play and pause button cofiguration
    if(back.playing){
		playBut.onclick = pauseClicked;
		$( "#play" ).button({
	      text: false,
	      icons: {
	      	primary: "ui-icon-pause"
      	  }
    	});
    	$("#"+nowPlay).addClass('ui-state-active');
		$("#"+nowPlay).removeClass('ui-state-default');
	}
	else{
		playBut.onclick = playClicked;
		$( "#play" ).button({
	      text: false,
	      icons: {
	      	primary: "ui-icon-play"
      	  }
    	});
	}
    //////////////////////////////////////
}


function removeItem(id){
	chrome.runtime.sendMessage({
		type:"removeItem",
		"id":id
	});
	
	if(nowPlay>id){
		nowPlay = (nowPlay-1)%currentLength;
	}
	updateID();
};


function songChosen(){
	if(canChange){
		clicked = ($(this).attr('id'));
			   
		if(clicked!=nowPlay | (clicked==nowPlay & !chrome.extension.getBackgroundPage().playing) ){
			$("#"+nowPlay).removeClass('ui-state-active');
			$("#"+nowPlay).addClass('ui-state-default');
			$("#"+clicked).addClass('ui-state-active');
			$("#"+clicked).removeClass('ui-state-default');
			chrome.runtime.sendMessage({
				type:"songChanged",
				"newInd": clicked
			});	
		}
		playBut.onclick = pauseClicked;
		$( "#play" ).button({
	      text: false,
	      icons: {
	      	primary: "ui-icon-pause"
      	  }
    	});
    	chrome.browserAction.setIcon({path:"iconCol.png"});

		nowPlay = clicked;
	}
};

$(function() {
    $( "#rewind" ).button({
      text: false,
      icons: {
        primary: "ui-icon-seek-prev"
      }
    });
    
    $( "#clear" ).button({
      text: false,
      icons: {
        primary: "ui-icon-close"
      }
    });
    $( "#play" ).button({
      text: false,
      icons: {
        primary: "ui-icon-play"
      }
    });
    $( "#forward" ).button({
      text: false,
      icons: {
        primary: "ui-icon-seek-next"
      }
    });
    $( "#shuffle" ).button();
  });


chrome.runtime.onMessage.addListener( 
	function(request,sender,sendResponse){
		switch(request.type){
			case "vidLinksUp":
				if(!request.status){
					hideWaitQ();
				}	
				updateTable();
				break;
		}
	}
)
