import pptxgen from "pptxgenjs";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export async function generatePPTX(images: string[], presentationName: string) {
  const pptx = new pptxgen();
  
  // Set layout to 16x9
  pptx.layout = 'LAYOUT_16x9';

  images.forEach((imgData, index) => {
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };
    
    // Add image that covers the whole slide
    slide.addImage({
      data: imgData,
      x: 0,
      y: 0,
      w: "100%",
      h: "100%"
    });
  });

  return await pptx.writeFile({ fileName: `${presentationName || 'presentation'}.pptx` });
}

export async function generatePNGZip(images: string[], presentationName: string) {
  const zip = new JSZip();
  const folder = zip.folder("slides");

  images.forEach((imgData, index) => {
    // Extract base64 content
    const base64Content = imgData.split(',')[1];
    folder?.file(`slide-${index + 1}.jpg`, base64Content, { base64: true });
  });

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `${presentationName || 'presentation'}_images.zip`);
}
