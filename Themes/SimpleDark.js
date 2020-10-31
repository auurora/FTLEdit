window.FTLThemeReady = function() {
	window.FTLThemeStyle.styles = {
		".ftledit\\.editor": {
			"color": "#fff",
		},
		".ftledit\\.editor\\.background": {
			"background": "#353535",
		},
		".ftledit\\.editor\\.linehighlight": {
			"background": "#7070703f",
			"transition": "top 0.1s",
		},
		".ftledit\\.editor\\.cursor": {
			"background": "rgba(255,255,255,0.7)",
			"transition": "top 0.1s",
		},
		".ftledit\\.editor\\.linenumbers": {
			"background": "#404040",
		},
	};
	window.FTLThemeStyle.refresh();
};