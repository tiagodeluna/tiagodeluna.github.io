// Array with the different images
var IMAGES = [];

// Enum defining the possible game status
var GameStatus = {
  NOT_STARTED: 1,
  SYMBOL_SELECTION: 2,
  SYMBOL_SELECTED: 3,
  SWITCH_PHASE_SPINNING: 4,
  SWITCH_PHASE_STOPPING: 5,
  SWITCH_PHASE_STOPPED: 6,
  CALCULATING_RESULT: 7,
  RESULT_WON: 8,
  RESULT_LOST: 9
};

var IMAGE_HEIGHT = 155;
var IMAGE_WIDTH = 235;
var IMAGE_TOP_MARGIN = 12;
var IMAGE_BOTTOM_MARGIN = 12;
var REEL_LEFT_MARGIN = 310;
var REEL_TOP_MARGIN = 12;
var RUNTIME = 3000; // how long all slots spin before starting countdown
var SPINTIME = 1000; // how long the slot spins at minimum
var HIGH_SPEED = 15;//15 // how many pixels per second slots roll
var LOW_SPEED = 5;
var DRAW_OFFSET = 45 // how much draw offset in slot display from top
var SLOT_HEIGHT = IMAGE_HEIGHT + IMAGE_TOP_MARGIN + IMAGE_BOTTOM_MARGIN; // how many pixels one slot image takes

var JSON_PATH = 'https://tiagodeluna.github.io/games/src/images.json';
var SPIN_BTN_ON = 'img/BTN_Spin.png';
var SPIN_BTN_OFF = 'img/BTN_Spin_d.png';


/*---------------------------------------------------*/
/* Game classes                                      */
/*---------------------------------------------------*/

var Game = {
    // Set up some initial values
    WIDTH: 960,//480
    HEIGHT:  536,//268
    scale:  1,
    status: GameStatus.NOT_STARTED,
    // the position of the canvas
    // in relation to the screen
    offset: {top: 0, left: 0},
    // These variables will be setted
    //  in the init function
    RATIO:  null,
    currentWidth:  null,
    currentHeight:  null,
    canvas: null,
    ctx:  null,
    slotOffset: null,
    resetOffset: null,
    // The elements in the slot machine
    elements: [],
    selectedSymbol: null,
    startBtn: null,

    init: function(callback) {

        // the proportion of width to height
        Game.RATIO = Game.WIDTH / Game.HEIGHT;
        // these will change when the screen is resized
        Game.currentWidth = Game.WIDTH;
        Game.currentHeight = Game.HEIGHT;
        // this is our canvas element
        Game.canvas = document.createElement("canvas");
        Game.canvas.style.zIndex = 2;

        // setting this is important
        // otherwise the browser will
        // default to 320 x 200
        Game.canvas.width = Game.WIDTH;
        Game.canvas.height = Game.HEIGHT;
        // the canvas context enables us to 
        // interact with the canvas api
        Game.ctx = Game.canvas.getContext('2d');

        // we need to sniff out Android and iOS
        // so that we can hide the address bar in
        // our resize function
//TODO: TESTAR O IMPACTO DESSE CODIGO (OU DA AUSENCIA DELE) NO CELULAR
        Game.ua = navigator.userAgent.toLowerCase();
        Game.android = Game.ua.indexOf('android') > -1 ? true : false;
        Game.ios = ( Game.ua.indexOf('iphone') > -1 || Game.ua.indexOf('ipad') > -1  ) ? 
            true : false;

        // Listen for clicks
        window.addEventListener('click', function(e) {
            e.preventDefault();
            Game.Input.set(e);
        }, false);

        // Listen for touches
        window.addEventListener('touchstart', function(e) {
            e.preventDefault();
            Game.Input.set(e.touches[0]);
        }, false);
        window.addEventListener('touchmove', function(e) {
            // We're just preventing default behaviour
            //  so the screen doesn't scroll or zoom
            e.preventDefault();
        }, false);
        window.addEventListener('touchend', function(e) {
            // as above
            e.preventDefault();
        }, false);

        // Load assets and predraw the reel
        preloadImages(JSON_PATH, function() {
            Game.elements = IMAGES.slice(0);
            shuffleArray(Game.elements);
            Game.resetOffset = (IMAGES.length + 3) * SLOT_HEIGHT;// + REEL_TOP_MARGIN;

            // Fill select element with symbols
            prepareSymbolsForSelection();

            if (callback) callback();
        });

    },

    // this is where all entities will be moved
    // and checked for collisions
    update: function() {
        var checkCollision = false;

        if (this.Input.tapped && this.status == GameStatus.NOT_STARTED) {
            this.Input.tapped = false;
            checkCollision = true;
        }

        // Checks collision
        if (checkCollision && Game.collides(this.Button, {x: this.Input.x, y: this.Input.y, r: 7}) ) {
            console.log('Colision!');
            this.status = GameStatus.SYMBOL_SELECTION;
            checkCollision = false;
        }

        var now = new Date();
        var that = this;

        // Check slot status and if spun long enough stop it on result
        function _check_slot(offset, result) {

            var resultPos1 = offset + (result+1) * SLOT_HEIGHT;
            var resultPos2 = offset + (that.elements.length*SLOT_HEIGHT) + (result+1)*SLOT_HEIGHT;
            var minimum = 2 * SLOT_HEIGHT + REEL_TOP_MARGIN - LOW_SPEED;
            var maximum = 2 * SLOT_HEIGHT + REEL_TOP_MARGIN + LOW_SPEED;
            
            console.log('Result pos = '+resultPos1+' and '+resultPos2);

            if ((resultPos1 >= minimum && resultPos1 <= maximum)
                || (resultPos2 >= minimum && resultPos2 <= maximum)) {
                return true;
            }

/*
            if (now - that.lastUpdate > SPINTIME) {
                var c = parseInt(Math.abs(offset / SLOT_HEIGHT)) % that.elements.length;
                //console.log('Math.abs( '+offset+' / '+SLOT_HEIGHT+') % '+that.elements.length+' = '+c);
                if ( c == result ) {
                    if ( result == 0 ) {
                        if ( Math.abs((offset-SLOT_HEIGHT) + (that.elements.length * SLOT_HEIGHT)) < (that.speed * 1.5)) {
                            return true; // done
                        }
                    } else if ( Math.abs(offset + (result * SLOT_HEIGHT)) < (that.speed * 1.5)) {
                            console.log('caso 2: offset + result * SLOT_HEIGHT < speed * 1.5');
                            console.log(offset+' + ('+result+' * '+SLOT_HEIGHT+')) = '+Math.abs(offset + (result * SLOT_HEIGHT)));
                            console.log('('+that.speed+' * 1.5) = '+that.speed * 1.5);
                        return true; // done
                    }
                }
            }
            */
            return false;
        }

        // Control the spinnig slots steps
        switch (this.status) {
            case GameStatus.SWITCH_PHASE_SPINNING:
//                console.log('1 - Spinning!')
                if (now - this.lastUpdate > RUNTIME) {
                    this.status = GameStatus.SWITCH_PHASE_STOPPING;
                    this.lastUpdate = now;
                    this.speed = LOW_SPEED;
                }
                break;
            case GameStatus.SWITCH_PHASE_STOPPING:
                this.stopped = _check_slot(this.slotOffset, this.result);
//                console.log('2 - Stopping.');
                if (this.stopped) {
                    this.speed = 0;
                    this.status = GameStatus.SWITCH_PHASE_STOPPED;
                    this.lastUpdate = now;
                }
                break;
            case GameStatus.SWITCH_PHASE_STOPPED:
//                console.log('3 - Stopped...');
                this.status = GameStatus.CALCULATING_RESULT;
//TODO: Play sound (?)
                this.lastUpdate = now;
                break;
            case GameStatus.CALCULATING_RESULT:
                console.log('Calculating result...');

                // Wait for a while before showing the result
                if (now - this.lastUpdate > 1000) {
                    console.log('Choose: '+ that.selectedSymbol.name+'; Result: '+that.elements[that.result].name+'('+this.result+')')
                    if (that.elements[that.result].id == that.selectedSymbol.id) {
                        Game.status = GameStatus.RESULT_WON;
                    }
                    else {
                        Game.status = GameStatus.RESULT_LOST;
                    }
                    console.log('Result is............');
                }
                break;
            case GameStatus.RESULT_WON: // End with victory
                console.log('WON!!!');
                break;
            case GameStatus.RESULT_LOST: // End with loss
                console.log('LOST...');
                break;
            default:
        }
        Game.lastupdate = now;
    },

    // This is where we draw all the entities
    render: function() {

        if (Game.status === GameStatus.SYMBOL_SELECTION) {
            var selectionBox = document.getElementById('selection-box');
            selectionBox.style.display = 'block';
        }

        // draw the spinning slots based on current state
        // Enter here if stopped = TRUE or speed > 0
//        if (this.stopped || this.speed) { // || force) {
        if (this.speed) {
            if (this.stopped) {
                this.speed = 0;
                this.slotOffset = -(this.result * SLOT_HEIGHT);
                //this.slotOffset = -(c * SLOT_HEIGHT + REEL_TOP_MARGIN);

                //if (this.slotOffset + DRAW_OFFSET > 0) {
                if (this.slotOffset > 0) {
                    // reset back to beginning
                    this.slotOffset = -this.resetOffset + SLOT_HEIGHT * 3;
                }

            } else {
                this.slotOffset += this.speed;
                //if (this.slotOffset + DRAW_OFFSET > 0) {
                if (this.slotOffset > 0) {
                    // reset back to beginning
                    //this.slotOffset = -this.resetOffset + SLOT_HEIGHT * 3 - DRAW_OFFSET;
                    this.slotOffset = -this.resetOffset + SLOT_HEIGHT * 3;
                }
            }
        }
        

        if (Game.status != GameStatus.NOT_STARTED) {
            Game.Draw.clear();

            // Draw elements on canvas
            Game.Draw.elements(Game.elements);
        }

        // Draw the background
        //Game.Draw.image('img/BG.png',0,0,Game.WIDTH,Game.HEIGHT);
    },

    // the actual loop
    // requests animation frame,
    // then proceeds to update
    // and render
    loop: function() {

        requestAnimFrame(Game.loop);

        Game.update();
        Game.render();
    },

    resize: function() {

        Game.currentHeight = window.innerHeight;
        // resize the width in proportion
        // to the new height
        Game.currentWidth = Game.currentHeight * Game.RATIO;

        // this will create some extra space on the
        // page, enabling us to scroll past
        // the address bar, thus hiding it.
//TODO: TESTAR O IMPACTO DESSE CODIGO (OU DA AUSENCIA DELE) NO CELULAR
        if (Game.android || Game.ios) {
            document.body.style.height = (window.innerHeight + 50) + 'px';
        }

        // set the new canvas style width and height
        // note: our canvas is still 320 x 480, but
        // we're essentially scaling it with CSS
        Game.canvas.style.width = Game.currentWidth + 'px';
        Game.canvas.style.height = Game.currentHeight + 'px';

        // The amount by which the css resized canvas
        // is different to the actual (480x320) size.
        Game.scale = Game.currentWidth / Game.WIDTH;
        // Position of canvas in relation to
        // the screen
        Game.offset.top = Game.canvas.offsetTop;
        Game.offset.left = Game.canvas.offsetLeft;

        // we use a timeout here because some mobile
        // browsers don't fire if there is not
        // a short delay
        window.setTimeout(function() {
                window.scrollTo(0,1);
        }, 1);
    },

    restart: function() {
        Game.lastUpdate = new Date();
        Game.speed = HIGH_SPEED;

        console.log('RESTART!');

        // get random result
        Game.result = parseInt(Math.random() * Game.elements.length)
        console.log('Resuls is '+ Game.elements[Game.result].name);

        // randomize reel locations
        //this.slotOffset = -parseInt(Math.random( Game.elements.length )) * SLOT_HEIGHT;
        this.slotOffset = 0;
        Game.stopped = false;

        //$('#results').hide();

        this.status = GameStatus.SWITCH_PHASE_SPINNING;
    }

};

// this function checks if two circles overlap
Game.collides = function(a, b) {

    if (b.x >= a.x && b.x <= (a.x+a.WIDTH)
        && b.y >= a.y && b.y <= (a.y+a.HEIGHT)) {
        return true;
    } else {
        return false;
    }
};

// Represents an user input (by touch or click)
Game.Input = {
    x: 0,
    y: 0,
    tapped :false,

    set: function(data) {
        //Get the input position considering the offset and scale
        this.x = (data.pageX - Game.offset.left) / Game.scale;
        this.y = (data.pageY - Game.offset.top) / Game.scale;

        this.tapped = true; 
    }
};


Game.Button = {
    WIDTH: 300,
    HEIGHT: 96,
    x: 0,
    y: 0,
    src: 'img/BTN_start.png',
    img: null,

    create: function() {
        this.x = Game.WIDTH/2 - this.WIDTH/2;
        this.y = Game.HEIGHT/2 - this.HEIGHT/2;

        //Draw Start Button
        Game.Draw.image(this.src, this.x, this.y, this.WIDTH, this.HEIGHT);
    },
};

// Abstracts various canvas operations into
// standalone functions
Game.Draw = {

    clear: function() {
        Game.ctx.clearRect(0, 0, Game.WIDTH, Game.HEIGHT);
    },

    rect: function(x, y, w, h, color) {
        Game.ctx.fillStyle = color;
        Game.ctx.fillRect(x, y, w, h);
    },

    circle: function(x, y, r, col) {
        Game.ctx.fillStyle = col;
        Game.ctx.beginPath();
        Game.ctx.arc(x + 5, y + 5, r, 0,  Math.PI * 2, true);
        Game.ctx.closePath();
        Game.ctx.fill();
    },

    text: function(string, x, y, size, color) {
        Game.ctx.font = 'bold '+size+'px Chewy';
        Game.ctx.fillStyle = color;
        Game.ctx.fillText(string, x, y);
    },

    title: function(string, y, size, color) {
        Game.ctx.font = size+'px Chewy';
        Game.ctx.fillStyle = color;

        // Get the width of the text to draw
        var textWidth = Game.ctx.measureText(string).width;

        Game.ctx.fillText(string, (Game.WIDTH/2) - (textWidth/2), y);
    },

    image: function(path, x, y, w, h) {
        Game.Button.img = new Image();
        Game.Button.img.src = path;

        Game.Button.img.onload = function() {
            Game.ctx.save();
            Game.ctx.shadowColor = "rgba(0,0,0,0.5)";
            Game.ctx.shadowOffsetX = 5;
            Game.ctx.shadowOffsetY = 5;
            Game.ctx.shadowBlur = 5;
            Game.ctx.drawImage(Game.Button.img, x, y, w, h);
            Game.ctx.restore();
        };
    },

    elements: function(items) {
        Game.ctx.save();
        Game.ctx.shadowColor = "rgba(0,0,0,0.5)";
        Game.ctx.shadowOffsetX = 5;
        Game.ctx.shadowOffsetY = 5;
        Game.ctx.shadowBlur = 5;

        for (var i = 0 ; i < items.length ; i++) {
            var asset = items[i];
            Game.ctx.drawImage(asset.img, REEL_LEFT_MARGIN, i * SLOT_HEIGHT + REEL_TOP_MARGIN + Game.slotOffset, IMAGE_WIDTH, IMAGE_HEIGHT);
            Game.ctx.drawImage(asset.img, REEL_LEFT_MARGIN, (i + items.length) * SLOT_HEIGHT + REEL_TOP_MARGIN + Game.slotOffset, IMAGE_WIDTH, IMAGE_HEIGHT);
        }

        Game.ctx.restore();
    }

};


/*---------------------------------------------------*/
/* Utilitary functions                               */
/*---------------------------------------------------*/

function shuffleArray(array) {

    for (i = array.length - 1; i > 0; i--) {
        var j = parseInt(Math.random() * i)
        var tmp = array[i];
        array[i] = array[j]
        array[j] = tmp;
    }
}

// Images must be preloaded before they are used to draw into canvas
function preloadImages(path, callback) {

    function _preload(asset) {
        asset.img = new Image();
        asset.img.src = asset.path+asset.file;

        asset.img.addEventListener("load", function() {
            _check();
        }, false);

        asset.img.addEventListener("error", function(err) {
            _check(err, asset.id);
        }, false);
    }

    var loadc = 0;
    function _check(err, id) {
        if (err) {
            alert('Failed to load file with id ' + id);
        }
        loadc++;
        if (IMAGES.length == loadc) {
            return callback()
        }
    }

    // Request the JSON file and execute a callback with the parsed result
    //  once it is available
    fetchJSONFile(path, function(data){
        // Read file getting the array of images {id, filename}
        IMAGES = data.symbols.image.slice(0);

        IMAGES.forEach(function(asset) {
            // Prepare each image to load
            asset.path = data.symbols.path;
            _preload(asset);
        });
    });
}

function fetchJSONFile(path, callback) {
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState === 4) { //4 = DONE
            if (httpRequest.status === 200) { //200 = OK
                var data = JSON.parse(httpRequest.responseText);
                if (callback) callback(data);
            }
        }
    };
    httpRequest.open('GET', path);
    httpRequest.send();
}

function prepareSymbolsForSelection() {
    var select = document.getElementById('symbol-select');

    IMAGES.forEach(function(asset) {
       //Fill <select> with the symbols
        var el = document.createElement('option');
        el.textContent = asset.name;
        el.value = asset.id;
        select.appendChild(el);
    });

    select.addEventListener('change', selectSymbol);
}

function selectSymbol() {
    var value = this.value;

    function _symbolById(symbol) {
        return symbol.id === value;
    }

    // Store selected symbol
    Game.selectedSymbol = IMAGES.find(_symbolById);

    var spinButton = document.getElementById('spin-button');

    if (Game.selectedSymbol != null) {
        // Enable Spin button
        spinButton.src = SPIN_BTN_ON;
        Game.status = GameStatus.SYMBOL_SELECTED;
    } else {
        spinButton.src = SPIN_BTN_OFF;
        Game.status = GameStatus.SYMBOL_SELECTION;
    }
}

function startSpinning() {
//TODO: Add other valid status
    if (Game.status == GameStatus.SYMBOL_SELECTED) {
        var selectionBox = document.getElementById('selection-box');
        selectionBox.style.display = 'none';

        Game.restart();
    }
}

// Hide loading screen and show Canvas
function displayCanvas() {
/*
    var loading = document.getElementById('game-container');
//    loading.remove();
    loading.style.display = 'none';
    // Add our canvas to body
    var body = document.getElementsByTagName("body")[0];
    body.appendChild(Game.canvas);
*/
    var loading = document.getElementById('loading');
    loading.style.display = 'none';
//    var menu = document.getElementById('menu');
//    menu.style.display = 'none';
    // Add our canvas to body
    var gameContainer = document.getElementById('game-container');
    gameContainer.appendChild(Game.canvas);
}

// Hide Loading message and show Start button
function prepareMenu() {
    // Display the scores in the main update function
    Game.Draw.title('Wild Fruits', 80, 60, '#fff');
//TODO: Draw "by Tiago Luna" with link to my portfolio

    // Create start button
    Game.Button.create();

    // Show canvas
    displayCanvas();
    // we're ready to resize
    Game.resize();

    // It will then repeat continuously
    Game.loop();
}


/*---------------------------------------------------*/
/* Window events                                     */
/*---------------------------------------------------*/

// Shim layer with setTimeout callback
// From: http://paulirish.com/2011/requestanimationframe-for-smart-animating
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

// Load game elements then show the start screen
window.addEventListener('load', function() {
    Game.init(prepareMenu);
}, false);

window.addEventListener('resize', Game.resize, false);