import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {defer} from 'rxjs/observable/defer';
import {fromPromise} from 'rxjs/observable/fromPromise';
import {of} from 'rxjs/observable/of';
import {forkJoin} from 'rxjs/observable/forkJoin';
import {concat} from 'rxjs/observable/concat';
import {range} from 'rxjs/observable/range';
import {zip} from 'rxjs/observable/zip';
import {tap, map, mergeMap} from 'rxjs/operators';

import {times, add, flatten} from 'ramda';

@Injectable()
export class PdfService {
  constructor() {}

  importPdfJs(): Observable<any> {
    return defer(() => fromPromise(import('pdfjs-dist')).pipe(
      tap(pdfjs => window['__pdfjs__'] = pdfjs)
    ));
  }

  getPdfJs(): Observable<any> {
    const pdfjs = window['__pdfjs__'];
    return pdfjs ? of(pdfjs) : this.importPdfJs();
  }

  getDocument(url: string): Observable<any> {
    return this.getPdfJs().pipe(
      mergeMap((pdfjs: any) => pdfjs.getDocument(url)),
      tap(() => URL.revokeObjectURL(url))
    );
  }

  getPageFromUrl(url: string, pageNumber: number): Observable<any> {
    return this.getDocument(url).pipe(
      mergeMap(pdfDoc => pdfDoc.getPage(pageNumber))
    );
  }

  getPageFromDocument(document: any, pageNum: number): Observable<any> {
    return defer(() => document.getPage(pageNum));
  }

  getThumbnailUrl(page: any, scale: number): Observable<string> {
    const viewport = page.getViewport(scale);
    const canvas = document.createElement('canvas');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    const context = canvas.getContext('2d');
    const renderContext = {
      canvasContext: context,
      viewport
    };
    return defer(() => fromPromise(page.render(renderContext)).pipe(
      map(() => canvas.toDataURL()),
      tap(() => canvas.remove())
    ));
  }

  getSvg(page: any): Observable<any> {
    return defer(() => page.getOperatorList().pipe(
      mergeMap(opList => {
        return this.getPdfJs().pipe(
          mergeMap(pdfjs => {
            const svgGfx = new pdfjs.SVGGraphics(page.commonObjs, page.objs);
            return svgGfx.getSVG(opList, page.getViewport(1));
          })
        );
      })
    ));
  }

  getAllSvg(url: string): Observable<any> {
    return this.getDocument(url).pipe(
      mergeMap(pdfDoc => {
        const { numPages } = pdfDoc;
        const tasks = times(add(1), numPages).map(pageNum => {
          return this.getPageFromDocument(pdfDoc, pageNum).pipe(
            mergeMap(page => this.getSvg(page))
          );
        });
        return forkJoin(...tasks);
      })
    );

  }

  getAllThumbnailUrl(url: string, scale: number): Observable<any> {
    return this.getDocument(url).pipe(
      mergeMap(pdfDoc => {
        const { numPages } = pdfDoc;
        const tasks = times(add(1), numPages).map(pageNum => {
          return this.getPageFromDocument(pdfDoc, pageNum).pipe(
            mergeMap(page => this.getThumbnailUrl(page, scale))
          );
        });
        return zip(range(1, numPages), concat(...tasks)).pipe(
          map(([num, img]) => [num / numPages, img])
        );
      })
    );
  }




}