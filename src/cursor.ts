import { EcgCanvas } from "./ecgCanvas.js"

export class Cursor {
    x: number;
    y: number;
    type: string | null;
    zoomCanvas: HTMLCanvasElement;
    zoomContainer: HTMLDivElement;
    zoomSize: number;
    zoomDPI: number;
    visible: boolean;
    ecgCanvas: EcgCanvas;

    constructor(ecgCanvas: EcgCanvas, zoomSize: number = 100, zoomDPI: number = 300.0) {
        // Store properties
        this.type = null;
        this.x = 0;
        this.y = 0;
        this.zoomSize = zoomSize;
        this.visible = false;
        this.zoomDPI = zoomDPI;

        // Get the zoom canvas and initialize the drawing context 
        this.zoomCanvas = (document.getElementById('zoomCanvas') as HTMLCanvasElement);
        this.zoomContainer = (document.getElementById('zoomContainer') as HTMLDivElement);

        const context = this.zoomCanvas.getContext("2d");
        if (context == null) {
            throw('Could not load zoom canvas context')
        }
        this.ecgCanvas = ecgCanvas;

        // Draw the page at the required dpi
        const viewport = this.ecgCanvas.page.getViewport({scale: zoomDPI/72.0, rotation: this.ecgCanvas.rotation});
        this.zoomCanvas.width = viewport.width;
        this.zoomCanvas.height = viewport.height;
        this.zoomCanvas.style.width = viewport.width;
        this.zoomCanvas.style.height = viewport.height;

        this.zoomContainer.style.width = this.zoomSize + 'px';
        this.zoomContainer.style.height = this.zoomSize + 'px';

        const renderContext = {
            canvasContext: context,
            transform: null,
            viewport: viewport
        };

        this.ecgCanvas.page.render(renderContext);
    }

    resetViewport() {
        const context = this.zoomCanvas.getContext("2d")
        if (context == null) {
            throw('Could not load zoom canvas context')
        }
        
        // Draw the page at the required dpi
        const viewport = this.ecgCanvas.page.getViewport({scale: this.zoomDPI/72.0, rotation: this.ecgCanvas.rotation})
        this.zoomCanvas.width = viewport.width;
        this.zoomCanvas.height = viewport.height;
        this.zoomCanvas.style.width = viewport.width;
        this.zoomCanvas.style.height = viewport.height;

        this.zoomContainer.style.width = this.zoomSize + 'px'
        this.zoomContainer.style.height = this.zoomSize + 'px'

        const renderContext = {
            canvasContext: context,
            transform: null,
            viewport: viewport
        };

        this.ecgCanvas.page.render(renderContext);
    }

    draw(x: number, y: number) {
        if (this.type == null) {
            return
        } 
        const ctx = this.ecgCanvas.measureContext
        ctx.beginPath();
        if (this.type == 'interval' || this.type == 'qt') {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.ecgCanvas.canvas.height);
        } else if (this.type == 'amplitude') {
            ctx.moveTo(0, y);
            ctx.lineTo(this.ecgCanvas.canvas.width, y);
        }
        ctx.stroke();
    }

    on () {
        if (this.type == null) {
            return
        }
        this.visible = true
    }

    off () {
        this.visible = false
        this.zoomContainer.style.visibility = 'hidden'
    }

    update(event: MouseEvent) {
        if (this.visible == false || 
            this.ecgCanvas.offsetX == undefined || 
            this.ecgCanvas.offsetY == undefined || 
            this.ecgCanvas.drawWidth == undefined ||
            this.ecgCanvas.drawHeight == undefined) {
            return
        }

        const rect = this.ecgCanvas.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        this.zoomContainer.style.left = (event.clientX - this.zoomSize / 2) + 'px';
        this.zoomContainer.style.top = (event.clientY - this.zoomSize / 2) + 'px';        
        

        const relativeX = (mouseX - this.ecgCanvas.offsetX) / this.ecgCanvas.drawWidth;
        const relativeY = (mouseY - this.ecgCanvas.offsetY) / this.ecgCanvas.drawHeight;
        
        // Adjust the margin
        this.zoomCanvas.style.left = - (relativeX * this.zoomCanvas.width - this.zoomSize / 2) + 'px'
        this.zoomCanvas.style.top = - (relativeY * this.zoomCanvas.height - this.zoomSize / 2) + 'px'

        this.zoomContainer.style.visibility = 'visible'
    }        
}
