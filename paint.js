const paint = {
    hexToRGB : function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
    } : null;
    },
    rgbToHex : function(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },
    download : function(e) {
        this.downloadElem.href = this.canvasElem.toDataURL();
        this.downloadElem.download = "image.png";
        
    },
    undo : function(e) {
        if(this.canvasVersion>0) {
            this.ctx.putImageData(this.drawHistory[this.canvasVersion-1],0,0);
            this.canvasVersion--;
            this.redoElem.removeAttribute('disabled','');
            if(this.canvasVersion==0) {
                this.undoElem.setAttribute('disabled','');
            }
        }
    },
    redo : function(e) {
        if(this.drawHistory.length>this.canvasVersion+1) {
            this.ctx.putImageData(this.drawHistory[this.canvasVersion+1],0,0);
            this.canvasVersion++;
            this.undoElem.removeAttribute('disabled','');
            if(this.canvasVersion==this.drawHistory.length-1) {
                this.redoElem.setAttribute('disabled','');
            }
        }
    },
    addHistoryData : function(context) {
        var imageData = context.getImageData(0,0,this.canvasElem.width, this.canvasElem.height);
        if(this.drawHistory.length>this.canvasVersion+1) {
            this.drawHistory.splice(this.canvasVersion+1,this.drawHistory.length-this.canvasVersion+1);
            this.redoElem.setAttribute('disabled','');
        }
        this.drawHistory.push(imageData);
        this.canvasVersion++;
        if(this.canvasVersion!=0)
            this.undoElem.removeAttribute('disabled','');
    },
    changeSize : function(e) {
        this.sizeElemVal.innerText = e.target.value;
        this.ctx.lineWidth = e.target.value;
        this.ctx2.lineWidth = e.target.value;
    },
    changeFill : function(e) {
        if(this.fill == false) {
            this.fillElem.classList.add('filled');
            this.fill = true;
        } else {
            this.fillElem.classList.remove('filled');
            this.fill = false;
        }
    },
    changeRoundSize : function() {
        this.roundSize = Number(this.roundSizeElem.value);
        this.roundSizeElemVal.innerText = this.roundSize;
    },
    changeRubberSize : function() {
        this.rubberSize = Number(this.rubberSizeElem.value);
        this.rubberSizeElemVal.innerText = this.rubberSize;
    },
    changeColor : function(e) {
        const color = this.colorElem.value;
        this.ctx.strokeStyle = color;
        this.ctx2.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.ctx2.fillStyle = color;
    },
    fillAlpha : function(e) {
        var imageData = this.ctx.getImageData(0,0,this.canvasElem.width, this.canvasElem.height);
        var color = this.hexToRGB(this.colorElem.value);
        for(let i = 0; i<imageData.data.length; i+=4) {
            if(imageData.data[i+3]<150) {
                imageData.data[i] = color.r;
                imageData.data[i+1] = color.g;
                imageData.data[i+2] = color.b;
                imageData.data[i+3] = 255;
            }
        }
        
        this.ctx.putImageData(imageData,0,0);
        this.addHistoryData(this.ctx);
    },
    enableMode : function(mode) {
        if(this.avaibleMode.indexOf(mode) !== -1) {
            this.ctx2.clearRect(0,0,this.canvasElem2.width,this.canvasElem2.height);
            this.mode = mode;
            this.stage = 0;
            if(this.mode!=="rounded-rectangle") {
                this.roundSizeSection.style.display = "none";
            } else {
                this.roundSizeSection.style.display = "inline-block";
            }
            if(this.mode!=="rubber") {
                this.rubberSizeSection.style.display = "none";
            } else {
                this.rubberSizeSection.style.display = "inline-block";
            }
            if(this.mode!=="sampler") {
                this.samplerSection.style.display = "none";
            } else {
                this.samplerSection.style.display = "inline-block";
            }
            if(this.mode==="sampler" || this.mode==="rubber") {
                this.paintSizeSection.style.display = "none";
            } else {
                this.paintSizeSection.style.display = "inline-block";
            }

        }
    },
    mouseEnable : function(e) {
        this.canDraw = true;
        const mousePos = this.getMousePosition(e);

        this.startX = mousePos.x;
        this.startY = mousePos.y;
        if(this.mode == "triangle") {
            if(this.stage == 0) {
                this.stage = 1;
            } else {
                this.ctx.drawImage(this.canvasElem2, 0,0);
                this.ctx2.clearRect(0,0,this.canvasElem2.width, this.canvasElem2.height);
                this.addHistoryData(this.ctx);
                this.stage = 0;
                this.firstPoint = {
                    x: 0,
                    y: 0
                }
            }
        }
        if(this.mode === "any-shape") {
            var point = {
                x: mousePos.x,
                y: mousePos.y
            }
            this.points.push(point);
            if(this.points.length>2) {
                this.lastPoint = this.points[this.points.length-2];
                if(this.lastPoint.x==point.x && this.lastPoint.y==point.y) {
                    this.points.splice(0,this.points.length);
                    this.ctx.drawImage(this.canvasElem2, 0,0);
                    this.ctx2.clearRect(0,0,this.canvasElem2.width, this.canvasElem2.height);
                    this.addHistoryData(this.ctx);
                    this.lastPoint = {
                        x: -1,
                        y: -1
                    }
                }
            }
        }
        if(this.mode === "curves") {
            if(this.stage == 0) {
                this.stage = 1;
                this.firstPoint = mousePos;
            }
            else if(this.stage == 2) {
                this.stage = 3;
                this.secondPoint = mousePos;
            }
            else if(this.stage == 3) {
                this.ctx.drawImage(this.canvasElem2, 0,0);
                this.ctx2.clearRect(0,0,this.canvasElem2.width, this.canvasElem2.height);
                this.addHistoryData(this.ctx);
                this.stage = 0;
                this.firstPoint = {
                    x: 0,
                    y: 0
                }
                this.secondPoint = {
                    x: 0,
                    y: 0
                }
                this.lastPoint = {
                    x: -1,
                    y: -1
                }
            }
        }
        if(this.mode === "sampler") {
            var hex = this.rgbToHex(this.samplerColor.r,this.samplerColor.g,this.samplerColor.b);
            this.colorElem.value = hex;
        }

        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
    },
    mouseDisable : function(e) {
        this.canDraw = false;
        const mousePos = this.getMousePosition(e);

        if(this.mode === "line" || this.mode === "rectangle" || this.mode === 'rounded-rectangle' || this.mode === 'circle' || this.mode === 'elipse') {
            this.ctx.drawImage(this.canvasElem2, 0,0);
            this.ctx2.clearRect(0,0,this.canvasElem2.width, this.canvasElem2.height);
        }
        
        if(this.mode === 'draw' || this.mode === 'line' || this.mode === 'rectangle' || this.mode === 'rounded-rectangle' || this.mode === 'circle' || this.mode === 'elipse' || this.mode === 'rubber') {
            this.addHistoryData(this.ctx);
        }
        if(this.mode === 'triangle') {
            if(this.stage != undefined) {
                if(this.stage == 1) {
                    this.firstPoint = {
                        x: this.startX,
                        y: this.startY
                    }
                    this.startX = mousePos.x;
                    this.startY = mousePos.y;
                    this.stage = 2;
                }
            }
        }
        if(this.mode === 'curves') {
            if(this.stage == 1) {
                this.stage = 2;
                this.lastPoint = mousePos;
            }
        }
    },
    mouseMove : function(e) {
        const mousePos = this.getMousePosition(e);
        if(this.canDraw) {
            if(this.mode === "draw") {
                this.ctx.lineTo(mousePos.x, mousePos.y);
                this.ctx.stroke();
            }
            if(this.mode === "line") {
                this.ctx2.clearRect(0,0,this.canvasElem2.width,this.canvasElem2.height);
                this.ctx2.beginPath();
                this.ctx2.moveTo(this.startX,this.startY);
                this.ctx2.lineTo(mousePos.x, mousePos.y);
                this.ctx2.closePath();
                this.ctx2.stroke();
            }
            if(this.mode === "rectangle") {
                this.ctx2.clearRect(0,0,this.canvasElem2.width,this.canvasElem2.height);
                this.ctx2.beginPath();
                this.ctx2.moveTo(this.startX,this.startY);
                this.ctx2.rect(this.startX, this.startY, mousePos.x-this.startX, mousePos.y-this.startY);
                this.ctx2.closePath();
                this.draw(this.ctx2);
            }
            if(this.mode === "rounded-rectangle") {
                this.ctx2.clearRect(0,0,this.canvasElem2.width,this.canvasElem2.height);
                this.roundRect(this.ctx2,this.startX,this.startY,mousePos.x-this.startX,mousePos.y-this.startY,this.roundSize);
                this.draw(this.ctx2);
            }
            if(this.mode === "circle") {
                this.ctx2.clearRect(0,0,this.canvasElem2.width,this.canvasElem2.height);
                var r1 = mousePos.x-this.startX;
                var r2 = mousePos.y-this.startY;
                var startX = this.startX;
                var startY = this.startY;
                var f1 = false, f2 = false;
                if(r1<0) {
                    r1 = Math.abs(r1);
                    startX = mousePos.x;
                    if(r1>r2) startX += r1-r2;
                    f1=true;
                }
                if(r2<0) {
                    r2 = Math.abs(r2);
                    startY = mousePos.y;
                    if(r2>r1) startY += r2-r1;
                    f2=true;
                }
                if(f1 && f2) {
                    startX -= r2+r1;
                    if(r1>r2) startX += r1-r2;
                }
                var r = Math.min(r1,r2);
                this.ctx2.beginPath();
                this.ctx2.arc(startX+r/2, startY+r/2, r/2, 0, 2 * Math.PI);
                this.draw(this.ctx2);
            }
            if(this.mode === "elipse") {
                this.ctx2.clearRect(0,0,this.canvasElem2.width,this.canvasElem2.height);
                var r = mousePos.x-this.startX;
                var r2 = mousePos.y-this.startY;
                var startX = this.startX;
                var startY = this.startY;
                if(r<0) {
                    r = Math.abs(r);
                    startX = mousePos.x;
                }
                if(r2<0) {
                    r2 = Math.abs(r2);
                    startY = mousePos.y;
                }
                this.ctx2.beginPath();
                this.ctx2.ellipse(startX+r/2, startY+r2/2, r/2, r2/2, 0, 2 * Math.PI, false);
                this.draw(this.ctx2);
            }
        }
        if(this.mode === "triangle") {
            if(this.stage == 1) {
                this.ctx2.clearRect(0,0,this.canvasElem2.width,this.canvasElem2.height);
                this.ctx2.beginPath();
                this.ctx2.moveTo(this.startX,this.startY);
                this.ctx2.lineTo(mousePos.x, mousePos.y);
                this.ctx2.closePath();
                this.ctx2.stroke();
            }
            if(this.stage == 2) {
                this.ctx2.clearRect(0,0,this.canvasElem2.width,this.canvasElem2.height);
                this.ctx2.beginPath();
                this.ctx2.moveTo(this.firstPoint.x,this.firstPoint.y);
                this.ctx2.lineTo(this.startX, this.startY);
                this.ctx2.lineTo(mousePos.x, mousePos.y);
                this.ctx2.lineTo(this.firstPoint.x,this.firstPoint.y);
                this.ctx2.closePath();
                this.draw(this.ctx2);
            }
        }
        if(this.mode === "any-shape") {
            if(this.points.length>0) {
                this.ctx2.clearRect(0,0,this.canvasElem2.width,this.canvasElem2.height);
                this.ctx2.beginPath();
                this.points.forEach(function(el, i) {
                    if(i==0) this.ctx2.moveTo(this.points[0].x,this.points[0].y);
                    else this.ctx2.lineTo(this.points[i].x,this.points[i].y);
                }.bind(this));
                this.ctx2.lineTo(mousePos.x, mousePos.y);
                this.ctx2.closePath();
                if(this.points.length==1) this.ctx2.stroke();
                else this.draw(this.ctx2);
            }
        }
        if(this.mode === "curves") {
            if(this.stage == 1) {
                this.ctx2.clearRect(0,0,this.canvasElem2.width,this.canvasElem2.height);
                this.ctx2.beginPath();
                this.ctx2.moveTo(this.startX,this.startY);
                this.ctx2.lineTo(mousePos.x, mousePos.y);
                this.ctx2.closePath();
                this.ctx2.stroke();
            }
            if(this.stage == 2) {
                this.ctx2.clearRect(0,0,this.canvasElem2.width,this.canvasElem2.height);
                this.ctx2.beginPath();
                this.ctx2.moveTo(this.firstPoint.x,this.firstPoint.y);
                this.ctx2.bezierCurveTo(mousePos.x, mousePos.y, mousePos.x, mousePos.y, this.lastPoint.x, this.lastPoint.y);
                this.ctx2.stroke();
            }
            if(this.stage == 3) {
                this.ctx2.clearRect(0,0,this.canvasElem2.width,this.canvasElem2.height);
                this.ctx2.beginPath();
                this.ctx2.moveTo(this.firstPoint.x,this.firstPoint.y);
                this.ctx2.bezierCurveTo(this.secondPoint.x, this.secondPoint.y, mousePos.x, mousePos.y, this.lastPoint.x, this.lastPoint.y);
                this.ctx2.stroke();
            }
        }
        if(this.mode === "rubber") {
            this.ctx2.fillStyle = "white";
            this.ctx2.strokeStyle = "black";
            this.ctx2.lineWidth = 1;

            this.ctx2.clearRect(0,0,this.canvasElem2.width,this.canvasElem2.height);
            this.ctx2.beginPath();
            this.ctx2.moveTo(mousePos.x, mousePos.y);
            this.ctx2.rect(mousePos.x-this.rubberSize/2, mousePos.y-this.rubberSize/2, this.rubberSize, this.rubberSize);
            this.ctx2.closePath();
            this.ctx2.fill();
            this.ctx2.stroke();
            this.ctx2.fillStyle = this.colorElem.value;
            this.ctx2.strokeStyle = this.colorElem.value;
            this.ctx2.lineWidth = this.sizeElem.value;
            if(this.canDraw==true) {
                this.ctx.clearRect(mousePos.x-this.rubberSize/2, mousePos.y-this.rubberSize/2, this.rubberSize, this.rubberSize);
            }
        }
        if(this.mode === "sampler") {
            var x = mousePos.x;
            var y = mousePos.y;
            var width = this.drawHistory[this.drawHistory.length-1].width;
            this.samplerColor = {
                r: this.drawHistory[this.drawHistory.length-1].data[((y - 1) * (width * 4)) + ((x - 1) * 4)],
                g: this.drawHistory[this.drawHistory.length-1].data[((y - 1) * (width * 4)) + ((x - 1) * 4)+1],
                b: this.drawHistory[this.drawHistory.length-1].data[((y - 1) * (width * 4)) + ((x - 1) * 4)+2],
                a: this.drawHistory[this.drawHistory.length-1].data[((y - 1) * (width * 4)) + ((x - 1) * 4)+3]
            }
            this.samplerColorInfo.innerHTML = "R:"+this.samplerColor.r+" G:"+this.samplerColor.g+" B:"+this.samplerColor.b+" A:"+this.samplerColor.a;
            this.samplerPosInfo.innerHTML = "X:"+mousePos.x+" Y:"+mousePos.y;
            this.ctx2.fillStyle = this.rgbToHex(this.samplerColor.r,this.samplerColor.g,this.samplerColor.b);
            this.ctx2.strokeStyle = "black";
            this.ctx2.lineWidth = 1;
            this.ctx2.clearRect(0,0,this.canvasElem2.width,this.canvasElem2.height);
            this.ctx2.beginPath();
            this.ctx2.moveTo(mousePos.x, mousePos.y);
            this.ctx2.rect(mousePos.x-25, mousePos.y-25, 20, 20);
            this.ctx2.closePath();
            this.ctx2.fill();
            this.ctx2.stroke();
            this.ctx2.strokeStyle = this.colorElem.value;
            this.ctx2.lineWidth = this.sizeElem.value;
            this.ctx2.fillStyle = this.colorElem.value;
        }
    },
    roundRect : function roundedRect(canvas, x ,y, width, height, radius){
        if(width<0) {
            var xx = x-width;
            x = x+width;
            width = Math.abs(width);
        }
        if(height<0) {
            var yy = y;
            y = y+height;
            height = Math.abs(height);
        }
        if(radius>width/2) radius = width/2;
        if(radius>height/2) radius = height/2;
        canvas.beginPath();
        canvas.moveTo(x,y+radius);
        canvas.lineTo(x,y+height-radius);
        canvas.quadraticCurveTo(x,y+height,x+radius,y+height);
        canvas.lineTo(x+width-radius,y+height);
        canvas.quadraticCurveTo(x+width,y+height,x+width,y+height-radius);
        canvas.lineTo(x+width,y+radius);
        canvas.quadraticCurveTo(x+width,y,x+width-radius,y);
        canvas.lineTo(x+radius,y);
        canvas.quadraticCurveTo(x,y,x,y+radius);
    },
    draw : function(obj) {
        if(this.fill == false) obj.stroke();
        else obj.fill();
    },
    getMousePosition : function(e) {
        const mouseX = e.pageX - this.getElementPos(this.canvasElem).left;
        const mouseY = e.pageY - this.getElementPos(this.canvasElem).top;

        return {
            x : mouseX,
            y : mouseY
        }
    },
    getElementPos : function(obj) {
        let top = 0;
        let left = 0;
        while(obj && obj.tagName != "BODY") {
            top += obj.offsetTop - obj.scrollTop;
            left += obj.offsetLeft - obj.scrollLeft;
            obj = obj.offsetParent;
        }
        return {
            top: top,
            left: left
        }
    },
    createCanvas : function() {
        this.canvasCnt.style.width = window.innerWidth+"px";
        this.canvasCnt.style.height = window.innerHeight-this.canvasBar.offsetHeight+"px";
        const canvasElem = document.createElement('canvas');
        canvasElem.width = window.innerWidth;
        canvasElem.height = window.innerHeight-this.canvasBar.offsetHeight;
        return canvasElem;
    },
    setupInitialCtx : function() {
        this.canvasElem.style.backgroundImage = "url("+this.canvasBg.src+")";
        this.ctx.lineWidth = this.sizeElem.value;
        this.ctx.lineJoin = "round";
        this.ctx.lineCap = "round";
        this.ctx.strokeStyle = this.colorElem.value;
        this.ctx.fillStyle = this.colorElem.value;

        this.ctx2.lineWidth = this.sizeElem.value;
        this.ctx2.strokeStyle = this.colorElem.value;
        this.ctx2.fillStyle = this.colorElem.value;
    },
    bindElements : function() {

        this.undoElem.addEventListener('click', this.undo.bind(this));
        this.redoElem.addEventListener('click', this.redo.bind(this));
        this.downloadElem.addEventListener('click', this.download.bind(this));
        this.fillAlphaElem.addEventListener('click', this.fillAlpha.bind(this));

        this.sizeElem.addEventListener('change', this.changeSize.bind(this));
        this.sizeElem.addEventListener('input', this.changeSize.bind(this));
        this.roundSizeElem.addEventListener('change', this.changeRoundSize.bind(this));
        this.roundSizeElem.addEventListener('input', this.changeRoundSize.bind(this));
        this.rubberSizeElem.addEventListener('change', this.changeRubberSize.bind(this));
        this.rubberSizeElem.addEventListener('input', this.changeRubberSize.bind(this));

        this.colorElem.addEventListener('change', this.changeColor.bind(this));
        this.fillElem.addEventListener('click', this.changeFill.bind(this));

        this.canvasCnt.addEventListener('mousemove', this.mouseMove.bind(this));
        this.canvasCnt.addEventListener('mouseup', this.mouseDisable.bind(this));
        this.canvasCnt.addEventListener('mousedown', this.mouseEnable.bind(this));

        this.btnsMode.forEach(function(el) {
            el.addEventListener('click', function(e) {
                e.currentTarget.classList.add('active');
                this.enableMode(e.currentTarget.dataset.mode);

                this.btnsMode.forEach(function(el2) {
                    if(el2 !== e.currentTarget) {
                        el2.classList.remove('active');
                    }
                });
            }.bind(this));
        }, this);
    },
    init : function() {
        this.avaibleMode = ['draw', 'line', 'rectangle', 'rounded-rectangle', 'circle', 'elipse', 'triangle', 'any-shape', 'curves', 'rubber', 'sampler'];
        this.drawHistory = new Array();

        this.canvasBg = new Image();
        this.canvasBg.addEventListener('load', function() {
            this.canvasCnt = document.querySelector('.paint-canvas-cnt');
            this.canvasBar = document.querySelector('.paint-bar');


            this.canvasElem = this.createCanvas();
            this.canvasCnt.appendChild(this.canvasElem);
            this.ctx = this.canvasElem.getContext('2d');

            this.canvasElem2 = this.createCanvas();
            this.canvasCnt.appendChild(this.canvasElem2);
            this.ctx2 = this.canvasElem2.getContext('2d');
            
            this.undoElem = document.querySelector('.undo');
            this.redoElem = document.querySelector('.redo');
            this.downloadElem = document.querySelector('.download');
            this.fillAlphaElem = document.querySelector('.fill');
            this.samplerColorInfo = document.querySelector('.color-info');
            this.samplerPosInfo = document.querySelector('.coordinates');

            this.paintSizeSection = document.querySelector('.option-paint-size');
            this.roundSizeSection = document.querySelector('.option-round-size');
            this.rubberSizeSection = document.querySelector('.option-rubber-size');
            this.samplerSection = document.querySelector('.option-sampler-info');

            this.sizeElem = document.querySelector('.paint-size');
            this.sizeElemVal = document.querySelector('.paint-size-val');
            this.sizeElemVal.innerHTML = this.sizeElem.value;
            this.roundSizeElem = document.querySelector('.round-size');
            this.roundSizeElemVal = document.querySelector('.round-size-val');
            this.roundSizeElemVal.innerHTML = this.roundSizeElem.value;
            this.rubberSizeElem = document.querySelector('.rubber-size');
            this.rubberSizeElemVal = document.querySelector('.rubber-size-val');
            this.rubberSizeElemVal.innerHTML = this.rubberSizeElem.value;

            this.colorElem = document.querySelector('.paint-color');
            this.fillElem = document.querySelector('.paint-fill');
            this.btnsMode = [].slice.call(document.querySelectorAll('.paint-buttons-cnt .button-mode'));
            this.btnsMode.filter(function(el) {
                return el.dataset.mode === 'draw';
            })[0].classList.add('active');

            this.canDraw = false;
            this.mode = 'draw';
            this.enableMode('draw');
            this.fill = false;
            this.canvasVersion = -1;
            this.roundSize = 5;
            this.rubberSize = 100;
            this.stage = 0;
            this.points = new Array();
            this.lastPoint = {x:-1,y:-1}
            this.samplerColor;

            this.setupInitialCtx();
            this.bindElements();

            this.addHistoryData(this.ctx);
        }.bind(this));
        this.canvasBg.src = "img/canvas-bg.png";
    }
}
paint.init();