const arena = document.getElementById('game-arena');
const arenaWidth = 800;
const arenaHeight = 500;

// Доступ через querySelector и querySelectorAll
const leftPaddle = document.querySelector('#left-paddle');
const rightPaddle = document.querySelector('#right-paddle');
const ball = document.querySelector('#ball');
const scores = document.querySelectorAll('.score'); // Коллекция
const p1ScoreElem = scores[0];
const p2ScoreElem = scores[1];

const messageScreen = document.getElementById('message-screen');
const settingsScreen = document.getElementById('settings-screen');
const effectsLayer = document.getElementById('effects-layer');


// getAttribute, setAttribute, hasAttribute)
let p1Score = 0, p2Score = 0;
let isPlaying = false;
let p1Y = 205, p2Y = 205;
let ballX = 391, ballY = 241, ballVX = 0, ballVY = 0;

// Настройки (читаем из DOM или задаем дефолтные)
let paddleSpeed = 7;
let baseBallSpeed = 4;
let currentPaddleHeight = 90;

arena.setAttribute('data-game-state', 'menu');
if (arena.hasAttribute('data-difficulty')) {
    arena.removeAttribute('data-difficulty');
}
arena.setAttribute('data-difficulty', 'normal');

const keys = { w: false, s: false, ArrowUp: false, ArrowDown: false };

window.addEventListener('keydown', (e) => {
    if (e.key in keys) {
        keys[e.key] = true;
        e.preventDefault(); // Запрещаем скролл страницы стрелками
    }
    // объект Promise
    if (e.code === 'Space' && arena.getAttribute('data-game-state') !== 'playing') {
        startGameWithPromise();
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
});
//mouse events, focus, blur

const btnSettings = document.getElementById('btn-settings');
const btnApply = document.getElementById('btn-apply-settings');
const speedSlider = document.getElementById('speed-slider');
const sizeSlider = document.getElementById('size-slider');

btnSettings.addEventListener('click', (e) => {
    e.stopPropagation(); // stopPropagation
    console.log(`Клик по настройкам. Время события (timestamp): ${e.timeStamp}`);
    showSettingsScreen();
});

btnApply.addEventListener('click', () => {
    baseBallSpeed = parseInt(speedSlider.value);
    currentPaddleHeight = parseInt(sizeSlider.value);
    
    // style, свойства узлов
    leftPaddle.style.height = `${currentPaddleHeight}px`;
    rightPaddle.style.height = `${currentPaddleHeight}px`;
    
    hideSettingsScreen();
    startGameWithPromise();
});

//focus, blur
arena.addEventListener('blur', () => {
    if (isPlaying) {
        isPlaying = false;
        arena.setAttribute('data-game-state', 'paused');
        showMessage("ПАУЗА", "Кликните для продолжения");
    }
});

arena.addEventListener('focus', () => {
    if (arena.getAttribute('data-game-state') === 'paused') {
        isPlaying = true;
        arena.setAttribute('data-game-state', 'playing');
        messageScreen.style.display = 'none';
    }
});

// touch events

const touchZoneLeft = document.getElementById('touch-zone-left');
const touchZoneRight = document.getElementById('touch-zone-right');

function handleTouch(e) {
    e.preventDefault(); 
    const touch = e.touches[0];
    const rect = arena.getBoundingClientRect();
    const relativeY = touch.clientY - rect.top;
    
    // Определяем, какая ракетка движется, через target (Event.target)
    if (e.target.id === 'touch-zone-left') {
        p1Y = Math.max(0, Math.min(arenaHeight - currentPaddleHeight, relativeY - currentPaddleHeight / 2));
    } else if (e.target.id === 'touch-zone-right') {
        p2Y = Math.max(0, Math.min(arenaHeight - currentPaddleHeight, relativeY - currentPaddleHeight / 2));
    }
}

// Привязка через on*-свойства 
touchZoneLeft.ontouchmove = handleTouch;
touchZoneRight.ontouchmove = handleTouch;
touchZoneLeft.ontouchstart = (e) => { if(!isPlaying) startGameWithPromise(); };

// CustomEvent, dispatchEvent
// событие "Мяч отбит"
const ballHitEvent = new CustomEvent('ballHit', {
    bubbles: true, 
    detail: { player: 0, speed: 0 }
});

function triggerBallHit(player, speed) {
    ballHitEvent.detail.player = player;
    ballHitEvent.detail.speed = speed;
    arena.dispatchEvent(ballHitEvent); // Генерируем событие
}

arena.addEventListener('ballHit', (e) => {
    console.log(`Кастомное событие! Игрок: ${e.detail.player}, Скорость: ${e.detail.speed.toFixed(2)}`);
    // Демонстрация работы со связями DOM (parentNode, nextSibling)
    const scoreDiv = e.target.querySelector(`#p${e.detail.player}-score`);
    if (scoreDiv && scoreDiv.parentNode) {
        // центральный разделитель или второй счет
        const nextEl = scoreDiv.nextElementSibling; 
        console.log('Родитель счетчика:', scoreDiv.parentNode.className);
    }
});

// Динамический DOM (append, removeChild, replaceWith, animationend)

function startGameWithPromise() {
    // Обертываем ожидание старта в Promise 
    const startPromise = new Promise((resolve) => {
        messageScreen.style.display = 'none';
        settingsScreen.style.display = 'none';
        isPlaying = true;
        arena.setAttribute('data-game-state', 'playing');
        arena.focus(); // Возвращаем фокус, чтобы сработал blur при потере
        resetBall(Math.random() > 0.5 ? 1 : -1);
        resolve("Игра запущена");
    });

    startPromise.then(msg => console.log(msg));
}

function showSettingsScreen() {
    messageScreen.style.display = 'none';
    settingsScreen.style.display = 'block';
}
function hideSettingsScreen() {
    settingsScreen.style.display = 'none';
}
function showMessage(title, sub) {
    document.getElementById('msg-title').innerText = title; // textContent/innerText
    document.getElementById('msg-sub').innerText = sub;
    messageScreen.style.display = 'block';
}

function resetBall(direction) {
    ballX = (arenaWidth - 18) / 2;
    ballY = (arenaHeight - 18) / 2;
    const angle = (Math.random() * 40 - 20) * (Math.PI / 180);
    ballVX = direction * baseBallSpeed * Math.cos(angle);
    ballVY = baseBallSpeed * Math.sin(angle);
}

// Динамическое создание DOM-элементов при голе (append, removeChild, replaceWith)
function createScorePopup(x, y, text) {
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = text;
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    
    effectsLayer.append(popup); // append

    // Обработка не-пользовательского события окончания анимации (animationend)
    popup.addEventListener('animationend', (e) => {
        console.log('Анимация завершена, элемент:', e.target);
        popup.remove(); //remove 
    });
}

function checkWinState(lastLoserDirection) {
    if (p1Score >= 11 || p2Score >= 11) {
        isPlaying = false;
        arena.setAttribute('data-game-state', 'ended');
        
        // replaceWith
        const oldTitle = document.getElementById('msg-title');
        const newTitle = document.createElement('h2');
        newTitle.id = 'msg-title';
        newTitle.innerText = p1Score >= 11 ? "ИГРОК 1 ПОБЕДИЛ!" : "ИГРОК 2 ПОБЕДИЛ!";
        oldTitle.replaceWith(newTitle); // Заменяем узел
        
        document.getElementById('msg-sub').innerText = "Нажмите ПРОБЕЛ или кликните";
        messageScreen.style.display = 'block';
        
        p1Score = 0; p2Score = 0;
        p1ScoreElem.innerText = 0; p2ScoreElem.innerText = 0;
    } else {
        resetBall(lastLoserDirection);
    }
}

function update() {
    if (isPlaying) {
        // Движение ракеток
        if (keys.w) p1Y = Math.max(0, p1Y - paddleSpeed);
        if (keys.s) p1Y = Math.min(arenaHeight - currentPaddleHeight, p1Y + paddleSpeed);
        if (keys.ArrowUp) p2Y = Math.max(0, p2Y - paddleSpeed);
        if (keys.ArrowDown) p2Y = Math.min(arenaHeight - currentPaddleHeight, p2Y + paddleSpeed);

        leftPaddle.style.top = `${p1Y}px`;
        rightPaddle.style.top = `${p2Y}px`;

        ballX += ballVX; ballY += ballVY;

        // Отскок от стен
        if (ballY <= 0) { ballY = 0; ballVY = -ballVY; } 
        else if (ballY >= arenaHeight - 18) { ballY = arenaHeight - 18; ballVY = -ballVY; }

        // Отскок от левой ракетки
        if (ballVX < 0 && ballX <= 36 && ballX >= 20) {
            if (ballY + 18 >= p1Y && ballY <= p1Y + currentPaddleHeight) {
                ballX = 36; ballVX = -ballVX * 1.05;
                ballVY += ((ballY + 9) - (p1Y + currentPaddleHeight / 2)) * 0.1;
                triggerBallHit(1, Math.abs(ballVX)); // Кастомное событие
            }
        }

        // Отскок от правой ракетки
        if (ballVX > 0 && ballX + 18 >= arenaWidth - 36 && ballX + 18 <= arenaWidth - 20) {
            if (ballY + 18 >= p2Y && ballY <= p2Y + currentPaddleHeight) {
                ballX = arenaWidth - 36 - 18; ballVX = -ballVX * 1.05;
                ballVY += ((ballY + 9) - (p2Y + currentPaddleHeight / 2)) * 0.1;
                triggerBallHit(2, Math.abs(ballVX)); // Кастомное событие
            }
        }

        // Голы
        if (ballX < 0) {
            p2Score++; p2ScoreElem.innerText = p2Score;
            createScorePopup(arenaWidth / 2 - 20, arenaHeight / 2, "+1 P2");
            checkWinState(-1);
        } else if (ballX > arenaWidth) {
            p1Score++; p1ScoreElem.innerText = p1Score;
            createScorePopup(arenaWidth / 2 - 20, arenaHeight / 2, "+1 P1");
            checkWinState(1);
        }

        ball.style.left = `${ballX}px`;
        ball.style.top = `${ballY}px`;
    }
    requestAnimationFrame(update);
}

// Клик по арене для возобновления (если на паузе из-за blur)
arena.addEventListener('click', () => {
    if (!arena.matches(':focus')) arena.focus();
});

update();

    
