window.Ground = function(res) {

    this.pal = [ '#438A41', '#4B8849', '#528751', '#5A8659', '#628560' ];
    this.res = res;

    this.randomize();

};

Ground.prototype.randomize = function() {

    this.heights = [];
    for (let i=0; i<this.res; i++) {
        this.heights.push(Math.random());
    }

    for (let k=0; k<30; k++) {
        let oh = this.heights;
        this.heights = [];
        for (let i=0; i<oh.length; i++) {
            let h = oh[i];
            if (i>1) {
                h += oh[i-1];
            }
            if (i < (oh.length-1)) {
                h += oh[i+1];
            }
            this.heights.push(h / 3.);
        }
    }

    this.colors = [];
    for (let i=0; i<this.heights.length; i++) {
        this.colors.push(this.pal[Math.floor(Math.random()*14141451)%this.pal.length]);
    }

};

Ground.prototype.toScreenX = function(i) {
    return i * 16;
};

Ground.prototype.toScreenY = function(i) {
    return (this.heights[i] - 0.5) * 512 + 768;
};

Ground.prototype.updateRender = function(ctx, dt) {

    ctx.lineWidth = 8;
    for (let i=1; i<this.heights.length; i++) {
        ctx.beginPath();
        ctx.moveTo(this.toScreenX(i-1), this.toScreenY(i-1));
        ctx.lineTo(this.toScreenX(i), this.toScreenY(i));
        ctx.strokeStyle = this.colors[i-1];
        ctx.stroke();
    }

};