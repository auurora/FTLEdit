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
class Stylesheet {
	styles = {};
	sheet = null;
	compilesheet() {
		var txt = "";
		for (var key in this.styles) {
			txt += `${key} {\n`;
			for (var k in this.styles[key]) txt += `	${k}: ${this.styles[key][k]};\n`;
			txt += "}\n";
		}
		return txt;
	}
	refresh() {
		if (this.sheet.styleSheet)
			this.sheet.styleSheet.cssText = this.compilesheet();
		else
			this.sheet.textContent = this.compilesheet();
	}
	constructor(styles) {
		this.styles = styles;
		this.sheet = newinstance("style", document.head);
		this.refresh();
	}
}

class HTMLEntity {
	constructor(editorDiv, classname) {
		this.Element = editorDiv;
		editorDiv.className = classname == null ? "" : classname;
	}
}
class LineOptimizer {
	selectionStart = [0,0];
	selectionEnd = [0,0];
	lines = [];
	firstDisplayed = 0;
	newline(text, index) {
		if (index == null || index >= this.lines.length) {
			this.lines[this.lines.length] = text;
			return;
		}
		this.lines.splice(index, 0, text);
	}
	realpos() {
		return this.selectionStart[1] > this.lines[this.selectionStart[0]].length ? this.lines[this.selectionStart[0]].length : this.selectionStart[1];
	}
	append(text) {
		var line = this.selectionStart[0];
		var pos = this.realpos();
		var textlines = text.split('\n');
		var start = this.lines[line].substr(0, pos);
		var end = this.lines[line].substr(pos)
		this.lines[line] = start + textlines[0];
		for (var i = 1; i < textlines.length; i++) {
			this.newline(textlines[i], line+i);
		}
		this.setcursorpos(line+textlines.length-1, textlines.length <= 1 ? this.selectionStart[1] + textlines[0].length : textlines[textlines.length-1].length);
		this.lines[this.selectionStart[0]] += end;
		this.refresh();
	}
	setcursorpos(line, letter) {
		if (line >= this.lines.length) {
			this.setcursorpos(this.lines.length-1, this.lines[this.lines.length-1].length);
			return;
		};
		this.selectionStart[0] = line;
		this.selectionStart[1] = letter;
		this.selectionEnd[0] = line;
		this.selectionEnd[1] = letter;
		
		this.editor.updateheights();
		this.editor.LineHighlight.style.top = `${line*this.editor.TextHeight}px`;
		this.editor.Cursor.style.top = `${line*this.editor.TextHeight}px`;
		var charwidth = this.editor.calculateLength(this.lines[line].substr(0,letter))
		
		this.editor.Cursor.style.left = `${1+charwidth}px`;

		var r = this.editor.Cursor.getBoundingClientRect();
		
		if (r.top < this.editor.YScrollbar.scrollTop || r.bottom > this.editor.Page.clientHeight) {
			console.log(r.top < 0 ? r.top : r.bottom-this.editor.Scroller.getBoundingClientRect().clientHeight);
			this.editor.YScrollbar.scrollTop = r.top < 0 ? r.top : r.bottom-this.editor.Scroller.getBoundingClientRect().clientHeight;
		}
	}
	moveleft() {
		var pos = this.realpos();
		if(this.selectionStart[0] == 0 && pos == 0) return;
		this.setcursorpos(
			pos == 0 ? this.selectionStart[0]-1 : this.selectionStart[0],
			pos == 0 ? this.lines[this.selectionStart[0]-1].length : pos-1
		);
	}
	moveright() {
		var pos = this.realpos();
		this.setcursorpos(
			pos == this.lines[this.selectionStart[0]].length ? this.selectionStart[0]+1 : this.selectionStart[0],
			pos == this.lines[this.selectionStart[0]].length ? 0 : pos+1
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
		
		this.lines[line] = this.lines[line].substr(0, pos-1) + this.lines[line].substr(pos);
		if (pos == 0 && line != 0) {
			this.lines[line-1] += this.lines[line];
			this.removeline(line);
		}
		this.refresh();
	}
	removeline(line) {
		this.lines.splice(line, 1);
	}
	refresh() {
		this.showfromline(this.firstDisplayed);
	}
	showfromline(line) {
		line--;
		line = line < 0 ? 0 : line;
		this.firstDisplayed = line;
		this.display.innerHTML = "";
		this.linenumbers.innerHTML = "";
		this.editor.updateheights();
		this.editor.YScrollbarSize.style.height = `${this.lines.length*this.editor.TextHeight}px`;
		this.editor.Cursor.style.height = `${this.editor.TextHeight}px`;
		this.editor.LineHighlight.style.height = `${this.editor.TextHeight}px`;
		//this.display.style.height = `${this.lines.length*this.editor.TextHeight}px`;
		var len = Math.ceil(this.editor.Page.clientHeight/this.editor.TextHeight)+1;
		var horizontal = 0;
		var offset = `${line*this.editor.TextHeight}px`;
		for (var i = 0; i < len; i++) {
			if (this.lines.length <= line+i) break;
			var linenumber = div(this.linenumbers);
			var linetext = span(linenumber);
			linetext.textContent = line+i+1;
			var parent = div(this.display);
			var text = span(parent);
			text.textContent = this.lines[line+i];
			if (this.lines[line+i] == "") text.textContent = " ";
			linenumber.style.top = offset;
			parent.style.top = offset;
		}
		
		this.editor.XScrollbarSize.style.width = `${this.display.scrollWidth}px`;

		
	}
	constructor(editor) {
		this.editor = editor;
		this.linenumbers = editor.LineNumbers;
		this.display = editor.Lines;
		this.newline("");
		//for (var i = 0; i < 2000; i++) this.newline(("1").repeat(i));
		
		
		this.showfromline(0);
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
	TextHeight = 16;

	calculateLength(text) {
		this.LengthCalculator.textContent = text;
		var length = this.LengthCalculator.scrollWidth;
		this.LengthCalculator.textContent = "";
	
		return length;
	}
	updateheights() {
		this.LengthCalculator.textContent="bruh";
		this.TextHeight = this.LengthCalculator.scrollHeight;
		this.LineHighlight.style.height = this.TextHeight;
		this.Cursor.style.height = this.TextHeight;
		this.LengthCalculator.textContent="";
	}
	constructor(editorDiv) {
		super(editorDiv, "ftledit.editor");
		this.YScrollHolder = div(this.Element, "ftledit.editor.frame");
		
		this.Page = div(this.YScrollHolder, "ftledit.editor.page");
		this.YScrollbar = div(this.YScrollHolder, "ftledit.editor.scrollbar y");
		this.Background = div(this.Element, "ftledit.editor.background");
		this.LineNumbers = div(this.Page, "ftledit.editor.linenumbers");
		this.Scroller = div(this.Page, "ftledit.editor.scroller");
		
		this.YScrollbarSize = div(this.YScrollbar);


		this.XScrollbar = div(this.Scroller, "ftledit.editor.scrollbar x");
		this.XScrollbarSize = div(this.XScrollbar);

		
		
		this.LengthCalculator = span(this.Background, "ftledit.editor.lengthcalculator");
		
		
		
		this.LineHolder = div(this.Scroller, "ftledit.editor.lineholder");
		this.Lines = div(this.LineHolder, "ftledit.editor.lines");
		
		this.LineHighlight = div(this.LineHolder, "ftledit.editor.linehighlight");
		this.Cursor = div(this.LineHolder, "ftledit.editor.cursor");
		
		Cursors[Cursors.length] = this.Cursor;

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
		this.YScrollbar.addEventListener('scroll', function(e) {
			editor.LineHolder.style.top = `-${editor.YScrollbar.scrollTop}px`
			editor.LineNumbers.style.top = `-${editor.YScrollbar.scrollTop}px`
			editor.LineNumbers.style.height = `${editor.YScrollbar.scrollTop + window.innerHeight}px`
			editor.LineOpt.showfromline(Math.ceil(editor.YScrollbar.scrollTop/editor.TextHeight)-1);
		});
		this.XScrollbar.addEventListener('scroll', function(e) {
			editor.LineHolder.style.left = `-${editor.XScrollbar.scrollLeft}px`
		});
		this.TextInput.addEventListener('input', function(e) {
			if (KeyEvents[e.code]) { return KeyEvents[e.code](e) };
			editor.LineOpt.append(editor.TextInput.value);
			editor.TextInput.value = "";
		});
		this.TextInput.addEventListener('keydown', function(e) {
			if (KeyEvents[e.code]) { return KeyEvents[e.code](e) };
			
			return false;
		});

		editorDiv.addEventListener('click', function(event) {
			editor.updateheights();
			var editorFrame = editor.Scroller.getBoundingClientRect();
			var lineTop = editor.LineHolder.getBoundingClientRect().top;
			if (event.clientY > editorFrame.top && event.clientY < editorFrame.bottom && event.clientX > editorFrame.left && event.clientX < editorFrame.right)
				editor.LineOpt.setcursorpos(Math.ceil((event.clientY-editorFrame.top-lineTop)/editor.TextHeight)-1, window.getSelection().focusOffset);
			editor.TextInput.focus();
		});
		this.LineOpt = new LineOptimizer(this);
		setTimeout(function() {
			editor.LineOpt.showfromline(0);
		},100);
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
	var Styling = new Stylesheet({
		".ftledit\\.editor": {
			"min-width": "50px",
			"min-height": "16px",
			"overflow": "hidden"
		}
	});
});