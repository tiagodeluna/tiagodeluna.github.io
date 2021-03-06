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

// namespace our game
var POP = {

    // set up some initial values
    WIDTH: 268, 
    HEIGHT:  480,//320, 
    // Add at the start of the program
    // the amount of game ticks until
    // we spawn a Enemy
    nextEnemy: 100,
    entities: [],
    scale:  1,
    // the position of the canvas
    // in relation to the screen
    offset: {top: 0, left: 0},
    // this goes at the start of the program
    // to track players's progress
    score: {
        taps: 0,
        hit: 0,
        escaped: 0,
        accuracy: 0
    },
    // we'll set the rest of these
    // in the init function
    RATIO:  null,
    currentWidth:  null,
    currentHeight:  null,
    canvas: null,
    ctx:  null,

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

        // set up our wave effect;
        // basically, a series of overlapping circles
        // across the top of screen
        POP.wave = {
            x: -25, // x coordinate of first circle
            y: -40, // y coordinate of first circle
            r: 50, // circle radius
            time: 0, // we'll use this in calculating the sine wave
            offset: 0 // this will be the sine wave offset
        }; 
        // calculate how many circles we need to 
        // cover the screen's width
        POP.wave.total = Math.ceil(POP.WIDTH / POP.wave.r) + 1;

        // we're ready to resize
        POP.resize();

        // it will then repeat continuously
        POP.loop();
    },

    resize: function() {

        POP.currentHeight = window.innerHeight;
        // resize the width in proportion
        // to the new height
        POP.currentWidth = POP.currentHeight * POP.RATIO;

        // this will create some extra space on the
        // page, allowing us to scroll past
        // the address bar, thus hiding it.
        if (POP.android || POP.ios) {
            document.body.style.height = (window.innerHeight + 50) + 'px';
        }

        // set the new canvas style width and height
        // note: our canvas is still 320 x 480, but
        // we're essentially scaling it with CSS
        POP.canvas.style.width = POP.currentWidth + 'px';
        POP.canvas.style.height = POP.currentHeight + 'px';

        // the amount by which the css resized canvas
        // is different to the actual (480x320) size.
        POP.scale = POP.currentWidth / POP.WIDTH;
        // position of canvas in relation to
        // the screen
        POP.offset.top = POP.canvas.offsetTop;
        POP.offset.left = POP.canvas.offsetLeft;

        // we use a timeout here because some mobile
        // browsers don't fire if there is not
        // a short delay
        window.setTimeout(function() {
                window.scrollTo(0,1);
        }, 1);
    },

    // this is where all entities will be moved
    // and checked for collisions, etc.
    update: function() {
        var i,
        // A flag for checking collisions
        checkCollision = false; // we only need to check for a collision
                                // if the user tapped on this game tick

        // decrease our nextEnemy counter
        POP.nextEnemy -= 1;
        // if the counter is less than zero
        if (POP.nextEnemy < 0) {
            if (Math.random() > 0.5) {
                // put a new instance of Enemy into our entities array
                POP.entities.push(new POP.FlyingSaucer());
            } else {
                POP.entities.push(new POP.Starship());
            }
            // reset the counter with a random value
            POP.nextEnemy = ( Math.random() * 100 ) + 100;
        }

        // spawn a new instance of Touch
        // if the user has tapped the screen
        if (POP.Input.tapped) {
            POP.entities.push(new POP.Touch(POP.Input.x, POP.Input.y));
            // set tapped back to false
            // to avoid spawning a new touch
            // in the next cycle
            POP.Input.tapped = false;
            checkCollision = true;
            // keep track of taps; needed to 
            // calculate accuracy
            POP.score.taps += 1;
        }

        // cycle through all entities and update as necessary
        for (i = 0; i < POP.entities.length; i += 1) {
            POP.entities[i].update();

            if ((POP.entities[i].type === 'flyingSaucer' || POP.entities[i].type === 'starship') && checkCollision) {
                hit = POP.collides(POP.entities[i], 
                                    {x: POP.Input.x, y: POP.Input.y, r: 7});
                if (hit) {
                    // Spawn an explosion
                    var qtd = (Math.random() * 5) + 5;
                    for (var n = 0; n < qtd; n +=1 ) {
                        POP.entities.push(new POP.Particle(
                            POP.entities[i].x, 
                            POP.entities[i].y, 
                            2, 
                            // random opacity to spice it up a bit
                            'rgba(255,69,0,'+Math.random()*1+')'
                        )); 
                    }
                    //Update number of hits
                    POP.score.hit += 1;
                }

                POP.entities[i].remove = hit;
            }

            // delete from array if remove property
            // flag is set to true
            if (POP.entities[i].remove) {
                POP.entities.splice(i, 1);
            }
        }

        // update wave offset
        POP.wave.time = new Date().getTime() * 0.002;
        POP.wave.offset = Math.sin(POP.wave.time * 0.8) * 5;

        //Calculate accuracy
        POP.score.accuracy = (POP.score.hit / POP.score.taps) * 100;
        POP.score.accuracy = isNaN(POP.score.accuracy) ? 0 : ~~(POP.score.accuracy); // a handy way to round floats
    },

    // this is where we draw all the entities
    render: function() {

       var i;

       //Draw background
       POP.Draw.rect(0, 0, POP.WIDTH, POP.HEIGHT, '#000');

        // cycle through all entities and render to canvas
        for (i = 0; i < POP.entities.length; i += 1) {
            POP.entities[i].render();
        }

        // display snazzy wave effect
        for (i = 0; i < POP.wave.total; i++) {
            POP.Draw.circle(
                        POP.wave.x + POP.wave.offset +  (i * POP.wave.r), 
                        POP.wave.y,
                        POP.wave.r, 
                        '#fff'); 
        }

        // Display the scores in the main update function
        POP.Draw.text('Hit: ' + POP.score.hit, 20, 30, 14, '#fff');
        POP.Draw.text('Escaped: ' + POP.score.escaped, 20, 50, 14, '#fff');
        POP.Draw.text('Accuracy: ' + POP.score.accuracy + '%', 20, 70, 14, '#fff');
    },

    // the actual loop
    // requests animation frame,
    // then proceeds to update
    // and render
    loop: function() {

        requestAnimFrame( POP.loop );

        POP.update();
        POP.render();
    }

};

// abstracts various canvas operations into
// standalone functions
POP.Draw = {

    clear: function() {
        POP.ctx.clearRect(0, 0, POP.WIDTH, POP.HEIGHT);
    },

    rect: function(x, y, w, h, col) {
        POP.ctx.fillStyle = col;
        POP.ctx.fillRect(x, y, w, h);
    },

    circle: function(x, y, r, col) {
        POP.ctx.fillStyle = col;
        POP.ctx.beginPath();
        POP.ctx.arc(x + 5, y + 5, r, 0,  Math.PI * 2, true);
        POP.ctx.closePath();
        POP.ctx.fill();
    },

    text: function(string, x, y, size, col) {
        POP.ctx.font = 'bold '+size+'px Monospace';
        POP.ctx.fillStyle = col;
        POP.ctx.fillText(string, x, y);
    }

};

// + add this at the bottom of your code,
// before the window.addEventListeners
POP.Input = {

    x: 0,
    y: 0,
    tapped :false,

    set: function(data) {
        //Get the input position considering the offset and scale
        this.x = (data.pageX - POP.offset.left) / POP.scale;
        this.y = (data.pageY - POP.offset.top) / POP.scale;

        this.tapped = true; 

        POP.Draw.circle(this.x, this.y, 10, 'red');
    }

};

// this function checks if two circles overlap
POP.collides = function(a, b) {

        var distance_squared = ( ((a.x - b.x) * (a.x - b.x)) + 
                                ((a.y - b.y) * (a.y - b.y)));

        var radii_squared = 0;
        if (a.type === 'flyingSaucer')
            radii_squared = (a.r + b.r) * (a.r + b.r);
        else
            radii_squared = (a.h + b.r) * (a.h + b.r);

        if (distance_squared < radii_squared) {
            return true;
        } else {
            return false;
        }
};

/* Useful classes */
POP.Touch = function(x, y) {

    this.type = 'touch';    // we'll need this later
    this.x = x;             // the x coordinate
    this.y = y;             // the y coordinate
    this.r = 5;             // the radius
    this.opacity = 1;       // initial opacity; the dot will fade out
    this.fade = 0.05;       // amount by which to fade on each game tick
    this.remove = false;    // flag for removing this entity. POP.update
                            // will take care of this

    this.update = function() {
        // reduce the opacity accordingly
        this.opacity -= this.fade; 
        // if opacity if 0 or less, flag for removal
        this.remove = (this.opacity < 0) ? true : false;
    };

    this.render = function() {
        POP.Draw.circle(this.x-5, this.y-5, this.r, 'rgba(255,0,0,'+this.opacity+')');
    };

};

POP.FlyingSaucer = function() {

    this.type = 'flyingSaucer';
    this.r = (Math.random() * 15) + 15; // the radius of the Enemy
    this.speed = (Math.random() * 3) + 1;

    this.x = (Math.random() * (POP.WIDTH) - this.r);
    this.y = POP.HEIGHT + (Math.random() * 100) + 100; // make sure it starts off screen

    // the amount by which the Enemy
    // will move from side to side
    this.waveSize = 5 + this.r;
    // we need to remember the original
    // x position for our sine wave calculation
    this.xConstant = this.x;

    this.remove = false;

    this.update = function() {

        // a sine wave is commonly a function of time
        var time = new Date().getTime() * 0.002;

        // move up the screen by 1 pixel
        this.y -= this.speed;
        // the x coordinate to follow a sine wave
        this.x = this.waveSize * Math.sin(time) + this.xConstant;

        // if off screen, flag for removal
        if (this.y < -10) {
            POP.score.escaped += 1; // Update score
            this.remove = true;
        }

    };

    this.render = function() {

        var colorDetails = 'rgba(150,150,150,1)';
        var radius = this.r/8;
        var  offsetDiagonal = this.r/2;
        var  offsetHorzVert = 3*this.r/4;
        //Main circle
        POP.Draw.circle(this.x, this.y, this.r, 'rgba(250,250,250,1)');
        //Cockpit
        POP.Draw.circle(this.x, this.y, this.r*0.5, colorDetails);
        //Small circles
        POP.Draw.circle(this.x - offsetHorzVert, this.y, radius, colorDetails);
        POP.Draw.circle(this.x + offsetHorzVert, this.y, radius, colorDetails);
        POP.Draw.circle(this.x, this.y - offsetHorzVert, radius, colorDetails);
        POP.Draw.circle(this.x, this.y + offsetHorzVert, radius, colorDetails);
        POP.Draw.circle(this.x - offsetDiagonal, this.y - offsetDiagonal, radius, colorDetails);
        POP.Draw.circle(this.x + offsetDiagonal, this.y - offsetDiagonal, radius, colorDetails);
        POP.Draw.circle(this.x + offsetDiagonal, this.y + offsetDiagonal, radius, colorDetails);
        POP.Draw.circle(this.x - offsetDiagonal, this.y + offsetDiagonal, radius, colorDetails);
    };

};

POP.Starship = function() {

    this.type = 'starship';
    this.h = (Math.random() * 9) + 18; // the radius of the Enemy
    this.speed = (Math.random() * 3) + 2;

    this.x = (Math.random() * (POP.WIDTH));
    this.y = POP.HEIGHT + (Math.random() * 100) + 100; // make sure it starts off screen

    // the amount by which the Enemy
    // will move from side to side
    this.waveSize = 5 + this.h/2;
    // we need to remember the original
    // x position for our sine wave calculation
    this.xConstant = this.x;

    this.remove = false;

    this.update = function() {

        // a sine wave is commonly a function of time
        var time = new Date().getTime() * 0.002;

        // move up the screen by 1 pixel
        this.y -= this.speed;
        // the x coordinate to follow a sine wave
        this.x = this.waveSize * Math.sin(time) + this.xConstant;

        // if off screen, flag for removal
        if (this.y < -10) {
            POP.score.escaped += 1; // Update score
            this.remove = true;
        }

    };

    this.render = function() {

        var colorDetails = 'rgba(150,150,150,1)';
        var radius = this.r/8;
        var offsetDiagonal = this.r/2;
        var offsetHorzVert = 3*this.r/4;
        //Main circle
        POP.Draw.circle(this.x, this.y, this.r, 'rgba(250,250,250,1)');
        //Cockpit
        POP.Draw.circle(this.x, this.y, this.r*0.5, colorDetails);

        POP.ctx.beginPath();
        POP.ctx.fillStyle = 'gold';

        // triangle
        POP.ctx.moveTo(this.x - this.h/2, this.y);
        POP.ctx.lineTo(this.x + this.h/2, this.y);
        POP.ctx.lineTo(this.x, this.y - this.h);
        POP.ctx.fill();
        //Cockpit
        var radius = this.h/5;
        POP.Draw.circle(this.x - radius, this.y - this.h/2, radius, 'rgba(255,150,0,1)');
    };

};

POP.Particle = function(x, y, r, col) {

    this.x = x;
    this.y = y;
    this.r = r;
    this.col = col;

    // determines whether particle will
    // travel to the right of left
    // 50% chance of either happening
    this.dir = (Math.random() * 2 > 1) ? 1 : -1;

    // random values so particles do not
    // travel at the same speeds
    this.vx = ~~(Math.random() * 4) * this.dir;
    this.vy = ~~(Math.random() * 7);

    this.remove = false;

    this.update = function() {

        // update coordinates
        this.x += this.vx;
        this.y += this.vy;

        // increase velocity so particle
        // accelerates off screen
        this.vx *= 0.99;
        this.vy *= 0.99;

        // adding this negative amount to the
        // y velocity exerts an upward pull on
        // the particle, as if drawn to the
        // surface
        this.vy -= 0.25;

        // off screen
        if (this.y < 0) {
            this.remove = true;
        }

    };

    this.render = function() {
        POP.Draw.circle(this.x, this.y, this.r, this.col);
    };

};

window.addEventListener('load', POP.init, false);
window.addEventListener('resize', POP.resize, false);