window.Bug = function(x, y) {

    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;

    this.radius = (10. + Math.random() * 15.) * 2.;

    this.animT = 0.;

    this.life = 30;

    this.clr = [ '#da11d7', '#f04dee', '#870b85', '#f699f5' ][Math.floor(Math.random()*1e9)%4];

    this.moveTo = null;//{ x: Math.random() * 2000, y: 500 + Math.random() * 500 };

};

Bug.prototype.updateRender = function(ctx, dt) {

    this.life -= dt;
    this.animT += dt;

    if (game.ground.isUnderground(this.x, this.y+this.radius)) {
        this.life = Math.min(this.life, 1.)
    }

    if (this.life < 1.) {
        this.radius *= this.life;
        if (this.blowUp && this.life > 0.25) {
            this.radius += this.radius * dt;
        }
    }

    if (this.life < 0.) {
        game.totalBugs += 1;
        return false;
    }

    let wf = game.windRain.getVelField(this.x, this.y);
    this.vx += wf.vx * dt * 0.05;
    this.vy += wf.vy * dt * 0.05;

    this.vx -= this.vx * 4 * dt;
    this.vy -= this.vy * 4 * dt;

    this.vy += 60 * dt;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (Math.random() < 0.001 || !this.moveTo) {
        if (this.moveTo && Math.random() < 0.25) {
            this.moveTo = { x: Math.random() * 2000, y: 500 + Math.random() * 500 };
        }
        else {
            let lst = [];
            for (let i=0; i<game.trees.length; i++) {
                if (!game.trees[i].root.infection) {
                    lst.push(game.trees[i]);
                }
            }
            if (lst.length) {
                let tree = lst[Math.floor(Math.random()*24525)%lst.length];
                this.moveTo = { x: tree.startX, y: tree.startY };
                console.log(this.moveTo);
            }
        }
    }

    if (this.moveTo) {
        let dx = this.moveTo.x - this.x,
            dy = this.moveTo.y - this.y;
        let len = Math.sqrt(dx*dx+dy*dy);
        if (len < this.radius * 2) {
            this.moveTo = null;
        }
        else {
            dx /= len;
            dy /= len;
            dx += Math.random() * 0.1 - 0.05;
            dy += Math.random() * 0.1 - 0.05;
            this.vx += dx * dt * 500;
            this.vy += dy * dt * 500;
        }
    }
    
    ctx.beginPath();
    let rs = [
        (Math.sin(this.animT * Math.PI) * this.radius * 0.35 + this.radius) * Math.min(this.animT, 1.),
        (Math.sin((this.animT+1) * Math.PI) * this.radius * 0.35 + this.radius) * Math.min(this.animT, 1.)
    ];
    for (let i=0; i<16; i++) {
        let r = rs[i%2];
        let a = i / 16 * Math.PI * 2;
        let x = this.x + Math.cos(a+this.animT*Math.PI) * r,
            y = this.y + Math.sin(a+this.animT*Math.PI) * r;
        if (i > 0) {
            ctx.lineTo(x, y);
        }
        else {
            ctx.moveTo(x, y);
        }
    }
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = this.clr;
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.arc(this.x, this.y, (Math.sin(this.animT * Math.PI * 2) * this.radius * 0.1 + this.radius)*0.25, 0, Math.PI*2);
    ctx.fill();
    ctx.closePath();

    return true;

};

window.Bugs = function() {

    this.stage = 1;
    this.stageT = 0.;

    this.list = [];

};

Bugs.prototype.updateRender = function(ctx, dt) {

    if (this.list.length < this.stage && Math.random() < 0.005) {
        this.list.push(new Bug(Math.random() * 2000, -50));
    }

    this.stageT += dt;
    if (this.stageT > 60) {
        this.stage += 1;
        this.stageT = 0.;
    }

    for (let i=0; i<this.list.length; i++) {
        if (!this.list[i].updateRender(ctx, dt)) {
            this.list.splice(i, 1);
            i --;
            continue;
        }
    }

};

Bugs.prototype.handleBranch = function(B, absX, absY, absAngle) {

    let x = absX + Math.cos(absAngle) * B.length * 0.5, 
        y = absY + Math.sin(absAngle) * B.length * 0.5;

    for (let I of this.list) {
        let dx = x - I.x, dy = y - I.y;
        let dist = Math.sqrt(dx*dx+dy*dy);
        if (dist < I.radius) {
            if (B.isLeaf) {
                B.infection = Math.max(B.infection, 0.1);
            }
            I.life = Math.min(I.life, 0.9999);
        }
    }

}