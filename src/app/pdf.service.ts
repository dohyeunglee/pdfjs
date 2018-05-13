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

type PDF = any;
type PDFPageProxy = any;
type PDFDocumentProxy = any;
type ImageURL = string;
type Progress = number;
type ConvertResult = [Progress, ImageURL];
type CanvasToDataURLOption = {
  type: string;
  encoderOptions: number;
};

@Injectable()
export class PdfService {
  constructor() {}

  private importPdfJs(): Observable<PDF> {
    return defer(() => fromPromise(import('pdfjs-dist')).pipe(
      tap(pdfjs => {
        /*
         * 처음에는 workerSrc를 명시안해도 에러가 발생안했는데
         * 어느 순간부터 명시 안할 시 에러 발생
         * 아무 문자열이나 대입해도 작동한다. 이유를 발견하기 전까지는 공백으로 둔다
         */
        pdfjs.GlobalWorkerOptions.workerSrc = ' ';
        window['__pdfjs__'] = pdfjs;
      })
    ));
  }

  private getPdfJs(): Observable<PDF> {
    const pdfjs = window['__pdfjs__'];
    return pdfjs ? of(pdfjs) : this.importPdfJs();
  }

  private getDocument(url: string): Observable<PDFDocumentProxy> {
    return this.getPdfJs().pipe(
      mergeMap((pdfjs: PDF) => pdfjs.getDocument(url))
    );
  }

  // getPageFromUrl(url: string, pageNumber: number): Observable<any> {
  //   return this.getDocument(url).pipe(
  //     mergeMap(pdfDoc => pdfDoc.getPage(pageNumber))
  //   );
  // }

  private getPageFromDocument(document: PDFDocumentProxy, pageNum: number): Observable<PDFPageProxy> {
    return defer(() => document.getPage(pageNum));
  }

  private getThumbnailUrl(page: PDFPageProxy, scale: number, option: CanvasToDataURLOption = {type: null, encoderOptions: null}): Observable<string> {
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
      map(() => canvas.toDataURL(option.type, option.encoderOptions)),
      tap(() => canvas.remove())
    ));
  }

  // getSvg(page: any): Observable<any> {
  //   return defer(() => page.getOperatorList().pipe(
  //     mergeMap(opList => {
  //       return this.getPdfJs().pipe(
  //         mergeMap(pdfjs => {
  //           const svgGfx = new pdfjs.SVGGraphics(page.commonObjs, page.objs);
  //           return svgGfx.getSVG(opList, page.getViewport(1));
  //         })
  //       );
  //     })
  //   ));
  // }
  //
  // getAllSvg(url: string): Observable<any> {
  //   return this.getDocument(url).pipe(
  //     mergeMap(pdfDoc => {
  //       const { numPages } = pdfDoc;
  //       const tasks = times(add(1), numPages).map(pageNum => {
  //         return this.getPageFromDocument(pdfDoc, pageNum).pipe(
  //           mergeMap(page => this.getSvg(page))
  //         );
  //       });
  //       return forkJoin(...tasks);
  //     })
  //   );
  // }

  convert(url: string, scale: number, pages?: number[], option?: CanvasToDataURLOption): Observable<ConvertResult> {
    return this.getDocument(url).pipe(
      mergeMap((pdfDoc: PDFDocumentProxy) => {
        let targetPages: number[];
        const { numPages } = pdfDoc;
        if (!pages) {
          targetPages = times(add(1), numPages);
        } else if (pages.length > 0) {
          if (pages.every(pageNum => pageNum <= numPages && pageNum >= 1)) {
            targetPages = pages;
          } else {
            console.error(`Maximum page number is ${numPages} and minimum is 1`);
            return of([0, null]) as Observable<ConvertResult>;
          }
        } else {
          console.warn('Nothing to convert or pages parameter is wrongly given');
          return of([1, null]) as Observable<ConvertResult>;
        }
        const tasks = targetPages.map(pageNum => {
          return this.getPageFromDocument(pdfDoc, pageNum).pipe(
            mergeMap(page => this.getThumbnailUrl(page, scale, option))
          );
        });
        return zip(range(1, tasks.length), concat(...tasks)).pipe(
          map(([num, img]) => [num / tasks.length, img])
        ) as Observable<ConvertResult>;
      })
    );
  }




}
