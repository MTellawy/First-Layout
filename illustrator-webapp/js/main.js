class IllustratorApp {
    constructor() {
        this.canvas = document.getElementById('drawing-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentTool = 'select';
        this.isDrawing = false;
        this.paths = [];
        this.currentPath = null;
        this.selectedObject = null;
        
        // Set canvas size to match container
        this.resizeCanvas();
        
        // Event listeners
        this.setupEventListeners();
        
        // Initialize UI
        this.initUI();
    }
    
    resizeCanvas() {
        const container = document.getElementById('canvas-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }
    
    setupEventListeners() {
        // Canvas events
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
        
        // Touch events for iPad compatibility
        this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.redraw();
        });
        
        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectTool(e.target.dataset.tool);
            });
        });
        
        // Color and stroke inputs
        document.getElementById('stroke-color').addEventListener('change', this.updateStyles.bind(this));
        document.getElementById('fill-color').addEventListener('change', this.updateStyles.bind(this));
        document.getElementById('stroke-width').addEventListener('input', this.updateStyles.bind(this));
        
        // Add layer button
        document.getElementById('add-layer').addEventListener('click', this.addLayer.bind(this));
    }
    
    initUI() {
        // Set initial active tool button
        document.querySelector(`.tool-btn[data-tool="${this.currentTool}"]`).classList.add('active');
    }
    
    selectTool(tool) {
        this.currentTool = tool;
        
        // Update UI
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.tool-btn[data-tool="${tool}"]`).classList.add('active');
    }
    
    updateStyles() {
        this.ctx.strokeStyle = document.getElementById('stroke-color').value;
        this.ctx.fillStyle = document.getElementById('fill-color').value;
        this.ctx.lineWidth = document.getElementById('stroke-width').value;
    }
    
    startDrawing(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.isDrawing = true;
        
        if (this.currentTool === 'pen') {
            this.currentPath = { type: 'path', points: [{x, y}], closed: false };
        } else if (this.currentTool === 'rectangle') {
            this.currentPath = { type: 'rectangle', startX: x, startY: y, x, y };
        } else if (this.currentTool === 'circle') {
            this.currentPath = { type: 'circle', startX: x, startY: y, x, y };
        } else if (this.currentTool === 'line') {
            this.currentPath = { type: 'line', startX: x, startY: y, x, y };
        }
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.currentTool === 'pen' && this.currentPath) {
            this.currentPath.points.push({x, y});
        } else if ((this.currentTool === 'rectangle' || this.currentTool === 'circle' || this.currentTool === 'line') && this.currentPath) {
            this.currentPath.x = x;
            this.currentPath.y = y;
        }
        
        this.redraw();
        
        if (this.currentTool === 'pen' && this.currentPath) {
            // Draw the current path being drawn
            this.ctx.beginPath();
            this.ctx.moveTo(this.currentPath.points[0].x, this.currentPath.points[0].y);
            for (let i = 1; i < this.currentPath.points.length; i++) {
                this.ctx.lineTo(this.currentPath.points[i].x, this.currentPath.points[i].y);
            }
            this.updateStyles();
            this.ctx.stroke();
        } else if (this.currentTool !== 'pen' && this.currentPath) {
            // Preview shape while drawing
            this.updateStyles();
            if (this.currentTool === 'rectangle') {
                const width = this.currentPath.x - this.currentPath.startX;
                const height = this.currentPath.y - this.currentPath.startY;
                this.ctx.strokeRect(this.currentPath.startX, this.currentPath.startY, width, height);
            } else if (this.currentTool === 'circle') {
                const radius = Math.sqrt(
                    Math.pow(this.currentPath.x - this.currentPath.startX, 2) +
                    Math.pow(this.currentPath.y - this.currentPath.startY, 2)
                );
                this.ctx.beginPath();
                this.ctx.arc(
                    this.currentPath.startX,
                    this.currentPath.startY,
                    radius,
                    0,
                    2 * Math.PI
                );
                this.ctx.stroke();
            } else if (this.currentTool === 'line') {
                this.ctx.beginPath();
                this.ctx.moveTo(this.currentPath.startX, this.currentPath.startY);
                this.ctx.lineTo(this.currentPath.x, this.currentPath.y);
                this.ctx.stroke();
            }
        }
    }
    
    stopDrawing() {
        if (this.isDrawing && this.currentPath) {
            this.paths.push(this.currentPath);
            this.currentPath = null;
        }
        this.isDrawing = false;
    }
    
    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup', {});
        this.canvas.dispatchEvent(mouseEvent);
    }
    
    redraw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Redraw all saved paths
        this.paths.forEach(path => {
            this.ctx.beginPath();
            this.updateStyles();
            
            if (path.type === 'path') {
                if (path.points.length > 0) {
                    this.ctx.moveTo(path.points[0].x, path.points[0].y);
                    for (let i = 1; i < path.points.length; i++) {
                        this.ctx.lineTo(path.points[i].x, path.points[i].y);
                    }
                    this.ctx.stroke();
                }
            } else if (path.type === 'rectangle') {
                const width = path.x - path.startX;
                const height = path.y - path.startY;
                this.ctx.strokeRect(path.startX, path.startY, width, height);
            } else if (path.type === 'circle') {
                const radius = Math.sqrt(
                    Math.pow(path.x - path.startX, 2) +
                    Math.pow(path.y - path.startY, 2)
                );
                this.ctx.beginPath();
                this.ctx.arc(
                    path.startX,
                    path.startY,
                    radius,
                    0,
                    2 * Math.PI
                );
                this.ctx.stroke();
            } else if (path.type === 'line') {
                this.ctx.beginPath();
                this.ctx.moveTo(path.startX, path.startY);
                this.ctx.lineTo(path.x, path.y);
                this.ctx.stroke();
            }
        });
    }
    
    addLayer() {
        const layersPanel = document.getElementById('layers-panel');
        const layerCount = layersPanel.children.length;
        const newLayer = document.createElement('div');
        newLayer.className = 'layer-item';
        newLayer.textContent = `Layer ${layerCount + 1}`;
        
        // Add click event to make layer active
        newLayer.addEventListener('click', function() {
            document.querySelectorAll('.layer-item').forEach(item => {
                item.classList.remove('active');
            });
            this.classList.add('active');
        });
        
        layersPanel.appendChild(newLayer);
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new IllustratorApp();
});