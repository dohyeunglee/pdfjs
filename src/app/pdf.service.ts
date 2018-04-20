import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {defer} from 'rxjs/observable/defer';
import {fromPromise} from 'rxjs/observable/fromPromise';
import {of} from 'rxjs/observable/of';
import {forkJoin} from 'rxjs/observable/forkJoin';
import {tap, map, mergeMap, pluck} from 'rxjs/operators';

import {times, add} from 'ramda';

interface PDFDocumentProxy {
  fingerprint: string;
  numPages: number;
}

interface PDFPageProxy {
  pageIndex: number;
  pageInfo: {
    ref: {
      num: number;
      gen: number;
    };
    rotate: number;
    userUnit: number;
    view: number[];
  };
  objs: any;
}

interface OperatorList {
  argsArray: any[];
  fnArray: number[];
  lastChunk: boolean;
}

@Injectable()
export class PdfService {
  constructor() {}

  importPdfJs(): Observable<any> {
    return defer(() => fromPromise(import('pdfjs-dist')).pipe(
      tap(pdfjs => window['pdfjs'] = pdfjs)
    ));
  }

  getPdfJs(): Observable<any> {
    const pdfjs = window['pdfjs'];
    return pdfjs ? of(pdfjs) : this.importPdfJs();
  }

  getDocument(url: string): Observable<any> {
    return this.getPdfJs().pipe(
      mergeMap((pdfjs: any) => pdfjs.getDocument(url)),
      tap(() => URL.revokeObjectURL(url))
    );
  }

  getPageFromUrl(url: string, pageNumber: number): Observable<PDFPageProxy> {
    return this.getDocument(url).pipe(
      mergeMap(pdfDoc => pdfDoc.getPage(pageNumber))
    );
  }

  getPageFromDocument(document: any, pageNum: number): Observable<PDFPageProxy> {
    return defer(() => document.getPage(pageNum));
  }

  getThumbnailUrl(page: any): Observable<string[]> {
    return defer(() => page.getOperatorList()).pipe(
      mergeMap(({fnArray, argsArray}) => {
        return this.getPdfJs().pipe(
          pluck('OPS'),
          map((OPS: any) => {
            const result = [];
            for (let i = 0 ; i < fnArray.length ; i++) {
              if (fnArray[i] === OPS.paintJpegXObject) {
                result.push(page.objs.get(argsArray[i][0]).src);
              }
            }
            return result.length === 1 ? result[0] : result;
          }),
        );
      })
    )
  }

  getAllThumbnailUrl(url: string): Observable<(string | string[])[]> {
    return this.getDocument(url).pipe(
      mergeMap(pdfDoc => {
        const { numPages } = pdfDoc;
        const tasks = times(add(1), numPages).map(pageNum => {
          return this.getPageFromDocument(pdfDoc, pageNum).pipe(
            mergeMap(page => this.getThumbnailUrl(page))
          );
        });
        return forkJoin(...tasks);
      })
    );
  }




}