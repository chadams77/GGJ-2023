window.game = {};

window.TouchStart = function(e) {
    e = e || window.event;
    let touches = e.touches;
    if (!touches || !touches.length) {
        return;
    }
    game.touchDown = true;
    game.touchStartT = game.time;
    game.touchStartX = touches[0].clientX;
    game.touchStartY = touches[0].clientY;
};

window.TouchEnd = function(e) {
    e = e || window.event;
    let touches = e.touches;
    if (!touches || !touches.length) {
        return;
    }
    game.touchDown = false;
};

window.TouchMove = function(e) {
    e = e || window.event;
    game.touchDown = true;
    game.touchNewX = e.clientX;
    game.touchNewY = e.clientY;
};

window.MouseStart = function(e) {
    e = e || window.event;
    game.touchDown = true;
    game.touchStartT = game.time;
    game.touchStartX = e.clientX;
    game.touchStartY = e.clientY;
};

window.MouseEnd = function(e) {
    e = e || window.event;
    game.touchDown = false;
};

window.MouseMove = function(e) {
    e = e || window.event;
    if (game.touchDown) {
        game.touchNewX = e.clientX;
        game.touchNewY = e.clientY;
    }
};

window.RunGame = function () {
    
    game.time = 0.;
    game.dt = 1/60;

    game.canvas = document.createElement('canvas');
    game.width = window.innerWidth;
    game.height = window.innerHeight;
    game.canvas.width = game.width;
    game.canvas.height = game.height;
    game.canvas.style.position = "fixed";
    game.canvas.style.left = "0px";
    game.canvas.style.top = "0px";
    game.canvas.style.width = "100%";
    game.canvas.style.height = "100%";
    game.canvas.className = 'game-canvas';
    document.body.appendChild(game.canvas);
    game.ctx = game.canvas.getContext('2d');

    game.ground = new Ground(256);
    game.ground.updateRender(game.ctx);

    game.windRain = new WindRain(200, 100, 48);
    game.bugs = new Bugs();

    game.trees = [
        new Tree(game.ground.toScreenX(64), game.ground.toScreenY(64), 1234567, 20.),
        new Tree(game.ground.toScreenX(32), game.ground.toScreenY(32), 1234561, 15.),
        new Tree(game.ground.toScreenX(96), game.ground.toScreenY(96), 1234562, 15.),
        new Tree(game.ground.toScreenX(128), game.ground.toScreenY(128), 1234562, 20.)
    ];

    document.addEventListener('touchstart', TouchStart, false);
    document.addEventListener('touchend', TouchEnd, false);
    document.addEventListener('touchmove', TouchMove, false);

    document.addEventListener('mousedown', MouseStart, false);
    document.addEventListener('mouseup', MouseEnd, false);
    document.addEventListener('mousemove', MouseMove, false);

    Tick();

};

window.Tick = function() {

    if (game.touchDown && (game.time - game.touchStartT) > 0.5) {
        game.touchDown = false;
    }

    if (game.touchDown) {
        let dx = game.touchNewX - game.touchStartX,
            dy = game.touchNewY - game.touchStartY;
        for (let k=0; k<5; k++) {
            game.windRain.applyForce((game.touchStartX + game.touchNewX) * 0.5, (game.touchStartY + game.touchNewY) * 0.5, dx, dy);
        }
    }

    window.setTimeout(Tick, 1000 * game.dt);
    game.ctx.clearRect(0, 0, game.width, game.height);
    game.time += game.dt;
   
    game.windRain.updateRender(game.ctx, game.dt);
    game.ground.updateRender(game.ctx, game.dt);

    game.infectedB = 0;
    game.totalB = 0;
    for (let tree of game.trees) {
        tree.updateRender(game.ctx, game.dt);
    }

    game.ctx.font = '32px Trebuchet MS';
    game.ctx.fillStyle = '#F88';
    game.ctx.fillText(`Infection: ${Math.floor(100*game.infectedB/Math.max(game.totalB, 1))}%`, 24, 24 + 28);

    game.bugs.updateRender(game.ctx, game.dt);

};