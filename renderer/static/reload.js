var ws = new WebSocket('ws://' + window.location.host + '/register', 'watch-changes-1.0');
ws.onmessage = function(msg) {
	if (msg.data == 'reload') {
		window.location.reload(true);
	}
}
