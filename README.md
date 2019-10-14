## Introduction
This is a chat app written in JavaScript.

[![Watch the video](https://media.giphy.com/media/duXt1hhpIlxBVCWucw/source.gif)]
Click on gif to see entire video demo. 

## Installation

`npm install`
`node index`

in another tab

`node gab-client.js`

## Login

1) Type appropriate username and enter

## Chat GUI (defaults to regular chat), otherwise:

1)      :direct 'username' 'message'
        * whisper to user in chat
2)      :whoami 
        * find your username
3)      :userlist
        * find all users
4)      :style 'add OR delete' 'expression' 'style'
        * create stylized expressions
        * if using colors, style must be in color-fg (for font color) or color-bg (background color) format
        * otherwise just type style ----> ex: italic, bold, etc.

## ------Other Options-------
* 'escape' to exit input and scroll chat box
       'UP' and \'DOWN\' arrow keys to scroll up and down
        'g' to scroll straight to top and 'G' to scroll straight tobottom
* 'Ctrl-G' to focus on input
* 'Q' or 'Ctrl-c' to exit program

## For best layout, terminal should be in full screen
tested in windows command prompt and cmder