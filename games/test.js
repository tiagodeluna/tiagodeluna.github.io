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
var SLOT_HEIGHT = IMAGE_HEIGHT + IMAGE_TOP_MARGIN + IMAGE_BOTTOM_MARGIN; // how many pixels one slot image takes
//TODO: Get the JSON path from the HTML file
var JSON_PATH = 'https://tiagodeluna.github.io/games/src/images.json';
//var JSON_PATH = 'src/images.json';


/*---------------------------------------------------*/
/* Game classes                                      */
/*---------------------------------------------------*/

var POP = {
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

    init: function(callback) {

        // the proportion of width to height
        POP.RATIO = POP.WIDTH / POP.HEIGHT;
        // these will change when the screen is resized
        POP.currentWidth = POP.WIDTH;
        POP.currentHeight = POP.HEIGHT;
        // this is our canvas element
        POP.canvas = document.createElement("canvas");
        POP.canvas.style.zIndex = 2;

        // setting this is important
        // otherwise the browser will
        // default to 320 x 200
        POP.canvas.width = POP.WIDTH;
        POP.canvas.height = POP.HEIGHT;
        // the canvas context enables us to 
        // interact with the canvas api
        POP.ctx = POP.canvas.getContext('2d');

        // we need to sniff out Android and iOS
        // so that we can hide the address bar in
        // our resize function
//TODO: TESTAR O IMPACTO DESSE CODIGO (OU DA AUSENCIA DELE) NO CELULAR
        POP.ua = navigator.userAgent.toLowerCase();
        POP.android = POP.ua.indexOf('android') > -1 ? true : false;
        POP.ios = ( POP.ua.indexOf('iphone') > -1 || POP.ua.indexOf('ipad') > -1  ) ? 
            true : false;

        // listen for clicks
        window.addEventListener('click', function(e) {
            e.preventDefault();
            POP.Input.set(e);
        }, false);

        // listen for touches
        window.addEventListener('touchstart', function(e) {
            e.preventDefault();
            // the event object has an array
            // named touches; we just want
            // the first touch
            POP.Input.set(e.touches[0]);
        }, false);
        window.addEventListener('touchmove', function(e) {
            // we're not interested in this,
            // but prevent default behaviour
            // so the screen doesn't scroll
            // or zoom
            e.preventDefault();
        }, false);
        window.addEventListener('touchend', function(e) {
            // as above
            e.preventDefault();
        }, false);

        // Load assets and predraw the reel
        preloadImages(JSON_PATH, function() {
            POP.elements = IMAGES.slice(0);
            shuffleArray(POP.elements);
            POP.resetOffset =  (IMAGES.length + 3) * SLOT_HEIGHT + REEL_TOP_MARGIN;

            if (callback) callback();
        });

    },

    // this is where all entities will be moved
    // and checked for collisions, etc.
    update: function() {
        var checkCollision = false;

        console.log('UPDATE!');

        if (POP.Input.tapped) {
            POP.Input.tapped = false;
            checkCollision = true;
        }

        // Checks collision
        if (checkCollision && POP.collides(POP.Button, {x: POP.Input.x, y: POP.Input.y, r: 7}) ) {
                console.log('Colision!');
                POP.status = GameStatus.SYMBOL_SELECTION;
                checkCollision = false;
            }
    },

    // this is where we draw all the entities
    render: function() {

        if (POP.status != GameStatus.NOT_STARTED) {
            POP.Draw.clear();

            // Draw elements on canvas
            POP.Draw.elements(POP.elements);
        }

        // Draw the background
        //POP.Draw.image('img/BG.png',0,0,POP.WIDTH,POP.HEIGHT);
    },

    // the actual loop
    // requests animation frame,
    // then proceeds to update
    // and render
    loop: function() {

        requestAnimFrame(POP.loop);

        POP.update();
        POP.render();
    },

    resize: function() {

        POP.currentHeight = window.innerHeight;
        // resize the width in proportion
        // to the new height
        POP.currentWidth = POP.currentHeight * POP.RATIO;

        // this will create some extra space on the
        // page, enabling us to scroll past
        // the address bar, thus hiding it.
//TODO: TESTAR O IMPACTO DESSE CODIGO (OU DA AUSENCIA DELE) NO CELULAR
        if (POP.android || POP.ios) {
            document.body.style.height = (window.innerHeight + 50) + 'px';
        }

        // set the new canvas style width and height
        // note: our canvas is still 320 x 480, but
        // we're essentially scaling it with CSS
        POP.canvas.style.width = POP.currentWidth + 'px';
        POP.canvas.style.height = POP.currentHeight + 'px';

        // The amount by which the css resized canvas
        // is different to the actual (480x320) size.
        POP.scale = POP.currentWidth / POP.WIDTH;
        // Position of canvas in relation to
        // the screen
        POP.offset.top = POP.canvas.offsetTop;
        POP.offset.left = POP.canvas.offsetLeft;

        // we use a timeout here because some mobile
        // browsers don't fire if there is not
        // a short delay
        window.setTimeout(function() {
                window.scrollTo(0,1);
        }, 1);
    }

};

// this function checks if two circles overlap
POP.collides = function(a, b) {

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

    console.log('Button: x='+POP.Button.x+', y='+POP.Button.y);
    console.log('Input: x='+POP.Input.x+', y='+POP.Input.y);

    if (b.x >= a.x && b.x <= (a.x+a.WIDTH)
        && b.y >= a.y && b.y <= (a.y+a.WIDTH)) {
        return true;
    } else {
        return false;
    }
};

// Represents an user input (by touch or click)
POP.Input = {
    x: 0,
    y: 0,
    tapped :false,

    set: function(data) {
        //Get the input position considering the offset and scale
        this.x = (data.pageX - POP.offset.left) / POP.scale;
        this.y = (data.pageY - POP.offset.top) / POP.scale;

        this.tapped = true; 
    }
};


POP.Button = {
    WIDTH: 300,
    HEIGHT: 96,
    x: 0,
    y: 0,
    caminho: 'img/start-button.png',
    img: null,

    create: function() {
        console.log('Drawing button!')

        this.x = POP.WIDTH/2 - this.WIDTH/2;
        this.y = POP.HEIGHT/2 - this.HEIGHT/2;

        //Draw Start Button
        POP.Draw.image(this.caminho, this.x, this.y, this.WIDTH, this.HEIGHT);
    },
};

// Abstracts various canvas operations into
// standalone functions
POP.Draw = {

    clear: function() {
        POP.ctx.clearRect(0, 0, POP.WIDTH, POP.HEIGHT);
    },

    rect: function(x, y, w, h, color) {
        POP.ctx.fillStyle = color;
        POP.ctx.fillRect(x, y, w, h);
    },

    circle: function(x, y, r, col) {
        POP.ctx.fillStyle = col;
        POP.ctx.beginPath();
        POP.ctx.arc(x + 5, y + 5, r, 0,  Math.PI * 2, true);
        POP.ctx.closePath();
        POP.ctx.fill();
    },

    text: function(string, x, y, size, color) {
        POP.ctx.font = 'bold '+size+'px Chewy';
        POP.ctx.fillStyle = color;
        POP.ctx.fillText(string, x, y);
    },

    title: function(string, y, size, color) {
        POP.ctx.font = size+'px Chewy';
        POP.ctx.fillStyle = color;

        // Get the width of the text to draw
        var textWidth = POP.ctx.measureText(string).width;

        POP.ctx.fillText(string, (POP.WIDTH/2) - (textWidth/2), y);
    },

    image: function(path, x, y, w, h) {
        POP.Button.img = new Image();
        POP.Button.img.src = path;

        POP.Button.img.onload = function() {
            POP.ctx.save();
            POP.ctx.shadowColor = "rgba(0,0,0,0.5)";
            POP.ctx.shadowOffsetX = 5;
            POP.ctx.shadowOffsetY = 5;
            POP.ctx.shadowBlur = 5;
            POP.ctx.drawImage(POP.Button.img, x, y, w, h);
            POP.ctx.restore();
        };

    },

    elements: function(items) {
        POP.ctx.save();
        POP.ctx.shadowColor = "rgba(0,0,0,0.5)";
        POP.ctx.shadowOffsetX = 5;
        POP.ctx.shadowOffsetY = 5;
        POP.ctx.shadowBlur = 5;

        console.log('Drawing elements!');

        for (var i = 0 ; i < items.length ; i++) {
            var asset = items[i];
            POP.ctx.drawImage(asset.img, REEL_LEFT_MARGIN, i * SLOT_HEIGHT + REEL_TOP_MARGIN, IMAGE_WIDTH, IMAGE_HEIGHT);
            POP.ctx.drawImage(asset.img, REEL_LEFT_MARGIN, (i + items.length) * SLOT_HEIGHT + REEL_TOP_MARGIN, IMAGE_WIDTH, IMAGE_HEIGHT);
        }

        POP.ctx.restore();
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

        // Prepare each image to load
        IMAGES.forEach(function(asset) {
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

// Hide loading screen and show Canvas
function displayCanvas() {
    console.log('Showing canvas!');

    var loading = document.getElementById('game-container');
//    loading.remove();
    loading.style.display = 'none';
    // Add our canvas to body
    var body = document.getElementsByTagName("body")[0];
    body.appendChild(POP.canvas);
}

// Hide Loading message and show Start button
function prepareMenu() {
    // Display the scores in the main update function
    POP.Draw.title('Wild Fruits', 80, 60, '#fff');
    // Create start button
    POP.Button.create();

    // Show canvas
    displayCanvas();
    // we're ready to resize
    POP.resize();

    // It will then repeat continuously
    POP.loop();
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
    POP.init(prepareMenu);
}, false);

window.addEventListener('resize', POP.resize, false);
