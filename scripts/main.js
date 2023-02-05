window.game = {};

window.InitSound = function () {
    sounds.whenLoaded = function () {
        if (!window.soundInitialized) {
            window.soundInitialized = true;
            game.music = sounds["sfx/music.wav"];
            game.music.loop = true;
            game.music.volume = 0.3;
            game.music.play();   
        }
    };
    if (!window.soundInitialized) {
        sounds.load([
            "sfx/music.wav",
            "sfx/break.wav",
            "sfx/die.wav",
            "sfx/spawn.wav",
            "sfx/wind.wav"
        ])
    }
};

window.PlaySound = function(sfx, x, vol, fadeIn) {
    if (window.soundInitialized) {
        let sound = sounds['sfx/' + sfx + '.wav'];
        sound.volume = vol || 0.85;
        sound.pan = Math.max(-1, Math.min(1, (x - 1250) / 1250)) || 0.;
        sound.playbackRate = Math.random() * 0.2 + 0.9;
        sound.play();
        if (fadeIn) {
            sound.fadeIn(fadeIn);
        }
    }
}

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
    InitSound();
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
    InitSound();
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
    game.canvas.style.position = 'absolute';
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

    game.totalBugs = 0;

    document.addEventListener('touchstart', TouchStart, false);
    document.addEventListener('touchend', TouchEnd, false);
    document.addEventListener('touchmove', TouchMove, false);

    document.addEventListener('mousedown', MouseStart, false);
    document.addEventListener('mouseup', MouseEnd, false);
    document.addEventListener('mousemove', MouseMove, false);

    game.startT = 0;
    game.lost = false;

    game.izoomed = false;

    Tick();

};

window.Tick = function() {

    if (game.width != window.innerWidth || game.height != window.innerHeight || !game.izoomed) {

        game.izoomed = true;
        game.width = window.innerWidth;
        game.height = window.innerHeight;
        game.canvas.width = 2500;
        game.canvas.height = 2500 * (window.innerHeight / window.innerWidth);

        document.body.style.zoom = game.width / 2500;
    }

    if (game.touchDown && (game.time - game.touchStartT) > 1.0) {
        game.touchDown = false;
    }

    if (game.touchDown && !game.lost) {
        let dx = game.touchNewX - game.touchStartX,
            dy = game.touchNewY - game.touchStartY;
        for (let k=0; k<5; k++) {
            game.windRain.applyForce((game.touchStartX + game.touchNewX) * 0.5 / document.body.style.zoom, (game.touchStartY + game.touchNewY) * 0.5 / document.body.style.zoom, dx, dy);
        }
        if (Math.random() < (1/4))
        PlaySound("wind", game.touchNewX, 2 * Math.sqrt(dx*dx+dy*dy) / 10000);
    }

    window.setTimeout(Tick, 1000 * game.dt);
    game.ctx.clearRect(0, 0, game.canvas.width, game.canvas.height);
    game.time += game.dt;
   
    game.windRain.updateRender(game.ctx, game.dt);
    game.ground.updateRender(game.ctx, game.dt);

    game.infectedB = 0;
    game.totalB = 0;
    for (let tree of game.trees) {
        tree.updateRender(game.ctx, game.dt);
    }

    game.bugs.updateRender(game.ctx, game.dt);

    game.ctx.font = '32px Trebuchet MS';
    game.ctx.fillStyle = '#F88';
    game.ctx.fillText(`Infection: ${Math.floor(100*game.infectedB/Math.max(game.totalB, 1))}%`, 24, 24 + 28);
    game.ctx.fillStyle = '#FF8';
    game.ctx.fillText(`Score: ${game.totalBugs * 1000}`, 24, 32 + 24 + 28);
    game.ctx.fillStyle = '#FF8';
    game.ctx.fillText(`Stage: ${game.bugs.stage}`, 24, 32 + 24 + 28 + 30);

    game.startT += game.dt;
    if (game.startT < 5) {
        game.ctx.globalAlpha = Math.pow((5 - game.startT) / 5, 0.35);
        game.ctx.font = '72px Trebuchet MS';
        game.ctx.fillStyle = '#2F2';
        game.ctx.textAlign = 'center';
        game.ctx.fillText(`GAWN WIT TEH WYND`, game.canvas.width * 0.5, game.canvas.height * 0.35 - 48);
        game.ctx.font = '12px Trebuchet MS';
        game.ctx.fillStyle = '#2F2';
        game.ctx.textAlign = 'center';
        game.ctx.fillText(`by Chris Adams`, game.canvas.width * 0.5, game.canvas.height * 0.35 - 32);
        game.ctx.font = '64px Trebuchet MS';
        game.ctx.fillStyle = '#8F8';
        game.ctx.textAlign = 'center';
        game.ctx.fillText(`Protect the Trees. Swipe for wind.`, game.canvas.width * 0.5, game.canvas.height * 0.35 + 28);
        game.ctx.globalAlpha = 1;
        game.ctx.textAlign = 'left';
    }

    if (game.infectedB >= game.totalB && !game.lost && game.totalB > 10) {
        game.lost = true;
        game.lostT = 0;
        if (game.music) {
            game.music.fadeOut(0.5);
            PlaySound('die', null, 0.25, 0.2);
        }
    }

    if (game.lost) {
        game.lostT += game.dt;
        if (game.lostT < 15) {
            game.ctx.globalAlpha = Math.pow((15 - game.lostT)/15, 0.35) * Math.pow(game.lostT / 15, 0.2);
            game.ctx.font = '64px Trebuchet MS';
            game.ctx.fillStyle = '#F44';
            game.ctx.textAlign = 'center';
            game.ctx.fillText(`Failure... Final Score: ${game.totalBugs * 1000}`, game.canvas.width * 0.5, game.canvas.height * 0.35 + 28);
            game.ctx.globalAlpha = 1;
            game.ctx.textAlign = 'left';
        }
        else {
            window.location.reload();
        }
    }

};