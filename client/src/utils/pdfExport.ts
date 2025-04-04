import jsPDF from 'jspdf';
import { ComicState } from '@/types/comic';

interface ExportToPdfOptions {
  state: ComicState;
  quality?: number;
  filename?: string;
}

export const exportToPdf = async ({
  state,
  quality = 1,
  filename = 'my-comic.pdf'
}: ExportToPdfOptions): Promise<void> => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // **Title Page**
  pdf.setFontSize(24);
  if (state.mainTitle) {
    pdf.text(state.mainTitle, pageWidth / 2, 30, { align: 'center' });
  }

  pdf.setFontSize(12);
  pdf.text('Created with Comic Creator Express', pageWidth / 2, 40, { align: 'center' });

  if (state.description) {
    pdf.setFontSize(14);
    const descLines = pdf.splitTextToSize(state.description, 160);
    pdf.text(descLines, 20, 60);
  }

  // **Loop through pages**
  for (const page of state.pages) {
    pdf.addPage();

    // **Page Title**
    pdf.setFontSize(18);
    if (page.title) {
      pdf.text(`Page ${page.number}: ${page.title}`, pageWidth / 2, 20, { align: 'center' });
    }

    // **Page Content**
    let yPosition = 40; // Start below the title
    if (page.content) {
      pdf.setFontSize(12);
      const contentLines = pdf.splitTextToSize(page.content, 170);
      pdf.text(contentLines, 20, yPosition);
      yPosition += contentLines.length * 6 + 10; // Adjust spacing dynamically
    }

    // **Add Images in 2-Per-Row Grid Layout**
    const imgWidth = 85;  // Half of A4 width (with spacing)
    const imgHeight = 60; // Fixed height for images
    const xLeft = 20; // Left-side image position
    const xRight = xLeft + imgWidth + 10; // Right-side image position
    let colCount = 0; // Column tracker

    for (let i = 0; i < page.imagePrompts.length; i++) {
      const panelNumber = i + 1;
      const base64Image = state.generatedImages[page.number]?.[panelNumber];

      if (base64Image) {
        try {
          const xPosition = colCount % 2 === 0 ? xLeft : xRight; // Alternate between left & right
          pdf.addImage(base64Image, 'JPEG', xPosition, yPosition, imgWidth, imgHeight);

          // **Add Prompt Text Below Image**
          pdf.setFontSize(10);
          pdf.text(
            `Panel ${panelNumber}: ${page.imagePrompts[i]}`,
            xPosition + imgWidth / 2,
            yPosition + imgHeight + 5,
            { align: 'center' }
          );

          colCount++;
          if (colCount % 2 === 0) {
            yPosition += imgHeight + 20; // Move to next row after 2 images
          }
        } catch (error) {
          console.error(`Error adding image to PDF: ${error}`);
        }
      }
    }
  }

  // **Save the PDF**
  pdf.save(filename);
};
