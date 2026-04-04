// js/drawing.js (версия с PNG эталонами)

export class DrawingTest {
    constructor(canvasId, onResult) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas?.getContext('2d', { willReadFrequently: true });
        this.onResult = onResult;
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        
        if (this.canvas) {
            this.initCanvas();
            this.initEvents();
        }
    }
    
    initCanvas() {
        const size = Math.min(window.innerWidth * 0.8, 400);
        this.canvas.width = size;
        this.canvas.height = size;
        this.canvas.style.width = `${size}px`;
        this.canvas.style.height = `${size}px`;
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.lineWidth = 6;
        this.ctx.strokeStyle = '#333';
    }
    
    initEvents() {
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseleave', this.stopDrawing.bind(this));
        this.canvas.addEventListener('touchstart', this.startDrawingTouch.bind(this));
        this.canvas.addEventListener('touchmove', this.drawTouch.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
    }
    
    startDrawing(e) {
        this.isDrawing = true;
        const pos = this.getMousePos(e);
        this.lastX = pos.x;
        this.lastY = pos.y;
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        e.preventDefault();
        const pos = this.getMousePos(e);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
    }
    
    stopDrawing() {
        this.isDrawing = false;
        this.ctx.beginPath();
    }
    
    startDrawingTouch(e) {
        e.preventDefault();
        this.isDrawing = true;
        const pos = this.getTouchPos(e);
        this.lastX = pos.x;
        this.lastY = pos.y;
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
    }
    
    drawTouch(e) {
        if (!this.isDrawing) return;
        e.preventDefault();
        const pos = this.getTouchPos(e);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }
    
    getTouchPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const touch = e.touches[0];
        return {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY
        };
    }
    
    clear() {
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    isEmpty() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const pixels = imageData.data;
        for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i+3] !== 0) return false;
        }
        return true;
    }
    
    async compareWithReference(symbol) {
        if (this.isEmpty()) {
            console.log(`❌ Холст пуст для ${symbol}`);
            return false;
        }
        
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const refCanvas = document.createElement('canvas');
                refCanvas.width = this.canvas.width;
                refCanvas.height = this.canvas.height;
                const refCtx = refCanvas.getContext('2d', { willReadFrequently: true });
                refCtx.drawImage(img, 0, 0, refCanvas.width, refCanvas.height);
                
                const userData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                const refData = refCtx.getImageData(0, 0, refCanvas.width, refCanvas.height);
                
                let mismatchCount = 0;
                const totalPixels = this.canvas.width * this.canvas.height;
                
                for (let i = 0; i < userData.data.length; i += 4) {
                    const userR = userData.data[i];
                    const userG = userData.data[i+1];
                    const userB = userData.data[i+2];
                    const refR = refData.data[i];
                    const refG = refData.data[i+1];
                    const refB = refData.data[i+2];
                    
                    if (Math.abs(userR - refR) > 50 || 
                        Math.abs(userG - refG) > 50 || 
                        Math.abs(userB - refB) > 50) {
                        mismatchCount++;
                    }
                }
                
                const matchPercent = (totalPixels - mismatchCount) / totalPixels * 100;
                const isMatch = matchPercent > 35;
                console.log(`📊 ${symbol}: совпадение ${matchPercent.toFixed(1)}% (${isMatch ? '✅' : '❌'})`);
                resolve(isMatch);
            };
            
            img.onerror = () => {
                console.warn(`⚠️ Нет эталона для ${symbol}`);
                resolve(!this.isEmpty());
            };
            
            img.src = `images/kanji/${symbol}.png`;
        });
    }
}