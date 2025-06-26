const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const gameOverlay = document.getElementById('game-overlay');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('final-score');
const restartButton = document.getElementById('restartButton');
const easyBtn = document.getElementById('easyBtn');
const mediumBtn = document.getElementById('mediumBtn');
const hardBtn = document.getElementById('hardBtn');

// 設置 Canvas 尺寸
canvas.width = 600;
canvas.height = 700;

// 遊戲參數
const BUBBLE_RADIUS = 20;
const BUBBLE_DIAMETER = BUBBLE_RADIUS * 2;
const SQRT3 = Math.sqrt(3); // 用於六邊形網格計算

const BUBBLE_COLORS = ['#ff6f61', '#6b5b95', '#88b04b', '#f7cac9', '#92a8d1', '#d64550']; // 更多樣的顏色
const SHOOTER_Y = canvas.height - BUBBLE_RADIUS * 2 - 10; // 發射器Y座標
let SHOOTER_SPEED = 15; // 射出泡泡的速度
let MAX_INITIAL_ROWS = 5; // 初始泡泡行數 (根據難度調整)
let GAME_OVER_ROW_THRESHOLD = 17; // 遊戲結束的行數（實際泡泡所在的最大行索引）

let score = 0;
let bubbles = []; // 遊戲板上的泡泡
let currentShooterBubble = null;
let nextShooterBubble = null;
let animationFrameId;
let isGameOver = false;
let gameStarted = false;

// 六邊形網格參數
const HEX_GRID_WIDTH = Math.floor(canvas.width / BUBBLE_DIAMETER); // 列數
const HEX_GRID_HEIGHT = Math.floor(canvas.height / (BUBBLE_RADIUS * SQRT3)); // 行數 (近似)
let gameGrid = []; // 二維陣列，儲存泡泡物件或 null

// 音效
const bgMusic = new Audio('assets/bg_music.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.3; // 背景音樂音量
const shootSound = new Audio('assets/shoot.mp3');
shootSound.volume = 0.6;
const popSound = new Audio('assets/pop.mp3');
popSound.volume = 0.8;
const bounceSound = new Audio('assets/bounce.mp3');
bounceSound.volume = 0.5;
const gameOverSound = new Audio('assets/gameover.mp3');
gameOverSound.volume = 0.7;
const dropSound = new Audio('assets/drop.mp3');
dropSound.volume = 0.5;


// 輔助函數：生成隨機顏色
function getRandomColor() {
    return BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
}

// 根據六邊形網格座標計算實際像素位置
function getPixelCoords(gridX, gridY) {
    let pixelX = gridX * BUBBLE_DIAMETER + BUBBLE_RADIUS;
    let pixelY = gridY * BUBBLE_RADIUS * SQRT3 + BUBBLE_RADIUS;

    // 奇數行向右偏移半個泡泡直徑
    if (gridY % 2 !== 0) {
        pixelX += BUBBLE_RADIUS;
    }
    return { x: pixelX, y: pixelY };
}

// 根據像素位置計算最近的六邊形網格座標
function getGridCoords(pixelX, pixelY) {
    let approximateGridY = Math.round((pixelY - BUBBLE_RADIUS) / (BUBBLE_RADIUS * SQRT3));
    let offsetX = 0;
    if (approximateGridY % 2 !== 0) {
        offsetX = BUBBLE_RADIUS;
    }
    let approximateGridX = Math.round((pixelX - BUBBLE_RADIUS - offsetX) / BUBBLE_DIAMETER);

    return { row: approximateGridY, col: approximateGridX };
}

// 泡泡類別
class Bubble {
    constructor(x, y, color, gridRow = -1, gridCol = -1) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = BUBBLE_RADIUS;
        this.vx = 0; // 速度向量 x
        this.vy = 0; // 速度向量 y
        this.isMoving = false;
        this.isFixed = false; // 是否已固定在網格上
        this.gridRow = gridRow;
        this.gridCol = gridCol;
    }

    draw() {
        // 繪製漸變色泡泡
        const gradient = ctx.createRadialGradient(this.x, this.y, 5, this.x, this.y, this.radius);
        gradient.addColorStop(0, '#ffffff'); // 中心亮點
        gradient.addColorStop(0.7, this.color);
        gradient.addColorStop(1, '#000000'); // 邊緣陰影

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'; // 高光邊緣
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }

    update() {
        if (this.isMoving) {
            this.x += this.vx;
            this.y += this.vy;

            // 碰撞左右牆壁反彈
            if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
                this.vx *= -1;
                this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x)); // 防止卡牆
                bounceSound.play();
            }

            // 碰撞頂部牆壁
            if (this.y - this.radius < 0) {
                this.y = this.radius;
                this.isMoving = false; // 停止移動，固定
                this.isFixed = true;
                this.snapToGrid();
            }
        }
    }

    // 將移動中的泡泡固定到網格上
    snapToGrid() {
        if (!this.isMoving && !this.isFixed) return;

        let { row, col } = getGridCoords(this.x, this.y);

        // 確保在有效範圍內
        row = Math.max(0, Math.min(HEX_GRID_HEIGHT - 1, row));
        col = Math.max(0, Math.min(HEX_GRID_WIDTH - 1, col));

        // 檢查目標位置是否已有泡泡，如果有的話，往上找最近的空位
        while (row >= 0 && gameGrid[row] && gameGrid[row][col]) {
            row--;
        }
        if (row < 0) { // 如果已經到達最頂部還是沒找到，視為遊戲結束
            endGame();
            return;
        }

        if (gameGrid[row] && gameGrid[row][col] === null) {
            this.gridRow = row;
            this.gridCol = col;
            gameGrid[row][col] = this;
            this.isMoving = false;
            this.isFixed = true;

            let pixelCoords = getPixelCoords(this.gridCol, this.gridRow);
            this.x = pixelCoords.x;
            this.y = pixelCoords.y;

            // 檢查消除
            checkAndRemoveBubbles(this.gridRow, this.gridCol, this.color);
            generateShooterBubbles(); // 準備下一個泡泡
        } else {
            // 如果無法固定，可能是邏輯問題或遊戲結束
            endGame(); // 臨時處理，需要更精確的碰撞固定邏輯
        }
    }
}

// 初始化遊戲網格
function initGameGrid() {
    gameGrid = [];
    for (let r = 0; r < HEX_GRID_HEIGHT; r++) {
        gameGrid[r] = [];
        for (let c = 0; c < HEX_GRID_WIDTH; c++) {
            gameGrid[r][c] = null;
        }
    }

    // 根據難度生成初始泡泡
    for (let r = 0; r < MAX_INITIAL_ROWS; r++) {
        for (let c = 0; c < HEX_GRID_WIDTH; c++) {
            let { x, y } = getPixelCoords(c, r);
            // 隨機跳過一些位置，讓初始佈局不那麼規則
            if (Math.random() < 0.8) {
                 gameGrid[r][c] = new Bubble(x, y, getRandomColor(), r, c);
            }
        }
    }
}

// 生成射擊泡泡
function generateShooterBubbles() {
    currentShooterBubble = new Bubble(canvas.width / 2, SHOOTER_Y, getRandomColor());
    // 預覽泡泡在右下角
    nextShooterBubble = new Bubble(canvas.width - BUBBLE_RADIUS * 2, canvas.height - BUBBLE_RADIUS * 2, getRandomColor());
}

// 繪製所有泡泡
function drawBubbles() {
    for (let r = 0; r < HEX_GRID_HEIGHT; r++) {
        for (let c = 0; c < HEX_GRID_WIDTH; c++) {
            if (gameGrid[r][c]) {
                gameGrid[r][c].draw();
            }
        }
    }
    if (currentShooterBubble) currentShooterBubble.draw();
    if (nextShooterBubble) {
        // 繪製下一個泡泡的預覽
        ctx.globalAlpha = 0.5; // 讓預覽泡泡半透明
        nextShooterBubble.draw();
        ctx.globalAlpha = 1.0;
    }
}

// 更新遊戲狀態
function updateGame() {
    if (isGameOver) return;

    if (currentShooterBubble && currentShooterBubble.isMoving) {
        currentShooterBubble.update();

        // 碰撞檢測與固定
        let collided = false;
        for (let r = 0; r < HEX_GRID_HEIGHT; r++) {
            for (let c = 0; c < HEX_GRID_WIDTH; c++) {
                const existingBubble = gameGrid[r][c];
                if (existingBubble && existingBubble.isFixed) { // 只檢查固定的泡泡
                    const dist = Math.sqrt(
                        (currentShooterBubble.x - existingBubble.x) ** 2 +
                        (currentShooterBubble.y - existingBubble.y) ** 2
                    );

                    if (dist < currentShooterBubble.radius + existingBubble.radius - 1) { // 稍微減小半徑防止過度重疊
                        collided = true;
                        currentShooterBubble.isFixed = true; // 標記為固定
                        currentShooterBubble.snapToGrid();
                        popSound.play(); // 碰撞後發出消除音效
                        break; // 處理完一個碰撞就退出
                    }
                }
            }
            if (collided) break;
        }
    }

    // 檢查遊戲結束線
    for (let c = 0; c < HEX_GRID_WIDTH; c++) {
        const bubble = gameGrid[GAME_OVER_ROW_THRESHOLD - 1]?.[c]; // 檢查指定行是否已有泡泡
        if (bubble) {
            endGame();
            return;
        }
    }
}

// 檢查並移除相連的同色泡泡
function checkAndRemoveBubbles(startRow, startCol, color) {
    let bubblesToClear = [];
    let visited = new Set(); // 使用 Set 儲存 'row,col' 字串，方便檢查是否訪問過

    function getNeighbors(r, c) {
        const neighbors = [];
        // 六邊形網格的鄰居偏移
        const oddRowOffsets = [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]]; // 奇數行
        const evenRowOffsets = [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]]; // 偶數行

        const offsets = (r % 2 !== 0) ? oddRowOffsets : evenRowOffsets;

        for (const [dr, dc] of offsets) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < HEX_GRID_HEIGHT && nc >= 0 && nc < HEX_GRID_WIDTH) {
                neighbors.push({ r: nr, c: nc });
            }
        }
        return neighbors;
    }

    function findConnected(r, c) {
        const key = `${r},${c}`;
        if (r < 0 || r >= HEX_GRID_HEIGHT || c < 0 || c >= HEX_GRID_WIDTH || visited.has(key) || !gameGrid[r][c] || gameGrid[r][c].color !== color) {
            return;
        }
        visited.add(key);
        bubblesToClear.push({ r, c });

        const neighbors = getNeighbors(r, c);
        for (const neighbor of neighbors) {
            findConnected(neighbor.r, neighbor.c);
        }
    }

    findConnected(startRow, startCol);

    if (bubblesToClear.length >= 3) { // 至少3個才消除
        bubblesToClear.forEach(pos => {
            gameGrid[pos.r][pos.c] = null;
        });
        score += bubblesToClear.length * 10;
        scoreDisplay.textContent = `分數: ${score}`;
        popSound.play();
        dropFloatingBubbles(); // 消除後檢查是否有浮空泡泡
    }
}

// 檢查並使浮空的泡泡下落
function dropFloatingBubbles() {
    let visited = new Set();

    // 找出所有連接到頂部的泡泡
    function getNeighbors(r, c) {
        const neighbors = [];
        const oddRowOffsets = [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];
        const evenRowOffsets = [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]];

        const offsets = (r % 2 !== 0) ? oddRowOffsets : evenRowOffsets;

        for (const [dr, dc] of offsets) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < HEX_GRID_HEIGHT && nc >= 0 && nc < HEX_GRID_WIDTH) {
                neighbors.push({ r: nr, c: nc });
            }
        }
        return neighbors;
    }

    function findConnectedToTop(r, c) {
        const key = `${r},${c}`;
        if (r < 0 || r >= HEX_GRID_HEIGHT || c < 0 || c >= HEX_GRID_WIDTH || visited.has(key) || !gameGrid[r][c]) {
            return;
        }
        visited.add(key);

        const neighbors = getNeighbors(r, c);
        for (const neighbor of neighbors) {
            findConnectedToTop(neighbor.r, neighbor.c);
        }
    }

    // 從頂部開始，標記所有連接的泡泡
    for (let c = 0; c < HEX_GRID_WIDTH; c++) {
        if (gameGrid[0][c]) { // 如果頂部第一行有泡泡
            findConnectedToTop(0, c);
        }
    }

    // 移除所有未被標記的泡泡 (即浮空的泡泡)
    let droppedCount = 0;
    for (let r = 0; r < HEX_GRID_HEIGHT; r++) {
        for (let c = 0; c < HEX_GRID_WIDTH; c++) {
            const key = `${r},${c}`;
            if (gameGrid[r][c] && !visited.has(key)) {
                gameGrid[r][c] = null; // 移除浮空的泡泡
                droppedCount++;
            }
        }
    }
    if (droppedCount > 0) {
        score += droppedCount * 20; // 每個掉落的泡泡加更多分
        scoreDisplay.textContent = `分數: ${score}`;
        dropSound.play();
    }
}


// 遊戲主循環
function gameLoop() {
    if (isGameOver) {
        cancelAnimationFrame(animationFrameId);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height); // 清除畫面
    drawBubbles(); // 繪製所有泡泡
    updateGame(); // 更新遊戲狀態

    animationFrameId = requestAnimationFrame(gameLoop);
}

// 遊戲結束
function endGame() {
    isGameOver = true;
    gameStarted = false;
    cancelAnimationFrame(animationFrameId);
    bgMusic.pause();
    bgMusic.currentTime = 0; // 重置音樂
    gameOverSound.play();

    finalScoreDisplay.textContent = `你的分數是: ${score}`;
    gameOverScreen.classList.remove('hidden');
    gameOverlay.classList.remove('hidden');
}

// 重新開始遊戲
function restartGame() {
    score = 0;
    scoreDisplay.textContent = `分數: ${score}`;
    isGameOver = false;
    gameOverScreen.classList.add('hidden');
    startScreen.classList.remove('hidden'); // 回到難度選擇畫面
    gameOverlay.classList.remove('hidden');
    bgMusic.pause();
    bgMusic.currentTime = 0;
    // 遊戲重新開始時，等待難度選擇後再初始化
}

// 根據難度設定遊戲參數
function setDifficulty(difficulty) {
    switch (difficulty) {
        case 'easy':
            MAX_INITIAL_ROWS = 4;
            SHOOTER_SPEED = 12;
            break;
        case 'medium':
            MAX_INITIAL_ROWS = 6;
            SHOOTER_SPEED = 15;
            break;
        case 'hard':
            MAX_INITIAL_ROWS = 8;
            SHOOTER_SPEED = 18;
            break;
    }
}

// 初始化遊戲
function initGame(difficulty) {
    setDifficulty(difficulty);
    initGameGrid();
    generateShooterBubbles();
    isGameOver = false;
    gameStarted = true;
    startScreen.classList.add('hidden');
    gameOverlay.classList.add('hidden');
    bgMusic.play();
    gameLoop();
}

// 事件監聽：滑鼠點擊發射泡泡
canvas.addEventListener('click', (e) => {
    if (isGameOver || !gameStarted || (currentShooterBubble && currentShooterBubble.isMoving)) {
        return;
    }

    const mouseX = e.clientX - canvas.getBoundingClientRect().left;
    const mouseY = e.clientY - canvas.getBoundingClientRect().top;

    // 計算發射角度和速度分量
    const dx = mouseX - currentShooterBubble.x;
    const dy = mouseY - currentShooterBubble.y; // 這裡 dy 通常為負值，因為要向上射
    const angle = Math.atan2(dy, dx);

    // 限制射擊角度，不能向下射
    if (angle > -Math.PI / 2 + Math.PI / 8 && angle < Math.PI / 2 - Math.PI / 8) { // 稍微限制角度範圍
        // 不允許向下或過於平射
        return;
    }

    currentShooterBubble.vx = SHOOTER_SPEED * Math.cos(angle);
    currentShooterBubble.vy = SHOOTER_SPEED * Math.sin(angle);
    currentShooterBubble.isMoving = true;
    shootSound.play();
});

// 難度選擇按鈕監聽
easyBtn.addEventListener('click', () => initGame('easy'));
mediumBtn.addEventListener('click', () => initGame('medium'));
hardBtn.addEventListener('click', () => initGame('hard'));
restartButton.addEventListener('click', restartGame);

// 初始顯示開始畫面
gameOverlay.classList.remove('hidden');
startScreen.classList.remove('hidden');
gameOverScreen.classList.add('hidden');