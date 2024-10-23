var InputBar = /** @class */ (function () {
    function InputBar(ecgCanvas) {
        // Constructor
        this.inputBar = document.getElementById('inputBar');
        this.inputField = document.getElementById('inputField');
        this.target = null;
        this.ecgCanvas = ecgCanvas;
    }
    InputBar.prototype.resetOn = function () {
        this.target = null;
        this.toggle();
    };
    InputBar.prototype.resetOff = function () {
        this.target = null;
        this.inputField.value = '';
        this.inputBar.style.display = 'none';
    };
    InputBar.prototype.toggle = function () {
        if (this.target) {
            var recalibrate = this.inputField.value.match(/\$(\d+)/);
            if (recalibrate) {
                var trueDuration = parseInt(recalibrate[1]);
                var falseDuration = this.target.duration;
                // Correct the scroll rate
                this.ecgCanvas.scrollRate *= falseDuration / trueDuration;
                this.ecgCanvas.updateMeasureDivs();
                console.debug("Corrected scroll rate to ".concat(this.ecgCanvas.scrollRate, " mm/s"));
            }
            else {
                this.target.label = this.inputField.value;
                this.target.updateDiv();
            }
            this.inputField.value = '';
            this.inputBar.style.display = 'none';
            this.target = null;
        }
        else {
            var lastMeasure = this.ecgCanvas.lastMeasure;
            if (lastMeasure) {
                this.target = lastMeasure;
                this.inputBar.style.display = 'block';
                this.inputField.value = this.target.label;
                this.inputField.focus();
                this.inputField.select();
            }
        }
    };
    return InputBar;
}());
export { InputBar };
//# sourceMappingURL=inputBar.js.map