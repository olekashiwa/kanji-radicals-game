// js/drawing.js
// Модуль рисования кандзи (рукописный ввод)

export class DrawingTest {
    constructor(canvasId, onResult) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas?.getContext('2d');
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
        // Устанавливаем размер canvas (адаптивно)
        const size = Math.min(window.innerWidth * 0.8, 400);
        this.canvas.width = size;
        this.canvas.height = size;
        this.canvas.style.width = `${size}px`;
        this.canvas.style.height = `${size}px`;
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        
        // Белый фон
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Настройка кисти
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.lineWidth = 6;
        this.ctx.strokeStyle = '#333';
    }
    
    initEvents() {
        // Мышь
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseleave', this.stopDrawing.bind(this));
        
        // Touch (мобильные устройства)
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
    
    getImageData() {
        return this.canvas.toDataURL();
    }
    
    // Проверка: пустой ли холст?
    isEmpty() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const pixels = imageData.data;
        for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i+3] !== 0) return false; // есть непрозрачные пиксели
        }
        return true;
    }
    
    // Сравнение с эталонным изображением
    async compareWithReference(symbol) {
        // 1. Если холст пуст → сразу неправильно
        if (this.isEmpty()) {
            console.log('Холст пуст');
            return false;
        }

        // 2. Пытаемся загрузить эталонное изображение
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = `images/kanji/${symbol}.png`;
        
        return new Promise((resolve) => {
            img.onload = async () => {
                // Создаём временный canvas с эталоном
                const refCanvas = document.createElement('canvas');
                refCanvas.width = this.canvas.width;
                refCanvas.height = this.canvas.height;
                const refCtx = refCanvas.getContext('2d');
                refCtx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
                
                // Сравниваем пиксели через pixelmatch
                const userData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                const refData = refCtx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                
                // pixelmatch доступен глобально
                const mismatchedPixels = pixelmatch(
                    userData.data, refData.data, null,
                    this.canvas.width, this.canvas.height,
                    { threshold: 0.2 }
                );
                
                const totalPixels = this.canvas.width * this.canvas.height;
                const matchPercent = (totalPixels - mismatchedPixels) / totalPixels * 100;
                console.log(`Совпадение с ${symbol}: ${matchPercent.toFixed(1)}%`);
                
                resolve(matchPercent > 40);
            };
            
            img.onerror = () => {
                console.warn(`Нет эталона для ${symbol}, проверяем только на пустоту`);
                resolve(!this.isEmpty());
            };
        });
    }
}