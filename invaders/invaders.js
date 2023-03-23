const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
let audioContext;
let beamBuffer;
let explosionBuffer;
let collisionBuffer;

const initAudio = () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        beamBuffer = createBeamSound();
        explosionBuffer = createExplosionWaveform();
        collisionBuffer = createCollisionWaveform();
    }
}

const createScene = () => {
    const scene = new BABYLON.Scene(engine);
    return scene;
};

const createCameraAndLight = (scene) => {
    // カメラの作成
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI/2, Math.PI/1.2, 40, new BABYLON.Vector3(0, 0, 0), scene);
    // ライトの作成
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, -1, 0), scene);
    light.intensity = 0.7;
};

const createPlayer = (scene) => {
    const player = BABYLON.MeshBuilder.CreateBox("player", { width: 2, height: 1, depth: 1 }, scene);
    player.position.y = -8;
    player.material = new BABYLON.StandardMaterial("playerMaterial", scene);
    player.material.diffuseColor = new BABYLON.Color3(0, 0, 1);
    return player;
};

const spawnEnemy = (scene) => {
    const minPositionX = -10; // スポーン可能なX軸の最小値
    const maxPositionX = 10; // スポーン可能なX軸の最大値
    const positionY = 10; // スポーンするY軸の位置（奥）

    // X軸のランダムな位置を決定
    const positionX = Math.random() * (maxPositionX - minPositionX) + minPositionX;

    const enemy = BABYLON.MeshBuilder.CreateBox("enemy", { size: 1 }, scene);
    enemy.position = new BABYLON.Vector3(positionX, positionY, 0);
    enemy.scaling.y = 0.5;
    enemy.material = new BABYLON.StandardMaterial("enemyMat", scene);
    enemy.material.diffuseColor = BABYLON.Color3.Red();

    return enemy;
};

const spawnInterval = 200; // 敵がスポーンする間隔（ミリ秒）

setInterval(() => {
    if (gameStatus === 'playing') {
        const enemy = spawnEnemy(scene);
        enemies.push(enemy);
    }
}, spawnInterval);

const createEnemies = (scene) => {
    const enemies = [];
    return enemies;
};

const createBullet = (scene, player) => {
    const bullet = BABYLON.MeshBuilder.CreateCylinder("bullet", { height: 2, diameter: 0.5, tessellation: 12 }, scene);
    bullet.position = player.position.clone();
    bullet.position.y += 1;
    bullet.material = new BABYLON.StandardMaterial("bulletMaterial", scene);
    bullet.material.diffuseColor = new BABYLON.Color3(0, 1, 0);
    return bullet;
};

const createGUI = () => {
    const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    const startButton = BABYLON.GUI.Button.CreateSimpleButton("startButton", "Start");
    startButton.width = 0.2;
    startButton.height = "40px";
    startButton.color = "white";
    startButton.cornerRadius = 20;
    startButton.background = "green";
    startButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    startButton.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    startButton.top = "-40px";

    const gameOverText = new BABYLON.GUI.TextBlock();
    gameOverText.text = "Game Over";
    gameOverText.color = "red";
    gameOverText.fontSize = 72;
    gameOverText.isVisible = false; // 非表示にしておく
    advancedTexture.addControl(gameOverText);

    let score = 0;
    const scoreText = new BABYLON.GUI.TextBlock();
    scoreText.text = `Score: ${score}`;
    scoreText.color = "white";
    scoreText.fontSize = 24;
    scoreText.top = "-300px";
    scoreText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    scoreText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    advancedTexture.addControl(scoreText);

    // 敵を倒したときにスコアを増やす
    const increaseScore = () => {
        score += 1;
        scoreText.text = `Score: ${score}`;
    };

    // スコアをリセットする
    const resetScore = () => {
        score = 0;
        scoreText.text = `Score: ${score}`;
    };

    startButton.onPointerUpObservable.add(() => {
        resetScore();
        startButton.isVisible = false;
        gameOverText.isVisible = false;
        gameStatus = 'playing'
        initAudio();
        playBGM();
    });

    advancedTexture.addControl(startButton);


   return {
     showStartButton: () => {
    		startButton.isVisible = true;
     },
     showGameOverText: () => {
        gameOverText.isVisible = true;
     },
     increaseScore,
     resetScore,
   }
};

let gameStatus = 'title'
const scene = createScene();
createCameraAndLight(scene);
const player = createPlayer(scene);
const enemies = createEnemies(scene);
const uiController = createGUI(scene);

let keys = {};
scene.actionManager = new BABYLON.ActionManager(scene);
scene.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
        keys[evt.sourceEvent.key] = true;
    })
);
scene.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
        keys[evt.sourceEvent.key] = false;
    })
);

const createBeamSound = () => {
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(1, sampleRate * 0.01, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleRate; i++) {
        const t = i / sampleRate;
        data[i] = Math.sin(2 * Math.PI * t * (500 + 700 * t)) * Math.exp(-3 * t);
    }
    return buffer;
};
const createExplosionWaveform = () => {
    const sampleRate = audioContext.sampleRate;
    const bufferLength = Math.floor(sampleRate * 0.5);
    const buffer = audioContext.createBuffer(1, bufferLength, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferLength; i++) {
        const t = i / sampleRate;
        const r = Math.random() * 2 - 1;
        const freq = 150 - 120 * t; // 周波数成分を調整
        data[i] = r * Math.exp(-3 * t) * Math.sin(2 * Math.PI * t * freq);
    }

    return buffer;
};

const createCollisionWaveform = () => {
    const sampleRate = audioContext.sampleRate;
    const bufferLength = Math.floor(sampleRate );
    const buffer = audioContext.createBuffer(1, bufferLength, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferLength; i++) {
        const t = i / sampleRate;
        const r = Math.random() * 2 - 1;
        const freq = 440 + 100 * t;
        data[i] = r * Math.exp(-10 * t) * Math.sin(2 * Math.PI * t * freq);
    }

    return buffer;
};



const playSound = (buffer, vol = 0.05) => {
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain(); // ゲインノードを追加

    source.buffer = buffer;
    gainNode.gain.value = vol; // 音量を下げる（0.05に設定）

    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    source.start();


};

const createBGMWaveform = () => {
    const sampleRate = audioContext.sampleRate;
    const bufferLength = Math.floor(sampleRate * 1); // 1秒間の波形データ
    const buffer = audioContext.createBuffer(1, bufferLength, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferLength; i++) {
        const t = i / sampleRate;
        const freq = 110 * Math.pow(2, (Math.floor(5 * t) % 12) / 12);
        data[i] = 0.1 * Math.sin(2 * Math.PI * t * freq);
    }

    return buffer;
};

let bgmSource;
const playBGM = () => {
    bgmSource = audioContext.createBufferSource();
    bgmSource.buffer = createBGMWaveform();
    bgmSource.connect(audioContext.destination);
    bgmSource.loop = true; // ループ再生を有効にする
    bgmSource.start();
};

let bullet;
let bulletFired = false;
const updatePlayerAndBullet = (player) => {
    if (keys["ArrowLeft"]) {
        if (player.position.x <= 10) {
           player.position.x += 0.2;
        }
    }
    if (keys["ArrowRight"]) {
        if (player.position.x >= -10) {
            player.position.x -= 0.2;
        }
    }
    if (keys[" "] && !bulletFired) {
        bullet = createBullet(scene, player);
        bulletFired = true;
    }

    if (bulletFired) {
        playSound(beamBuffer);
        bullet.position.y += 0.5;
        if (bullet.position.y > 10) {
            bullet.dispose();
            bulletFired = false;
        }
    }
};

let direction = 1;
const updateEnemies = (enemies) => {
    for (const enemy of enemies) {
        enemy.position.y -= 0.1 * direction;
    }
};



const checkCollisions = (enemies, bullet) => {
    if (bulletFired) {
        for (let i = 0; i < enemies.length; i++) {
            if (bullet.intersectsMesh(enemies[i], false)) {
                uiController.increaseScore();
                playSound(explosionBuffer, 0.2);
                enemies[i].dispose();
                enemies.splice(i, 1);
                bullet.dispose();
                bulletFired = false;
                break;
            }
        }
    }

    // プレイヤーと敵の衝突判定
    for (let j = 0; j < enemies.length; j++) {
      if (player.intersectsMesh(enemies[j])) {
        // 衝突した場合の処理
        doGameOver();
        break;
     }
    }
};

const clearEnemies = () => {
    for (let enemy of enemies) {
        enemy.dispose();
    }
    enemies.length = 0;
};

const doGameOver = () => {
   playSound(collisionBuffer, 0.7)
   gameStatus = 'gameover'; // ゲームオーバー状態に更新
   clearEnemies();
   uiController.showStartButton();
   uiController.showGameOverText();
       if (bgmSource) {
        bgmSource.stop(); // BGMを停止
        bgmSource = null;
    }
}


engine.runRenderLoop(() => {
    if (gameStatus === 'playing') {
    	updatePlayerAndBullet(player);
    	updateEnemies(enemies);
    	checkCollisions(enemies, bullet);
    }
    scene.render();
});

window.addEventListener("resize", () => {
    engine.resize();
});
