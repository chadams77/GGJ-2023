const MAX_RAIN = 3000;
const RAIN_START = -100;
const RAIN_V0 = 500;

window.WindRain = function(gWidth, gHeight, gSize) {

    this.gWidth = gWidth;
    this.gHeight = gHeight;
    this.gSize = gSize;

    this.hash = {};
    this.prt = [];
    this.rain = [];

    for (let i=0; i<MAX_RAIN; i++) {
        this.rain.push({
            vx: 0,
            vy: RAIN_V0,
            x: Math.random() * gWidth * gSize,
            y: Math.random() * (gHeight * gSize - RAIN_START)
        });
    }

};

WindRain.prototype.getField = function(x, y, me) {

    let ix = Math.floor(x / this.gSize),
        iy = Math.floor(y / this.gSize);

    let ret = {
        vx: 0,
        vy: 0
    };

    for (let kx=ix-2; kx<=ix+2; kx++) {
        for (let ky=iy-2; ky<=iy+2; ky++) {
            const H = this.hash[kx + ',' + ky];
            if (H) {
                for (let P of H) {
                    if (P.id == me.id) {
                        continue;
                    }
                    let dx = me.x - P.x, dy = me.y - P.y;
                    let fdist = Math.sqrt(dx*dx+dy*dy);
                    let ft = Math.pow(Math.max(0, 1. - fdist / this.gSize), 0.25) * 10.;
                    ret.vx += ft * dx;
                    ret.vy += ft * dy;
                }
            }
        }
    }

    return ret;

};

WindRain.prototype.getVelField = function(x, y) {

    let ix = Math.floor(x / this.gSize),
        iy = Math.floor(y / this.gSize);

    let ret = {
        vx: 0,
        vy: 0
    };

    for (let kx=ix-2; kx<=ix+2; kx++) {
        for (let ky=iy-2; ky<=iy+2; ky++) {
            const H = this.hash[kx + ',' + ky];
            if (H) {
                for (let P of H) {
                    let dx = x - P.x, dy = y - P.y;
                    let fdist = Math.sqrt(dx*dx+dy*dy);
                    let ft = Math.pow(Math.max(0, 1. - fdist / this.gSize), 0.25) * 10.;
                    ret.vx += ft * P.vx;
                    ret.vy += ft * P.vy;
                }
            }
        }
    }

    return ret;

};

WindRain.prototype.updateRender = function(ctx, dt) {

    this.hash = {};

    for (let i=0; i<this.prt.length; i++) {
        const P = this.prt[i];
        P.t -= dt;
        if (P.t <= 0.) {
            this.prt.splice(i, 1); i--; continue;
        }
        P.x += P.vx * dt;
        P.y += P.vy * dt;
        P.vx -= P.vx * dt * 0.25;
        P.vy -= P.vy * dt * 0.25;
        if (P.x < 0.) {
            P.x = 0.;
            P.vx = -P.vx;
        }
        if (P.y < 0.) {
            P.y = 0.;
            P.vy = -P.vy;
        }
        if (P.x > (this.gWidth * this.gSize)) {
            P.x = (this.gWidth * this.gSize);
            P.vx = -P.vx;
        }
        if (P.y > (this.gHeight * this.gSize)) {
            P.y = (this.gHeight * this.gSize);
            P.vy = -P.vy;
        }
        if (game.ground.isUnderground(P.x, P.y)) {
            P.y -= P.vy * dt * 2;
            P.vy = -P.vy * 0.1;
        }
        let key = Math.floor(P.x / this.gSize) + ',' + Math.floor(P.y / this.gSize);
        (this.hash[key] = this.hash[key] || []).push({...P});
    }

    for (let i=0; i<this.prt.length; i++) {
        const P = this.prt[i];
        const F = this.getField(P.x, P.y, P);
        P.vx += F.vx * dt;
        P.vy += F.vy * dt;

        // debug draw
        /*ctx.globalAlpha = Math.min(1, P.t) * 0.5;
        ctx.beginPath();
        ctx.fillStyle = '#8080F0';
        ctx.arc(P.x, P.y, this.gSize, 0, Math.PI*2);
        ctx.fill();*/
    }

    let ftemp = {};

    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#8080F0';
    for (let i=0; i<this.rain.length; i++) {
        const R = this.rain[i];
        let wf = this.getVelField(R.x, R.y);
        let lx = R.x, ly = R.y;
        R.x += R.vx * dt;
        R.y += R.vy * dt;
        R.vx += wf.vx * dt * 0.05;
        R.vy += wf.vy * dt * 0.05;
        R.vx -= R.vx * dt * 0.5;
        R.vy -= R.vy * dt * 0.5;
        R.vy += 100 * dt;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(R.x, R.y);
        ctx.stroke();
        if (game.ground.isUnderground(R.x, R.y) || R.y > 4000) {
            this.rain[i] = {
                vx: 0,
                vy: RAIN_V0,
                x: Math.random() * this.gWidth * this.gSize,
                y: RAIN_START - Math.random() * this.gHeight * this.gSize
            };
        }
    }
    ctx.globalAlpha = 1.0;

};

WindRain.prototype.applyForce = function(x, y, vx, vy) {
    this.prt.push({
        id: Math.floor(Math.random()*1e9), x, y, vx, vy, t: 4.
    });
};