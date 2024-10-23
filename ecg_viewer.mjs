import * as pdfjsLib from '/libs/pdfjs/pdf.mjs';
import { EcgCanvas } from "/dist/ecgCanvas.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = 'libs/pdfjs/pdf.worker.mjs';

const selectPDF = document.getElementById('selectPdfButton')
selectPDF.addEventListener('click', () => fileInput.click())

const fileInput = document.getElementById('fileInput')

fileInput.addEventListener('change', async function(e) {
  const file = e.target.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = async function() {
      const arrayBuffer = new Uint8Array(this.result);
      const hash = await computeHashFromArrayBuffer(arrayBuffer);
      await processPDF(arrayBuffer, hash);
    };
    reader.readAsArrayBuffer(file);

    // Hide the selector
    const selectors = document.getElementsByClassName('selector')
    for (const c of selectors){
      console.log(c)
      c.classList.add("hidden")
    }

    // Display the controls
    const controls = document.getElementsByClassName('controls')
    for (const c of controls){
      c.classList.remove("hidden")
    }
  }
});

async function computeHashFromArrayBuffer(arrayBuffer) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // Convert buffer to byte array
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // Convert bytes to hex string
  return hashHex;
}

async function processPDF(pdfData, pdfUniqueID) {
  try {
    const loadingTask = pdfjsLib.getDocument({data: pdfData});
    const pdf = await loadingTask.promise;
    const pageNumInput = document.getElementById('pageNum');

    let pageNum = 1
    const page = await pdf.getPage(pageNum);
    const ecgCanvas = new EcgCanvas(page);
    ecgCanvas.loadAnnotations(pdfUniqueID)
    pageNumInput.value = 1;

    // Change page function def
    async function changePage(pageId) {
      pageId = Math.round(pageId);
      if (pageId < 1 || pageId > pdf.numPages) {
        console.error('Page num out of range.');
        changePage(pageNum);
        return;
      }
      if (pageId != pageNum){
        ecgCanvas.saveAnnotations(pdfUniqueID)
        pageNum = pageId;
        ecgCanvas.page = await pdf.getPage(pageNum);
        ecgCanvas.loadAnnotations(pdfUniqueID)
      }
      pageNumInput.value = pageNum;
    }

    // Export annotations function def
    function exportAnnotations() {
      // Start by saving current annotations
      ecgCanvas.saveAnnotations(pdfUniqueID)

      const allAnnotations = []

      // Get all annotations from the localstorage
      for (let iPage=1; iPage <= pdf.numPages; iPage++) {
        const lsKey = `${pdfUniqueID}-${iPage}`;
        const data = localStorage.getItem(lsKey);
        const annotations = data ? JSON.parse(data) : {};
        allAnnotations.push(annotations);
      }

      // Stringify, put in blob and download
      const jsonData = JSON.stringify(allAnnotations)
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'export_annotations.json';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 0)
    }

    // Define callbacks
    document.getElementById('cw-rotate').addEventListener('mouseup',()=> ecgCanvas.rotate(90))
    document.getElementById('ccw-rotate').addEventListener('mouseup',()=> ecgCanvas.rotate(-90))
    document.getElementById('next').addEventListener('mouseup', () => changePage(pageNum + 1));
    document.getElementById('previous').addEventListener('mouseup', () => changePage(pageNum - 1));    
    document.getElementById('save').addEventListener('mouseup', ()=> exportAnnotations());
    document.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft') {
        changePage(pageNum - 1)
      } else if (e.key === 'ArrowRight') {
        changePage(pageNum + 1)
      }
    });
    
    pageNumInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        changePage(pageNumInput.value)
      }
      e.stopPropagation();
    })

    // Add total pages
    document.getElementById('numPages').innerText = `/${pdf.numPages}`

  } catch (error) {
    console.error('Error processing PDF:', error);
    document.getElementById('status').textContent = 'Error: ' + error.message;
  }
}

function calculateDPI(page, img, width, height) {
  // Simplified DPI calculation
  const viewport = page.getViewport({ scale: 1 });
  const scaleX = viewport.scale;
  const scaleY = viewport.scale;

  // PDF units are in points (1/72 inch)
  const widthInInches = (width / scaleX) / 72;
  const heightInInches = (height / scaleY) / 72;

  const dpiX = width / widthInInches;
  const dpiY = height / heightInInches;

  return {
    dpiX: Math.round(dpiX),
    dpiY: Math.round(dpiY),
  };
}
