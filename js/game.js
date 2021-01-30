const BOX = 32;
const NUM_CELLS = { width: 17, height: 15 };
const BG_OFFSET = { x: BOX, y: 3 * BOX };
const SCORE_OFFSET = { x: BOX * 2.5, y: BOX * 1.7 };
const BEST_SCORE_OFFSET = { x: BOX * 16, y: BOX * 1.7 };
const SNAKE_START = { x: BOX * 9, y: BOX * 10 };
const config = "config.json";

const endGameEvent = new Event('endGame');

const game = {
  canvas: document.getElementById('game'),
  ctx: null,
  score: 0,
  bestScore: 0,
  items: [],
  ground: new Image(),

  init() {
    this.items.push(new Snack());
    this.setPixelRatio();
  },

  run() {
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.ground, 0, 0);
    snake.draw(this.ctx);
    
    for(let item of this.items) {
      item.draw(this.ctx);
    }

    this.showScore();
    this.showBestScore();
    
  },

  update() {
    snake.update();
  },

  setPixelRatio() { 
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
    this.ctx.fillText('Game Over', BOX * 6, BOX * 7);
    this.ctx.fillText('Score: ' + this.score, BOX * 7, BOX * 9);
    this.ctx.fillText('Best score: ' + localStorage.getItem('bestScore'), BOX * 5, BOX * 11);
    this.ctx.fillStyle = "#295b6d";
    this.ctx.fillText('Replay', BOX * 7.5, BOX * 13);
    document.addEventListener('click', () => game.replay());
  },

  replay() {
    location.reload();
  },

  showScore() {
    this.ctx.fillStyle = "white";
    this.ctx.font = "50px Arial";
    this.ctx.fillText(this.score, SCORE_OFFSET.x, SCORE_OFFSET.y);
  },

  showBestScore() {
    if(this.score > localStorage.getItem('bestScore')) {
      localStorage.setItem('bestScore', this.score);
    }
    this.ctx.fillStyle = "white";
    this.ctx.font = "50px Arial";
    this.ctx.fillText(+localStorage.getItem('bestScore'), BEST_SCORE_OFFSET.x, BEST_SCORE_OFFSET.y);
  },
};

const snake = {
  tail: [{ x: 9 * BOX, y: 10 * BOX }],

  draw(ctx) {
    for (const cell of this.tail) {
      ctx.fillStyle = this.color;
      ctx.fillRect(cell.x, cell.y, BOX, BOX);
    }
  },

  update() {
    const newHead = { ...this.tail[0] }
    if (this.dir === "left") newHead.x -= BOX;
    if (this.dir === "right") newHead.x += BOX;
    if (this.dir === "up") newHead.y -= BOX;
    if (this.dir === "down") newHead.y += BOX;
    this._checkBorders(newHead);

    if(this._hasEatenItself(newHead)) game.end();
    if (!this._hasEatenItem(newHead)) { 
      this.tail.pop();
    }
    this.tail.unshift(newHead);
  },

  _checkBorders(head) {
    if ((head.x <= 0 || head.y <= 2 * BOX) || (head.x >= game.canvas.width - BOX || head.y >= game.canvas.height - BOX)) {
      document.dispatchEvent(endGameEvent);
    }
  },

  _hasEatenItself(head) {
    if(this.tail.length > 1) {
      for(let item of this.tail) {
        if(head.x === item.x && head.y === item.y)
          return true;
      }
    }
    else return false;
  },

  _hasEatenItem(head) {
    for (const item of game.items) {
      if (item.x === head.x && item.y === head.y)
        return item.wasEaten();
    }
  }
}

class Item {
  static counter = 0;

  constructor() {
    this._move();
    this.bonus = 0;
    this.isGrow = false;
    this.img = new Image();
  }

  draw(ctx) {
    ctx.drawImage(this.img, this.x, this.y);
  }

  _move() {
    do {
      this.x = Math.floor(Math.random() * NUM_CELLS.width) * BOX + BG_OFFSET.x;
      this.y = Math.floor(Math.random() * NUM_CELLS.height) * BOX + BG_OFFSET.y;
    } while(this._isInSnake(this.x, this.y));
  }

  _isInSnake(x, y) {
    for(let item of snake.tail) {
      if(item.x === x && item.y === y) return true;
    }
    return false;
  }

  wasEaten() {
    this._move()
    game.score += this.bonus;
    this._queueChanging();
    return this.isGrow;
  }

  _queueChanging() {
    Item.counter++;
    if(game.items.length > 1) game.items.pop();

    if(!(Item.counter % 3)) {
      game.items.pop();
      game.items.push(new Food);
      return;
    }

    if(!(Item.counter % 5)) {
      game.items.push(new Mine());
      return;
    }

    if(!(Item.counter % 13)) {
      game.items.push(new Poison());
      return;
    }

    game.items.pop();
    game.items.push(new Snack());
  }
}

class Food extends Item {
  constructor() {
    super();
    this.img.src = "img/hamburger.png";
    this.bonus = 1;
    this.isGrow = true;
  }
}

class Snack extends Item {
  constructor() {
    super();
    this.img.src = "img/carrot.png";
    this.bonus = 1;
  }
}

class Mine extends Item {
  constructor() {
    super();
    this.img.src = "img/mine.png";
    this.bonus = -5;
  }
}

class Poison extends Item {
  constructor() {
    super();
    this.img.src = "img/poison.png";
  }

  wasEaten() {
    game.end();
  }
}

document.addEventListener("keydown", () => {
  if (event.key === 'ArrowLeft' && snake.dir !== "right")
    snake.dir = "left";
  if (event.key === 'ArrowRight' && snake.dir !== "left")
    snake.dir = "right";
  if (event.key === 'ArrowUp' && snake.dir !== "down")
    snake.dir = "up";
  if (event.key === 'ArrowDown' && snake.dir !== "up")
    snake.dir = "down";
});


const getGonfig = async (config) => {
  const response = await fetch(config);
  const data = await response.json();

  snake.color = data["snakeColor"];
  game.ground.src = data["imgGround"];
}

getGonfig(config);

document.addEventListener('endGame', () => game.end());

game.init();
const gameInterval = setInterval(() => { game.run(); game.update() }, 200);
 





