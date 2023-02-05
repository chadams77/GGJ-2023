const THICK_R = 0.025;
const MAX_LEV = 5;
const NORM_A = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));
const TREE_GROWTH_RATE = 10;

window.Branch = function(position, angle, isRoot, growthSpeed, parent) {

    angle = NORM_A(angle);

    this.sub = [];
    this.length = 1.; // current length of branch
    this.position = position; // (length in px)
    this.angle = angle; // (angle relative to parent branch)
    this.restAngle = angle;
    this.angVel = 0.;
    this.forceX = 0;
    this.forceY = 0;
    this.growthSpeed = growthSpeed; // px/s
    this.initGrowthSpeed = growthSpeed;
    this.weight = THICK_R;
    this.isRoot = !!isRoot;
    this.level = parent ? parent.level + 1 : 0;
    this.parent = parent;
    this.isLeaf = !this.isRoot && (this.level == MAX_LEV || growthSpeed < 5);
    this.broken = false;
    this.brokenT = 1.5;
    this.hp = 1.;
    this.brokeX = this.brokeY = this.brokeAngle = 0.;
    this.brokeVelX = this.brokeVelY = this.brokeAngVel = 0.;
    this.growT = 1.5;
    this.infection = Math.max(0., this.parent ? this.parent.infection||0 : 0.);
    this.z = Math.random() * 1000;
    this.infClr = ['#da11d7', '#f04dee', '#870b85', '#f699f5'][Math.floor(Math.random()*1e9)%4];
    if (this.isRoot) {
        this.clr = ['#65331c', '#2f3324', '#392b17', '#3a3915'][Math.floor(Math.random()*1e6)%4];
    }
    else {
        this.clr = ['#a5633c', '#5f6344', '#694b37', '#7a6935'][Math.floor(Math.random()*1e6)%4];
        if (this.isLeaf) {
            this.clr = ['#608f07', '#6f9f05', '#84ae09', '#91b90c', '#a6c70d'][Math.floor(Math.random()*1e6)%5];
        }
    }

};

Branch.prototype.updateRender = function(
        // base
        ctx, dt,
        // stack vars
        absX, absY, absAngle,
        leafs,
        absRestAngle,
        parentAlpha,
        parentDead
    ) { 

    // bugs/infection
    game.bugs.handleBranch(this, absX, absY, absAngle);
    game.totalB += 1.;
    if (parentDead) {
        this.infection = Math.max(this.infection, 0.1);
    }
    if (this.infection > 0.) {
        this.infection += dt * 0.25;
        if (this.isLeaf) {
            this.infection += dt * 0.75;
        }
        if (this.infection > 1.) {
            this.infection = 1.;
            if (this.parent) {
                this.parent.infection = Math.max(0.1, this.parent.infection);
            }
            for (let S of this.sub) {
                S.infection = Math.max(S.infection, 0.1);
            }
            if (parentDead && this.isLeaf) {
                this.hp -= dt;
            }
        }
        game.infectedB += Math.min(1, this.infection || 0.);
    }

    // forces
    if (!this.isRoot) {
        this.forceY += 2.5 * this.weight;
        const F = game.windRain.getVelField(absX + Math.cos(absAngle) * this.length * 0.5, absY + Math.sin(absAngle) * this.length * 0.5);
        this.forceX += F.vx * dt * 100.;
        this.forceY += F.vy * dt * 100.;
    }
    // 

    // broken branch physics
    this.growT -= dt;
    let alpha = parentAlpha;
    if (this.broken) {
        this.brokenT -= dt;
        if (this.parent) {
            this.parent.hadBroken = true;
        }
        if (this.brokenT <= 0.) {
            if (this.parent) {
                let idx = this.parent.sub.indexOf(this);
                this.parent.sub.splice(idx, 1);
                this.parent = null;
                return true;
            }
            this.brokenT = 0.;
        }
        alpha *= Math.min(1, Math.max(0, this.brokenT / 1.5));
        absX = this.brokeX;
        absY = this.brokeY;
        absAngle = this.brokeAngle;
        this.brokeX += this.brokeVelX * dt;
        this.brokeVelX -= this.brokeVelX * dt * 4.;
        this.brokeY += this.brokeVelY * dt;
        this.brokeVelY -= this.brokeVelY * dt * 4.;
        this.brokeAngle += this.brokeAngVel * dt;
        this.brokeAngVel -= this.brokeAngVel * dt * 0.5;
        this.brokeVelX += this.forceX * dt / this.weight / 10;
        this.brokeVelY += this.forceY * dt / this.weight / 10;
        this.restAngle = this.angle = absAngle;
    }

    // taper tree growth start
    this.growthSpeed -= this.growthSpeed * dt * 0.03 * TREE_GROWTH_RATE;
    if ((this.level == (MAX_LEV - 1) || this.growthSpeed < 5) && !this.isRoot && this.sub.length) {
        this.growthSpeed -= this.growthSpeed * dt * 1. * TREE_GROWTH_RATE;
    }
    if (this.isLeaf && this.length > 40) {
        this.growthSpeed -= this.growthSpeed * dt * 0.1 * TREE_GROWTH_RATE;
    }
    if (this.level == MAX_LEV && this.isRoot) {
        this.growthSpeed -= this.growthSpeed * dt * 0.1 * TREE_GROWTH_RATE;
    }
    // taper tree growth end

    // grow tree start
    this.length += this.growthSpeed * dt * TREE_GROWTH_RATE;
    this.weight = this.length * this.length * THICK_R;
    if (this.isLeaf) {
        this.weight *= 5;
    }

    let dist = 40;
    if (!this.isRoot && (this.level+1) == MAX_LEV) {
        dist = 20;
    }
    if (this.isRoot) {
        dist = 80;
    }

    if (!this.broken && !this.isLeaf && this.level < MAX_LEV && this.sub.length < 5 && (this.length / (this.sub.length+1)) > dist && Math.random() < (0.01 * TREE_GROWTH_RATE) && (this.growthSpeed > 2 || this.hadBroken) && !parentDead) {
        
        let angle = 0;
        let k = 0;
        while (k++ < 100) {
            angle = (Math.pow(Math.random(), 3.5) * 0.5 + 0.5) * Math.PI * (Math.random() < 0.5 ? -1 : 1) * 0.25;
            if (this.isRoot) {
                angle *= 2;
            }
            let yDir = Math.sin(angle + absRestAngle);
            if (this.isRoot) {
                if (yDir > 0) {
                    break;
                }
            }
            else {
                if (yDir < 0) {
                    break;
                }
            }
        }

        if (angle) {
            let nextLeaf = this.level == (MAX_LEV - 1) && !this.isRoot;
            let pos = this.length * (Math.random() * 0.1 + 1.1);
            if (!nextLeaf) {
                if (this.hadBroken) {
                    pos = this.length * (Math.random() * 0.75 + 0.25);
                }
                else {
                    pos = this.length * (Math.random() * 0.25 + 0.75);
                }
            }
            this.sub.push(new Branch(pos, angle, this.isRoot, this.hadBroken ? 0.5 * (this.initGrowthSpeed + this.growthSpeed) : this.growthSpeed, this));
        }

    }
    // grow tree end

    // render leafs start
    if (this.isLeaf) {
        let x2 = absX, y2 = absY;
        let r = this.length * 0.5;
        if (!this.leafAng && this.leafAng != 0.) {
            this.leafAng = (Math.PI/3 + Math.PI/2) - absRestAngle + (Math.random() * 0.1 - 0.05) * Math.PI;
        }
        leafs.push([this.clr, x2, y2, r, this.leafAng + absAngle, alpha, this.z, this.infClr, this.infection]);
    }
    // render leafs end

    for (let i=0; i<this.sub.length; i++) {
        let sub = this.sub[i];
        let x2 = absX + Math.cos(absAngle) * sub.position,
            y2 = absY + Math.sin(absAngle) * sub.position;
        if (sub.updateRender(ctx, dt, x2, y2, absAngle + sub.angle, leafs, absRestAngle + sub.restAngle, alpha, parentDead) == true) {
            i --;
            continue;
        }
    }

    // render branch
    if (!this.isLeaf) {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.clr;
        ctx.beginPath();
        ctx.moveTo(absX + Math.cos(absAngle - Math.PI * 0.5) * this.length * THICK_R, absY + Math.sin(absAngle - Math.PI * 0.5) * this.length * THICK_R);
        ctx.lineTo(absX + Math.cos(absAngle) * this.length, absY + Math.sin(absAngle) * this.length);
        ctx.lineTo(absX + Math.cos(absAngle + Math.PI * 0.5) * this.length * THICK_R, absY + Math.sin(absAngle + Math.PI * 0.5) * this.length * THICK_R);
        ctx.fill();
        ctx.globalAlpha = 1.;
        if (this.infection > 0.) {
            ctx.globalAlpha = alpha * this.infection;
            ctx.fillStyle = this.infClr;
            ctx.beginPath();
            ctx.moveTo(absX + Math.cos(absAngle - Math.PI * 0.5) * this.length * THICK_R, absY + Math.sin(absAngle - Math.PI * 0.5) * this.length * THICK_R);
            ctx.lineTo(absX + Math.cos(absAngle) * this.length, absY + Math.sin(absAngle) * this.length);
            ctx.lineTo(absX + Math.cos(absAngle + Math.PI * 0.5) * this.length * THICK_R, absY + Math.sin(absAngle + Math.PI * 0.5) * this.length * THICK_R);
            ctx.fill();
            ctx.globalAlpha = 1.;    
        }
    }
    // render branch end

    // movement start
    this.angle += this.angVel * dt;
    this.angle += (this.restAngle - this.angle) * dt * 30;
    this.angle = NORM_A(this.angle);
    this.angVel -= this.angVel * dt * 0.5;
    if (!this.broken && (this.forceX || this.forceY)) {
        let forceLen = Math.sqrt(this.forceX*this.forceX+this.forceY*this.forceY);
        let fdx = this.forceX / forceLen, fdy = this.forceY / forceLen;
        let forceAngle = -Math.atan2(fdy, fdx);
        let angDiff = -Math.atan2(Math.sin(absAngle - forceAngle), Math.cos(absAngle - forceAngle));
        //let angDiff = Math.atan2(fdy - Math.sin(absAngle), fdx - Math.cos(absAngle));
        let FL1 = forceLen / this.weight;
        this.hp -= Math.max(FL1*0.025-1., -0.5) * dt;
        if (this.hp < 0.) {
            this.hp = 0;
        }
        if (this.hp > 1.) {
            this.hp = 1.;
        }
        if ((FL1/this.weight > (1 + Math.pow(Math.random(), 0.5) * 6) || this.hp <= 0.) && this.growT < 0) {
            this.broken = true;
            this.brokeX = absX;
            this.brokeY = absY;
            this.brokeAngle = absAngle;
        }
        this.angVel += dt * (Math.min(60, FL1)) * angDiff;
        if (this.parent) {
            this.parent.forceX += (this.forceX + Math.cos(this.angVel + absAngle)) * this.weight / 10000;
            this.parent.forceY += (this.forceY + Math.sin(this.angVel + absAngle)) * this.weight / 10000;
        }
        this.forceX = this.forceY = 0;
    }
    // movement end

};

window.Tree = function(x, y, seed, growthSpeed) {

    this.startX = x; this.startY = y;
    this.seed = seed;
    this.growthSpeed = growthSpeed;

    this.trunk = new Branch(0, -Math.PI*0.5 + (Math.pow(Math.random(), 3.5) * 0.5 + 0.5) * Math.PI * (Math.random() < 0.5 ? -1 : 1) * 0.125, false, growthSpeed);
    this.root = new Branch(0, Math.PI*0.5 + (Math.pow(Math.random(), 3.5) * 0.5 + 0.5) * Math.PI * (Math.random() < 0.5 ? -1 : 1) * 0.125, true, growthSpeed);
    
};

Tree.prototype.updateRender = function(ctx, dt) {

    let leafs = [];

    this.trunk.updateRender(ctx, dt, this.startX, this.startY, this.trunk.angle, leafs, this.trunk.restAngle, 1, this.dead);

    if (this.trunk.infection >= 1.) {
        this.root.infection = Math.max(this.root.infection, 0.1);
        this.dead = true;
    }

    this.root.updateRender(ctx, dt, this.startX, this.startY, this.root.angle, null, this.root.restAngle, 1, this.dead);

    leafs.sort((a, b) => a[6] - b[6]);

    for (let L of leafs) {
        if (L[3] > 0.1) {
            ctx.fillStyle = L[0];
            ctx.globalAlpha = 0.9 * L[5];
            ctx.beginPath();
            ctx.moveTo(L[1] + Math.cos(L[4] + Math.PI/3) * L[3], L[2] + Math.sin(L[4] + Math.PI/3) * L[3]);
            ctx.lineTo(L[1] + Math.cos(L[4] + 2*Math.PI/3) * L[3], L[2] + Math.sin(L[4] + 2*Math.PI/3) * L[3]);
            ctx.lineTo(L[1] + Math.cos(L[4] + 3*Math.PI/3) * L[3], L[2] + Math.sin(L[4] + 3*Math.PI/3) * L[3]);
            ctx.lineTo(L[1] + Math.cos(L[4] + 4*Math.PI/3) * L[3], L[2] + Math.sin(L[4] + 4*Math.PI/3) * L[3]);
            ctx.fill();
            ctx.globalAlpha = 1.0;
            if (L[8] > 0.) {
                ctx.fillStyle = L[7];
                ctx.globalAlpha = 0.9 * L[5] * L[8];
                ctx.beginPath();
                ctx.moveTo(L[1] + Math.cos(L[4] + Math.PI/3) * L[3], L[2] + Math.sin(L[4] + Math.PI/3) * L[3]);
                ctx.lineTo(L[1] + Math.cos(L[4] + 2*Math.PI/3) * L[3], L[2] + Math.sin(L[4] + 2*Math.PI/3) * L[3]);
                ctx.lineTo(L[1] + Math.cos(L[4] + 3*Math.PI/3) * L[3], L[2] + Math.sin(L[4] + 3*Math.PI/3) * L[3]);
                ctx.lineTo(L[1] + Math.cos(L[4] + 4*Math.PI/3) * L[3], L[2] + Math.sin(L[4] + 4*Math.PI/3) * L[3]);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        }
    }

};