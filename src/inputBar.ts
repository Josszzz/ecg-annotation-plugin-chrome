import { EcgCanvas } from "./ecgCanvas.js"
import { Measure } from "./measure.js"

export class InputBar {
    inputField: HTMLInputElement
    inputBar: HTMLDivElement
    target: Measure | null
    ecgCanvas: EcgCanvas

    constructor(ecgCanvas: EcgCanvas) {
        // Constructor
        this.inputBar = (document.getElementById('inputBar') as HTMLDivElement)
        this.inputField = (document.getElementById('inputField') as HTMLInputElement)

        this.target = null

        this.ecgCanvas = ecgCanvas
    } 

    resetOn() {
        this.target = null
        this.toggle()
    }

    resetOff() {
        this.target = null
        this.inputField.value = ''
        this.inputBar.style.display = 'none'
    }

    toggle() {
        if (this.target) {
            const recalibrate = this.inputField.value.match(/\$(\d+)/);
            if (recalibrate) {
                const trueDuration = parseInt(recalibrate[1])
                const falseDuration = this.target.duration

                // Correct the scroll rate
                this.ecgCanvas.scrollRate *= falseDuration / trueDuration
                this.ecgCanvas.updateMeasureDivs()
                
                console.debug(`Corrected scroll rate to ${this.ecgCanvas.scrollRate} mm/s`)
            } else {
                this.target.label = this.inputField.value
                this.target.updateDiv()
            }
            this.inputField.value = ''
            this.inputBar.style.display = 'none'
            this.target = null
        } else {
            const lastMeasure = this.ecgCanvas.lastMeasure
            if (lastMeasure) {
                this.target = lastMeasure
                this.inputBar.style.display = 'block'
                this.inputField.value = this.target.label
                this.inputField.focus()
                this.inputField.select()
            }
        } 
    }
}