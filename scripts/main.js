window.game = {};

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

    game.ground = new Ground(128);
    game.ground.updateRender(game.ctx);

    game.testTree = new Tree(game.ground.toScreenX(64), game.ground.toScreenY(64), 1234567, 20.);
    game.testTree2 = new Tree(game.ground.toScreenX(32), game.ground.toScreenY(32), 1234561, 10.);
    game.testTree3 = new Tree(game.ground.toScreenX(96), game.ground.toScreenY(96), 1234562, 10.);

    Tick();

};

window.Tick = function() {

    game.ctx.clearRect(0, 0, game.width, game.height);

    game.time += game.dt;

    window.setTimeout(Tick, 1000 * game.dt);

    game.ground.updateRender(game.ctx, game.dt);
    game.testTree.updateRender(game.ctx, game.dt);
    game.testTree2.updateRender(game.ctx, game.dt);
    game.testTree3.updateRender(game.ctx, game.dt);

};