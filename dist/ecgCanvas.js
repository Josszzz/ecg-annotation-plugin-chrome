import { Measure } from "./measure.js";
import { Cursor } from "./cursor.js";
import { InputBar } from "./inputBar.js";
var EcgCanvas = /** @class */ (function () {
    function EcgCanvas(page, scrollRate, rotation) {
        if (scrollRate === void 0) { scrollRate = 25; }
        if (rotation === void 0) { rotation = 0; }
        var _this = this;
        this.canvas = document.getElementById('renderCanvas');
        this.measureCanvas = document.getElementById('measureCanvas');
        this.rotation = rotation;
        this.page = page;
        var viewport = this.page.getViewport({ scale: 1.0, rotation: this.rotation });
        var context = this.canvas.getContext('2d');
        var measureContext = this.measureCanvas.getContext('2d');
        if (context == null || measureContext == null) {
            throw 'Cannot load 2D context from canvas';
        }
        this.measureContext = measureContext;
        this.renderContext = {
            canvasContext: context,
            transform: null,
            viewport: viewport
        };
        this.scrollRate = scrollRate;
        this.cursor = new Cursor(this);
        this.inputBar = new InputBar(this);
        this.measures = [];
        this.measuring = false;
        // Callbacks
        window.addEventListener('resize', function () { return _this.resizeCanvas(); });
        // window.addEventListener('load', () => this.resizeCanvas());
        document.addEventListener('keyup', function (e) { return _this.switchKey(e.key); });
        // Using pointer events instead of mouse events ensures subpixel accuracy
        this.canvas.addEventListener('pointerup', function (e) { return _this.toggleMeasure(e); });
        this.canvas.addEventListener('pointermove', function (e) { return _this.mouseMove(e); });
        this.canvas.addEventListener('pointerdown', function () { return _this.cursor.on(); });
        this.canvas.addEventListener('pointerdown', function (e) { return _this.cursor.update(e); });
        this.canvas.addEventListener('pointerup', function () { return _this.cursor.off(); });
        this.canvas.addEventListener('pointermove', function (e) { return _this.cursor.update(e); });
        this.canvas.addEventListener('wheel', function (e) { return _this.wheel(e); });
        this.resizeCanvas();
    }
    EcgCanvas.prototype.resetViewport = function () {
        this.renderContext.viewport = this.page.getViewport({ scale: 1.0, rotation: this.rotation });
        this.resizeCanvas();
        // Update cursor
        this.cursor.resetViewport();
    };
    EcgCanvas.prototype.resizeCanvas = function () {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.measureCanvas.width = window.innerWidth;
        this.measureCanvas.height = window.innerHeight;
        var canvasRatio = this.canvas.width / this.canvas.height;
        var outputScale = 1.0;
        var imgRatio = this.renderContext.viewport.width / this.renderContext.viewport.height;
        if (canvasRatio < imgRatio) {
            // Fit by width
            this.drawWidth = this.canvas.width;
            this.drawHeight = this.drawWidth / imgRatio;
            outputScale = this.drawWidth / this.renderContext.viewport.width;
        }
        else {
            // Fit by height
            this.drawHeight = this.canvas.height;
            this.drawWidth = this.drawHeight * imgRatio;
            outputScale = this.drawHeight / this.renderContext.viewport.height;
        }
        this.offsetX = (this.canvas.width - this.drawWidth) / 2;
        this.offsetY = (this.canvas.height - this.drawHeight) / 2;
        this.renderContext.transform = outputScale !== 1
            ? [outputScale, 0, 0, outputScale, this.offsetX, this.offsetY]
            : null;
        this.page.render(this.renderContext);
        this.draw();
        this.updateMeasureDivs();
    };
    EcgCanvas.prototype.rotate = function (amount) {
        this.rotation = (this.rotation + amount) % 360;
        this.resetViewport();
    };
    EcgCanvas.prototype.imgToCanvas = function (x, y) {
        // Compute x and y in image coordinates
        if (this.offsetX == undefined || this.offsetY == undefined || this.drawWidth == undefined || this.drawHeight == undefined) {
            throw ('Error...');
        }
        var xCanvas = this.offsetX + x * this.drawWidth / this.renderContext.viewport.width;
        var yCanvas = this.offsetY + y * this.drawHeight / this.renderContext.viewport.height;
        return { x: xCanvas, y: yCanvas };
    };
    EcgCanvas.prototype.canvasToImg = function (x, y, relative) {
        if (relative === void 0) { relative = false; }
        if (this.offsetX == undefined || this.offsetY == undefined || this.drawWidth == undefined || this.drawHeight == undefined) {
            throw ('Error...');
        }
        var offset = relative ? { x: 0, y: 0 } : { x: this.offsetX, y: this.offsetY };
        // Compute x and y in image coordinates
        var xImg = this.renderContext.viewport.width * (x - offset.x) / this.drawWidth;
        var yImg = this.renderContext.viewport.height * (y - offset.y) / this.drawHeight;
        return { x: xImg, y: yImg };
    };
    EcgCanvas.prototype.draw = function () {
        this.measureContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (var _i = 0, _a = this.measures; _i < _a.length; _i++) {
            var measure = _a[_i];
            measure.draw();
        }
    };
    EcgCanvas.prototype.updateMeasureDivs = function () {
        for (var _i = 0, _a = this.measures; _i < _a.length; _i++) {
            var measure = _a[_i];
            measure.updateDiv();
        }
    };
    EcgCanvas.prototype.mouseMove = function (event) {
        // If needs be, draw the cursor
        if (this.measuring) {
            var current_measure = this.measures[this.measures.length - 1];
            var imgPos = this.canvasToImg(event.offsetX, event.offsetY);
            current_measure.update(imgPos.x, imgPos.y);
            current_measure.updateDiv();
            this.draw();
        }
        else if (this.cursor.type != null) {
            this.draw();
            this.cursor.draw(event.clientX, event.clientY);
        }
    };
    EcgCanvas.prototype.toggleMeasure = function (event) {
        if (this.measuring) {
            this.measuring = false;
            var current_measure = this.measures[this.measures.length - 1];
            var imgPos = this.canvasToImg(event.offsetX, event.offsetY);
            current_measure.update(imgPos.x, imgPos.y);
            current_measure.finalize();
            this.inputBar.resetOn();
        }
        else if (this.cursor.type) {
            this.measuring = true;
            var imgPos = this.canvasToImg(event.offsetX, event.offsetY);
            var measure = new Measure(this, this.cursor.type, imgPos.x, imgPos.y, 45);
            this.measures.push(measure);
        }
        this.draw();
    };
    Object.defineProperty(EcgCanvas.prototype, "lastMeasure", {
        get: function () {
            if (this.measures.length)
                return this.measures[this.measures.length - 1];
            else
                return undefined;
        },
        enumerable: false,
        configurable: true
    });
    EcgCanvas.prototype.deleteMeasure = function () {
        var removedMeasure = this.measures.pop();
        if (removedMeasure) {
            removedMeasure.delete();
        }
        this.draw();
    };
    EcgCanvas.prototype.clearMeasures = function () {
        // Clear measures
        for (var _i = 0, _a = this.measures; _i < _a.length; _i++) {
            var measure = _a[_i];
            measure.delete();
        }
        this.measures = [];
        this.measuring = false;
        this.draw();
        this.updateMeasureDivs();
    };
    EcgCanvas.prototype.switchKey = function (key) {
        if (key === 'Enter') {
            this.inputBar.toggle();
        }
        else if (key === 'Escape') {
            console.debug('Default');
            this.canvas.style.cursor = '';
            this.cursor.type = null;
            this.cursor.off();
            this.inputBar.resetOff();
            this.draw();
        }
        else if (document.activeElement == this.inputBar.inputField)
            return;
        if (key === 'd' || key === 'D' || key === 'Delete' || key === 'Backspace') {
            console.debug('Removed last measure.');
            this.deleteMeasure();
        }
        else if (key === 'i' || key === 'I' || key === ' ') {
            console.debug('Interval measurement.');
            this.canvas.style.cursor = 'crosshair';
            this.cursor.type = 'interval';
            if (this.measuring && this.lastMeasure) {
                this.lastMeasure.type = 'interval';
            }
            this.draw();
        }
        else if (key === 'q' || key === 'Q') {
            console.debug('QT measurement.');
            this.canvas.style.cursor = 'crosshair';
            this.cursor.type = 'qt';
            if (this.measuring && this.lastMeasure) {
                this.lastMeasure.type = 'qt';
            }
            this.draw();
        }
    };
    EcgCanvas.prototype.wheel = function (event) {
        if (this.measuring) {
            var current_measure = this.measures[this.measures.length - 1];
            current_measure.adjustAngle(event.deltaY);
            this.draw();
            event.preventDefault();
        }
    };
    Object.defineProperty(EcgCanvas.prototype, "annotations", {
        get: function () {
            var annotations = [];
            for (var _i = 0, _a = this.measures; _i < _a.length; _i++) {
                var measure = _a[_i];
                var annotation = {
                    type: measure.type,
                    start: { x: measure.xStart, y: measure.yStart },
                    end: { x: measure.xEnd, y: measure.yEnd },
                    angle: measure.angle,
                    label: measure.label,
                    duration: measure.duration
                };
                annotations.push(annotation);
            }
            // Add the annotation for the scroll rate
            annotations.push({
                type: "__scroll_rate",
                value: this.scrollRate
            });
            // Add the annotation for the rotation
            annotations.push({
                type: "__rotation",
                value: this.rotation
            });
            return annotations;
        },
        enumerable: false,
        configurable: true
    });
    EcgCanvas.prototype.setAnnotations = function (annotations) {
        // Start by clearing existing measures
        this.clearMeasures();
        this.scrollRate = 25;
        // Load them one by one
        for (var _i = 0, annotations_1 = annotations; _i < annotations_1.length; _i++) {
            var annotation = annotations_1[_i];
            if (annotation.type === "__scroll_rate") {
                this.scrollRate = Number(annotation.value);
            }
            else if (annotation.type === "__rotation") {
                this.rotation = Number(annotation.value);
            }
            else {
                try {
                    var measure = new Measure(this, annotation.type, annotation.start.x, annotation.start.y, annotation.angle);
                    measure.xEnd = annotation.end.x, measure.yEnd = annotation.end.y;
                    measure.label = annotation.label;
                    measure.finalize();
                    this.measures.push(measure);
                }
                catch (e) {
                    console.error('Could not add an annotation: ', e);
                }
            }
        }
        this.resetViewport();
    };
    EcgCanvas.prototype.saveAnnotations = function (uniqueID) {
        var lsKey = "".concat(uniqueID, "-").concat(this.page.pageNumber);
        localStorage.setItem(lsKey, JSON.stringify(this.annotations));
    };
    EcgCanvas.prototype.loadAnnotations = function (uniqueID) {
        var lsKey = "".concat(uniqueID, "-").concat(this.page.pageNumber);
        var data = localStorage.getItem(lsKey);
        if (data) {
            try {
                this.setAnnotations(JSON.parse(data));
            }
            catch (e) {
                console.error(e);
            }
        }
        else {
            // Start fresh with nothing
            this.clearMeasures();
            this.resetViewport();
        }
    };
    return EcgCanvas;
}());
export { EcgCanvas };
//# sourceMappingURL=ecgCanvas.js.map