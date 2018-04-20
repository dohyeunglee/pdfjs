import {Component, ViewChild, ElementRef} from '@angular/core';
import {PdfService} from './pdf.service';

@Component({
  selector: 'app-root',
  template: `
    <h1>Dynamic import test</h1>
    <h2 *ngIf="pdfjs">Imported!</h2>
    <button *ngIf="!pdfjs" (click)="dynamicImport()">Import</button>
    <button *ngIf="pdfjs" (click)="showPdf()">PDF</button>
    <button (click)="onPrevPage()">Prev</button>
    <button (click)="onNextPage()">Next</button>
    <input type="file" #file (change)="onChange($event)"/>
    <span>page num: {{ pageNum }}</span>
    <span>page count: {{ pageCount }}</span>
    <ng-container *ngFor="let src of test">
      <img *ngIf="src.length !== 0" [src]="src | sanitize"/>
    </ng-container>
    <canvas #canvas></canvas>
   `,
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  @ViewChild('canvas') canvas: ElementRef;
  heroes = [{name: 1}, {name:2}, {name:3}, {name:4}, {name:5}];
  pdfDoc = null;
  pdfjs: any;
  pageNum = 1;
  pageCount: number;
  pageRendering = true;
  pageNumPending = null;
  test = [];
  constructor(
    private pdfService: PdfService
  ) {
  }

  dynamicImport() {
    import('pdfjs-dist')
      .then(pdf => {
        this.pdfjs= pdf;
        window['pdfjs'] = pdf;
        console.log('dynamic import: ', pdf);
      })
      .catch(err => console.error('dynamic import error: ', err));
  }

  onChange(event) {
    const file = event.target.files[0];
    console.log('event: ', file);
    const url = URL.createObjectURL(file);
    this.pdfService.getAllThumbnailUrl(url).subscribe(list => this.test = list);
    // this.pdfjs.getDocument(url).then(pdf => {
    //   URL.revokeObjectURL(url);
    //   console.log('pdf: ', pdf);
    //   this.pdfDoc = pdf;
    //   this.pageCount = pdf.numPages;
    //   this.renderPage(this.pageNum);
    // })
  }

  renderPage(num: number) {
    this.pageRendering = true;
    this.pdfDoc.getPage(num).then(page => {
      console.log('page: ', page);
      const viewport = page.getViewport(2);
      const canvas = this.canvas.nativeElement;
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      const renderContext = {
        canvasContext: context,
        viewport
      };
      page.getOperatorList().then(ops => {
        console.log('ops: ', ops);
        for (let i = 0; i < ops.fnArray.length ; i++) {
          if (ops.fnArray[i] == this.pdfjs.OPS.paintJpegXObject) {
            this.test.push(ops.argsArray[i][0])
          }
        }
        const blob = page.objs.get(this.test[num-1]).src;
        console.log('blob: ', blob);
      });
      // const renderTask = page.render(renderContext);
      // renderTask.promise.then(() => {
      //   this.pageRendering = false;
      //   if (this.pageNumPending !== null) {
      //     this.renderPage(this.pageNumPending);
      //     this.pageNumPending = null;
      //   }
      // });
    });
  }

  queueRenderPage(num: number) {
    if (this.pageRendering) {
      this.pageNumPending = num;
    } else {
      this.renderPage(num);
    }
  }

  onPrevPage() {
    if (this.pageNum <= 1) {
      return;
    }
    this.pageNum--;
    this.queueRenderPage(this.pageNum);
  }

  onNextPage() {
    if (this.pageNum >= this.pdfDoc.numPages) {
      return;
    }
    this.pageNum++;
    this.queueRenderPage(this.pageNum);
  }
}
