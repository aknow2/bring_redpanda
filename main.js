const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const gridSize = 40;
const rows = canvas.height / gridSize;
const cols = canvas.width / gridSize;
const house = {
  x: 3,
  y: 3,
}
const initPlayerInfo =  {
    x: 2,
    y: 2,
    dx: 1,
    dy: 0,
    body: [],
    bodySize: 0
};

let player = {
  ...initPlayerInfo,
  body: []
};

let item = { x: 0, y: 0 };
let score = 0;
let speed = 150;
let lastTime = 0;

let playerImage;
let itemImage;
let houseImage;

async function init() {
    try {
        playerImage = await loadImage('player.png');
        itemImage = await loadImage('redpanda.png');
        houseImage = await loadImage('house.png');
    } catch (err) {
        console.error('画像の読み込みに失敗しました:', err);
        return;
    }

    updateScoreDisplay();
    spawnItem();
    gameLoop();
}

function gameLoop(timestamp) {
    let deltaTime = timestamp - lastTime;
    if (deltaTime > speed) {
        movePlayer();
        checkCollisions();
        drawGame();
        updateScoreDisplay();
        lastTime = timestamp;
    }
    requestAnimationFrame(gameLoop);
}

const movePlayer = () => {
    const nextX = player.x + player.dx;
    const nextY = player.y + player.dy;

    player.body.push({ x: player.x, y: player.y, dx: player.dx, dy: player.dy });

    if (player.body.length > player.bodySize) {
        player.body.shift();
    }

    console.log(player.dx, player.dy)
    player.x = nextX;
    player.y = nextY;
}

const checkCollisions = () => {
    if (player.x < 0 || player.x >= cols || player.y < 0 || player.y >= rows) {
        gameOver();
        return;
    }

    for (let part of player.body) {
        if (part.x === player.x && part.y === player.y) {
            gameOver();
            return;
        }
    }

    if (player.x === item.x && player.y === item.y) {
        player.bodySize++;
        score++;
        spawnItem();
        speed = speed * 0.99;
        console.log(speed)
        
    }

    if (player.x === house.x && player.y === house.y) {
        score += Math.floor(player.bodySize * player.bodySize / 2);
        player.bodySize = 0;
        player.body = [];
    }
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);


    drawImage(player, playerImage)
    
    
    for (let part of player.body) {
        drawImage(part, itemImage)
    }

    ctx.drawImage(itemImage, item.x * gridSize, item.y * gridSize, gridSize, gridSize);


    ctx.drawImage(houseImage, house.x * gridSize, house.y * gridSize, gridSize, gridSize);
}

function spawnItem() {
    do {
        item.x = Math.floor(Math.random() * cols);
        item.y = Math.floor(Math.random() * rows);
    } while (player.body.some(part => part.x === item.x && part.y === item.y));
}

function gameOver() {
    alert('Score is ' + score)
    player = {
      ...initPlayerInfo,
      body: []
    };
    speed = 150;
    score = 0;
    spawnItem();
    updateScoreDisplay();
}

document.addEventListener('keydown', (e) => {
    e.preventDefault();
    if (e.key === 'ArrowUp') {
        player.dx = 0;
        player.dy = -1;
    } else if (e.key === 'ArrowDown') {
        player.dx = 0;
        player.dy = 1;
    } else if (e.key === 'ArrowLeft') {
        player.dx = -1;
        player.dy = 0;
    } else if (e.key === 'ArrowRight') {
        player.dx = 1;
        player.dy = 0;
    }

});


let touchStartX = 0;
let touchStartY = 0;
window.addEventListener('touchstart', (event) => {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
});

window.addEventListener('touchend', (event) => {
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        player.dx = deltaX > 0 ? 1 : -1;
        player.dy = 0;
    } else {
        player.dy = deltaY > 0 ? 1 : -1;
        player.dx = 0;
    }
});

function updateScoreDisplay() {
  const element = document.getElementById('score');
  element.textContent = score
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
    });
}
function drawImage(obj, image) {
    ctx.save();
    if (obj.dx > 0) {
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);
        ctx.drawImage(image, (canvas.width - obj.x * gridSize - gridSize), obj.y * gridSize, gridSize, gridSize);
    } else {
        ctx.drawImage(image, obj.x * gridSize, obj.y * gridSize, gridSize, gridSize);
    }
    ctx.restore();
}


init();
