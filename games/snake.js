//Constants
var COLS=26, ROWS = 26;
//IDs
var EMPTY=0, SNAKE=1, FRUIT=2, BUG=3;
//Directions
var LEFT=0, UP=1, RIGHT=2, DOWN=3;
//KeyCodes
var KEY_LEFT=37, KEY_UP=38, KEY_RIGHT=39, KEY_DOWN=40;
//Colors
var COLOR_EMPTY="#2D373D", COLOR_SNAKE="#0CD2A4", COLOR_FRUIT="#0CE2E4", COLOR_BUG="#990099", COLOR_SCORE="#fff", COLOR_POISON="#FF1AFF";
//Hit Types
var HIT_WALL="wall", HIT_SELF="self", HIT_POISON="poison";

var grid = {
	width: null,
	height: null,
	_grid: null,
	
	init: function(d, c, r) {
		this.width = c;
		this.height = r;
		
		this._grid = [];
		for (var x=0; x < c; x++) {
			this._grid.push([]);
			for (var y=0; y < r; y++) {
				this._grid[x].push(d);
			}
		}
	},
	
	set: function(val, x, y) {
		this._grid[x][y] = val;
	},
	
	get: function(x, y) {
		return this._grid[x][y];
	}
}

var snake = {
	direction: null,
	last: null,
	_queue: null,
	
	init: function(d, x, y) {
		this.direction = d;
		
		this._queue = [];
		this.insert(x,y);
	},
	
	insert: function(x, y) {
		this._queue.unshift({x:x, y:y});
		this.last = this._queue[0];
	},
	
	remove: function() {
		return this._queue.pop();
	}
}

function setFood() {
	var empty = [];
	
	for (var x=0; x < grid.width; x++) {
		for (var y=0; y < grid.height; y++) {
			if (grid.get(x, y) === EMPTY) {
				empty.push({x:x, y:y});
			}
		}
	}
	var randomPos = empty[Math.floor(Math.random() * empty.length)];
	grid.set(FRUIT, randomPos.x, randomPos.y);
}

function setBug() {
	var empty = [];
	
	for (var x=0; x < grid.width; x++) {
		for (var y=0; y < grid.height; y++) {
			if (grid.get(x, y) === EMPTY) {
				empty.push({x:x, y:y});
			}
		}
	}
	var randomPos = empty[Math.floor(Math.random() * empty.length)];
	grid.set(BUG, randomPos.x, randomPos.y);
}

//Game objects
var canvas, ctx, keystate, frames, score, poison, menu, hitType,
	msgsSelf, msgsWall, msgsPoison;


function main() {
	canvas = document.createElement("canvas");
	canvas.width = COLS*20;
	canvas.height = ROWS*20;
	canvas.style.zIndex = 2;
	canvas.style.position = "absolute";
	ctx = canvas.getContext("2d");

	div = document.getElementById("snake-container");
	div.appendChild(canvas);

	//Press Start 2P
	ctx.font = "12px 'Press Start 2P', cursive";

	//Custom funny gameover messages
	msgsSelf = [];
	msgsSelf[0] = "There's plenty of food. Don't eat yourself!";
	msgsSelf[1] = "Is your body tastier than the food?";
	msgsSelf[2] = "AArrgghhh!! I bit myself!!";	
	msgsSelf[3] = "Do you have Autophagia?";	
	
	msgsWall = [];
	msgsWall[0] = "You broke your head!";
	msgsWall[1] = "The wall is stronger than it seems!";
	msgsWall[2] = "There's no way to escape the game...";
	msgsWall[3] = "Can't see the wall? Huh?";

	msgsPoison = [];
	msgsPoison[0] = "You got a little intoxicated.";
	msgsPoison[1] = "This purple thing is delicious but dangerous.";
	msgsPoison[2] = "You had an overdose of trash food. That's it!";
	msgsPoison[3] = "Don't eat so many purple bugs, you sweet tooth!";

	frames = 0;
	keystate = {};
	document.addEventListener("keydown", function(evt) {
		keystate[evt.keyCode] = true;
	});
	document.addEventListener("keyup", function(evt) {
		delete keystate[evt.keyCode];
	});

	init();
	loop();
}

function init() {
	score = 0;
	poison = 0;
	grid.init(EMPTY, COLS, ROWS);
	
	//Define starting position
	var sp = {x:Math.floor(COLS/2), y:ROWS-1};
	snake.init(UP, sp.x, sp.y);

	//Set snake, food and bug
	grid.set(SNAKE, sp.x, sp.y);
	setFood();
	setBug();
}

function loop() {
	update();
	draw();
	
	window.requestAnimationFrame(loop, canvas);
}

function update() {
	frames++;

	if(keystate[KEY_LEFT] && snake.direction != RIGHT)
		setTimeout(function() {snake.direction = LEFT; }, 50);
	if(keystate[KEY_UP] && snake.direction != DOWN)
		setTimeout(function() {snake.direction = UP; }, 50);
	if(keystate[KEY_RIGHT] && snake.direction != LEFT)
		setTimeout(function() {snake.direction = RIGHT; }, 50);
	if(keystate[KEY_DOWN] && snake.direction != UP)
		setTimeout(function() {snake.direction = DOWN; }, 50);

	if (frames%5 === 0) {
		var nx = snake.last.x;
		var ny = snake.last.y;

		switch (snake.direction) {
			case LEFT:
				nx--;
				break;
			case UP:
				ny--;
				break;
			case RIGHT:
				nx++;
				break;
			case DOWN:
				ny++;
				break;
		}

		//Death - Hit Wall
		if (0 > nx || nx > grid.width-1 ||
			0 > ny || ny > grid.height-1) {
			hitType = HIT_WALL;
			gameover();
		}
		//Death - Self-Hit
		else if (grid.get(nx, ny) === SNAKE) {
			hitType = HIT_SELF;
			gameover();
		}
		//Death - 100% poisoned
		else if (poison >= 100) {
			hitType = HIT_POISON;
			gameover();
		}

		//Eat bug
		if (grid.get(nx, ny) === BUG) {
			var tail = {x:nx, y:ny};
			score += 5;
			poison += 20;
			setBug();
		//Eat fruit
		} else if (grid.get(nx, ny) === FRUIT) {
			var tail = {x:nx, y:ny};
			score++;
			poison -= 5;
			if (poison < 0) {
				poison = 0;
			}
			setFood();
		}
		else {
			var tail = snake.remove();
			grid.set(EMPTY, tail.x, tail.y);
			tail.x = nx;
			tail.y = ny;
		}

		grid.set(SNAKE, tail.x, tail.y);

		snake.insert(tail.x, tail.y);
	}
}

function gameover() {
	makeTweet();
	gameOverText();

	//Reconfigure Start button
	var start = document.getElementById("start");
	start.innerHTML = "Try Again";
	start.style.width = "240px";
	
	//Clear canvas	
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.restore();
	canvas.style.zIndex   = "-2";
	canvas.style.boxShadow = "none";
}

	function makeTweet() {
		//Reconfigure Tweet link
		var tweet = document.getElementById("tweet");
		tweet.href='https://twitter.com/home?status=http%3A//tiagodeluna.github.io/games/snake%20I%20scored%20' 
					+score+ '%20points%20in%20the%20Toxic%20Snake%20game%20via%20%40tiago_luna';
		tweet.style.top = "35%";


	}

	function gameOverText() {
		//Get the gameover text
		var goText = document.getElementById("info2");
		goText.style.top = "15%";

		//Show the messages
		if(hitType == HIT_WALL) {
			goText.innerHTML = msgsWall[Math.floor(Math.random() * msgsWall.length)];
		}
		else if(hitType == HIT_SELF) {
			goText.innerHTML = msgsSelf[Math.floor(Math.random() * msgsSelf.length)];
		}
		else if(hitType == HIT_POISON) {
			goText.innerHTML = msgsPoison[Math.floor(Math.random() * msgsPoison.length)];
		}
	}

function draw() {
	var tw = canvas.width/grid.width;
	var th = canvas.height/grid.height;
	
	for (var x=0; x < grid.width; x++) {
		for (var y=0; y < grid.height; y++) {
			switch (grid.get(x, y)) {
				case EMPTY:
					ctx.fillStyle = COLOR_EMPTY;
					break;
				case SNAKE:
					if (Math.random() < poison/100) { ctx.fillStyle = COLOR_BUG; }
					else { ctx.fillStyle = COLOR_SNAKE; }
					break;
				case FRUIT:
					ctx.fillStyle = COLOR_FRUIT;
					break;
				case BUG:
					ctx.fillStyle = COLOR_BUG;
					break;
			}
			
			ctx.fillRect(x*tw, y*th, tw, th);
		}
	}
	ctx.fillStyle = COLOR_SCORE;
	ctx.fillText("SCORE: " + score, 10, canvas.height-30);
	ctx.fillStyle = COLOR_POISON;
	ctx.fillText("POISON: " + poison + "%", 10, canvas.height-10);
}
