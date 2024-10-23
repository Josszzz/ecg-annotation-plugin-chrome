import { Measure } from "./measure.js";
import { Cursor } from "./cursor.js";
import { InputBar } from "./inputBar.js";


export class EcgCanvas {
    canvas: HTMLCanvasElement;
    measureCanvas: HTMLCanvasElement;
    measureContext: CanvasRenderingContext2D;
    page: any;
    offsetX: number | undefined;
    offsetY: number | undefined;
    drawWidth: number | undefined;
    drawHeight: number | undefined;
    measures: Measure[];
    cursor: Cursor;
    measuring: boolean;
    inputBar: InputBar;
    scrollRate: number;
    rotation: number;
    renderContext: any;

    constructor(page: any, scrollRate: number = 25, rotation: number = 0) {
        this.canvas = (document.getElementById('renderCanvas') as HTMLCanvasElement);
        this.measureCanvas = (document.getElementById('measureCanvas') as HTMLCanvasElement);
        this.rotation = rotation;
        this.page = page;

        const viewport = this.page.getViewport({scale: 1.0, rotation: this.rotation});
        const context = this.canvas.getContext('2d');
        const measureContext = this.measureCanvas.getContext('2d');
        
        if (context == null || measureContext == null ) {
            throw 'Cannot load 2D context from canvas'
        }

        this.measureContext = measureContext

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
        window.addEventListener('resize', () => this.resizeCanvas());
        // window.addEventListener('load', () => this.resizeCanvas());
        document.addEventListener('keyup', (e) => this.switchKey(e.key));

        // Using pointer events instead of mouse events ensures subpixel accuracy
        this.canvas.addEventListener('pointerup', (e) => this.toggleMeasure(e));
        this.canvas.addEventListener('pointermove', (e) => this.mouseMove(e));
        this.canvas.addEventListener('pointerdown', () => this.cursor.on());
        this.canvas.addEventListener('pointerdown', (e) => this.cursor.update(e));
        this.canvas.addEventListener('pointerup', () => this.cursor.off());
        this.canvas.addEventListener('pointermove', (e) => this.cursor.update(e));

        this.canvas.addEventListener('wheel', (e) => this.wheel(e));

        this.resizeCanvas();
    }

    resetViewport() {
        this.renderContext.viewport = this.page.getViewport({scale: 1.0, rotation: this.rotation});
        this.resizeCanvas();

        // Update cursor
        this.cursor.resetViewport();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.measureCanvas.width = window.innerWidth;
        this.measureCanvas.height = window.innerHeight;
        
        const canvasRatio = this.canvas.width / this.canvas.height;
        var outputScale = 1.0;

        const imgRatio = this.renderContext.viewport.width / this.renderContext.viewport.height;

        if (canvasRatio < imgRatio) {
            // Fit by width
            this.drawWidth = this.canvas.width;
            this.drawHeight = this.drawWidth / imgRatio;
            outputScale = this.drawWidth / this.renderContext.viewport.width;

        } else {
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
    }

    rotate(amount: number) {
        this.rotation = (this.rotation + amount) % 360;
        this.resetViewport();
    }

    imgToCanvas(x: number, y: number) {
        // Compute x and y in image coordinates
        if (this.offsetX == undefined || this.offsetY == undefined || this.drawWidth == undefined || this.drawHeight == undefined) {
            throw('Error...')
        }
        const xCanvas = this.offsetX + x * this.drawWidth / this.renderContext.viewport.width;
        const yCanvas = this.offsetY + y * this.drawHeight / this.renderContext.viewport.height;

        return {x: xCanvas, y: yCanvas}
    }

    canvasToImg(x: number, y: number, relative: boolean = false) {
        if (this.offsetX == undefined || this.offsetY == undefined || this.drawWidth == undefined || this.drawHeight == undefined) {
            throw('Error...')
        }
        
        const offset = relative ? {x: 0, y:0} : {x: this.offsetX, y: this.offsetY}
        // Compute x and y in image coordinates
        const xImg = this.renderContext.viewport.width * (x - offset.x) / this.drawWidth;
        const yImg = this.renderContext.viewport.height * (y - offset.y) / this.drawHeight;

        return {x: xImg, y: yImg}
    }

    draw () {
        this.measureContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (const measure of this.measures) {
            measure.draw();
        }
    }

    updateMeasureDivs() {
        for (const measure of this.measures) {
            measure.updateDiv();
        }
    }

    mouseMove(event: MouseEvent) {
        // If needs be, draw the cursor
        if (this.measuring) {
            const current_measure = this.measures[this.measures.length - 1];
            const imgPos = this.canvasToImg(event.offsetX, event.offsetY)
            current_measure.update(imgPos.x, imgPos.y)
            current_measure.updateDiv();
            this.draw()
        } else if (this.cursor.type != null) {
            this.draw()
            this.cursor.draw(event.clientX, event.clientY)
        }
    }

    toggleMeasure(event: MouseEvent) {
        if (this.measuring) {
            this.measuring = false
            const current_measure = this.measures[this.measures.length - 1];
            const imgPos = this.canvasToImg(event.offsetX, event.offsetY)
            current_measure.update(imgPos.x, imgPos.y)
            current_measure.finalize();
            this.inputBar.resetOn()

        } else if (this.cursor.type) {
            this.measuring = true
            const imgPos = this.canvasToImg(event.offsetX, event.offsetY)
            const measure = new Measure(this, this.cursor.type, imgPos.x, imgPos.y, 45);
            this.measures.push(measure)
        } 
        this.draw();
    }

    get lastMeasure() {
        if (this.measures.length) return this.measures[this.measures.length - 1]
        else return undefined
    }

    deleteMeasure() {
        const removedMeasure = this.measures.pop()
        if (removedMeasure) {
            removedMeasure.delete()
        }
        this.draw()
    }

    clearMeasures() {
        // Clear measures
        for (const measure of this.measures) {
            measure.delete()
        }
        this.measures = [];
        this.measuring = false;
        this.draw();
        this.updateMeasureDivs();
    }

    switchKey(key: string) {
        if (key === 'Enter') {
            this.inputBar.toggle()

        } else if (key === 'Escape') {
            console.debug('Default')
            this.canvas.style.cursor = ''
            this.cursor.type = null
            this.cursor.off()
            this.inputBar.resetOff()
            this.draw()

        } else if (document.activeElement == this.inputBar.inputField) return

        if (key === 'd' || key === 'D' || key === 'Delete' || key === 'Backspace') {
            console.debug('Removed last measure.')
            this.deleteMeasure()
        } else if (key === 'i' || key === 'I' || key === ' ') {
            console.debug('Interval measurement.')
            this.canvas.style.cursor = 'crosshair'
            this.cursor.type = 'interval'
            if (this.measuring && this.lastMeasure) {
                this.lastMeasure.type = 'interval'
            }
            this.draw()

        } else if (key === 'q' || key === 'Q') {
            console.debug('QT measurement.')
            this.canvas.style.cursor = 'crosshair';
            this.cursor.type = 'qt';
            if (this.measuring && this.lastMeasure) {
                this.lastMeasure.type = 'qt'
            }
            this.draw()

        } 
    }

    wheel(event: WheelEvent) {
        if (this.measuring) {
            const current_measure = this.measures[this.measures.length - 1]
            current_measure.adjustAngle(event.deltaY)
            this.draw()
            event.preventDefault()
        }
    }

    get annotations() {
        const annotations = [];
        for (const measure of this.measures) {
            const annotation = {
                type: measure.type,
                start: {x: measure.xStart, y: measure.yStart},
                end: {x: measure.xEnd, y: measure.yEnd},
                angle: measure.angle,
                label: measure.label,
                duration: measure.duration

            }
            annotations.push(annotation)
        }

        // Add the annotation for the scroll rate
        annotations.push({
            type: "__scroll_rate",
            value: this.scrollRate
        })
        
        // Add the annotation for the rotation
        annotations.push({
            type: "__rotation",
            value: this.rotation
        })

        return annotations
    }

    setAnnotations(annotations: any[]) {
        // Start by clearing existing measures
        this.clearMeasures();

        // Load them one by one
        for (const annotation of annotations) {
            if (annotation.type === "__scroll_rate") {
                this.scrollRate = Number(annotation.value);
            } else if (annotation.type === "__rotation") {
                this.rotation = Number(annotation.value);
            } else {
                try {
                    const measure = new Measure(this, annotation.type, annotation.start.x, annotation.start.y, annotation.angle)
                    measure.xEnd = annotation.end.x, measure.yEnd = annotation.end.y
                    measure.label = annotation.label
                    measure.finalize()
                    this.measures.push(measure)
                } catch (e) {
                    console.error('Could not add an annotation: ', e)
                }
            }
        }
        this.resetViewport();
    }

    saveAnnotations(uniqueID: string) {
        const lsKey = `${uniqueID}-${this.page.pageNumber}`
        localStorage.setItem(lsKey, JSON.stringify(this.annotations));
    }

    loadAnnotations(uniqueID: string) {
        const lsKey = `${uniqueID}-${this.page.pageNumber}`
        const data = localStorage.getItem(lsKey);
        if (data) {
            try {
                this.setAnnotations(JSON.parse(data))
            } catch (e) {
                console.error(e)
            }
        } else {
            // Start fresh with nothing
            this.clearMeasures();
            this.resetViewport();
        }
    }
}
