import {Component, ElementRef, ViewChild, AfterViewInit, OnChanges, Input} from '@angular/core';
import {drawBarcode} from './barcode-renderer';

@Component({selector:'app-barcode',template:'<svg #svg role="img" [attr.aria-label]="\'Código de barras \'+value"></svg>',styles:[':host{display:block;overflow:auto;background:white}svg{display:block;max-width:100%;height:auto;margin:auto}']})
export class BarcodeComponent implements AfterViewInit, OnChanges {
 @Input() value='';
 @ViewChild('svg') svg?:ElementRef<SVGElement>;
 ngAfterViewInit(){this.render();}
 ngOnChanges(){this.render();}
 private async render(){if(!this.svg)return;const value=this.value;this.svg.nativeElement.replaceChildren();if(!/^[\x21-\x7e]{4,48}$/.test(value))return;const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');await drawBarcode(svg,value);if(this.value===value){for(const attribute of Array.from(svg.attributes))this.svg.nativeElement.setAttribute(attribute.name,attribute.value);this.svg.nativeElement.replaceChildren(...Array.from(svg.childNodes));}}
}
