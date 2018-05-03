# PdfService

## API
### `ConvertResult`
```typescript
type Progress = number;
type ImageURL = string;
type ConvertResult = [Progress, ImageURL]
```

### `CanvasToDataURLOption`
Check [`Canvas.toDataURL()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL)
```typescript
type CanvasToDataURLOption = {
  type: string;
  encodeOptions: number;
}
```
### `convert`
```typescript
convert(
  url: string,
  scale: number, 
  page?: number[],
  option?: CanvasToDataURLOption
): Observable<ConvertResult>
```
###### `url`
string from `URL.createObjectURL(File)`

###### `scale`
scale of thumbnail

###### `page`
Specific page numbers to convert. If not given, all pages are converted

###### `option`
option for quality of `Canvas.toDataURL()`. Default value is 
```
{
  type: 'image/png',
  encodeOptions: 0.92
}
```
