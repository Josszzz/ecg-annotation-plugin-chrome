import { EcgCanvas } from "./ecgCanvas.js";

export class Measure {
    type: string;
    xStart: number;
    yStart: number
    xEnd: number;
    yEnd: number;
    angle: number;
    measureDiv: HTMLDivElement;
    grabInfo: {x: number, y:number, initPos: {xStart: number, yStart: number, xEnd: number, yEnd: number}} | undefined
    ecgCanvas: EcgCanvas;
    label: string;

    constructor(ecgCanvas: EcgCanvas, type: string, x: number, y: number, angle: number = 45) {
        this.ecgCanvas = ecgCanvas;
        this.type = type
        this.xStart = x;
        this.xEnd = x;
        this.yStart = y;
        this.yEnd = y;
        this.angle = angle;
        this.label = '';

        // Get the measure contained
        const measureContainer = (document.getElementById('measureContainer') as HTMLDivElement)

        // Create the div containing the measure info
        this.measureDiv = document.createElement('div')
        this.measureDiv.className = 'measureDiv'
        measureContainer.appendChild(this.measureDiv)
    }

    update (x: number, y: number) {
        this.xEnd = Math.max (x, this.xStart)
        this.yEnd = y
    }

    finalize () {
        this.measureDiv.style.pointerEvents = ' all'
        this.measureDiv.style.cursor = 'grab'

        // Add callbacks to move the measure
        this.measureDiv.addEventListener('pointerdown', (e) => this.onMouseDown(e))
    }

    private onMouseDown(e: MouseEvent): void {
        const initPos = {xStart: this.xStart, yStart: this.yStart, xEnd: this.xEnd, yEnd: this.yEnd}
        this.grabInfo = {x: e.clientX, y: e.clientY, initPos: initPos}
        this.bringToFront()

        // Attach event listeners for mousemove and mouseup
        document.addEventListener('pointermove', this.onMouseMove);
        document.addEventListener('pointerup', this.onMouseUp);
    }

    private onMouseMove = (e: MouseEvent): void => {
        if (this.grabInfo == undefined) return
        // Calculate the new position of the element
        const offsetX = e.clientX - this.grabInfo.x;
        const offsetY = e.clientY - this.grabInfo.y;

        const imgOffset = this.ecgCanvas.canvasToImg(offsetX, offsetY, true)

        this.xStart = this.grabInfo.initPos.xStart + imgOffset.x
        this.xEnd = this.grabInfo.initPos.xEnd + imgOffset.x
        this.yStart = this.grabInfo.initPos.yStart + imgOffset.y
        this.yEnd = this.grabInfo.initPos.yEnd + imgOffset.y

        // Redraw the image
        this.ecgCanvas.draw()

        // Update the div
        this.updateDiv()
    }

    private onMouseUp = (): void => {
        // Remove event listeners for mousemove and mouseup when dragging stops
        document.removeEventListener('pointermove', this.onMouseMove);
        document.removeEventListener('pointerup', this.onMouseUp);
    }

    adjustAngle(delta: number) {
        this.angle = this.angle + delta
        this.angle = Math.max(this.angle, 5)
        this.angle = Math.min(this.angle, 175)
    }

    draw() {
        // Convert x start and x end to canvas coordinates
        const canvasWidth = this.ecgCanvas.canvas.width
        const canvasHeight = this.ecgCanvas.canvas.height
        const ctx = this.ecgCanvas.measureContext

        if (this.type == 'interval') {
            ctx.beginPath();
            ctx.moveTo(this.canvasStart.x, 0);
            ctx.lineTo(this.canvasStart.x, canvasHeight);
            ctx.moveTo(this.canvasEnd.x, 0);
            ctx.lineTo(this.canvasEnd.x, canvasHeight);
            ctx.moveTo(this.canvasStart.x, this.canvasEnd.y);
            ctx.lineTo(this.canvasEnd.x, this.canvasEnd.y);
            ctx.stroke();

        } else if (this.type == 'amplitude') {
            ctx.beginPath();
            ctx.moveTo(0, this.canvasStart.y);
            ctx.lineTo(canvasWidth, this.canvasStart.y);
            ctx.moveTo(0, this.canvasEnd.y);
            ctx.lineTo(canvasWidth, this.canvasEnd.y);
            ctx.moveTo(this.canvasEnd.x, this.canvasStart.y);
            ctx.lineTo(this.canvasEnd.x, this.canvasEnd.y);
            ctx.stroke();

        } else if (this.type == 'qt') {
            ctx.beginPath();
            ctx.moveTo(0, this.canvasEnd.y);
            ctx.lineTo(canvasWidth, this.canvasEnd.y);
            ctx.moveTo(this.canvasStart.x, 0);
            ctx.lineTo(this.canvasStart.x, canvasHeight);
            ctx.stroke();

            ctx.beginPath();
            ctx.strokeStyle = '#0004'
            // Solve to compute the line/angle
            const radians = Math.PI * this.angle / 180;
            const dx = Math.cos(radians);
            const dy = Math.sin(radians);
            if (dx == 0) {
                ctx.moveTo(this.canvasEnd.x, 0);
                ctx.lineTo(this.canvasEnd.x, canvasHeight);
            } else if (dy == 0) {
                ctx.moveTo(0, this.canvasEnd.y);
                ctx.lineTo(canvasWidth, this.canvasEnd.y);
            } else {
                const t = [
                    - this.canvasEnd.x / dx,
                    (canvasWidth - this.canvasEnd.x) / dx,
                    - this.canvasEnd.y / dy,
                    (canvasHeight - this.canvasEnd.y) / dy
                ]
                t.sort()
                ctx.moveTo(this.canvasEnd.x + t[1] * dx, this.canvasEnd.y + t[1] * dy);
                ctx.lineTo(this.canvasEnd.x + t[2] * dx, this.canvasEnd.y + t[2] * dy);
            }
            ctx.stroke();
            ctx.strokeStyle = '#000F'
        }
    }

    get canvasStart() {
        return this.ecgCanvas.imgToCanvas(this.xStart, this.yStart);
    }

    get canvasEnd() {
        return this.ecgCanvas.imgToCanvas(this.xEnd, this.yEnd);
    }

    updateDiv() {
        const rect = this.ecgCanvas.measureCanvas.getBoundingClientRect();
        const canvasStart = this.ecgCanvas.imgToCanvas(this.xStart, this.yStart);
        const canvasEnd = this.ecgCanvas.imgToCanvas(this.xEnd, this.yEnd);

        this.measureDiv.style.left = (Math.min(canvasStart.x, canvasEnd.x) + rect.left) + 'px';
        this.measureDiv.style.top = (canvasEnd.y + rect.top) + 'px';
        this.measureDiv.style.width = Math.max(0, Math.abs(canvasEnd.x - canvasStart.x) - 1) + 'px';
        this.measureDiv.textContent = this.label ? `${this.label}: ${Math.round(this.duration)}` : `${Math.round(this.duration)}`
    }

    get duration() {
        const dx = Math.abs(this.xEnd - this.xStart)
        
        // 72 dpi is the default for pdf rendering
        return 1000 * 25.4 * dx / (72 * this.ecgCanvas.scrollRate)
    }

    delete() {
        this.measureDiv.parentElement?.removeChild(this.measureDiv);
    }

    bringToFront() {
        const index = this.ecgCanvas.measures.indexOf(this);
        if (index > -1) {
            // Remove the object from its current position
            this.ecgCanvas.measures.splice(index, 1);
            // Push it to the end of the array
            this.ecgCanvas.measures.push(this);
        }
    }
}