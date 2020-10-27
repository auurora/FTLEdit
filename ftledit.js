class HTMLEntity {
	constructor(editorDiv, classname) {
		this.Element = editorDiv;
		editorDiv.className = classname;
	}
}
function newinstance(tag, parent, classname) {
	var d = document.createElement(tag);
	d.className = classname;
	parent.appendChild(d);
	return d;
}
function div(parent, classname) {
	return newinstance("div", parent, classname);
}
function span(parent, classname) {
	return newinstance("span", parent, classname);
}
class LineOptimizer {
	constructor() {
		
	}
}
class Editor extends HTMLEntity {
	
	Refresh() {
		this.Lines.innerHTML = "";
		this.LineNumbers.innerHTML = "";
		var lines = this.TextInput.value.split('\n');
		for (var i = 0; i < lines.length; i++) { 
			var linenum = span(this.LineNumbers);
			linenum.textContent = i+1;
			var lineContainer = div(this.Lines);
			this.LineHeight = linenum.clientHeight;
			if (lines[i].length == 0) {
				lineContainer.style.minHeight = linenum.clientHeight + "px";
			} else {
				var line = span(lineContainer);
				line.textContent = lines[i];
			}
		}
	}
	constructor(editorDiv) {
		super(editorDiv, "ftledit.editor");
		this.Frame = div(this.Element, "ftledit.editor.frame");
		this.LineNumbers = div(this.Frame, "ftledit.editor.linenumbers");
		this.Cursor = div(this.Element, "ftledit.editor.cursor");
		this.Lines = div(this.Frame, "ftledit.editor.lines");
		this.TextInput = newinstance("textarea", this.Element, "ftledit.editor.textinput");
		this.TextInput.autocapitalize = "off";
		this.TextInput.spellcheck = "false";
		this.TextInput.autocorrect = "off";
		this.TextInput.wrap = "off";
		console.log(this.TextInput);
		var editor = this;
		this.TextInput.addEventListener('input', function() {editor.Refresh()});
		
		this.Frame.addEventListener('click', function() {
			editor.TextInput.focus();
		});
		this.Refresh();
	}
}
var HTMLEntityClasses = [
	["ftledit.editor", Editor]
];
function AddCSS(location) {
	var link = document.createElement("link");
	link.href = location;
	link.rel = "stylesheet";
	document.head.appendChild(link);
}	
function HTMLEntityCreator(element) {
	var morphreg = /morph<[^><]*>/; // cant use positive lookbehind since not supported on some browsers
	if (element.className.match(morphreg)[0] != "")
		for (var i = 0; i < HTMLEntityClasses.length; i++) 
			if ((HTMLEntityClasses[i][0] + ">") == element.className.match(morphreg)[0].substr(6))
				return new HTMLEntityClasses[i][1](element);
}
window.addEventListener("load", function() {
	HTMLEntityCreator(document.getElementsByClassName("morph<ftledit.editor>")[0]); // Just to get it up and running
	AddCSS("ftledit.css");
});
