const THICK_R = 0.025;
const MAX_LEV = 5;

window.Branch = function(position, angle, isRoot, growthSpeed, parent) {

    this.sub = [];
    this.length = 1.; // current length of branch
    this.position = position; // (length in px)
    this.angle = angle; // (angle relative to parent branch)
    this.growthSpeed = growthSpeed; // px/s
    this.weight = THICK_R;
    this.isRoot = !!isRoot;
    this.level = parent ? parent.level + 1 : 0;
    this.isLeaf = !this.isRoot && (this.level == MAX_LEV || growthSpeed < 5);
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
        leafs
    ) {

    this.growthSpeed -= this.growthSpeed * dt * 0.03;
    if ((this.level == (MAX_LEV - 1) || this.growthSpeed < 5) && !this.isRoot && this.sub.length) {
        this.growthSpeed -= this.growthSpeed * dt * 1.;
    }
    if (this.isLeaf && this.length > 40) {
        this.growthSpeed -= this.growthSpeed * dt * 0.1;
    }
    if (this.level == MAX_LEV && this.isRoot) {
        this.growthSpeed -= this.growthSpeed * dt * 0.1;
    }

    // grow tree start
    this.length += this.growthSpeed * dt;
    this.weight = this.length * this.length * THICK_R;

    let dist = 40;
    if (!this.isRoot && (this.level+1) == MAX_LEV) {
        dist = 20;
    }

    if (!this.isLeaf && this.level < MAX_LEV && this.sub.length < 5 && (this.length / (this.sub.length+1)) > dist && Math.random() < 0.01 && this.growthSpeed > 2) {
        
        let angle = 0;
        while (true) {
            angle = (Math.pow(Math.random(), 3.5) * 0.5 + 0.5) * Math.PI * (Math.random() < 0.5 ? -1 : 1) * 0.25;
            if (this.isRoot) {
                angle *= 2;
            }
            let yDir = Math.sin(angle + absAngle);
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
            this.sub.push(new Branch(nextLeaf ? this.length * (Math.random() * 0.3 + 1.1) : this.length * (Math.random() * 0.5 + 0.5), angle, this.isRoot, this.growthSpeed, this));
        }

    }
    // grow tree end

    // render leafs start
    if (this.isLeaf) {
        let x2 = absX, y2 = absY;
        let r = this.length;
        if (!this.leafAng) {
            this.leafAng = (Math.PI/3 + Math.PI/2) - absAngle + (Math.random() * 0.1 - 0.05) * Math.PI;
        }
        leafs.push([this.clr, x2, y2, r, this.leafAng + absAngle]);
    }
    // render leafs end

    for (let sub of this.sub) {
        let x2 = absX + Math.cos(absAngle) * sub.position,
            y2 = absY + Math.sin(absAngle) * sub.position;
        sub.updateRender(ctx, dt, x2, y2, absAngle + sub.angle, leafs);
    }

    // render branch
    if (!this.isLeaf) {
        ctx.fillStyle = this.clr;
        ctx.beginPath();
        ctx.moveTo(absX + Math.cos(absAngle - Math.PI * 0.5) * this.length * THICK_R, absY + Math.sin(absAngle - Math.PI * 0.5) * this.length * THICK_R);
        ctx.lineTo(absX + Math.cos(absAngle) * this.length, absY + Math.sin(absAngle) * this.length);
        ctx.lineTo(absX + Math.cos(absAngle + Math.PI * 0.5) * this.length * THICK_R, absY + Math.sin(absAngle + Math.PI * 0.5) * this.length * THICK_R);
        ctx.fill();
    }
    // render branch end

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

    this.trunk.updateRender(ctx, dt, this.startX, this.startY, this.trunk.angle, leafs);
    this.root.updateRender(ctx, dt, this.startX, this.startY, this.root.angle);

    for (let L of leafs) {
        ctx.fillStyle = L[0];
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.moveTo(L[1] + Math.cos(L[4] + Math.PI/3) * L[3], L[2] + Math.sin(L[4] + Math.PI/3) * L[3]);
        ctx.lineTo(L[1] + Math.cos(L[4] + 2*Math.PI/3) * L[3], L[2] + Math.sin(L[4] + 2*Math.PI/3) * L[3]);
        ctx.lineTo(L[1] + Math.cos(L[4] + 3*Math.PI/3) * L[3], L[2] + Math.sin(L[4] + 3*Math.PI/3) * L[3]);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }

};