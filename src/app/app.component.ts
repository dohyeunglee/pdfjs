import {Component} from '@angular/core';
import {PdfService} from './pdf.service';
import {Subscription} from 'rxjs/Subscription';

@Component({
  selector: 'app-root',
  template: `
    <h1>Test Application for PdfJS</h1>
    <h2 *ngIf="pdfjs">PdfJS is dynamically imported!</h2>
    <h2 *ngIf="!pdfjs">PdfJS is not yet imported</h2>
    <button *ngIf="progressing" (click)="onStop()">Stop</button>
    <input type="file" #file (change)="onChange($event)"/>
    <span *ngIf="stopped">Stopped!</span>
    <span>percentage: {{ percent }}%</span>
    <img *ngFor="let image of thumbnails" style="border: 1px solid" [src]="image"/>
   `,
  styleUrls: []
})
export class AppComponent {
  job: Subscription;
  thumbnails = null;
  progressing = false;
  percent = 0;
  temp = [];
  stopped = false;

  constructor(
    private pdfService: PdfService
  ) {
  }

  get pdfjs() {
    return window['pdfjs'];
  }

  initialize() {
    this.progressing = false;
    this.temp = [];
    this.thumbnails = null;
    this.percent = 0;
  }

  onChange(event) {
    const file = event.target.files[0];
    const url = URL.createObjectURL(file);
    this.initialize();
    this.stopped = false;
    this.job = this.pdfService.convert(url, 1).subscribe({
      next: ([percent, thumbnail]) => {
        this.percent = Math.trunc(percent * 100);
        this.temp.push(thumbnail);
        this.progressing = true;
      },
      complete: () => {
        this.progressing = false;
        this.thumbnails = this.temp;
      }
    });
  }

  onStop() {
    if (this.job) {
      this.job.unsubscribe();
      this.initialize();
      this.stopped = true;
    }
  }

}
