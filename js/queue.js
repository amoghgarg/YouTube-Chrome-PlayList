window.onload=loadThings;
var currentLength;
var canChange = true;
var nowPlay;
var listInd;
var noticeText = "Empty Queue!<br><a id = \"openSearch\">Search</a> YouTube or choose a <a id = \"openPlaylist\">playlist</a>"
var updateTime = 1;
var tabId; 
var muted = false;

function setNotice(){
	$("#notice").html(noticeText);
	$("#saveButton").hide();
	$("#leftButtons").hide();
	$("#rightButtons").hide();
	$("#clear").hide();
	$("#radio").hide();
	$('hr').hide();
	$("#openSearch").click(function(){
		$( "#tabs" ).tabs({"active":2});
	})
	$("#openPlaylist").click(function(){
		$( "#tabs" ).tabs({
			"active":0,
		});
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
	document.getElementById("loadingProgressG_1").style.visibility = "hidden";
	setTimeout(function(){document.getElementById("completedText").className="hide"}, 1000);
}

function showWaitQ(input){
	document.getElementById("loadingProgressG_1").style.visibility = "visible";
	document.getElementById("completedText").innerHTML = "Songs added to queue."
}

function playClicked(){

	if(currentLength>0){
		setToPause();
		back = chrome.extension.getBackgroundPage();
		tabId = back.tabId;

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
			$("#radio").removeClass("checked");
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
	$("#radio").removeClass("checked");
	$("#saveButton").hide();
	setNotice()
};


function loadThings() {
	updateTable()
;}

function prettyTime(input){
	var h = Math.floor(input/3600); 
	input = input - 3600*h;
	var m = Math.floor(input/60);
	s = input - m*60;
	s = s >= 10 ? s : "0"+s.toString();
	endString = m+":"+s;
	endString = h>0 ? h+":"+endString : endString
	return (endString)
}

function shuffleToggled(event, ui){
	var temp;

	if( $("#radio.checked").length==1 ){
		window.alert("Disable Radio Mode to enable Shuffle.")
	}
	else{
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
}

function loopToggled(event, ui){
	var temp;
	if( $("#loop.checked").length==1 ){
		$("#loop").removeClass("checked");
		temp = 0;
	}
	else{
		$("#loop").addClass("checked");
		temp = 1;
	}
	chrome.runtime.sendMessage({
		type:"loop",
		loop:temp
	})
}

function radioToggled(event, ui){
	var temp;
	if( $("#radio.checked").length==1 ){
		$("#radio").removeClass("checked");
		temp = 0;
	}
	else{
		$("#radio").addClass("checked");
		temp = 1;
		if( $("#shuffle.checked").length==1 ){
			$("#shuffle").removeClass("checked");
		}
	}
	chrome.runtime.sendMessage({
		type:"radio",
		radio:temp
	})
}



function updateSeekbar(response){
	if(updateTime){
		$("#timeCurrent").html(prettyTime(response.current));
		$("#timeDuration").html(' / '+prettyTime(response.duration))
		$("#timeSeek").slider("option","value",response.current);
		$("#timeSeek").slider("option","max",response.duration);
		$("#volumeSeek").slider("option","value",response.volume)
		muted = response.muted
		showMuteIcon()
		updateVolumeIcon(response.volume)
	}
}

function updateTable(){
	
	back = chrome.extension.getBackgroundPage();
	var vidLinks = back.vidLinks;
	nowPlay = back.vidInd;
	currentLength = vidLinks.length;
	shuffleState = back.shuffle;
	loopState = back.loop;
	tabId = back.tabId;
	radioState = back.radio;

	if(back.loggedIn){
		if(currentLength>0){
			// $("#saveButton")[0].style.visibility = "visible";
			$("#saveButton").show();
			$("#leftButtons").show();
			$("#rightButtons").show();
			$("#radio").show();
			$("#clear").show();
		}
		else{
			// $("#saveButton")[0].style.visibility = "hidden";
			$("#saveButton").hide();
			$("#radio").hide();
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
	document.getElementById("loop").checked = loopState;
	document.getElementById("loop").onclick=loopToggled;
	document.getElementById("radio").checked = radioState;
	document.getElementById("radio").onclick=radioToggled;
	if(shuffleState){
		$("#shuffle").addClass("checked");
	}
	if(loopState){
		$("#loop").addClass("checked");
	}
	if(radioState){
		$("#radio").addClass("checked");
	}

	//$("#test").click( testFunction);


	var table="<div id=\"notice\"></div>";
	//ui-state-default

	for (i = 0; i < currentLength; i++) {
		table += "<li id = \"" +i +"\" class=\"vidItem ui-state-default\" ><span class=\"ui-icon ui-icon-grip-dotted-horizontal\"></span>"+
		" <span><div>" + (vidLinks[i].name) + "</div></span> <span><button class=\"fa-trash remove\"></button><button title=\"Similar Songs\" class=\"fa-link similar\"></button></span> </li>";
	}
	document.getElementById('queueSortable').innerHTML = table;

	if(currentLength<1){
			setNotice();
	}

	//// Vid Item changes
	$(".vidItem").click(songChosen);
	$( ".remove, .similar" ).button({
      text: "remove"
    });

	$(".remove , .similar").mouseenter(function(){
    	 canChange = false;
	});

	$(".remove, .similar").mouseleave(function(){
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

    $(".similar").click(function(){
    	showRelated  = 0;		
    	showWaitSearch();
		chrome.runtime.sendMessage({
				type:"searchRelated",
				videoId:$(this).parent().parent().attr("id")

		})
		$( "#tabs" ).tabs({
			"active":2,
		});
	})
    $(".vidItem").mouseenter(
      function(){ 
      	$(this).children("span").children('div')[0].style.width="74%"
        $(this).removeClass("ui-state-default");
        $(this).addClass("ui-state-hover");
        $(this).children("span").children("button")[0].style.visibility="visible";
        $(this).children("span").children("button")[1].style.visibility="visible";
        //window.alert($(this).attr("id"))
      });
    $(".vidItem").mouseleave(
      function(){
      	$(this).children("span").children('div')[0].style.width="90%"
        $(this).addClass("ui-state-default");
        $(this).removeClass("ui-state-hover");
        $(this).children("span").children("button")[0].style.visibility="hidden";        
        $(this).children("span").children("button")[1].style.visibility="hidden";
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

    $( "#timeSeek" ).slider({
			orientation: "horizontal",
			range: "min",
			value: 0,
			max: 0,
			start: function(event, ui){
				updateTime = 0;
			},
			stop: function(event, ui){
				updateTime = 1;
				chrome.tabs.sendMessage(tabId,{
					type: "seekVideo",
					"info": ui.value
				})
			},
			slide: function(event, ui){
				$("#timeCurrent").html(prettyTime(ui.value))
			}
	});

	$( "#volumeSeek" ).slider({
			orientation: "horizontal",
			range: "min",
			value: 30,
			max: 1,
			step: 0.1,
			change: function(event, ui){
				updateTime = 1;
				updateVolumeIcon(ui.value)
			},
			stop: function(event, ui){
				chrome.tabs.sendMessage(tabId,{
					type: "seekVolume",
					"info": ui.value
				})
			}
	});

	$("#volumeArea").mouseenter(
		function(){
		$("#volumeSeek").css("width","50px")
	})

	$("#volumeArea").mouseleave(function(){
		$("#volumeSeek").css("width","0px")
	})


	$("#volume, #muteIcon").click(function(){
		muted = !muted;
		showMuteIcon();
		chrome.tabs.sendMessage(tabId,
			{type:"muteVolume"},
			function(response){
				updateSeekbar(response);
			}
		);
	})

    getTimeInfo()
   setInterval(getTimeInfo,1000)
}

function updateVolumeIcon(level){
	if(!muted){
		if(level>=0.5){
			$("#volume").removeClass("fa-volume-down")
			$("#volume").removeClass("fa-volume-off")
			$("#volume").addClass("fa-volume-up")
		}
		else if(level>0.2){
			$("#volume").removeClass("fa-volume-up")
			$("#volume").removeClass("fa-volume-off")
			$("#volume").addClass("fa-volume-down")
		}
		else{
			$("#volume").removeClass("fa-volume-down")
			$("#volume").removeClass("fa-volume-up")
			$("#volume").addClass("fa-volume-off")
		}
	}
	else{
		$("#muteIcon").css("visibility","visible")		
		$("#volume").removeClass("fa-volume-down")
		$("#volume").removeClass("fa-volume-up")
		$("#volume").addClass("fa-volume-off")
	}
}

function showMuteIcon(){
	if(muted){
		$("#muteIcon").css("visibility","visible")	
		$("#volume").removeClass("fa-volume-down")
		$("#volume").removeClass("fa-volume-up")
		$("#volume").addClass("fa-volume-off")		
	}
	else{
		$("#muteIcon").css("visibility","hidden")	
		$("#volume").removeClass("fa-volume-down")
		$("#volume").removeClass("fa-volume-up")
		$("#volume").addClass("fa-volume-off")	
	}
}

function getTimeInfo(){
	if(tabId){
		chrome.tabs.sendMessage(tabId,
				{type:"getTime"},
				function(response){
					updateSeekbar(response);
				}
			);
	}
}


function removeItem(id){
	chrome.runtime.sendMessage({
		type:"removeItem",
		"id":id
	});
	
	if(nowPlay>=id){
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
				canChange = true;
				break;
			case "tabCreated":
				tabId = request.tabId
				break;
		}
	}
)