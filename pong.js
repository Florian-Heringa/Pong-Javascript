// 2D-vector class, simply holds two coordinates in a plane
class Vec
{
	constructor(x = 0, y = 0)
	{
		this.x = x;
		this.y = y
	}

	normalize()
	{
		// Circumvent divide by 0 errors
		if (this.x == 0 && this.y == 0) {
			return;
		}
		const c = Math.sqrt(this.x * this.x + this.y * this.y);
		this.x = this.x / c;
		this.y = this.y / c;
	}

	multiplyBy(c) 
	{
		this.x *= c;
		this.y *= c;
	}
}

// Rectangle class, defined by its width, height and x- y-position as vectors
class Rect
{
	constructor(w, h) 
	{
		this.pos = new Vec;
		this.size = new Vec(w, h);
	}

	get left() 
	{
		return this.pos.x - this.size.x / 2;
	}

	get right() 
	{
		return this.pos.x + this.size.x / 2;
	}

	get top() 
	{
		return this.pos.y - this.size.y / 2;
	}

	get bottom() 
	{
		return this.pos.y + this.size.y / 2;
	}
}

// Ball class, simply a rectangle with an extra velocity variable
class ball extends Rect
{
	constructor()
	{
		super(10, 10);
		this.vel = new Vec;
	}
}

// Player class, rectangle with score variable
class Player extends Rect
{
	constructor()
	{
		super(20, 100);
		this.score = 0;
	}
}

// Holds general information about game state and AI difficulty
class GameManager 
{
	constructor() 
	{
		// AI
		this.difficultyFactor = 5;
		this.AIvelocity = 0;

		// General game state info
		this.running = false;
		this.startSpeedAbs = 400;

		// Speedup options, currently buggy
		// TODO : Fix
		this.alwaysSpeedup = false;
		this.speedupPercentage = .1;
	}
}

class Pong 
{
	constructor(canvas)
	{
		this._canvas = canvas;
		this._context = canvas.getContext('2d');
		// Make ball object
		this.ball = new ball;
		// Keep track of the gameState and difficulty
		this.manager = new GameManager;

		// Array of players
		this.players = [
			new Player, 
			new Player,
		];

		// Setup initial position of players
		this.players[0].pos.x = 40;
		this.players[1].pos.x = this._canvas.width - 40;
		this.players.forEach(player => player.pos.y = (this._canvas.height) / 2);

		let lastTime;
		const callback = (millis) => {
			if (lastTime) {
				this.update((millis - lastTime) / 1000);
			}
			lastTime = millis;
			requestAnimationFrame(callback);
		}
		// Start ball in center with random velocity in any direction
		this.reset(0, 0);
		callback();
	}

	// AI functions

	// Simple rubber band behaviour
	rubberBand(dt)
	{
		const diff = (this.ball.pos.y - this.players[1].pos.y);
		this.manager.AIvelocity = this.manager.difficultyFactor * Math.sign(diff) * Math.sqrt(Math.abs(diff));
		this.players[1].pos.y += this.manager.AIvelocity * dt;
	}

	// Unbeatable AI behaviour
	simple() 
	{
		this.players[1].pos.y = (this.players[1].pos.y + this.ball.pos.y) / 2;
	}

	// Collision check between two rectangles
	collide(player, ball)
	{
		
		if (player.left < ball.right && player.right > ball.left &&
			player.top < ball.bottom && player.bottom > ball.top) 
		{
			if (this.manager.alwaysSpeedup)
			{
				this.ball.vel.x += Math.sign(this.ball.vel.x) * this.manager.speedupPercentage * this.ball.vel.x;
			}
			ball.vel.x = -ball.vel.x;
		}
	}

	// Draw background, ball and players
	draw() 
	{
		// Background
		this._context.fillStyle = '#000';
		this._context.fillRect(0, 0, this._canvas.width, this._canvas.height);
		// Ball
		this.drawRect(this.ball);
		// Players
		this.players.forEach(player => this.drawRect(player));
	}

	// Generic draw call for any rectangle
	drawRect(rect)
	{
		this._context.fillStyle = '#fff';
		this._context.fillRect(rect.left, rect.top, rect.size.x, rect.size.y);
	}

	// Determines direction of x velocity, returns +/- startSpeedAbs
	velXinit() 
	{
		return Math.floor(Math.random() > .5 ? 1 : -1) * this.manager.startSpeedAbs;
	}

	// Random value between +/- startSpeedAbs
	velYinit()
	{
		return Math.floor(Math.random() - .5) * this.manager.startSpeedAbs;
	}

	// Resets the position of the ball to the center with the given velocity
	reset(velx, vely) 
	{
		// Make ball start in the middle
		this.ball.pos.x = this._canvas.width  / 2;
		this.ball.pos.y = this._canvas.height / 2;

		// Set ball velocity
		this.ball.vel.x = velx;
		this.ball.vel.y = vely;
		// Ensure start velocity is always the same, only direction is different
		this.ball.vel.normalize();
		this.ball.vel.multiplyBy(this.manager.startSpeedAbs);
	}

	// Called once on first mouse click after initialisation (event handler)
	start() 
	{
		if (!this.manager.running) {
			this.reset(this.velXinit(), this.velYinit());
			this.manager.running = true;
		}
	}

	// Handler when ball is out of bounds on y-axis
	bounceOnY() 
	{
		if (this.manager.alwaysSpeedup)
		{
			this.ball.vel.y += Math.sign(this.ball.vel.y) * this.manager.speedupPercentage * this.ball.vel.y;
		}
		this.ball.vel.y = -this.ball.vel.y;
	}

	// Handler if ball is out of bounds on x-axis
	score() 
	{
		// Determine which player has got a point
		const playerId = this.ball.vel.x < 0 | 0;
		// Add score to correct player object
		this.players[playerId].score++;
		// Set x velocity depending on who scored the point
		// Reset ball position and velocity
		this.reset((playerId == 1 ? 1 : -1) * Math.floor(Math.random() * 200), this.velYinit());
	}

	// Update function, calls all other functions above when needed
	update(dt) 
	{
		// Update position of the ball
		this.ball.pos.x += this.ball.vel.x * dt;
		this.ball.pos.y += this.ball.vel.y * dt;

		// Handles when the ball goes oob on any players side (x-axis)
		if (this.ball.left < 0 || this.ball.right > this._canvas.width) 
		{
			this.score();
		}
		// Handles when ball threatens to go oob on y-axis
		if (this.ball.top < 0 || this.ball.bottom > this._canvas.height) 
		{
			this.bounceOnY();
		}

		// Use simple rubber band AI
		this.rubberBand(dt);

		// Check collissions for ball with players
		this.players.forEach(player => this.collide(player, this.ball));

		// Draw updated board
		this.draw();
	}
}

// Get canvas to draw on from html
const canvas = document.getElementById('pong');

// Make Pong class
const pong = new Pong(canvas);


// Event handlers for mouse movement and init through click
canvas.addEventListener('mousemove', event => {
	pong.players[0].pos.y = event.offsetY;
})

canvas.addEventListener('click', event => {
	pong.start();
})