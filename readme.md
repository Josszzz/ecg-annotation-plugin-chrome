# PDF ECG viewer
An HTML5 ECG annotation tool.

## Usage
1) Install on chrome browser
2) Click on the button in chrome browser
3) Select the pdf file you want to read/annotate

## Annotation:
Press the `I` key to create an interval annotation.
Press the `Q` key to create an QT measurement. The mouse wheel can be used to adjust the tangent.

Once a measurement has been made, you can delete it using the `d` key, or add a text comment.

The grid is calibrated by default to a scroll rate of 25mm/s and scan resolution of 72dpi, fullsize. Sometimes, this is not valid. You can recalibrate the scroll rate by adding a text comment `$DURATION`. For example, if you measure an interval of 1000ms, type `$1000` as a comment for this measurement and the entire page will be recalibrated accordingly.