var Measure = /** @class */ (function () {
    function Measure(ecgCanvas, type, x, y, angle) {
        if (angle === void 0) { angle = 45; }
        var _this = this;
        this.onMouseMove = function (e) {
            if (_this.grabInfo == undefined)
                return;
            // Calculate the new position of the element
            var offsetX = e.clientX - _this.grabInfo.x;
            var offsetY = e.clientY - _this.grabInfo.y;
            var imgOffset = _this.ecgCanvas.canvasToImg(offsetX, offsetY, true);
            _this.xStart = _this.grabInfo.initPos.xStart + imgOffset.x;
            _this.xEnd = _this.grabInfo.initPos.xEnd + imgOffset.x;
            _this.yStart = _this.grabInfo.initPos.yStart + imgOffset.y;
            _this.yEnd = _this.grabInfo.initPos.yEnd + imgOffset.y;
            // Redraw the image
            _this.ecgCanvas.draw();
            // Update the div
            _this.updateDiv();
        };
        this.onMouseUp = function () {
            // Remove event listeners for mousemove and mouseup when dragging stops
            document.removeEventListener('pointermove', _this.onMouseMove);
            document.removeEventListener('pointerup', _this.onMouseUp);
        };
        this.ecgCanvas = ecgCanvas;
        this.type = type;
        this.xStart = x;
        this.xEnd = x;
        this.yStart = y;
        this.yEnd = y;
        this.angle = angle;
        this.label = '';
        // Get the measure contained
        var measureContainer = document.getElementById('measureContainer');
        // Create the div containing the measure info
        this.measureDiv = document.createElement('div');
        this.measureDiv.className = 'measureDiv';
        measureContainer.appendChild(this.measureDiv);
    }
    Measure.prototype.update = function (x, y) {
        this.xEnd = Math.max(x, this.xStart);
        this.yEnd = y;
    };
    Measure.prototype.finalize = function () {
        var _this = this;
        this.measureDiv.style.pointerEvents = ' all';
        this.measureDiv.style.cursor = 'grab';
        // Add callbacks to move the measure
        this.measureDiv.addEventListener('pointerdown', function (e) { return _this.onMouseDown(e); });
    };
    Measure.prototype.onMouseDown = function (e) {
        var initPos = { xStart: this.xStart, yStart: this.yStart, xEnd: this.xEnd, yEnd: this.yEnd };
        this.grabInfo = { x: e.clientX, y: e.clientY, initPos: initPos };
        this.bringToFront();
        // Attach event listeners for mousemove and mouseup
        document.addEventListener('pointermove', this.onMouseMove);
        document.addEventListener('pointerup', this.onMouseUp);
    };
    Measure.prototype.adjustAngle = function (delta) {
        this.angle = this.angle + delta;
        this.angle = Math.max(this.angle, 5);
        this.angle = Math.min(this.angle, 175);
    };
    Measure.prototype.draw = function () {
        // Convert x start and x end to canvas coordinates
        var canvasWidth = this.ecgCanvas.canvas.width;
        var canvasHeight = this.ecgCanvas.canvas.height;
        var ctx = this.ecgCanvas.measureContext;
        if (this.type == 'interval') {
            ctx.beginPath();
            ctx.moveTo(this.canvasStart.x, 0);
            ctx.lineTo(this.canvasStart.x, canvasHeight);
            ctx.moveTo(this.canvasEnd.x, 0);
            ctx.lineTo(this.canvasEnd.x, canvasHeight);
            ctx.moveTo(this.canvasStart.x, this.canvasEnd.y);
            ctx.lineTo(this.canvasEnd.x, this.canvasEnd.y);
            ctx.stroke();
        }
        else if (this.type == 'amplitude') {
            ctx.beginPath();
            ctx.moveTo(0, this.canvasStart.y);
            ctx.lineTo(canvasWidth, this.canvasStart.y);
            ctx.moveTo(0, this.canvasEnd.y);
            ctx.lineTo(canvasWidth, this.canvasEnd.y);
            ctx.moveTo(this.canvasEnd.x, this.canvasStart.y);
            ctx.lineTo(this.canvasEnd.x, this.canvasEnd.y);
            ctx.stroke();
        }
        else if (this.type == 'qt') {
            ctx.beginPath();
            ctx.moveTo(0, this.canvasEnd.y);
            ctx.lineTo(canvasWidth, this.canvasEnd.y);
            ctx.moveTo(this.canvasStart.x, 0);
            ctx.lineTo(this.canvasStart.x, canvasHeight);
            ctx.stroke();
            ctx.beginPath();
            ctx.strokeStyle = '#0004';
            // Solve to compute the line/angle
            var radians = Math.PI * this.angle / 180;
            var dx = Math.cos(radians);
            var dy = Math.sin(radians);
            if (dx == 0) {
                ctx.moveTo(this.canvasEnd.x, 0);
                ctx.lineTo(this.canvasEnd.x, canvasHeight);
            }
            else if (dy == 0) {
                ctx.moveTo(0, this.canvasEnd.y);
                ctx.lineTo(canvasWidth, this.canvasEnd.y);
            }
            else {
                var t = [
                    -this.canvasEnd.x / dx,
                    (canvasWidth - this.canvasEnd.x) / dx,
                    -this.canvasEnd.y / dy,
                    (canvasHeight - this.canvasEnd.y) / dy
                ];
                t.sort();
                ctx.moveTo(this.canvasEnd.x + t[1] * dx, this.canvasEnd.y + t[1] * dy);
                ctx.lineTo(this.canvasEnd.x + t[2] * dx, this.canvasEnd.y + t[2] * dy);
            }
            ctx.stroke();
            ctx.strokeStyle = '#000F';
        }
    };
    Object.defineProperty(Measure.prototype, "canvasStart", {
        get: function () {
            return this.ecgCanvas.imgToCanvas(this.xStart, this.yStart);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Measure.prototype, "canvasEnd", {
        get: function () {
            return this.ecgCanvas.imgToCanvas(this.xEnd, this.yEnd);
        },
        enumerable: false,
        configurable: true
    });
    Measure.prototype.updateDiv = function () {
        var rect = this.ecgCanvas.measureCanvas.getBoundingClientRect();
        var canvasStart = this.ecgCanvas.imgToCanvas(this.xStart, this.yStart);
        var canvasEnd = this.ecgCanvas.imgToCanvas(this.xEnd, this.yEnd);
        this.measureDiv.style.left = (Math.min(canvasStart.x, canvasEnd.x) + rect.left) + 'px';
        this.measureDiv.style.top = (canvasEnd.y + rect.top) + 'px';
        this.measureDiv.style.width = Math.max(0, Math.abs(canvasEnd.x - canvasStart.x) - 1) + 'px';
        this.measureDiv.textContent = this.label ? "".concat(this.label, ": ").concat(Math.round(this.duration)) : "".concat(Math.round(this.duration));
    };
    Object.defineProperty(Measure.prototype, "duration", {
        get: function () {
            var dx = Math.abs(this.xEnd - this.xStart);
            // 72 dpi is the default for pdf rendering
            return 1000 * 25.4 * dx / (72 * this.ecgCanvas.scrollRate);
        },
        enumerable: false,
        configurable: true
    });
    Measure.prototype.delete = function () {
        var _a;
        (_a = this.measureDiv.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(this.measureDiv);
    };
    Measure.prototype.bringToFront = function () {
        var index = this.ecgCanvas.measures.indexOf(this);
        if (index > -1) {
            // Remove the object from its current position
            this.ecgCanvas.measures.splice(index, 1);
            // Push it to the end of the array
            this.ecgCanvas.measures.push(this);
        }
    };
    return Measure;
}());
export { Measure };
//# sourceMappingURL=measure.js.map