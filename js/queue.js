window.onload=loadThings;
var currentLength;
var canChange = true;
var nowPlay;
var listInd;
var noticeText = "Empty Queue!<br><a id = \"openSearch\">Search</a> YouTube or choose a <a id = \"openPlaylist\">playlist</a>"

function setNotice(){
	$("#notice").html(noticeText);
	$("#saveButton").hide();
	$("#leftButtons").hide();
	$("#rightButtons").hide();
	$("#clear").hide();
	$('hr').hide();
	$("#openSearch").click(function(){
		$( "#tabs" ).tabs({"active":2});
	})
	$("#openPlaylist").click(function(){
		$( "#tabs" ).tabs({"active":0});
	})
}

function setToPause(){
	$("#play").removeClass("willPlay fa-play");
	$("#play").addClass("willPause fa-pause");
	$("#play").click(pauseClicked);
}


function setToPlay(){
	$("#play").removeClass("willPause fa-pause");
	$("#play").addClass("willPlay fa-play");
	$("#play").click(playClicked)
}


function hideWaitQ(){
	document.getElementById("completedText").className = "show";	
	stopAnimation();
	document.getElementById("loaderImage").style.visibility = "hidden";
	setTimeout(function(){document.getElementById("completedText").className="hide"}, 1000);
}

function showWaitQ(input){
	document.getElementById("loaderImage").style.visibility = "visible";
	startAnimation();
	document.getElementById("completedText").innerHTML = "Songs added to queue."
}

function playClicked(){

	if(currentLength>0){
		// $( "#play" ).button({
	 //      text: false,
	 //      icons: {
	 //      	primary: "fa fa-pause fa-2x"
  //     	  }
  //   	});
		setToPause();
		
		

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
	setToPlay();
	chrome.runtime.sendMessage(
		{type:"pauseClicked"}	
	);
};

function prevClicked(){

	if(currentLength>0){
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

		setToPause();
	}
};

function nextClicked(){

	if(currentLength>0){
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

		nowPlay = clicked;

		setToPause();
	}
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

	setToPlay();
	currentLength = 0;
	// $("#saveButton")[0].style.visibility="hidden"
	$("#saveButton").hide();
	setNotice()
	//updateTable();
};


function loadThings() {
	updateTable()
;}

function shuffleToggled(event, ui){
	var temp;
	if( $("#shuffle.checked").length==1 ){
		$("#shuffle").removeClass("checked");
		temp = 0;
	}
	else{
		$("#shuffle").addClass("checked");
		temp = 1;
	}
	chrome.runtime.sendMessage({
		type:"shuffle",
		shuffle:temp
	})
}

function updateTable(){
	
	back = chrome.extension.getBackgroundPage();
	var vidLinks = back.vidLinks;
	nowPlay = back.vidInd;
	currentLength = vidLinks.length;
	shuffleState = back.shuffle;

	if(back.loggedIn){
		if(currentLength>0){
			// $("#saveButton")[0].style.visibility = "visible";
			$("#saveButton").show();
			$("#leftButtons").show();
			$("#rightButtons").show();
			$("#clear").show();
		}
		else{
			// $("#saveButton")[0].style.visibility = "hidden";
			$("#saveButton").hide();
		}
	}
	else{
		// $("#saveButton")[0].style.visibility = "hidden";	
		$("#saveButton").hide();
	}

	playBut = document.getElementById("play");		

	//document.getElementById("test").onclick=test;
    document.getElementById("saveButton").onclick=saveQueue;
	document.getElementById("forward").onclick=nextClicked;
	document.getElementById("rewind").onclick=prevClicked;
	document.getElementById("clear").onclick=clearClicked;
	document.getElementById("shuffle").checked = shuffleState;
	document.getElementById("shuffle").onclick=shuffleToggled;
	if(shuffleState){
		$("#shuffle").addClass("checked");
	}

	//$("#test").click( testFunction);


	var table="<div id=\"notice\"></div>";
	//ui-state-default

	for (i = 0; i < currentLength; i++) {
		table += "<li id = \"" +i +"\" class=\"vidItem ui-state-default\" ><span class=\"ui-icon ui-icon-grip-dotted-horizontal\"></span>"+
		" <span><div>" + (vidLinks[i].name) + "</div></span> <span><button class=\"fa-trash remove\"></button></span> </li>";
	}
	document.getElementById('queueSortable').innerHTML = table;

	if(currentLength<1){
			setNotice();
	}

	//// Vid Item changes
	$(".vidItem").click(songChosen);
	$( ".remove" ).button({
      text: "remove",
      icons: {
        primary: "fa-trash"
      }
    });

	$(".remove").mouseenter(function(){
    	 canChange = false;
	});

	$(".remove").mouseleave(function(){
		 canChange = true;
	});

    $(".remove").click(function(){
    	$(this).parent().parent().remove(0);
    	id = $(this).parent().parent().attr("id");
    	removeItem(id);
    	currentLength--;
    	if(currentLength==0){
    		setNotice();
    	}
    });
    $(".vidItem").mouseenter(
      function(){ 
      	$(this).children("span").children('div')[0].style.width="82%"
        $(this).removeClass("ui-state-default");
        $(this).addClass("ui-state-hover");
        $(this).children("span").children("button")[0].style.visibility="visible";
        //window.alert($(this).attr("id"))
      });
    $(".vidItem").mouseleave(
      function(){
      	$(this).children("span").children('div')[0].style.width="90%"
        $(this).addClass("ui-state-default");
        $(this).removeClass("ui-state-hover");
        $(this).children("span").children("button")[0].style.visibility="hidden";
      });
     ///////////////////////////////////////

    //// Play and pause button cofiguration
    
    if(back.playing){
		setToPause();
    	$("#"+nowPlay).addClass('ui-state-active');
		$("#"+nowPlay).removeClass('ui-state-default');
	}
	else{
		setToPlay();
	}

    /////////////////////////////////////
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
		setToPause();
    	chrome.browserAction.setIcon({path:"img/iconCol.png"});

		nowPlay = clicked;
	}
};

chrome.runtime.onMessage.addListener( 
	function(request,sender,sendResponse){
		switch(request.type){
			case "vidLinksUp":
				if(!request.status){
					hideWaitQ();
				}	
				updateTable();
				if(request.from=="searchAdd"){
					if(currentLength==1){
						playClicked()
					}
				}
				break;
			case "changedToNextSong":
				var clicked = request.id
				$("#"+nowPlay).removeClass('ui-state-active');
				$("#"+nowPlay).addClass('ui-state-default');
				$("#"+clicked).addClass('ui-state-active');
				$("#"+clicked).removeClass('ui-state-default');
				nowPlay = clicked;
				break;
		}
	}
)