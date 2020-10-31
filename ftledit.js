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
		if (this.sheet.styleSheet)this.sheet.styleSheet.cssText = this.compilesheet();
		else this.sheet.textContent = this.compilesheet();
	}
	constructor(styles) {
		this.styles = styles;
		this.sheet = newinstance("style", document.head);
		this.sheet.type = "text/css";
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
		var rtop = line*this.editor.TextHeight;
		var rbottom = rtop + r.height;
		var yscrolltop = this.editor.YScrollbar.scrollTop;
		var scrollheight = this.editor.Scroller.getBoundingClientRect().height;
		
		if (rtop < yscrolltop || rbottom > yscrolltop+scrollheight) {
			this.editor.YScrollbar.scrollTop = rtop < yscrolltop ? rtop : rbottom-(scrollheight)+(this.editor.XScrollbar.getBoundingClientRect());
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
			this.selectionStart[0] < this.lines.length ? this.selectionStart[0]+1 : this.selectionStart[0],
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
		this.editor.YScrollbarSize.style.height = `${(this.lines.length*this.editor.TextHeight) + this.editor.XScrollbar.getBoundingClientRect().height}px`;
		this.editor.Cursor.style.height = `${this.editor.TextHeight}px`;
		this.editor.LineHighlight.style.height = `${this.editor.TextHeight}px`;
		var len = Math.ceil(this.editor.Page.clientHeight/this.editor.TextHeight)+1;
		var horizontal = 0;
		var offset = `${line*this.editor.TextHeight}px`;
		var spaces = (" ").repeat(this.editor.TabSpaces);
		for (var i = 0; i < len; i++) {
			if (this.lines.length <= line+i) break;
			var linenumber = div(this.linenumbers);
			var linetext = span(linenumber);
			linetext.textContent = line+i+1;
			var parent = div(this.display);
			var text = span(parent);
			text.textContent = this.lines[line+i].replace("\t", spaces);
			if (this.lines[line+i] == "") text.textContent = " ";
			linenumber.style.top = offset;
			parent.style.top = offset;
			this.linenumbers.style.marginBottom = `${this.editor.XScrollbar.getBoundingClientRect().height}px`;
		}
		
		this.editor.XScrollbarSize.style.width = `${this.display.scrollWidth}px`;

		
	}
	constructor(editor) {
		this.editor = editor;
		this.linenumbers = editor.LineNumbers;
		this.display = editor.Lines;
		this.newline("");
		
		
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
	TabSpaces = 4;
	UseTabs = true;
	Selecting = false;
	IntellisenseCallback = function(line, word) {

	}
	getText() {
		var Doc = "";
		for (var i = 0; i < this.LineOpt.lines.length; i++)
			Doc+=this.LineOpt.lines[i];
		return Doc;
	}
	calculateLength(text) {
		this.LengthCalculator.textContent = text.replace("\t", (" ").repeat(this.TabSpaces));
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
		this.XFlexbox = div(this.Page, "ftledit.editor.scrollflex");
		this.Scroller = div(this.XFlexbox, "ftledit.editor.scroller");
		
		this.YScrollbarSize = div(this.YScrollbar);

		this.XScrollbar = div(this.XFlexbox, "ftledit.editor.scrollbar x");
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
			},
			"Tab": function(e) {
				editor.LineOpt.append(editor.UseTabs ? "\t" : ((" ").repeat(editor.TabSpaces)));
				return true;
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
			editor.LineHighlight.style.left = `${editor.XScrollbar.scrollLeft}px`
		});
		this.TextInput.addEventListener('input', function(e) {
			if (KeyEvents[e.code]) { return KeyEvents[e.code](e) };
			editor.LineOpt.append(editor.TextInput.value);
			editor.TextInput.value = "";
		});
		this.TextInput.addEventListener('keydown', function(e) {
			if (KeyEvents[e.code]) { 
				e.preventDefault();
				return KeyEvents[e.code](e) 
			};
			
			return false;
		});
		editorDiv.addEventListener('mousedown', function(event) {
			this.Selecting = true;
			editor.updateheights();
			var editorFrame = editor.Scroller.getBoundingClientRect();
			var lineTop = editor.LineHolder.getBoundingClientRect().top;
			if (event.clientY > editorFrame.top && event.clientY < editorFrame.bottom && event.clientX > editorFrame.left && event.clientX < editorFrame.right) {
				var line = Math.ceil((event.clientY-editorFrame.top-lineTop)/editor.TextHeight)-1;
				// Begin bad method to determine character clicked
				if (line < editor.LineOpt.lines.length) {
					var linestr = editor.LineOpt.lines[line];
					var character = 0;
					var correctedX = event.clientX-editorFrame.left+editor.XScrollbar.scrollLeft;
					if (linestr.length > 0) {
						if (correctedX > editor.calculateLength(linestr)) {
							character = linestr.length;
						} else if(correctedX > 0) { // dont do the big calc if not needed
							for (var i = 0; i < linestr.length; i++) {
								character = i;
								if (correctedX < editor.calculateLength(linestr.substr(0,i+1))) break;
							}
						}
					} 
				}
				editor.LineOpt.setcursorpos(Math.ceil((event.clientY-editorFrame.top-lineTop)/editor.TextHeight)-1, character);
			}
		});
		editorDiv.addEventListener('mouseup', function(event) {
			this.Selecting = false;
		});
		editorDiv.addEventListener('click', function(event) {
			editor.TextInput.focus();
		});
		this.LineOpt = new LineOptimizer(this);
		setTimeout(function() {
			editor.LineOpt.showfromline(0);
		},100);
	}
	
}


window.addEventListener("load", function() {
	window.FTLThemeStyle = new Stylesheet({
		".ftledit\\.editor\\.background": {
			"background": "#fafafa",
		},
		".ftledit\\.editor\\.linehighlight": {
			"background": "rgba(40,40,40,0.3)",
		},
		".ftledit\\.editor\\.cursor": {
			"background": "rgba(0,0,0,0.7)",
		},
		".ftledit\\.editor\\.linenumbers": {
			"background": "#ddd",
		},
	});
	window.FTLThemeStyle.sheet.id="FTLEditTheme";
	if (window.FTLThemeReady!=null) FTLThemeReady();
	var Styling = new Stylesheet({
		".ftledit\\.editor": {
			"min-width": "50px",
			"min-height": "16px",
			"overflow": "hidden"
		},
		".ftledit\\.editor\\.scrollbar": {
			"flex-shrink": 0,
		},
		".ftledit\\.editor\\.scrollbar.y": {
			"overflow-y": "scroll",
			"height": "100%",
			"right": "0px",
		},
		".ftledit\\.editor\\.scrollbar.y > div": {
			"overflow-y": "hidden",
			"width": "1px",
		},
		".ftledit\\.editor\\.scrollbar.x": {
			"overflow-x": "scroll",
			"width": "100%",
			"bottom": "0px",
			"z-index": 2,
		},
		".ftledit\\.editor\\.scrollbar.x > div": {
			"overflow-x": "hidden",
			"height": "1px",
		},
		".ftledit\\.editor\\.page": {
			"flex-grow": 2,
			"min-height": "100%",
			"height": "100%",
			"display": "flex",
			"flex-direction": "row",
			"overflow": "hidden",
		},
		".ftledit\\.editor\\.frame": {
			"position": "relative",
			"min-width": "100%",
			"min-height": "100%",
			"height": "100%",
			"width": "100%",
			"display": "flex",
			"flex-direction": "row",
			"overflow": "hidden",
		},
		".ftledit\\.editor\\.content": {
			"height": "auto",
			"width": "auto",
			"min-height": "100%",
			"min-width": "100%",
			"display": "flex",
			"flex-direction": "row",
			
		},
		".ftledit\\.editor\\.background": {
			"position": "absolute",
			"left": "0px",
			"top": "0px",
			"min-width": "100%",
			"min-height": "100%",
			"height": "auto",
			"width": "auto",
			"z-index": "-1",
		},
		".ftledit\\.editor\\.linehighlight": {
			"width": "100%",
			"position": "absolute",
			"top": "-100%",
			"left": "0px",
		},
		".ftledit\\.editor\\.cursor": {
			"width": "2px",
			"position": "absolute",
			"top": "-100vh",
		},
		".ftledit\\.editor\\.linenumbers": {
			"width": "auto",
			"min-width": "18px",
			"height": "auto",
			"pointer-events": "none",
			"position": "relative",
			"padding-left": "16px",
			"padding-right": "16px",
			"flex-shrink": 0,
		},
		".ftledit\\.editor\\.linenumbers > div": {
			"position": "relative",
			"right": "0px",
		},
		".ftledit\\.editor\\.linenumbers > div > span": {
			"direction": "rtl",
			"min-width": "100%",
			"float": "right",
			"pointer-events": "none",
			"user-select": "none",
			"-moz-user-select": "none",
			"-webkit-user-select": "none",
		},
		".ftledit\\.editor\\.lines > div > span, .ftledit\\.editor\\.lengthcalculator": {
			"white-space": "pre",
			"pointer-events": "none",
			"word-break": "break-all",
			"-webkit-touch-callout": "none",
			"-webkit-user-select": "none",
			"-khtml-user-select": "none",
			"-moz-user-select": "none",
			"-ms-user-select": "none",
			"user-select": "none",
		},
		".ftledit\\.editor\\.scrollflex": {
			"flex-grow": 2,
			"min-height": "100%",
			
			"max-height": "100%",
			"overflow": "hidden",
			"position": "relative",
			"display": "flex",
			"flex-direction": "column",
		},
		".ftledit\\.editor\\.scroller": {
			"flex-grow": 2,
			"overflow": "hidden",
		},
		".ftledit\\.editor\\.lineholder": {
			"height": "auto",
			"width": "auto",
			"cursor": "text",
			"position": "relative",
			"left": "0px",
			"width": "100%",
			"height": "100%",
		},
		".ftledit\\.editor\\.lines": {
			"top": "0px",
			"cursor": "text",
			"position": "absolute",
			"left": "0px",
			"min-width": "100%",
			"min-height": "100%",
		},
		".ftledit\\.editor\\.lines > div": {
			"max-width": "100%",
			"margin-left": "2px",
			"margin-right": "2px",
			"position": "relative",
		},
		".ftledit\\.editor\\.lengthcalculator": {
			"z-index": "-1000",
			"position": "absolute",
			"top": "-20000vh",
			"left": "-20000vh",
			"width": "1px",
			"height": "1px",
			"opacity": 1,
		},
		".ftledit\\.editor\\.textinput": {
			"opacity": 0,
			"font-size": "1px",
			"height": "1px",
			"width": "1px",
			"max-width": "1px",
			"max-height": "1px",
			"position": "fixed",
			"z-index": -1000,
			"left": 0,
			"top": 0,
		},
	});
});