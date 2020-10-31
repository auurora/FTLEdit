# FTLEdit
A Work in Progress Single File Fast JS Code Editor

Demo: https://auurora.github.io/FTLEdit/

# Features

Super fast and efficient editing

Able to edit large documents (Tested with 2,000,000+ lines)

Low RAM consumption

Lightweight and only requires 1 script tag to be included

Fully customizable with CSS 

Optimized rendering

Easy to implement

Able to display non-monospace fonts with correct cursor positioning, which editors like Ace struggle with

# Usage
Insert the script into the head tag

`<script src="https://raw.githubusercontent.com/auurora/FTLEdit/main/ftledit.js"></script>`

In your script:

`var FTLEditor = new Editor(document.getElementById("div id"));`

## Getting text content

`FTLEditor.getText();` Returns the whole text content

*May change in future versions*
