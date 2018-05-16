# PdfService

## API
### `ConvertResult`
```typescript
type Progress = number;
type ImageURL = string;
type ConvertResult = [Progress, ImageURL]
```

### `CanvasToBlobOption`
Check [`Canvas.toBlob()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)
```typescript
type CanvasToBlobOption = {
  mimeType: string;
  qualityArgument: number;
}
```
### `convert`
```typescript
convert(
  url: string,
  scale: number, 
  page?: number[],
  option?: CanvasToBlobOption
): Observable<ConvertResult>
```
###### `url`
String from `URL.createObjectURL(File)`

###### `scale`
Scale of thumbnail

###### `page`
Specific page numbers to convert. If not given, all pages are converted

###### `option`
Option for quality of `Canvas.toBlobˇ()`. Default value is 
```typescript
{
  mimeType: 'image/png',
  qualityArgument: null
}
```
