// Array with the different images
var IMAGES = [];

// Enum defining the possible game status
var GameStatus = {
  NOT_STARTED: 1,
  SYMBOL_SELECTION: 2,
  WON: 3,
  LOST: 4
};

var IMAGE_HEIGHT = 155;
var IMAGE_WIDTH = 235;
var IMAGE_TOP_MARGIN = 12;
var IMAGE_BOTTOM_MARGIN = 12;
var REEL_LEFT_MARGIN = 70;
var REEL_TOP_MARGIN = 12;
var SLOT_SPEED = 15; // how many pixels per second slots roll
var SLOT_HEIGHT = IMAGE_HEIGHT + IMAGE_TOP_MARGIN + IMAGE_BOTTOM_MARGIN; // how many pixels one slot image takes
var JSON_PATH = 'https://tiagodeluna.github.io/games/src/images.json';


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
    resetOffset: null,
    // The elements in the slot machine
    elements: [],
    startBtn: null,
    selectedSymbol: null,

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
            Game.resetOffset =  (IMAGES.length + 3) * SLOT_HEIGHT + REEL_TOP_MARGIN;

            // Fill select element with symbols
            prepareSymbolsForSelection();

            if (callback) callback();
        });

    },

    // this is where all entities will be moved
    // and checked for collisions, etc.
    update: function() {
        var checkCollision = false;

        console.log('UPDATE!');

        if (Game.Input.tapped) {
            Game.Input.tapped = false;
            checkCollision = true;
        }

        // Checks collision
        if (checkCollision && Game.collides(Game.Button, {x: Game.Input.x, y: Game.Input.y, r: 7}) ) {
                console.log('Colision!');
                Game.status = GameStatus.SYMBOL_SELECTION;
                checkCollision = false;
            }
    },

    // this is where we draw all the entities
    render: function() {

        if (Game.status != GameStatus.NOT_STARTED) {
            Game.Draw.clear();

            // Draw elements on canvas
            Game.Draw.elements(Game.elements);
        }

        if (Game.status === GameStatus.SYMBOL_SELECTION) {
            var selectionBox = document.getElementById('selection-box');
            selectionBox.style.display = 'block';
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
        //Game.lastUpdate = new Date();
        Game.speed1 = SLOT_SPEED;

        // function locates id from items
        function _find(items, id) {
            for ( var i=0; i < items.length; i++ ) {
                if ( items[i].id == id ) return i;
            }
        }

        // uncomment to get always jackpot
        //this.result1 = _find( this.items1, 'gold-64' );
        //this.result2 = _find( this.items2, 'gold-64' );
        //this.result3 = _find( this.items3, 'gold-64' );

        // get random results
        Game.result1 = parseInt(Math.random() * Game.elements.length)

        // Clear stop locations
        Game.stopped1 = false;

//TODO: PAREI AQUI!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // randomize reel locations
        this.offset1 = -parseInt(Math.random( ITEM_COUNT )) * SLOT_HEIGHT;
        this.offset2 = -parseInt(Math.random( ITEM_COUNT )) * SLOT_HEIGHT;
        this.offset3 = -parseInt(Math.random( ITEM_COUNT )) * SLOT_HEIGHT;

        $('#results').hide();

        this.state = 1;
    }

};

// this function checks if two circles overlap
Game.collides = function(a, b) {

    /*
    var distance_squared = ( ((a.x - b.x) * (a.x - b.x)) + 
                            ((a.y - b.y) * (a.y - b.y)));


    var radii_squared = (a.r + b.r) * (a.r + b.r);

    if (distance_squared < radii_squared) {
        return true;
    } else {
        return false;
    }
    */

    console.log('Button: x='+Game.Button.x+', y='+Game.Button.y);
    console.log('Input: x='+Game.Input.x+', y='+Game.Input.y);

    if (b.x >= a.x && b.x <= (a.x+a.WIDTH)
        && b.y >= a.y && b.y <= (a.y+a.WIDTH)) {
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
    src: 'img/start-button.png',
    img: null,

    create: function() {
        console.log('Drawing button!')

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

        console.log('Drawing elements!');

        for (var i = 0 ; i < items.length ; i++) {
            var asset = items[i];
            Game.ctx.drawImage(asset.img, REEL_LEFT_MARGIN, i * SLOT_HEIGHT + REEL_TOP_MARGIN, IMAGE_WIDTH, IMAGE_HEIGHT);
            Game.ctx.drawImage(asset.img, REEL_LEFT_MARGIN, (i + items.length) * SLOT_HEIGHT + REEL_TOP_MARGIN, IMAGE_WIDTH, IMAGE_HEIGHT);
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

    var symbolElement = document.getElementById('symbol-img');

    if (Game.selectedSymbol != null) {
        // Show selected image
        symbolElement.src = Game.selectedSymbol.path+Game.selectedSymbol.file;
        symbolElement.style.display = 'block';
//TODO: Enable Spin button
    } else {
        // Hide image element if no symbol was chosen
        symbolElement.style.display = 'none';
    }
}

// Hide loading screen and show Canvas
function displayCanvas() {
    console.log('Showing canvas!');
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
