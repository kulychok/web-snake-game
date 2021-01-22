const BOX = 32;
const NUM_CELLS = {width: 17, height: 15};
const BG_OFFSET = {x: BOX, y:3*BOX};
const SCORE_OFFSET = {x: BOX*2.5, y: BOX*1.7};
const SNAKE_START = {x: BOX*9, y: BOX*10};


const endGameEvent = new Event('endGame');

const game = {
	canvas : document.getElementById('game'),
	ctx : null,
  score: 0,
	items : [],
  ground: new Image(),
	init() {	
    this.ground.src = "img/ground.png";
		this.items.push(new Food(), new Snack());
		this.setPixelRatio();
	},
	run(){
		this.ctx.clearRect(0,0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.ground, 0, 0);
    snake.draw(this.ctx);
    
		for (let item of this.items){
			item.draw(this.ctx);
		}

    this.showScore();
	},
	update(){
    snake.update();
		for (let item of this.items){
			item.update();
		}
	},
	setPixelRatio(){ //нужно для нормальной плотности точек на канвасе
		let dpr = window.devicePixelRatio || 1;
		let rect = this.canvas.getBoundingClientRect();
		this.canvas.width = rect.width * dpr;
		this.canvas.height = rect.height * dpr;
		this.ctx = this.canvas.getContext('2d');
		this.ctx.scale(dpr, dpr);
	},

  end() {
    clearInterval(gameInterval);
    this.ctx.fillStyle = "white";
    this.ctx.font = "50px Arial";
    this.ctx.fillText('Game Over',BOX*6, BOX*7);
    this.ctx.fillText('Score: '+this.score,BOX*7, BOX*9);
    this.ctx.fillStyle = "green";
    this.ctx.fillText('Replay',BOX*7.5, BOX*11);
    document.addEventListener('click', ()=> game.replay());
  },

  replay() {
    location.reload();
  },

  showScore(e){
    this.ctx.fillStyle = "white";
    this.ctx.font = "50px Arial";
    this.ctx.fillText(this.score,SCORE_OFFSET.x, SCORE_OFFSET.y);
  },

};

const snake = {
  tail: [{x:9*BOX,y:10*BOX}],
  color: 'green',
  draw(ctx){
    for (const cell of this.tail ){
      ctx.fillStyle = this.color;
      ctx.fillRect(cell.x,cell.y,BOX,BOX);  
    }
  },
  update(){
    const newHead = {...this.tail[0]}
    if(this.dir === "left") newHead.x -= BOX;
    if(this.dir === "right") newHead.x += BOX;
    if(this.dir === "up") newHead.y -= BOX;
    if(this.dir === "down") newHead.y += BOX;
    this._checkBorders(newHead);
   
    if(!this._hasEatenItem(newHead)) {
      this.tail.pop();
    }
    this.tail.unshift(newHead);
    
  },
  _checkBorders(head) {
    if((head.x <= 0 || head.y <= 2* BOX) || (head.x >= game.canvas.width - BOX || head.y >= game.canvas.height - BOX)) {
      document.dispatchEvent(endGameEvent);
    } 
  },

  _hasEatenItem(head) {
    for(const item of game.items) {
      if(item.x === head.x && item.y === head.y) 
        return item.wasEaten();
    }
  }
}

class Item{
	constructor(){
    this._move();
    this.bonus = 0;
    this.isGrow = false;
    this.img = new Image();
	}
	draw(ctx){
    ctx.drawImage(this.img, this.x, this.y);
	}
	update(){
	}
  _move() {
    this.x = Math.floor(Math.random()* NUM_CELLS.width) * BOX+BG_OFFSET.x;
    this.y = Math.floor(Math.random()* NUM_CELLS.height) * BOX+BG_OFFSET.y;
  }
  wasEaten() {
    this._move()
    game.score += this.bonus;
    return this.isGrow;
  }
}

class Food extends Item {
  constructor() {
    super();
    this.img.src = "img/hamburger.png";
    this.bonus = 2;
    this.isGrow = true;
  }
}

class Snack extends Item {
  constructor() {
    super();
    this.img.src = "img/food.png";
    this.bonus = 1;
    this.isGrow = false;
  }
}

document.addEventListener("keydown", direction);
function direction(event){
 if(event.key === 'ArrowLeft' && snake.dir !== "right")
   snake.dir = "left";
 if(event.key === 'ArrowRight' && snake.dir !== "left")
   snake.dir = "right";
 if(event.key === 'ArrowUp' && snake.dir !== "down")
   snake.dir = "up";
 if(event.key === 'ArrowDown' && snake.dir !== "up")
   snake.dir = "down";
}

document.addEventListener('endGame', () => game.end());

game.init();

const gameInterval = setInterval(()=>{game.run();game.update()},100);