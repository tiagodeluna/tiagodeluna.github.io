// http://paulirish.com/2011/requestanimationframe-for-smart-animating
// shim layer with setTimeout fallback
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

// Array with the different items
var items = [ 
    {id: 'SYM1'},
    {id: 'SYM3'},
    {id: 'SYM4'},
    {id: 'SYM5'},
    {id: 'SYM6'},
    {id: 'SYM7'}
    ];

var IMAGE_HEIGHT = 155;//77;
var IMAGE_WIDTH = 235;//117;
var IMAGE_TOP_MARGIN = 12;
var IMAGE_BOTTOM_MARGIN = 12;
var IMAGE_X = 70;
var SLOT_HEIGHT = IMAGE_HEIGHT + IMAGE_TOP_MARGIN + IMAGE_BOTTOM_MARGIN; // how many pixels one slot image takes

// Main game object
var POP = {

    // set up some initial values
    WIDTH: 960,//480, 
    HEIGHT:  536,//268,
    // The elements in the slot machine
    elements: [],
    // we'll set the rest of these
    // in the init function
    RATIO:  null,
    currentWidth:  null,
    currentHeight:  null,
    canvas: null,
    ctx:  null,
    resetOffset: null,

    init: function() {

        // the proportion of width to height
        POP.RATIO = POP.WIDTH / POP.HEIGHT;
        // these will change when the screen is resized
        POP.currentWidth = POP.WIDTH;
        POP.currentHeight = POP.HEIGHT;
        // this is our canvas element
        POP.canvas = document.getElementsByTagName('canvas')[0];
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

        // load assets and predraw the reel
        preloadImages( items, function() {

            // images are preloaded

            // draw elements on canvas
            function _fillCanvasWithItems(items) {

                for (var i = 0 ; i < items.length ; i++) {
                    var asset = items[i];
                    POP.ctx.save();
                    POP.ctx.shadowColor = "rgba(0,0,0,0.5)";
                    POP.ctx.shadowOffsetX = 5;
                    POP.ctx.shadowOffsetY = 5;
                    POP.ctx.shadowBlur = 5;
                    POP.ctx.drawImage(asset.img, IMAGE_X, i * SLOT_HEIGHT + IMAGE_TOP_MARGIN, IMAGE_WIDTH, IMAGE_HEIGHT);
                    POP.ctx.drawImage(asset.img, IMAGE_X, (i + items.length) * SLOT_HEIGHT, IMAGE_WIDTH, IMAGE_HEIGHT);
                    POP.ctx.restore();
                }
            }
            // Draw the canvas with shuffled array
            POP.elements = items.slice(0);
            shuffleArray(POP.elements);
            _fillCanvasWithItems( POP.elements );
            POP.resetOffset =  (items.length + 3) * SLOT_HEIGHT;
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

        requestAnimFrame( POP.loop );

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

// abstracts various canvas operations into
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

    image: function(imgpath, x, y, w, h) {
        var img = new Image();
        img.src = imgpath;
        img.onload = function() {
            POP.ctx.drawImage(img, x, y, w, h);
        }
    }

};

function shuffleArray(array) {

    for (i = array.length - 1; i > 0; i--) {
        var j = parseInt(Math.random() * i)
        var tmp = array[i];
        array[i] = array[j]
        array[j] = tmp;
    }
}

// Images must be preloaded before they are used to draw into canvas
function preloadImages(images, callback) {

    function _preload( asset ) {
        asset.img = new Image();
        asset.img.src = 'img/' + asset.id+'.png';
//        asset.img.src = 'img/SYM1.png';

        asset.img.addEventListener("load", function() {
            _check();
        }, false);

        asset.img.addEventListener("error", function(err) {
            _check(err, asset.id);
        }, false);
    }

    var loadc = 0;
    function _check( err, id ) {
        if ( err ) {
            alert('Failed to load ' + id );
        }
        loadc++;
        if ( images.length == loadc ) {
            return callback()
        }
    }

    images.forEach(function(asset) {
        _preload( asset );
    });
}


window.addEventListener('load', POP.init, false);
window.addEventListener('resize', POP.resize, false);