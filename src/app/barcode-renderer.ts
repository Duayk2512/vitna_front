// Load the barcode library only when a label is previewed or downloaded.
export async function drawBarcode(svg:SVGElement,value:string,height=65){
 const {default:JsBarcode}=await import('jsbarcode');
 JsBarcode(svg,value,{format:'CODE128',width:2,height,fontSize:14,margin:16});
}
