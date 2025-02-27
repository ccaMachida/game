'use strict';

//ゲーム表示領域の要素取得
const canvas = document.getElementById("gameCanvas");
// 二次元描画を行うためのオブジェクト読み込み
const context = canvas.getContext("2d");
// キャンバスの背景色を黒に設定
canvas.style.backgroundColor = 'black';

// スコアの表示要素取得
const scoreElement = document.getElementById('score');
// スコアを管理する変数
let score = 0;
let scoreRanking = [];

// 初期設定の残機数の定数
const defaultMyShipNum = 5;
// 残機数の表示要素取得
const missCountElement = document.getElementById('restShip');
// 残機数を管理する変数
let restMyShip = defaultMyShipNum;
// 残機数を表示する関数
function updateRestMyShip() {
    missCountElement.innerText = '';
    for (let i=0; i < restMyShip-1; i++){
        missCountElement.insertAdjacentHTML('beforeend','<i class="bi bi-airplane-engines-fill me-1"></i>');
    }
}
// 残機数を減らす関数
function decreaseRestMyShip() {
    restMyShip--;
    // 表示している残機数を更新
    updateRestMyShip();
}
// 残機数を画面上に表示するために関数を一度呼び出し
updateRestMyShip();

// 自機用クラス
class Character {
    constructor (posX, posY, spd, collisionSize, statAlive, canShot) {
        this.posX = posX;
        this.posY = posY;
        this.spd = spd;
        this.collisionSize = collisionSize;
        this.statAlive = statAlive;
        this.canShot = canShot;
    }

    // 自機描画メソッド
    drawCharacter() {
        context.beginPath();
        context.fillStyle = "gold";
        context.font = '30px bootstrap-icons';
        context.fillText('\uF7CA', this.posX - 15, this.posY + 10);
        // キャラクター（当たり判定の実体）を円で描画
        context.arc(this.posX, this.posY, this.collisionSize / 2, 0, Math.PI * 2);
        context.closePath();
        // キャラクターの当たり判定部分の色を設定
        context.fillStyle = 'rgba(255,0,0,.5)';
        context.fill();
    }
}

// 弾クラス
class Bullet {
    constructor (spd, collisionSize, shootInterval) {
        this.bullets = [];
        this.spd = spd;
        this.collisionSize = collisionSize;
        this.shootInterval = shootInterval;
    }
/*　----------
クラス呼び出し時にプロパティで与える
// // 弾丸の初期設定
// const bulletRadius = 5;
// // 自機の弾の速度
// const bulletSpeed = 10;
---------- */

    // 弾生成メソッド
    createBullet(x,y,angle,spd){
        this.bullets.push({
            bPosX : x,
            bPosY : y,
            angle : angle,
            spd : spd
        });
        return this.bullets;
    }

    // 弾移動メソッド
    updateBullets(bullets) {
        bullets.forEach((bullet, index) => {
            const { bPosX, bPosY, angle, spd } = bullet;
            const dx = Math.cos(angle) * spd;
            const dy = Math.sin(angle) * spd;
            bullet.bPosX = bPosX + dx;
            bullet.bPosY = bPosY + dy;

            // 画面外に出た弾を削除
            if (bullet.bPosY < 0 || bullet.bPosX < 0 || bullet.bPosX > canvas.width) {
                this.bullets.splice(index, 1);
            }
        });
    }

    // 弾描画メソッド
    drawBullets (bullet, bulletRadius) {
        const { bPosX, bPosY } = bullet;
        context.fillStyle = "cyan";
        context.beginPath();
        context.arc(bPosX, bPosY, bulletRadius, 0, Math.PI * 2);
        context.fill();
        context.closePath();
    }

    // 発射弾メソッド
    /* -----
    弾の種類に応じた発射にしたい
    ----- */
    // shootBullet(bulletKind){
    //     switch (bulletKind) {
    //         case 'lazer': // レーザー
    //             break;
    //         case 'homing': // ホーミング
    //             break;
    //         default: // 3way
    //             for (let i = -1; i <= 1; i++) {
    //                 const angle = -Math.PI / 2 + (i * Math.PI) / 6; // 上方向から左右に15度ずつずらす
    //                 bullets.push({ x: myShip.posX, y: myShip.posY, angle, speed: bulletSpeed });
    //             }
    //             break;
    //     }
    //     canShoot = false; // 発射後、再発射を制限
    //     setTimeout(() => {
    //         canShoot = true; // 一定時間後に再発射を許可
    //     }, shootInterval);
    // }
}

// 敵クラス
class Enemy {
    constructor (
        // posX, // x軸位置情報
        // posY, // y軸位置情報
        // spd, // 移動速度
        // collisionSize, // 当たり判定サイズ
        ) {
        // this.posX = posX;
        // this.posY = posY;
        // this.spd = spd;
        // this.collisionSize = collisionSize;

        this.enemies = []; // 位置情報・速度・サイズなどオブジェクト化して入れる
        this.bSpd = 2;
        this.shootInterval = 0;
        this.canShot = false;
        this.eBullets = []; // 敵弾情報を管理する
    }

    // 敵描画メソッド
    drawEnemy(enemy){
        const e = enemy;
        context.beginPath();
        // 見た目部分のデザイン
        context.scale(1,-1);
        context.fillStyle = "green";
        context.font = `${e.size}px bootstrap-icons`;
        context.fillText('\uF1DB', e.x - e.size/2, -(e.y - e.size/2));
        context.setTransform(1,0,0,1,0,0);
        // 当たり判定の実態の視覚化
        // context.arc(e.x, e.y, e.size / 2, 0, Math.PI * 2);
        // context.fillStyle = 'rgba(255,0,0,.5)';
        context.fill();
        context.closePath();
    }

    // 敵弾発射メソッド
    initAimingBullet(
        ex,ey, // 発射する敵の位置
        mx,my, // ターゲットとなる自機の位置
        spd, // 弾の速さ
    ){
        // 弾の座標を設定
        let x = ex;
        let y = ey;

        let vx;
        let vy;

        // 目標までの距離dを求める
        let d = Math.sqrt((mx - ex) * (mx - ex) + (my - ey) * (my - ey));

        // 速さが一定値speedになるように速度(vx,vy)を求める
        // 目標までの距離dが0のときには下方向に発射する。
        if (d) {
            vx = (mx - ex)/d*spd;
            vy = (my - ey)/d*spd;
        } else {
            vx = 0;
            vy = spd;
        }

        return {x,y,vx,vy};
    }

    // 敵弾移動メソッド
    moveAimingBullet(
        x,y, // 弾の座標
        vx,vy // 弾の速度
    ){
        // 弾の座標(x,y)に速度(vx,vy)を加える
        x += vx;
        y += vy;

        return {x,y};
    }

    // 敵弾描画メソッド
    drawEnemyBullet(enemyBullet,bulletSize){
        const eb = enemyBullet;
        const ebSize = bulletSize;
        context.beginPath();
        context.fillStyle = "magenta";
        context.arc(eb.x, eb.y, ebSize / 2, 0, Math.PI * 2);
        context.fill();
        context.closePath();
    }
}

// 背景オブジェクトクラス
class bgObj {
    constructor () {
        // this.gridWidth = 20; // 1マスの幅 20px
        // this.gridHeight = 20; // 1マスの高さ 20px
        // this.maxX = 20; // 横20マス
        // this.maxY = 26; // 縦26マス
        // this.scrollSpd = 1; // 速度1（秒間20pxぐらいにしたい）
        this.backgroundStars = []; // 位置情報・速度・サイズなどオブジェクト化して入れる
    }

    // // 敵配置設定メソッド
    // setEnemymap(){
    //     // JSONデータで敵配置マップを作成して読み込む
    //     const stage1 = [
    //         [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    //         [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    //         [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    //         [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    //         [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    //         [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    //         [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    //         [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    //         [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    //         [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    //         [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    //         [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    //         [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    //         [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    //         [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0]
    //     ];
    // }
    // // 敵配置読み込みメソッド
    // loadEnemymap(){
    //     // 敵配置を読み込んで画面上に配置する
    // }
    // // 敵配置移動メソッド
    // moveEnemymap(){
    //     // 読み込んだ敵を移動させる
    // }

    // 背景生成メソッド
    createBackGround(){
        if (Math.random() < 0.1) { // 背景オブジェクトをランダムに生成
            const backGroundStarsX = Math.random() * canvas.width; // ランダムなX座標
            const backGroundStarsY = 0; // 画面上端から出現
            const speed = Math.random() * 2 + 1;
            this.backGroundStars.push({ x: backGroundStarsX, y: backGroundStarsY, spd: speed });
        }
    }
    // 背景描画メソッド
    drawBackGround(){
        // 背景オブジェクトを描画
        context.fillStyle = "rgba(255,255,255,.5)";
        this.backGroundStars.forEach((bgs) => {
            context.beginPath();
            context.arc(bgs.x, bgs.y, starsRadius, 0, Math.PI * 2);
            context.fill();
            context.closePath();
        });
    }
    // 背景移動メソッド
    moveBackGround(){
        this.backGroundStars.forEach((bgs, index) => {
            bgs.y += bgs.spd;                

            // 画面外に出た背景オブジェクトを削除
            if (bgs.y > canvas.height) {
                this.backGroundStars.splice(index, 1);
            }
        });
    }
}

// ゲームの初期化処理
function init() {
    // キーの状態を保持するオブジェクト
    const keys = {};

    // イベントリスナーの設定
    // キーが押されたとき
    document.addEventListener('keydown', function (event) {
        event.preventDefault();
        keys[event.key] = true;
    });
    // キーが離されたとき
    document.addEventListener('keyup', function (event) {
        keys[event.key] = false;
    });

    // 自機の初期設定
    const myShip = new Character(
        canvas.width / 2, // 初期位置 x
        canvas.height - 50, // 初期位置 y
        5, // 移動速度
        4, // キャラクターの当たり判定のサイズ
        true, // 生存フラグ
        true // 弾発射可能フラグ
    );

    // 弾丸の初期設定
    const myBullet = new Bullet;
    // 自機の弾の大きさを定数で設定
    const myBulletRadius = 5;

    // 敵オブジェクトの初期設定
    const enemy = new Enemy;
    // 敵の弾の大きさを定数で設定
    const ebSize = 5;

    // 背景オブジェクトの初期設定
    const backGroundStars = [];
    const starsRadius = 1;

    // 衝突判定
    function checkCollisions() {
        // 自機の弾 と 敵
        for (let i = 0; i < myBullet.bullets.length; i++) {
            for (let j = 0; j < enemy.enemies.length; j++) {
                const bullet = myBullet.bullets[i];
                const e = enemy.enemies[j];

                // 自機の弾 と 敵 の距離を計算
                const distance = Math.sqrt(
                    (bullet.bPosX - e.x) ** 2 + (bullet.bPosY - e.y) ** 2
                );

                // 自機の弾 が 敵 に当たった場合
                if (distance < myBulletRadius + e.size / 2) {
                    // 当たった自機の弾 と 敵 を削除
                    myBullet.bullets.splice(i, 1);
                    enemy.enemies.splice(j, 1);
                    i--; // 弾が削除されたので、インデックスを調整
                    
                    // スコアを更新
                    score += 100;
                    scoreElement.innerText = "SCORE " + score;
                    
                    break; // 弾丸が1つの敵にしか当たらないため、内側のループを終了
                }
            }
        }

        // 敵 と 自機 の当たり判定
        for (let i = 0; i < enemy.enemies.length; i++) {
            const e = enemy.enemies[i];

            // 自機と敵の距離を計算
            const distance = Math.sqrt(
                (myShip.posX - e.x) ** 2 + (myShip.posY - e.y) ** 2
            );

            // 自機が敵に当たった場合
            if (distance < myShip.collisionSize + e.size / 2 && myShip.statAlive) {
                // 自機を消去
                myShip.statAlive = false;
                // 残機数を減らす
                decreaseRestMyShip();
                // 自機などを初期位置に戻す
                resetCharacter();

                // ここでゲームオーバー処理を行う関数を呼び出すなどの処理を追加する
                if (restMyShip <= 0) {
                    gameOver();
                }
            }
        }

        // 敵弾 と 自機 の当たり判定
        for (let i = 0; i < enemy.eBullets.length; i++) {
            const eb = enemy.eBullets[i];

            // 自機と敵弾の距離を計算
            const distance = Math.sqrt(
                (myShip.posX - eb.x) ** 2 + (myShip.posY - eb.y) ** 2
            );

            // 自機が敵弾に当たった場合
            if (distance < myShip.collisionSize + ebSize / 2 && myShip.statAlive) {
                // 自機を消去
                myShip.statAlive = false;
                // 残機数を減らす
                decreaseRestMyShip();
                // 自機などを初期位置に戻す
                resetCharacter();

                // ここでゲームオーバー処理を行う関数を呼び出すなどの処理を追加する
                if (restMyShip <= 0) {
                    gameOver();
                }
            }
        }
    }

    // ミス時に自機と敵を初期位置に戻す関数
    function resetCharacter() {
        // 自機情報のリセット
        myShip.posX = canvas.width / 2;
        myShip.posY = canvas.height - 50;
        myShip.statAlive = true;

        // 敵情報のリセット
        enemy.enemies.length = 0;

        // 弾情報のリセット
        myBullet.bullets.length = 0;

        // 敵弾情報のリセット
        enemy.eBullets.length = 0;
    }

    // ゲームオーバー関数
    function gameOver() {
        keys['Space'] = keys[' '] = keys['ArrowUp'] = keys['ArrowDown'] = keys['ArrowLeft'] = keys['ArrowRight'] = null;

        let name = window.prompt('GAME OVER! 10文字以内で名前を入力してください');

        judgeName(name);

        // 名前の内容を判定する関数
        function judgeName(targetName) {
            const nameLength = String(targetName).length;
            if (nameLength > 10){
                // 文字数が10文字を超える場合、再入力させる
                name = window.prompt('名前は10文字以内で名前を入力してください');
                judgeName(name);
            } else if (targetName === null || nameLength === 0){
                // 名前が空欄でOKが押されたか、キャンセルボタンが押されたとき、特定の名前を入れる
                name = 'cca';
            } else {
                // 上記以外の時は何もしない
            }
        }
        
        // スコアランキング配列に名前と得点を入れる
        scoreRanking.push({name, score});
        // 配列をスコアで降順に並び替える
        scoreRanking.sort((a , b) => b.score - a.score);
        console.log(scoreRanking);

        // ランキング表示エリアに今表示されているものをいったんすべて消す
        const ranking = document.querySelectorAll('.ranking');
        ranking.forEach(function(item, index){
            item.remove();
        });

        // ランキング表の表示領域にランキング情報を入れ込む
        const rankingTbl = document.getElementById('rankingTbl');
        scoreRanking.forEach(function(item, index){
            if (index < 10) {
                rankingTbl.insertAdjacentHTML('beforeend', 
                `<div class="mt-1 ranking rank${index+1}"><div class="rank">${index+1}</div><div class="name">${item.name}</div><div class="score pe-1">${item.score}</div></div>`
                );
            }
        });

        restMyShip = defaultMyShipNum;
        updateRestMyShip();
        score = 0;
        scoreElement.innerText = "Score: " + score;
    }

    // ゲームの更新処理
    function updateGame() {
        // 自機の移動
        if (keys['ArrowUp'] && myShip.posY - myShip.collisionSize > 0) {
            myShip.posY -= myShip.spd;
        }
        if (keys['ArrowDown'] && myShip.posY + myShip.collisionSize < canvas.height) {
            myShip.posY += myShip.spd;
        }
        if (keys['ArrowLeft'] && myShip.posX - myShip.collisionSize > 0) {
            myShip.posX -= myShip.spd;
        }
        if (keys['ArrowRight'] && myShip.posX + myShip.collisionSize < canvas.width) {
            myShip.posX += myShip.spd;
        }

        // 自機の弾のインターバル
        // 一度弾を撃つと0.1秒経たないと次の弾を撃てない
        myBullet.shootInterval = 100; // 100ミリ秒（=0.1秒）

        // 自機の弾の速度
        const bulletSpeed = 10;

        // スペースキーで発射
        if ((keys[' '] || keys['Space']) && myShip.canShot) {
            // 3発同時に発射
            for (let i = -1; i <= 1; i++) {
                const angle = -Math.PI / 2 + (i * Math.PI) / 6; // 上方向から左右に15度ずつずらす
                myBullet.createBullet(
                    myShip.posX,
                    myShip.posY,
                    angle,
                    bulletSpeed
                );
            }
            myShip.canShot = false; // 発射後、再発射を制限
            setTimeout(() => {
                myShip.canShot = true; // 一定時間後に再発射を許可
            }, myBullet.shootInterval);
        }

        // 弾丸を移動
        myBullet.updateBullets(myBullet.bullets);

        // 敵オブジェクトの生成
        if (Math.random() < 0.1) { // 敵オブジェクトをランダムに生成
            const enemyX = Math.random() * canvas.width; // ランダムなX座標
            const enemyY = 0; // 画面上端から出現
            const enemySpd = Math.random() * 2 + 1;
            const enemySize = Math.random() * 20 + 10;
            enemy.enemies.push({
                x: enemyX,
                y: enemyY,
                spd: enemySpd,
                size: enemySize,
                bSpd: enemy.bSpd,
                eShootInterval: enemy.shootInterval,
                canShot: enemy.canShot
            });
        }

        // 敵オブジェクトの移動
        enemy.enemies.forEach((e, index) => {
            e.y += e.spd;
            e.eShootInterval++;

            if (e.eShootInterval >= 60){
                e.eShootInterval = 0;
                enemy.eBullets.push(enemy.initAimingBullet(e.x, e.y, myShip.posX, myShip.posY, e.bSpd));
            }

            // 画面外に出た敵オブジェクトを削除
            if (e.y > canvas.height) {
                enemy.enemies.splice(index, 1);
            }
        });

        enemy.eBullets.forEach((eb, index) => {
            eb.x += eb.vx;
            eb.y += eb.vy;

            // 画面外に出た敵弾オブジェクトを削除
            if (eb.y < 0 || eb.x < 0 || eb.x > canvas.width) {
                enemy.eBullets.splice(index, 1);
            }
        });
        
        // 背景オブジェクトの生成
        if (Math.random() < 0.1) { // 背景オブジェクトをランダムに生成
            const backGroundStarsX = Math.random() * canvas.width; // ランダムなX座標
            const backGroundStarsY = 0; // 画面上端から出現
            const speed = Math.random() * 2 + 1;
            backGroundStars.push({ x: backGroundStarsX, y: backGroundStarsY, spd: speed });
        }

        // 背景オブジェクトの移動
        backGroundStars.forEach((bgs, index) => {
            bgs.y += bgs.spd;                

            // 画面外に出た背景オブジェクトを削除
            if (bgs.y > canvas.height) {
                backGroundStars.splice(index, 1);
            }
        });

        /* -----
        描画処理
　        画面をクリア
　        背景
　        自機の弾
　        自機
　        敵
　        敵の弾
        の順で表示処理
        ----- */

        // ゲーム画面をクリア
        context.clearRect(0, 0, canvas.width, canvas.height);

        // 背景オブジェクトを描画
        context.fillStyle = "rgba(255,255,255,.5)";
        backGroundStars.forEach((bgs) => {
            context.beginPath();
            context.arc(bgs.x, bgs.y, starsRadius, 0, Math.PI * 2);
            context.fill();
            context.closePath();
        });

        // 自機の弾を描画
        myBullet.bullets.forEach((bullet) => {
            myBullet.drawBullets(bullet, myBulletRadius);
        });

        // 自機の生存状態に応じて自機を描画
        if (myShip.statAlive) {
            myShip.drawCharacter();
        }

        // 敵オブジェクトを描画
        enemy.enemies.forEach((e) => {
            enemy.drawEnemy(e);
        });

        // 敵弾オブジェクトを描画
        enemy.eBullets.forEach((eb) => {
            enemy.drawEnemyBullet(eb,ebSize);
        });

        // 衝突判定を実行
        checkCollisions();

        // ゲームループを再起呼び出し
        requestAnimationFrame(updateGame);
    }

    // 初期化後、ゲームループを開始
    updateGame();
}

// ゲームの初期化を呼び出し
init();