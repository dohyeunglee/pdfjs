import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { PdfService } from './pdf.service';
import { SanitizePipe } from './sanitize.pipe';

@NgModule({
  declarations: [
    AppComponent,
    SanitizePipe
  ],
  imports: [
    BrowserModule,
  ],
  providers: [PdfService],
  bootstrap: [AppComponent]
})
export class AppModule { }
