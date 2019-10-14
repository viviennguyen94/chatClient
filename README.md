## Introduction
This is a chat app written in JavaScript command line.

[![Watch the video](chatClient1.gif)](https://youtu.be/5dCL3NVSzEs)

Click on gif to see entire video demo. 

[![Watch the video](chatClient.gif)](https://youtu.be/5dCL3NVSzEs)

## Installation

`npm install`
`node index`

in another tab

`node gab-client.js`

## Login

1) Type appropriate username and enter

## Chat GUI (defaults to regular chat), otherwise:

1)      direct message to user in chat
        - :direct 'username' 'message'
2)      find your username 
        - :whoami
3)      find all users
        - :userlist
4)      create stylized expressions
        - :style 'add OR delete' 'expression' 'style'
            - if using colors, style must be in color-fg (for font color) or color-bg (background color) format
            - otherwise just type style ----> ex: italic, bold, etc.

## Other Options
- 'escape' to exit input and scroll chat box
       'UP' and \'DOWN\' arrow keys to scroll up and down
        'g' to scroll straight to top and 'G' to scroll straight tobottom
- 'Ctrl-G' to focus on input
- 'Q' or 'Ctrl-c' to exit program

## For best layout, terminal should be in full screen
tested in windows command prompt and cmder

## Resources
- Blessed.js
- ws (websocket)
