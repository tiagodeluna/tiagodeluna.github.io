// Array with the different images
var IMAGES = [];

var IMAGE_HEIGHT = 155;//77;
var IMAGE_WIDTH = 235;//117;
var IMAGE_TOP_MARGIN = 12;
var IMAGE_BOTTOM_MARGIN = 12;
var REEL_LEFT_MARGIN = 70;
var REEL_TOP_MARGIN = 12;
var SLOT_HEIGHT = IMAGE_HEIGHT + IMAGE_TOP_MARGIN + IMAGE_BOTTOM_MARGIN; // how many pixels one slot image takes
//TODO Get the JSON path from the HTML file
var JSON_PATH = 'https://tiagodeluna.github.io/games/src/images.json';
//var JSON_PATH = 'src/images.json';


/*---------------------------------------------------*/
/* Game classes                                      */
/*---------------------------------------------------*/

var POP = {
    // Set up some initial values
    WIDTH: 960,//480
    HEIGHT:  536,//268
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

    init: function() {

        // the proportion of width to height
        POP.RATIO = POP.WIDTH / POP.HEIGHT;
        // these will change when the screen is resized
        POP.currentWidth = POP.WIDTH;
        POP.currentHeight = POP.HEIGHT;
        // this is our canvas element
        POP.canvas = document.createElement("canvas");
        POP.canvas.style.zIndex = 2;
        //"Remove" menu and show append our canvas to body
        var section = document.getElementById('menu-screen');
//        section.remove();
        section.style.display = 'none';
        // Add our new canvas to body
        var body = document.getElementsByTagName("body")[0];
        body.appendChild(POP.canvas);

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
//        POP.ua = navigator.userAgent.toLowerCase();
//        POP.android = POP.ua.indexOf('android') > -1 ? true : false;
//        POP.ios = ( POP.ua.indexOf('iphone') > -1 || POP.ua.indexOf('ipad') > -1  ) ? 
//            true : false;

        // Load assets and predraw the reel
        preloadImages(JSON_PATH, function() {

            POP.elements = IMAGES.slice(0);
            shuffleArray(POP.elements);
            // After images are preloaded
            //  draw elements on canvas
            POP.Draw.elements(POP.elements);
            POP.resetOffset =  (IMAGES.length + 3) * SLOT_HEIGHT + REEL_TOP_MARGIN;
        });

        // we're ready to resize
        POP.resize();

        // It will then repeat continuously
        POP.loop();

    },

    // this is where all entities will be moved
    // and checked for collisions, etc.
    update: function() {

    },

    // this is where we draw all the entities
    render: function() {
        //POP.Draw.clear();

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
//        if (POP.android || POP.ios) {
//            document.body.style.height = (window.innerHeight + 50) + 'px';
//        }

        // set the new canvas style width and height
        // note: our canvas is still 320 x 480, but
        // we're essentially scaling it with CSS
        POP.canvas.style.width = POP.currentWidth + 'px';
        POP.canvas.style.height = POP.currentHeight + 'px';

        // we use a timeout here because some mobile
        // browsers don't fire if there is not
        // a short delay
        window.setTimeout(function() {
                window.scrollTo(0,1);
        }, 1);
    }

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
        POP.ctx.font = 'bold '+size+'px Monospace';
        POP.ctx.fillStyle = color;
        POP.ctx.fillText(string, x, y);
    },

    image: function(img, x, y, w, h) {
        POP.ctx.drawImage(img, x, y, w, h);
    },

    elements: function(items) {
        POP.ctx.save();
        POP.ctx.shadowColor = "rgba(0,0,0,0.5)";
        POP.ctx.shadowOffsetX = 5;
        POP.ctx.shadowOffsetY = 5;
        POP.ctx.shadowBlur = 5;

        for (var i = 0 ; i < items.length ; i++) {
            var asset = items[i];
            POP.ctx.drawImage(asset.img, REEL_LEFT_MARGIN, i * SLOT_HEIGHT + REEL_TOP_MARGIN, IMAGE_WIDTH, IMAGE_HEIGHT);
            POP.ctx.drawImage(asset.img, REEL_LEFT_MARGIN, (i + items.length) * SLOT_HEIGHT + REEL_TOP_MARGIN, IMAGE_WIDTH, IMAGE_HEIGHT);
            POP.ctx.restore();
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
        IMAGES = data.images.image.slice(0);

        // Prepare each image to load
        IMAGES.forEach(function(asset) {
            asset.path = data.images.path;
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


/*---------------------------------------------------*/
/* Window events and Main function                   */
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

function main() {
    //Start game
    POP.init();
    window.addEventListener('resize', POP.resize, false);
}