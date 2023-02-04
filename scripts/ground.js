
window.Ground = function(width, height) {

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width = width;
    this.canvas.height = this.height = height;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.clearRect(0, 0, width, height);
    this.img = this.ctx.getImageData(0, 0, width, height);

    this.pal = [ /*[234,208,168], */[182,159,102], [107,84,40], [107,84,40], [118,85,43], [64,41,5], [118,85,43], [64,41,5]  ];

    this.rseq = new Float32Array(256*256);
    for (let i=0; i<this.rseq.length; i++) {
        this.rseq[i] = Math.random();
    }

    this.randomize();

};

Ground.prototype.set = function(x, y) {

    this.imgUpdated = true;

    x = Math.floor(x); y = Math.floor(y);

    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
        return false;
    }

    const off = (x + y * this.width) * 4;

    const hash = this.rseq[(Math.floor(x/6)*512+Math.floor(y/6+x/2.5)) % this.rseq.length];

    const clr = this.pal[Math.floor(hash*1000000) % this.pal.length];

    this.img.data[off + 0] = clr[0];
    this.img.data[off + 1] = clr[1];
    this.img.data[off + 2] = clr[2];
    this.img.data[off + 3] = 255;

    return true;

};

Ground.prototype.get = function(x, y) {

    x = Math.floor(x); y = Math.floor(y);

    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
        return false;
    }

    const off = (x + y * this.width) * 4;

    return this.img.data[off + 3] > 0 ;


};

Ground.prototype.clear = function(x, y) {

    this.imgUpdated = true;

    x = Math.floor(x); y = Math.floor(y);

    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
        return false;
    }

    const off = (x + y * this.width) * 4;

    this.img.data[off + 0] = 0;
    this.img.data[off + 1] = 0;
    this.img.data[off + 2] = 0;
    this.img.data[off + 3] = 0;


};

Ground.prototype.randomize = function() {

    for (let x=0; x<this.width; x++) {
        const h = this.height * 0.6 + (Math.random() * 0.6 - 0.3) * this.height;
        for (let y=0; y<this.height; y++) {
            if (y > h && Math.random() > 0.5) {
                this.set(x, y);
            }
        }
    }

    for (let k=0; k<4; k++) {
        for (let x=0; x<this.width; x++) {
            for (let y=0; y<this.height; y++) {
                let countEq = 0, countNeq = 0;
                let bool = this.get(x, y);
                for (let ox=-6; ox<=6; ox++) {
                    for (let oy=-1; oy<=1; oy++) {
                        const eq = this.get(x+ox, y+oy) == bool;
                        countEq += eq ? 1 : 0;
                        countNeq += eq ? 0 : 1;
                    }
                }
                let prob = (bool ? 0.25 : 0.5) * countNeq / countEq;
                if (prob < 0.25) {
                    prob = 0;
                }
                if (Math.random() < prob) {
                    if (bool) {
                        this.clear(x, y);
                    }
                    else {
                        this.set(x, y);
                    }
                }
            }
        }
        for (let x=0; x<this.width; x++) {
            let rf = false;
            for (let y=0; y<this.height; y++) {
                rf = rf || this.get(x, y);
                if (rf) {
                    this.set(x, y);
                }
            }
        }
    }

};

Ground.prototype.updateRender = function(ctx, dt) {

    if (this.imgUpdated) {
        this.ctx.putImageData(this.img, 0, 0);
        this.imgUpdated = false;
    }

    ctx.drawImage(this.canvas, 0, -100, 2048, 1024);

};