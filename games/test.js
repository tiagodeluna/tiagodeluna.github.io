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
var SPIN_TIME = 3000; // how long all slots spin before starting countdown
var WAIT_TIME = 1000; // how long the slot spins at minimum
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
    WIDTH: 960,
    HEIGHT:  536,
    scale:  1,
    status: GameStatus.NOT_STARTED,
    stopped: true,
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
    elements: [], // The elements in the slot machine
    selectedSymbol: null,

    init: function(callback) {

        // The proportion of width to height
        Game.RATIO = Game.WIDTH / Game.HEIGHT;
        // These will change when the screen is resized
        Game.currentWidth = Game.WIDTH;
        Game.currentHeight = Game.HEIGHT;
        // this is our canvas element
        Game.canvas = document.createElement("canvas");
        Game.canvas.style.zIndex = 2;

        // setting this is important
        // otherwise the browser will
        // set the default values
        Game.canvas.width = Game.WIDTH;
        Game.canvas.height = Game.HEIGHT;

        Game.ctx = Game.canvas.getContext('2d');

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
        /*
        window.addEventListener('touchmove', function(e) {
            // We're just preventing default behaviour
            //  so the screen doesn't scroll or zoom
            e.preventDefault();
        }, false);
        window.addEventListener('touchend', function(e) {
            // as above
            e.preventDefault();
        }, false);
        */
        // Load assets and predraw the reel
        preloadImages(JSON_PATH, function() {
            Game.elements = IMAGES.slice(0);
            shuffleArray(Game.elements);
            Game.resetOffset = (IMAGES.length + 3) * SLOT_HEIGHT;// + REEL_TOP_MARGIN;

            // Fill select element with symbols
            prepareSymbolsForSelection();

            // Display the scores in the main update function
            Game.Draw.text('Wild Fruits', {'y': 100}, 80, '#fff', false, true);
            Game.Draw.text('by Tiago Luna', {'y': 135}, 26, '#000a3c', false, true);

            // Create start button
            Game.Button.create();

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

            return false;
        }

        // Control the spinnig slots steps
        switch (this.status) {
            case GameStatus.SWITCH_PHASE_SPINNING:
                if (now - this.lastUpdate > SPIN_TIME) {
                    this.status = GameStatus.SWITCH_PHASE_STOPPING;
                    this.lastUpdate = now;
                    this.speed = LOW_SPEED;
                }
                break;
            case GameStatus.SWITCH_PHASE_STOPPING:
                this.stopped = _check_slot(this.slotOffset, this.result);
                if (this.stopped) {
                    this.speed = 0;
                    this.status = GameStatus.SWITCH_PHASE_STOPPED;
                    this.lastUpdate = now;
                }
                break;
            case GameStatus.SWITCH_PHASE_STOPPED:
                this.status = GameStatus.CALCULATING_RESULT;
//TODO: Play sound
                this.lastUpdate = now;
                break;
            case GameStatus.CALCULATING_RESULT:
                // Wait for a while before showing the result
                if (now - this.lastUpdate > WAIT_TIME) {
                    
                    console.log('Choose: '+ that.selectedSymbol.name+'; Result: '+that.elements[that.result].name+'('+this.result+')');
                    
                    Game.status = that.elements[that.result].id == that.selectedSymbol.id ?
                        GameStatus.RESULT_WON :
                        GameStatus.RESULT_LOST;

                    this.lastUpdate = now;
                }
                break;
            case GameStatus.RESULT_WON: // End with victory
            case GameStatus.RESULT_LOST: // End with loss
                if (now - this.lastUpdate > WAIT_TIME*3) {
                    Game.status = GameStatus.SYMBOL_SELECTED;
                }
                break;
            default:
        }
        Game.lastupdate = now;
    },

    // This is where we draw all the entities
    render: function() {

        if (Game.status === GameStatus.SYMBOL_SELECTION
            || Game.status === GameStatus.SYMBOL_SELECTED) {
            var selectionBox = document.getElementById('selection-box');
            selectionBox.style.display = 'block';
        }

        // Adjust the spinning slots based on current state
        if (!this.stopped) {
            this.slotOffset += this.speed;
            if (this.slotOffset > 0) {
                // reset back to beginning
                this.slotOffset = -this.resetOffset + SLOT_HEIGHT * 3;
            }
        }
        
        if (Game.status != GameStatus.NOT_STARTED) {
            Game.Draw.clear();

            //"Static" UI text
            Game.Draw.text('Your symbol:', {'x': 812, 'y': 195}, 24, '#fff', false, false);

            if (Game.selectedSymbol != null) {
                Game.Draw.image(Game.selectedSymbol.path+Game.selectedSymbol.file, 812, 226, 117, 77);
            }

            // Draw elements on canvas
            Game.Draw.elements(Game.elements);
        }

        if (Game.status === GameStatus.CALCULATING_RESULT
            || Game.status === GameStatus.RESULT_LOST
            || Game.status === GameStatus.RESULT_WON) {
            Game.Draw.triangles();
        }
        //Show result messages
        if (Game.status === GameStatus.RESULT_LOST) {
            Game.Draw.text('You lost', {'y': 300}, 150, 'red', true, true);
            Game.Draw.text('Try again =]', {'y': 400}, 60, 'red', true, true);
        }
        else if (Game.status === GameStatus.RESULT_WON) {
            Game.Draw.text('You Won!', {'y': 300}, 150, 'green', true, true);
            Game.Draw.text('Yay! =D', {'y': 400}, 60, 'green', true, true);
        }
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
        // Resize the width in proportion to the new height
        Game.currentWidth = Game.currentHeight * Game.RATIO;

        // Set the new canvas style width and height
        // we're essentially scaling it with CSS
        Game.canvas.style.width = Game.currentWidth + 'px';
        Game.canvas.style.height = Game.currentHeight + 'px';
        Game.scale = Game.currentWidth / Game.WIDTH;
        // Position of canvas in relation to the screen
        Game.offset.top = Game.canvas.offsetTop;
        Game.offset.left = Game.canvas.offsetLeft;

        // We use a timeout here because some mobile browsers
        //  don't fire if there is not a short delay
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

        // Initial reel location
        this.slotOffset = 0;
        Game.stopped = false;

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
        Game.Draw.button(this.src, this.x, this.y, this.WIDTH, this.HEIGHT);
    },
};

// Abstracts various canvas operations into
// standalone functions
Game.Draw = {

    clear: function() {
        Game.ctx.clearRect(0, 0, Game.WIDTH, Game.HEIGHT);
    },

    circle: function(x, y, r, col) {
        Game.ctx.fillStyle = col;
        Game.ctx.beginPath();
        Game.ctx.arc(x + 5, y + 5, r, 0,  Math.PI * 2, true);
        Game.ctx.closePath();
        Game.ctx.fill();
    },

    text: function(string, axis, size, color, bordered, centered) {
        Game.ctx.font = size+'px Chewy';
        Game.ctx.fillStyle = color;

        Game.ctx.save();

        if (bordered) {
            Game.ctx.save();
            Game.ctx.shadowColor = '#fff';
            Game.ctx.shadowOffsetX = 0;
            Game.ctx.shadowOffsetY = 0;
            Game.ctx.shadowBlur = 40;
        }

        if (centered || !axis['x']) {
            // Get the width of the text to draw
            var textWidth = Game.ctx.measureText(string).width;
            axis.x = (Game.WIDTH/2) - (textWidth/2);
        }

        Game.ctx.fillText(string, axis.x, axis.y);
        Game.ctx.restore();
    },

    image: function(path, x, y, w, h) {
        var img = new Image();
        img.src = path;
        Game.ctx.drawImage(img, x, y, w, h);
    },

    button: function(path, x, y, w, h) {
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

    triangles: function() {
        Game.ctx.beginPath();
        Game.ctx.fillStyle = 'gold';

        // triangle 1
        Game.ctx.moveTo(230, 230);
        Game.ctx.lineTo(230, 330);
        Game.ctx.lineTo(290, 280);
        Game.ctx.fill();

        // triangle 2
        Game.ctx.moveTo(625, 230);
        Game.ctx.lineTo(625, 330);
        Game.ctx.lineTo(565, 280);
        Game.ctx.fill();
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