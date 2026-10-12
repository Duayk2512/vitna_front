import {AfterViewInit, Directive, ElementRef, OnDestroy} from '@angular/core';
@Directive({selector:'[reveal]',standalone:true,host:{class:'scroll-reveal'}})
export class RevealDirective implements AfterViewInit,OnDestroy {
 private observer?:IntersectionObserver;
 constructor(private el:ElementRef<HTMLElement>){}
 ngAfterViewInit(){const element=this.el.nativeElement;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)){element.classList.add('is-visible');return;}
  this.observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){element.classList.add('is-visible');this.observer?.unobserve(element);}}},{threshold:0,rootMargin:'0px 0px 40px 0px'});this.observer.observe(element);
 }
 ngOnDestroy(){this.observer?.disconnect();}
}
