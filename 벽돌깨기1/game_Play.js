var canvas = document.getElementById("game-canvas");
var ctx = canvas.getContext("2d");
var canvasX = canvas.offsetLeft;
var game = null; //Game 클래스 객체
var g_level = 0; //현재 레벨 상태
var ballSpeeds = [6, 7, 10];
var brickData; //현재 벽돌 데이터
var myReq; //rAF 아이디
var ring = 0; //링 개수
var supersonic = 0; //슈퍼소닉 아이템
var darksonic = 0; //다크소닉 아이템
var Knuckles = 0; //너클즈 아이템
var is_supersonic = false; //슈퍼소닉 상태
var is_darksonic = false; //다크소닉 상태

//레벨 을 인자로 받아 게임 시작
function startGame(level) {
  if (myReq) cancelAnimationFrame(myReq);
  g_level = level;
  brickData = mkBricks(g_level);
  game = new Game(g_level);
  mainLoop();
}

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const BALL_RADIUS = 20;
const PADDLE_WIDTH = 150;
const PADDLE_HEIGHT = 30;
const PADDLE_X = (WIDTH - PADDLE_WIDTH) / 2;
const PADDLE_Y = HEIGHT - PADDLE_HEIGHT - 10;

/**변수로 볼 이미지, paddle 이미지 추가후 생성자 수정 필요 **/
//이미지들
var ballImg = new Image(30, 30);
ballImg.src = "sonic/sonic_ball-0.png";
var ring_img = new Image();
ring_img.src = "ring-sonic.gif";
var supersonic_img = new Image();
supersonic_img.src = "supersonic/supersonic_ball-0.png";
var darksonic_img = new Image();
darksonic_img.src = "darksonic_ball-0.png";
var Knuckles_img = new Image();
Knuckles_img.src = "Knuckles/Knuckles_ball-0.png";
var paddle_img = new Array(3);
for (var i = 0; i < 3; i++) {
  paddle_img[i] = new Image();
  paddle_img[i].src = "paddle/paddle" + (i + 1) + ".png";
}

/**임시 색상 **/
const COLOR = "dogerblue";
/**data(brick 배치) 레벨별로 디자인 후 정의 필요 **/
/**임시 data **/

//브릭데이터 생성
function mkBricks(level) {
  if (level == 1) {
    var row = 3;
    var col = 5;
    var data = [];
    for (var r = 0; r < row; r++) {
      var line = new Array(col);
      for (var c = 0; c < col; c++) {
        if (c % 2) line[c] = new Brick("red", 2);
        //아이템 랜덤 생성시 브릭을 매번 생성해줘야됨
        else line[c] = new Brick("blue", 1);
      }
      data.push(line);
    }
    return data;
  }
  if (level == 2) {
    var row = 3;
    var col = 5;
    var data = [];
    for (var r = 0; r < row; r++) {
      var line = new Array(col);
      for (var c = 0; c < col; c++) {
        if (c % 2) line[c] = new Brick("red", 2);
        else line[c] = new Brick("blue", 2);
      }
      data.push(line);
    }
    return data;
  }
  if (level == 3) {
    var row = 5;
    var col = 10;
    var data = [];
    for (var r = 0; r < row; r++) {
      var line = new Array(col);
      for (var c = 0; c < col; c++) {
        if (c % 2) line[c] = new Brick("yellow", 2);
        else line[c] = new Brick("blue", 2);
      }
      data.push(line);
    }
    return data;
  }
}
//배경 설정
function setBackground(level) {
  var back = document.getElementById("back-ground");
  var url = "background/lv" + level + ".gif";
  back.style.backgroundImage = "url(" + url + ")";
  back.style.backgroundRepeat = "no-repeat";
  back.style.backgroundSize = "cover";
}

//공
class Ball {
  constructor(x, y, radius, speed, angle) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.speed = speed;
    this.setAngle(angle);
    this.count = 0;
    this.is_sonic = true;
  }
  setAngle(angle) {
    var radian = (angle / 180) * Math.PI;
    this.mx = this.speed * Math.cos(radian);
    this.my = -this.speed * Math.sin(radian);
  }
  move(k) {
    this.x = this.x + this.mx * k;
    this.y = this.y + this.my * k;
  }

  get collideX() {
    if (this.mx > 0) return this.x + this.radius;
    else return this.x - this.radius;
  }

  get collideY() {
    if (this.my > 0) return this.y + this.radius;
    else return this.y - this.radius;
  }

  collideWall(left, top, right) {
    if (this.mx < 0 && this.collideX < left) this.mx *= -1;
    if (this.mx > 0 && this.collideX > right) this.mx *= -1;
    if (this.my < 0 && this.collideY < top) this.my *= -1;
  }

  draw(ctx) {
    //소닉 이미지 변경
    if (this.is_sonic) {
      //소닉일때
      if (is_supersonic)
        ballImg.src = "supersonic/supersonic_ball-" + this.count + ".png";
      else ballImg.src = "sonic/sonic_ball-" + this.count + ".png";
      if (this.count == 7) this.count = 0;
      else this.count++;
      ctx.beginPath();
      ctx.drawImage(
        ballImg,
        this.x - this.radius,
        this.y - this.radius,
        2 * this.radius,
        2 * this.radius
      );
      ctx.closePath();
    } else {
      //너클즈일때
      Knuckles_img.src = "Knuckles/Knuckles_ball-" + this.count + ".png";
      if (this.count == 4) this.count = 0;
      else this.count++;
      ctx.beginPath();
      ctx.drawImage(
        Knuckles_img,
        this.x - this.radius,
        this.y - this.radius,
        2 * this.radius,
        2 * this.radius
      );
      ctx.closePath();
    }
  }
}

//패들
class Paddle {
  constructor(x, y, width, height, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.halfWidth = width / 2;
    this.height = height;
    this.color = color;
  }

  get center() {
    return this.x + this.halfWidth;
  }

  collide(ball) {
    var yCheck = () =>
      this.y - ball.radius < ball.y && ball.y < this.y + ball.radius;
    var xCheck = () => this.x < ball.x && ball.x < this.x + this.width;
    if (ball.my > 0 && yCheck() && xCheck()) {
      const hitPos = ball.x - this.center;
      var angle = 80 - (hitPos / this.halfWidth) * 60;
      ball.setAngle(angle);
    }
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.drawImage(
      paddle_img[g_level - 1],
      this.x,
      this.y,
      this.width,
      this.height
    );
    ctx.closePath();
  }
}

//브릭
class Brick {
  constructor(color, hp) {
    this.color = color;
    this.hp = hp;
    //아이템들 추가
    this.has_ring = Math.random() > 0.7;
    if (!this.has_ring) this.has_supersonic = Math.random() > 0.9;
    if (!this.has_ring && !this.has_supersonic)
      this.has_darksonic = Math.random() > 0.9;
    if (!this.has_ring && !this.has_supersonic && !this.has_darksonic)
      this.has_Knuckles = Math.random() > 0.95;
  }
}

//브릭데이터를 기반으로 실시간 브릭처리
class Bricks {
  /**(Brick)data = Brick의 2차원 배열, 없으면 value=0 **/
  constructor(data, x, y, width, height) {
    this.rows = data.length;
    this.cols = data[0].length;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.brickWidth = width / this.cols;
    this.brickHeight = height / this.rows;
    this.data = data;
    this.count = 0;
    for (var r = 0; r < this.rows; r++)
      for (var c = 0; c < this.cols; c++) if (data[r][c]) this.count++;
  }
  collide(x_Ball, y_Ball) {
    var row = Math.floor((y_Ball - this.y) / this.brickHeight);
    var col = Math.floor((x_Ball - this.x) / this.brickWidth);
    if (row < 0 || row >= this.rows) return false;
    if (col < 0 || col >= this.cols) return false;
    if (this.data[row][col]) {
      //부딪혔을 때 아이템이 들어있을 시 아이템+1
      if (this.data[row][col].has_ring) {
        ring++;
        document.getElementById("ring_count").innerText = ring;
      } else if (this.data[row][col].has_supersonic) {
        supersonic++;
        document.getElementById("supersonic_count").innerText = supersonic;
      } else if (this.data[row][col].has_darksonic) {
        darksonic++;
        document.getElementById("darksonic_count").innerText = darksonic;
      } else if (this.data[row][col].has_Knuckles) {
        Knuckles++;
        document.getElementById("Knuckles_count").innerText = Knuckles;
      }
      //블럭 없애기
      this.data[row][col] = 0;
      this.count--;
      return true;
    } else return false;
  }
  draw(ctx) {
    ctx.strokeStyle = "lightgray";
    for (var r = 0; r < this.rows; r++) {
      for (var c = 0; c < this.cols; c++) {
        if (!this.data[r][c]) continue;
        var x_Brick = this.x + this.brickWidth * c;
        var y_Brick = this.y + this.brickHeight * r;
        ctx.beginPath();
        ctx.fillStyle = this.data[r][c].color; //이미지로 수정!
        ctx.fillRect(x_Brick, y_Brick, this.brickWidth, this.brickHeight);
        ctx.strokeRect(x_Brick, y_Brick, this.brickWidth, this.brickHeight);
        ctx.closePath();
        //블럭에 아이템이 들어있을 시 아이템 이미지 삽입
        if (this.data[r][c].has_ring) {
          ctx.drawImage(
            ring_img,
            x_Brick + this.brickWidth / 2 - 20,
            y_Brick + this.brickHeight / 2 - 15,
            40,
            30
          );
        }
        if (this.data[r][c].has_supersonic) {
          ctx.drawImage(
            supersonic_img,
            x_Brick + this.brickWidth / 2 - 18,
            y_Brick + this.brickHeight / 2 - 18,
            36,
            36
          );
        }
        if (this.data[r][c].has_darksonic) {
          ctx.drawImage(
            darksonic_img,
            x_Brick + this.brickWidth / 2 - 18,
            y_Brick + this.brickHeight / 2 - 18,
            36,
            36
          );
        }
        if (this.data[r][c].has_Knuckles) {
          ctx.drawImage(
            Knuckles_img,
            x_Brick + this.brickWidth / 2 - 18,
            y_Brick + this.brickHeight / 2 - 18,
            36,
            36
          );
        }
      }
    }
  }
}
var mouseX; //상대적(canvas) x좌표

function onMouseMove(e) {
  mouseX = e.pageX - canvasX;
  if (canvasX + PADDLE_WIDTH / 2 >= e.pageX) mouseX = PADDLE_WIDTH / 2;
  if (e.pageX >= WIDTH + canvasX - PADDLE_WIDTH / 2)
    mouseX = WIDTH - PADDLE_WIDTH / 2;
}
canvas.addEventListener("mousemove", onMouseMove, false);

//키보드 입력으로 아이템 사용
document.addEventListener("keydown", (e) => {
  const key = e.key;
  if (key == "1") {
    //슈퍼소닉 사용
    if (supersonic > 0) {
      is_supersonic = true;
      supersonic--;
      document.getElementById("supersonic_count").innerText = supersonic;
      //슈퍼소닉 5초유지
      setTimeout(function () {
        is_supersonic = false;
      }, 5000);
    }
  }
  if (key == "2") {
    //다크소닉 사용
    is_darksonic = true;
  }
  if (key == "3") {
    //너클즈 사용
    if (Knuckles > 0) {
      game.ball[1] = new Ball(
        game.paddle.center,
        PADDLE_Y - BALL_RADIUS,
        BALL_RADIUS,
        ballSpeeds[game.level - 1],
        80
      );
      game.ball[1].is_sonic = false;
      Knuckles--;
      document.getElementById("Knuckles_count").innerText = Knuckles;
    }
  }
});

class Game {
  constructor(level) {
    var brickSettings = [brickData, 0, 50, WIDTH, 150];

    this.level = level;

    this.state = "start"; //게임의 현재 상태("start" / "play" // "end" // "clear")
    this.timeCount = 0;
    this.paddle = new Paddle(
      PADDLE_X,
      PADDLE_Y,
      PADDLE_WIDTH,
      PADDLE_HEIGHT,
      COLOR
    );
    this.ball = [];
    this.ball[0] = new Ball(
      this.paddle.center,
      PADDLE_Y - BALL_RADIUS,
      BALL_RADIUS,
      ballSpeeds[level - 1],
      80
    );
    this.ball[1] = null;
    this.bricks = new Bricks(...brickSettings);
    setBackground(level);
  }

  update() {
    if (this.state == "start") {
      this.timeCount++;
      if (this.timeCount >= 100) this.state = "play";
      return;
    }
    if (this.state != "play") return;

    this.paddle.x = mouseX - PADDLE_WIDTH / 2;

    //공의 벽이나 패들과의 충돌 여부 확인(for문 -> 정확도 높임)
    const DIV = 10;
    for (var i = 0; i < DIV; i++) {
      this.ball[0].move(1 / DIV);
      this.ball[0].collideWall(0, 0, WIDTH);
      this.paddle.collide(this.ball[0]);
      if (this.bricks.collide(this.ball[0].collideX, this.ball[0].y)) {
        if (!is_supersonic) {
          this.ball[0].mx *= -1;
        }
      }
      if (this.bricks.collide(this.ball[0].x, this.ball[0].collideY)) {
        if (!is_supersonic) {
          this.ball[0].my *= -1;
        }
      }
      //너클즈가 존재한다면
      if (this.ball[1] != null) {
        this.ball[1].move(1 / DIV);
        this.ball[1].collideWall(0, 0, WIDTH);
        this.paddle.collide(this.ball[1]);
        if (this.bricks.collide(this.ball[1].collideX, this.ball[1].y)) {
          this.ball[1].mx *= -1;
        }
        if (this.bricks.collide(this.ball[1].x, this.ball[1].collideY)) {
          this.ball[1].my *= -1;
        }
      }
    }
    //승리, 실패 조건
    if (this.ball[0].y > HEIGHT + this.ball[0].radius) {
      //링이 남아 있을시
      if (ring > 0) {
        //this.paddle.x=PADDLE_X;
        this.ball[0].x = this.paddle.center;
        this.ball[0].y = PADDLE_Y - BALL_RADIUS;
        this.ball[0].setAngle(80);
        ring--;
        document.getElementById("ring_count").innerText = ring;
        is_supersonic = false;
        is_darksonic = false;
      } else {
        this.state = "end";
      }
    }
    //너클즈가 떨어진다면 삭제
    if (this.ball[1] != null) {
      if (this.ball[1].y > HEIGHT + this.ball[1].radius) {
        this.ball[1] = null;
      }
    }
    if (this.bricks.count == 0) {
      if (g_level == 1) game.state = "go2Lv2";
      if (g_level == 2) game.state = "go2Lv3";
      else game.state = "clear";
    }
  }

  draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    this.paddle.draw(ctx);
    this.ball[0].draw(ctx);
    if (this.ball[1] != null) {
      this.ball[1].draw(ctx);
    }
    this.bricks.draw(ctx);
  }
}
//임시 결과창 함수
function resultScreen(result) {
  ctx.font = "bold 70px arial";
  ctx.fillStyle = "red";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(result, WIDTH / 2, HEIGHT / 2);
}

//반복 함수
function mainLoop() {
  myReq = requestAnimationFrame(mainLoop);
  game.update();
  game.draw();
  if (game.state == "end") resultScreen("END");
  if (game.state == "go2Lv2") resultScreen("go2Lv2");
  if (game.state == "go2Lv3") resultScreen("go2Lv3");
  if (game.state == "clear") resultScreen("CLEAR");
}

/**임시 버튼 **/
document.getElementById("Lv1").onclick = () => startGame(1);
document.getElementById("Lv2").onclick = () => startGame(2);
document.getElementById("Lv3").onclick = () => startGame(3);
