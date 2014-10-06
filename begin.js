var queueWaitLoop;
var playlistWaitLoop;
function tabChanged(event, ui){

	if(ui.newPanel.selector=="#tabQueue"){
		updateLoginSpan()
	}

}

$(function() {
    $( "#tabs" ).tabs({
    	"active":1,
    	activate:tabChanged
	});


    queueWaitLoop = new CanvasLoader('queueWaitDiv');
	queueWaitLoop.setShape('spiral'); // default is 'oval'
	queueWaitLoop.setDiameter(20); // default is 40
	queueWaitLoop.setDensity(16); // default is 40
	queueWaitLoop.setRange(0.5); // default is 1.3
	queueWaitLoop.setSpeed(1); // default is 2
	queueWaitLoop.setFPS(22); // default is 24
	//queueWaitLoop.show(); // Hidden by default


    playlistWaitLoop = new CanvasLoader('playlistWaitDiv');
	playlistWaitLoop.setShape('spiral'); // default is 'oval'
	playlistWaitLoop.setDiameter(20); // default is 40
	playlistWaitLoop.setDensity(16); // default is 40
	playlistWaitLoop.setRange(0.5); // default is 1.3
	playlistWaitLoop.setSpeed(1); // default is 2
	playlistWaitLoop.setFPS(22); // default is 24
	//playlistWaitLoop.show(); // Hidden by default	
});