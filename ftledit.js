class HTMLEntity {
	constructor(editorDiv, classname) {
		this.Element = editorDiv;
		editorDiv.className = classname == null ? "" : classname;
	}
}
function newinstance(tag, parent, classname) {
	var d = document.createElement(tag);
	d.className = classname == null ? "" : classname;
	if (parent != null) parent.appendChild(d);
	return d;
}
function div(parent, classname) {
	return newinstance("div", parent, classname);
}
function span(parent, classname) {
	return newinstance("span", parent, classname);
}
class LineOptimizer {
	display = 0;
	selectionStart = [0,0];
	selectionEnd = [0,0];
	lines = [];
	realpos() {
		return this.selectionStart[1] > this.lines[this.linepos(this.selectionStart[0])][0].length ? this.lines[this.linepos(this.selectionStart[0])][0].length : this.selectionStart[1];
	}
	append(text) {
		var line = this.selectionStart[0];
		var pos = this.realpos();
		var textlines = text.split('\n');
		var start = this.lines[this.linepos(line)][0].substr(0, pos);
		var end = this.lines[this.linepos(line)][0].substr(pos)
		this.lines[this.linepos(line)][0] = start + textlines[0];
		this.setcursorpos(this.selectionStart[0], this.selectionStart[1] + textlines[0].length);
		for (var i = 1; i < textlines.length; i++) {
			this.newline(textlines[i], line+i-1);
			this.updateline(this.linepos(line+i));
			this.updateline(this.linepos(line+i-1));
			
			
		}
		this.setcursorpos(line+textlines.length-1, textlines[textlines.length-1].length);
		this.lines[this.linepos(this.selectionStart[0])][0] += end;
		this.updateline(this.linepos(this.selectionStart[0]));
	}
	newline(text, index) {
		this.lines[this.lines.length] = [text, div(null, `fltedit.line:${this.lines.length}`)];
		if (index != null) {
			var next = this.display.childNodes[index].nextSibling;
			this.display.insertBefore(this.lines[this.lines.length-1][1], next);
		} else {
			this.display.appendChild(this.lines[this.lines.length-1][1]);
		}
		this.updateline(this.lines.length-1);
		this.updatelinenumbers();
	}
	linepos(line) {
		return parseInt(this.display.childNodes[line].className.substr(13));
	}
	updateline(line) {
		this.lines[line][1].innerHTML = "";
		var spn = span(this.lines[line][1]);
		spn.textContent = this.lines[line][0];
	}
	updatelinenumbers() {
		var displayedLines = this.linenumbers.childNodes.length;
		
		if (this.display.childNodes.length > displayedLines) {
			for (var i = 0; i < (this.display.childNodes.length - displayedLines); i++) {
				var linenum = span(this.linenumbers);
				linenum.textContent = displayedLines + i + 1;
			}
		} else if(this.display.childNodes.length < displayedLines) {
			for (var i = 0; i < (displayedLines - this.display.childNodes.length); i++) {
				this.linenumbers.removeChild(this.linenumbers.lastChild);
			}
		}
	}
	removeline(line) {
		var linepos = this.linepos(line);
		this.lines[linepos][1].parentElement.removeChild(this.lines[linepos][1]);
		this.lines[linepos] = null;
	}
	setcursorpos(line, letter) {
		if (line >= this.display.childNodes.length) {
			this.setcursorpos(this.display.childNodes.length-1, this.lines[this.linepos(this.display.childNodes.length-1)][0].length);
			return;
		};
		this.selectionStart[0] = line;
		this.selectionStart[1] = letter;
		this.selectionEnd[0] = line;
		this.selectionEnd[1] = letter;
		this.editor.LineHighlight.style.top = line + "em";
		this.editor.Cursor.style.top = line + "em";
		var charwidth = 0;
		charwidth = this.editor.calculateLength(this.lines[this.linepos(line)][0].substr(0,letter))
		
		this.editor.Cursor.style.left = `${1+this.linenumbers.clientWidth+charwidth}px`;
		this.editor.Cursor.scrollIntoView();
	}
	
	moveleft() {
		var pos = this.realpos();
		if(this.selectionStart[0] == 0 && pos == 0) return;
		this.setcursorpos(
			pos == 0 ? this.selectionStart[0]-1 : this.selectionStart[0],
			pos == 0 ? this.lines[this.linepos(this.selectionStart[0]-1)][0].length : pos-1
		);
	}
	moveright() {
		var pos = this.realpos();
		this.setcursorpos(
			pos == this.lines[this.linepos(this.selectionStart[0])][0].length ? this.selectionStart[0]+1 : this.selectionStart[0],
			pos == this.lines[this.linepos(this.selectionStart[0])][0].length ? 0 : pos+1
		);
	}
	moveup() {
		this.setcursorpos(
			this.selectionStart[0] > 0 ? this.selectionStart[0]-1 : this.selectionStart[0],
			this.selectionStart[1]
		);
	}
	movedown() {
		this.setcursorpos(
			this.selectionStart[0] < this.display.childNodes.length ? this.selectionStart[0]+1 : this.selectionStart[0],
			this.selectionStart[1]
		);
	}
	backspace() {
		var line = this.selectionStart[0]
		var pos = this.realpos();
		
		this.moveleft();
		
		var linepos = this.linepos(line);
		this.lines[linepos][0] = this.lines[linepos][0].substr(0, pos-1) + this.lines[linepos][0].substr(pos);
		if (pos == 0 && line != 0) {
			this.lines[this.linepos(line-1)][0] += this.lines[this.linepos(line)][0];
			this.removeline(line);
			this.updatelinenumbers();
		}
		this.updateline(this.linepos(this.selectionStart[0]));
	}
	constructor(editor) {
		this.editor = editor;
		this.linenumbers = editor.LineNumbers;
		this.display = editor.Lines;
		this.newline("");
		this.updatelinenumbers();
		
	}
}
var Cursors = [];
var CursorOpacity = 0;
setInterval(function() {
	CursorOpacity = CursorOpacity == 0 ? 1 : 0;
	for (var i = 0; i < Cursors.length; i++) {
		if (Cursors[i] != null)
			Cursors[i].style.opacity = CursorOpacity;
	}
}, 500);

class Editor extends HTMLEntity {
	calculateLength(text) {
		this.LengthCalculator.textContent = text;
		var length = this.LengthCalculator.clientWidth;
		this.LengthCalculator.textContent = "";
	
		return length;
	}
	constructor(editorDiv) {
		super(editorDiv, "ftledit.editor");
		this.Page = div(this.Element, "ftledit.editor.page");
		this.Background = div(this.Page, "ftledit.editor.background");
		this.Frame = div(this.Page, "ftledit.editor.frame");
		
		this.LineHighlight = div(this.Background, "ftledit.editor.linehighlight");
		
		this.LengthCalculator = div(this.Background, "ftledit.editor.lengthcalculator");
		
		this.Cursor = div(this.Page, "ftledit.editor.cursor");
		
		Cursors[Cursors.length] = this.Cursor;
		
		this.LineNumbers = div(this.Frame, "ftledit.editor.linenumbers");
		this.Lines = div(this.Frame, "ftledit.editor.lines");
		
		this.TextInput = newinstance("textarea", this.Element, "ftledit.editor.textinput");
		this.TextInput.autocapitalize = "off";
		this.TextInput.spellcheck = false;
		this.TextInput.autocorrect = "off";
		this.TextInput.wrap = "off";
		
		
		var editor = this;
		var KeyEvents = {
			"ArrowLeft": function (e) {
				editor.LineOpt.moveleft();
			},
			"ArrowRight": function (e) {
				editor.LineOpt.moveright();
			},
			"ArrowUp": function (e) {
				editor.LineOpt.moveup();
			},
			"ArrowDown": function (e) {
				editor.LineOpt.movedown();
			},
			"Backspace": function (e) {
				editor.LineOpt.backspace();
			}
		};
		this.TextInput.addEventListener('input', function(e) {
			if (KeyEvents[e.code]) { return KeyEvents[e.code](e) };
			editor.LineOpt.append(editor.TextInput.value);
			editor.TextInput.value = "";
		});
		this.TextInput.addEventListener('keydown', function(e) {
			if (KeyEvents[e.code]) { return KeyEvents[e.code](e) };
			
			return false;
		});
		this.Frame.addEventListener('click', function(event) {
			var editorFrame = editor.Frame.getBoundingClientRect();
			if (event.clientY > editorFrame.top && event.clientY < editorFrame.bottom &&
				event.clientX > editorFrame.left && event.clientX < editorFrame.right) {
				var line = 
					Math.ceil((event.clientY-editorFrame.top)/editor.LineOpt.lines[0][1].clientHeight)-1;
				var pos = window.getSelection().focusOffset;

				editor.LineOpt.setcursorpos(line, pos);
			}
			editor.TextInput.focus();
		});
		this.LineOpt = new LineOptimizer(this);
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
