var Cursor = /** @class */ (function () {
    function Cursor(ecgCanvas, zoomSize, zoomDPI) {
        if (zoomSize === void 0) { zoomSize = 100; }
        if (zoomDPI === void 0) { zoomDPI = 300.0; }
        // Store properties
        this.type = null;
        this.x = 0;
        this.y = 0;
        this.zoomSize = zoomSize;
        this.visible = false;
        this.zoomDPI = zoomDPI;
        // Get the zoom canvas and initialize the drawing context 
        this.zoomCanvas = document.getElementById('zoomCanvas');
        this.zoomContainer = document.getElementById('zoomContainer');
        var context = this.zoomCanvas.getContext("2d");
        if (context == null) {
            throw ('Could not load zoom canvas context');
        }
        this.ecgCanvas = ecgCanvas;
        // Draw the page at the required dpi
        var viewport = this.ecgCanvas.page.getViewport({ scale: zoomDPI / 72.0, rotation: this.ecgCanvas.rotation });
        this.zoomCanvas.width = viewport.width;
        this.zoomCanvas.height = viewport.height;
        this.zoomCanvas.style.width = viewport.width;
        this.zoomCanvas.style.height = viewport.height;
        this.zoomContainer.style.width = this.zoomSize + 'px';
        this.zoomContainer.style.height = this.zoomSize + 'px';
        var renderContext = {
            canvasContext: context,
            transform: null,
            viewport: viewport
        };
        this.ecgCanvas.page.render(renderContext);
    }
    Cursor.prototype.resetViewport = function () {
        var context = this.zoomCanvas.getContext("2d");
        if (context == null) {
            throw ('Could not load zoom canvas context');
        }
        // Draw the page at the required dpi
        var viewport = this.ecgCanvas.page.getViewport({ scale: this.zoomDPI / 72.0, rotation: this.ecgCanvas.rotation });
        this.zoomCanvas.width = viewport.width;
        this.zoomCanvas.height = viewport.height;
        this.zoomCanvas.style.width = viewport.width;
        this.zoomCanvas.style.height = viewport.height;
        this.zoomContainer.style.width = this.zoomSize + 'px';
        this.zoomContainer.style.height = this.zoomSize + 'px';
        var renderContext = {
            canvasContext: context,
            transform: null,
            viewport: viewport
        };
        this.ecgCanvas.page.render(renderContext);
    };
    Cursor.prototype.draw = function (x, y) {
        if (this.type == null) {
            return;
        }
        var ctx = this.ecgCanvas.measureContext;
        ctx.beginPath();
        if (this.type == 'interval' || this.type == 'qt') {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.ecgCanvas.canvas.height);
        }
        else if (this.type == 'amplitude') {
            ctx.moveTo(0, y);
            ctx.lineTo(this.ecgCanvas.canvas.width, y);
        }
        ctx.stroke();
    };
    Cursor.prototype.on = function () {
        if (this.type == null) {
            return;
        }
        this.visible = true;
    };
    Cursor.prototype.off = function () {
        this.visible = false;
        this.zoomContainer.style.visibility = 'hidden';
    };
    Cursor.prototype.update = function (event) {
        if (this.visible == false ||
            this.ecgCanvas.offsetX == undefined ||
            this.ecgCanvas.offsetY == undefined ||
            this.ecgCanvas.drawWidth == undefined ||
            this.ecgCanvas.drawHeight == undefined) {
            return;
        }
        var rect = this.ecgCanvas.canvas.getBoundingClientRect();
        var mouseX = event.clientX - rect.left;
        var mouseY = event.clientY - rect.top;
        this.zoomContainer.style.left = (event.clientX - this.zoomSize / 2) + 'px';
        this.zoomContainer.style.top = (event.clientY - this.zoomSize / 2) + 'px';
        var relativeX = (mouseX - this.ecgCanvas.offsetX) / this.ecgCanvas.drawWidth;
        var relativeY = (mouseY - this.ecgCanvas.offsetY) / this.ecgCanvas.drawHeight;
        // Adjust the margin
        this.zoomCanvas.style.left = -(relativeX * this.zoomCanvas.width - this.zoomSize / 2) + 'px';
        this.zoomCanvas.style.top = -(relativeY * this.zoomCanvas.height - this.zoomSize / 2) + 'px';
        this.zoomContainer.style.visibility = 'visible';
    };
    return Cursor;
}());
export { Cursor };
//# sourceMappingURL=cursor.js.map