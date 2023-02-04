const THICK_R = 0.025;

window.Branch = function(position, angle, isRoot, growthSpeed) {

    this.sub = [];
    this.length = 1.; // current length of branch
    this.position = position; // (length in px)
    this.angle = angle; // (angle relative to parent branch)
    this.growthSpeed = growthSpeed; // px/s
    this.weight = THICK_R;
    this.isRoot = !!isRoot;
    if (this.isRoot) {
        this.clr = ['#65331c', '#2f3324', '#392b17', '#3a3915'][Math.floor(Math.random()*1e6)%4];
    }
    else {
        this.clr = ['#a5633c', '#5f6344', '#694b37', '#7a6935'][Math.floor(Math.random()*1e6)%4];
    }

};

Branch.prototype.updateRender = function(
        // base
        ctx, dt,
        // stack vars
        absX, absY, absAngle
    ) {

    this.growthSpeed -= this.growthSpeed * dt * 0.02;

    // grow tree start
    this.length += this.growthSpeed * dt;
    this.weight = this.length * this.length * THICK_R;

    if (this.sub.length < 5 && (this.length / (this.sub.length+1)) > 40 && Math.random() < 0.01 && this.growthSpeed > 2) {
        
        let angle = 0;
        while (true) {
            angle = (Math.pow(Math.random(), 3.5) * 0.5 + 0.5) * Math.PI * (Math.random() < 0.5 ? -1 : 1) * 0.25;
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
            this.sub.push(new Branch(this.length * (Math.random() * 0.5 + 0.5), angle, this.isRoot, this.growthSpeed));
        }

    }
    // grow tree end

    for (let sub of this.sub) {
        let x2 = absX + Math.cos(absAngle) * sub.position,
            y2 = absY + Math.sin(absAngle) * sub.position;
        sub.updateRender(ctx, dt, x2, y2, absAngle + sub.angle);
    }

    // render start
    ctx.fillStyle = this.clr;
    ctx.beginPath();
    ctx.moveTo(absX + Math.cos(absAngle - Math.PI * 0.5) * this.length * THICK_R, absY + Math.sin(absAngle - Math.PI * 0.5) * this.length * THICK_R);
    ctx.lineTo(absX + Math.cos(absAngle) * this.length, absY + Math.sin(absAngle) * this.length);
    ctx.lineTo(absX + Math.cos(absAngle + Math.PI * 0.5) * this.length * THICK_R, absY + Math.sin(absAngle + Math.PI * 0.5) * this.length * THICK_R);
    ctx.fill();
    // render end

};

window.Tree = function(x, y, seed, growthSpeed) {

    this.startX = x; this.startY = y;
    this.seed = seed;
    this.growthSpeed = growthSpeed;

    this.trunk = new Branch(0, -Math.PI*0.5 + (Math.pow(Math.random(), 3.5) * 0.5 + 0.5) * Math.PI * (Math.random() < 0.5 ? -1 : 1) * 0.125, false, growthSpeed);
    this.root = new Branch(0, Math.PI*0.5 + (Math.pow(Math.random(), 3.5) * 0.5 + 0.5) * Math.PI * (Math.random() < 0.5 ? -1 : 1) * 0.125, true, growthSpeed);
    
};

Tree.prototype.updateRender = function(ctx, dt) {

    this.trunk.updateRender(ctx, dt, this.startX, this.startY, this.trunk.angle);
    this.root.updateRender(ctx, dt, this.startX, this.startY, this.root.angle);

};