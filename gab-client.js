/* eslint-disable quote-props */
/* eslint-disable quotes */
/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
const WebSocket = require('ws');
const blessed = require('blessed');
let styleEx = require('./styleEx.json'); // external style expression JSON file

// create JSON objects
const craftMessage = (from, to, kind, data) => JSON.stringify({
  from, to, kind, data,
});

// blessed interface
const screen = blessed.screen({
  smartCSR: true,
});

const enteruserlabel = blessed.text({ // enter username label
  top: '50%-5',
  left: 'center',
  content: 'Enter your name: ',
});

const enteruser = blessed.textbox({ // enter username prompt
  top: 'center',
  left: 'center',
  height: 3,
  width: '50%',
  keys: true,
  mouse: true,
  inputOnFocus: true,
  style: {
    fg: 'white',
    bg: '#00d7ff',
  },
  border: {
    type: 'line',
  },
});

const body = blessed.box({ // chat box display that is scrollable
  // fg: 'white',
  bg: 'default',
  border: {
    type: 'line',
    fg: '#ffffff',
  },
  width: '79%',
  height: '90%',
  top: 2,
  left: 1,
  // focused: true,
  keys: true,
  mouse: true,
  vi: true,
  tags: true,
  dockBorders: true,
  alwaysScroll: true,
  scrollable: true,
  scrollbar: {
    ch: ' ',
    bg: 'yellow',
  },
});
const inputBar = blessed.textbox({ // input for chat and all other options
  bottom: 0,
  left: 7,
  height: 3,
  width: '75%',
  dockBorders: true,
  keys: true,
  mouse: true,
  inputOnFocus: true,
  style: {
    fg: 'white',
    bg: 'magenta',
  },
  border: {
    type: 'line',
  },
});
const onlineBox = blessed.box({ // online users box display
  // fg: 'white',
  bg: 'default',
  border: {
    type: 'line',
    fg: '#ffffff',
  },
  width: '20%',
  height: '95%',
  top: 2,
  right: 1,
  // focused: true,
  tags: true,
  dockBorders: true,
});

screen.append(enteruserlabel);
screen.append(enteruser);
enteruser.focus();
screen.render();

// Close the example on Q or Ctrl+C
screen.key(['q', 'C-c'], (ch, key) => (process.exit(0)));

// handle username data
enteruser.on('submit', (text1) => {
  const uname = text1;
  // username taken and placed into server url to connect to server
  const ws = new WebSocket(`ws://localhost:4930/?username=${uname}`);
  enteruser.clearValue();

  // all labels for chat interface
  const inputlabel = blessed.text({
    parent: screen,
    content: 'INPUT:',
    bottom: 1,
    left: 1,
  });
  const userslabel = blessed.text({
    parent: screen,
    content: 'ONLINE USERS:',
    left: '80%+1',
    top: 1,
  });
  const chatlabel = blessed.text({
    parent: screen,
    content: '~~~~~~~~~~~~~~~~~~~~ GABSERVER CHATROOM ~~~~~~~~~~~~~~~~~~~~~~~~~~',
    top: 1,
    left: 2,
  });
  // Add chat components to blessed screen
  screen.append(onlineBox);
  screen.append(body);
  screen.append(inputBar);

  // all variables
  let firstConnect; // to allow users to load current online userlist on first login
  let start = 1; // another step with same purpose as above
  let stuff; // for all JSON parsing to send to server
  let buffer; // for string input
  let splitup; // splitting buffer by spaces
  let users = []; // user map with names from userArray and their assigned colors from userColor
  let count = 0; // for accessing from userColor
  const userColor = ['{#00d7ff-bg}', '{red-bg}', '{yellow-bg}', '{white-bg}', '{magenta-bg}', '{blue-bg}', '{green-bg}']; // array of colors to assign users
  let userName;
  let serverInfo; // informs if user left or joined server (for current user and assigned color purposes)
  let userArray; // load current users

  // open connection
  ws.on('open', () => {
    log('-- Connected--');
  });
  inputBar.on('action', () => {
    // request user list upon first connection only, for online users
    if (start) {
      firstConnect = true;
      stuff = craftMessage(uname, '', 'userlist', '');
      ws.send(stuff);
      start = 0;
    }
  });
  // Handle submitting/sending data from inputBar
  inputBar.on('submit', (text) => {
    // command options other than default chat
    if (text.startsWith(':')) {
      buffer = text;
      if (/\s/.test(buffer)) {
        splitup = buffer.split(' ');
      }
      if (/^:direct/.test(buffer)) {
        let index = buffer.indexOf(' ', buffer.indexOf(' ') + 1);
        const command_user = buffer.substr(0, index); // only picks up :direct 'user'
        const directMessage = buffer.substr(index + 1); // only picks up 'message'

        // log(`{magenta-fg}YOU to ${splitup[1]}: ${directMessage}{/}`);
        stuff = craftMessage(uname, splitup[1], 'direct', directMessage);
        ws.send(stuff);
      } else if (/^:whoami/.test(buffer)) {
        stuff = craftMessage(uname, '', 'whoami', '');
        ws.send(stuff);
      } else if (/^:userlist/.test(buffer)) {
        stuff = craftMessage(uname, '', 'userlist', '');
        ws.send(stuff);
      } else if (/^:style/.test(buffer)) {
        const index3 = buffer.indexOf(' ', buffer.indexOf(' ') + 1);
        const commandaddDelete = buffer.substr(0, index3); // only picks up ':style 'add or delete''
        const expressionStyle = buffer.substr(index3 + 1); // only picks up 'expression style'
        const splitup2 = expressionStyle.split(' ');
        if (/add/.test(commandaddDelete)) {
          styleEx.push({ "expression": splitup2[0], "style": splitup2[1] });
          log('Style added');
        } else if (/delete/.test(commandaddDelete)) {
          styleEx = styleEx.filter(x => x.expression !== splitup[0]);
          log('Style deleted');
        } else {
          log('Style command not available');
        }
      } else if (/^:help/.test(buffer)) { // menu options
        log('{blue-fg}--------------OPTIONS--------------\n'
            + '1)      :direct \'username\' \'message\' \n{/}'
            + '        * whisper to user in chat\n'
            + '{blue-fg}2)      :whoami \n{/}'
            + '        * find your username\n'
            + '{blue-fg}3)      :userlist\n{/}'
            + '        * find all users\n'
            + '{blue-fg}4)      :style \'add OR delete\' \'expression\' \'style\'\n{/}'
            + '        * create stylized expressions\n'
            + '        * if using colors, style must be in color-fg or color-bg format\n'
            + '        * other wise use style format for everything else'
            + '{yellow-fg}------Other Options-------\n{/}'
            + '{yellow-fg}* \'escape\' to exit input and scroll chat box\n{/}'
            + '       \'UP\' and \'DOWN\' arrow keys to scroll up and down\n'
            + '        \'g\' to scroll top and \'G\' to scroll bottom\n'
            + '{yellow-fg}* \'Ctrl-G\' to focus on input\n\n'
            + '* \'Q\' or \'Ctrl-C\' to exit program\n\n{/}');
      } else {
        log('The command is not a menu option');
      }
    } else { // defaults to chat if none of commands above are typed
      // styled expression in regular chat
      for (let i = 0; i < styleEx.length; i++) {
        if (text.match(styleEx[i].expression)) {
          text = text.replace(RegExp(styleEx[i].expression, 'g'), `{${styleEx[i].style}}${text.match(styleEx[i].expression)}{/}`);
        }
      }
      stuff = craftMessage(uname, 'all', 'chat', text);
      ws.send(stuff, () => {
        inputBar.clearValue();
      });
    }
  });
  // checks entire database constantly and checks messages from other servers
  // and outputs message to everybody or particular user
  ws.on('message', (msg) => {
    const parsed = JSON.parse(msg);
    // if there are errors
    if (parsed.kind === 'error') {
      log(`{red-fg}${parsed.data}{/}`);
    }
    // when user joins or leaves server
    if (parsed.kind === 'connection') {
      userName = parsed.data.substr(0, parsed.data.indexOf(' '));
      serverInfo = (parsed.data.substr(parsed.data.indexOf(' ') + 1));
      if (serverInfo.match('joined') && start === 0) {
        // if user joins add to users array/map
        users.push({ name: userName, color: userColor[count % userColor.length] });
        count++;
        onlineBox.pushLine(userName); // add user to online users display
        userArray.push(userName);
      } else if (serverInfo.match('left')) {
        // else remove from users array/map
        let index1 = userArray.indexOf(userName);
        users = users.filter(x => x.name !== parsed.data.substr(0, parsed.data.indexOf(' ')));
        onlineBox.deleteLine(index1); // delete user from online users display
        userArray = userArray.filter(x => x !== userName);
      }
      log(`${parsed.from}: {yellow-fg}${parsed.data}{/}`);
    } else if (parsed.kind === 'chat') { // chat
      let index2 = users.findIndex(x => x.name === parsed.from);
      log(`${users[index2].color}{black-fg}${parsed.from}{/}: ${parsed.data}`);
    } else if (parsed.kind === 'direct') { // direct message
      log(`{magenta-fg}${parsed.from} to YOU: ${parsed.data}{/}`);
    } else if (parsed.kind === 'userlist') { // userlist
      // show and load online users upon first connection
      if (firstConnect === true) {
        userArray = parsed.data.split(',');
        for (let i = 0; i < userArray.length; i++) {
          onlineBox.pushLine(userArray[i]);
          users.push({ name: userArray[i], color: userColor[count] });
          count++;
        }
        // no longer first connection
        firstConnect = false;
      } else { // allow user to see userlist as normal
        log(`Userlist: {green-fg}${parsed.data}{/}`);
      }
    } else if (parsed.kind === 'whoami') { // whoami
      log(parsed.data);
    }
  });
  ws.on('close', () => {
    log('--Disconnecting in 3 seconds...--');
    setInterval(() => { process.exit(); }, 3000); // allow user to see error message before program terminates
  });
  ws.on('error', (err) => {
    log(`Error: ${err.stack}`);
  });
  // Add text to body (replacement for console.log)
  const log = (text) => {
    body.pushLine(text);
    body.setScrollPerc(100); // keeps scroll bar at bottom, when box is filled up
    inputBar.clearValue();
    inputBar.focus();
    screen.render();
  };

  // Listen for Ctrl + G key and focus input then
  screen.key('C-g', (ch, key) => {
    inputBar.focus();
  });
  // // Listen for enter key and focus input then
  screen.key('escape', (ch, key) => {
    body.focus();
  });

  screen.render();
});
