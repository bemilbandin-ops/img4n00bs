import { vi } from 'vitest';

/**
 * Minimal RGBA canvas mock for unit tests that exercise renderer/history logic.
 * It intentionally implements only the 2D API surface used by the tests.
 */

class MockImageData implements ImageData {
  readonly colorSpace: PredefinedColorSpace = 'srgb';
  data: Uint8ClampedArray;
  height: number;
  width: number;

  constructor(widthOrData: number | Uint8ClampedArray, heightOrWidth: number, height?: number) {
    if (typeof widthOrData === 'number') {
      this.width = widthOrData;
      this.height = heightOrWidth;
      this.data = new Uint8ClampedArray(this.width * this.height * 4);
    } else {
      this.data = new Uint8ClampedArray(widthOrData);
      this.width = heightOrWidth;
      this.height = height ?? 0;
    }
  }
}

type ContextState = {
  fillStyle: string | CanvasGradient;
  globalAlpha: number;
  globalCompositeOperation: GlobalCompositeOperation;
  filter: string;
};

class MockCanvasGradient implements CanvasGradient {
  private stops: [number, string][] = [];

  addColorStop(offset: number, color: string) {
    this.stops.push([offset, color]);
  }

  colorAtEnd() {
    return this.stops.sort((a, b) => a[0] - b[0]).at(-1)?.[1] ?? 'transparent';
  }
}

const parseColor = (value: string | CanvasGradient): [number, number, number, number] => {
  if (value instanceof MockCanvasGradient) {
    return parseColor(value.colorAtEnd());
  }

  const color = typeof value === 'string' ? value : 'transparent';

  if (color.startsWith('#') && color.length === 7) {
    return [
      Number.parseInt(color.slice(1, 3), 16),
      Number.parseInt(color.slice(3, 5), 16),
      Number.parseInt(color.slice(5, 7), 16),
      255
    ];
  }

  const rgba = color.match(/rgba?\(([^)]+)\)/);
  if (rgba) {
    const [r, g, b, a = '1'] = rgba[1].split(',').map(part => part.trim());
    return [Number(r), Number(g), Number(b), Math.round(Number(a) * 255)];
  }

  if (color === 'transparent') return [0, 0, 0, 0];
  if (color === 'white') return [255, 255, 255, 255];
  if (color === 'black') return [0, 0, 0, 255];
  return [0, 0, 0, 255];
};

class MockCanvasRenderingContext2D {
  canvas: MockCanvas;
  fillStyle: string | CanvasGradient = '#000000';
  strokeStyle = '#000000';
  lineWidth = 1;
  globalAlpha = 1;
  globalCompositeOperation: GlobalCompositeOperation = 'source-over';
  filter = 'none';
  font = '';
  textBaseline: CanvasTextBaseline = 'alphabetic';
  textAlign: CanvasTextAlign = 'start';
  lineCap: CanvasLineCap = 'butt';
  lineJoin: CanvasLineJoin = 'miter';
  private stack: ContextState[] = [];

  constructor(canvas: MockCanvas) {
    this.canvas = canvas;
  }

  save() {
    this.stack.push({
      fillStyle: this.fillStyle,
      globalAlpha: this.globalAlpha,
      globalCompositeOperation: this.globalCompositeOperation,
      filter: this.filter
    });
  }

  restore() {
    const state = this.stack.pop();
    if (!state) return;
    this.fillStyle = state.fillStyle;
    this.globalAlpha = state.globalAlpha;
    this.globalCompositeOperation = state.globalCompositeOperation;
    this.filter = state.filter;
  }

  clearRect(x: number, y: number, width: number, height: number) {
    for (let py = Math.max(0, Math.floor(y)); py < Math.min(this.canvas.height, Math.ceil(y + height)); py++) {
      for (let px = Math.max(0, Math.floor(x)); px < Math.min(this.canvas.width, Math.ceil(x + width)); px++) {
        this.canvas.setPixel(px, py, [0, 0, 0, 0]);
      }
    }
  }

  fillRect(x: number, y: number, width: number, height: number) {
    const color = parseColor(this.fillStyle);
    for (let py = Math.max(0, Math.floor(y)); py < Math.min(this.canvas.height, Math.ceil(y + height)); py++) {
      for (let px = Math.max(0, Math.floor(x)); px < Math.min(this.canvas.width, Math.ceil(x + width)); px++) {
        this.blendPixel(px, py, color);
      }
    }
  }

  getImageData(x: number, y: number, width: number, height: number): ImageData {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const src = this.canvas.getPixel(x + px, y + py);
        data.set(src, (py * width + px) * 4);
      }
    }
    return new MockImageData(data, width, height);
  }

  putImageData(imageData: ImageData, x: number, y: number) {
    for (let py = 0; py < imageData.height; py++) {
      for (let px = 0; px < imageData.width; px++) {
        const offset = (py * imageData.width + px) * 4;
        this.canvas.setPixel(x + px, y + py, [
          imageData.data[offset],
          imageData.data[offset + 1],
          imageData.data[offset + 2],
          imageData.data[offset + 3]
        ]);
      }
    }
  }

  drawImage(source: CanvasImageSource, ...args: number[]) {
    const src = source as unknown as MockCanvas;
    if (!(src instanceof MockCanvas)) return;

    let sx = 0;
    let sy = 0;
    let sw = src.width;
    let sh = src.height;
    let dx = 0;
    let dy = 0;
    let dw = src.width;
    let dh = src.height;

    if (args.length === 2) {
      [dx, dy] = args;
    } else if (args.length === 4) {
      [dx, dy, dw, dh] = args;
    } else if (args.length === 8) {
      [sx, sy, sw, sh, dx, dy, dw, dh] = args;
    }

    for (let y = 0; y < dh; y++) {
      for (let x = 0; x < dw; x++) {
        const srcX = Math.min(src.width - 1, Math.max(0, Math.floor(sx + (x / Math.max(1, dw)) * sw)));
        const srcY = Math.min(src.height - 1, Math.max(0, Math.floor(sy + (y / Math.max(1, dh)) * sh)));
        this.blendPixel(Math.floor(dx + x), Math.floor(dy + y), src.getPixel(srcX, srcY));
      }
    }
  }

  translate() {}
  rotate() {}
  scale() {}
  beginPath() {}
  rect() {}
  ellipse() {}
  moveTo() {}
  lineTo() {}
  closePath() {}
  clip() {}
  stroke() {}
  fill() {}
  fillText() {}
  createRadialGradient(): CanvasGradient {
    return new MockCanvasGradient();
  }

  private blendPixel(x: number, y: number, src: [number, number, number, number]) {
    if (x < 0 || y < 0 || x >= this.canvas.width || y >= this.canvas.height) return;

    const sourceAlpha = (src[3] / 255) * this.globalAlpha;
    const dst = this.canvas.getPixel(x, y);
    const dstAlpha = dst[3] / 255;

    if (this.globalCompositeOperation === 'destination-out') {
      const nextAlpha = dst[3] * (1 - sourceAlpha);
      this.canvas.setPixel(x, y, [dst[0], dst[1], dst[2], nextAlpha]);
      return;
    }

    if (this.globalCompositeOperation === 'destination-in') {
      this.canvas.setPixel(x, y, [
        dst[0],
        dst[1],
        dst[2],
        Math.round(dst[3] * sourceAlpha)
      ]);
      return;
    }

    if (this.globalCompositeOperation === 'multiply') {
      const outAlpha = sourceAlpha + dstAlpha * (1 - sourceAlpha);
      const multiply = (channel: number) => Math.round((dst[channel] * src[channel]) / 255);
      const blend = (channel: number) => Math.round(multiply(channel) * sourceAlpha + dst[channel] * (1 - sourceAlpha));
      this.canvas.setPixel(x, y, [blend(0), blend(1), blend(2), Math.round(outAlpha * 255)]);
      return;
    }

    const outAlpha = sourceAlpha + dstAlpha * (1 - sourceAlpha);
    if (outAlpha <= 0) {
      this.canvas.setPixel(x, y, [0, 0, 0, 0]);
      return;
    }

    const blend = (channel: number) => Math.round((src[channel] * sourceAlpha + dst[channel] * dstAlpha * (1 - sourceAlpha)) / outAlpha);
    this.canvas.setPixel(x, y, [blend(0), blend(1), blend(2), Math.round(outAlpha * 255)]);
  }
}

class MockCanvas {
  private context: MockCanvasRenderingContext2D;
  private buffer = new Uint8ClampedArray(0);
  private _width = 0;
  private _height = 0;

  constructor() {
    this.context = new MockCanvasRenderingContext2D(this);
  }

  get width() { return this._width; }
  set width(value: number) {
    this._width = value;
    this.buffer = new Uint8ClampedArray(this._width * this._height * 4);
  }

  get height() { return this._height; }
  set height(value: number) {
    this._height = value;
    this.buffer = new Uint8ClampedArray(this._width * this._height * 4);
  }

  getContext(contextId: string) {
    return contextId === '2d' ? this.context as unknown as CanvasRenderingContext2D : null;
  }

  toDataURL() {
    return 'data:image/png;base64,mock';
  }

  getPixel(x: number, y: number): [number, number, number, number] {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return [0, 0, 0, 0];
    const offset = (y * this.width + x) * 4;
    return [this.buffer[offset], this.buffer[offset + 1], this.buffer[offset + 2], this.buffer[offset + 3]];
  }

  setPixel(x: number, y: number, color: [number, number, number, number]) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const offset = (y * this.width + x) * 4;
    this.buffer[offset] = color[0];
    this.buffer[offset + 1] = color[1];
    this.buffer[offset + 2] = color[2];
    this.buffer[offset + 3] = color[3];
  }
}

vi.stubGlobal('ImageData', MockImageData);
vi.stubGlobal('document', {
  createElement: (tagName: string) => {
    if (tagName === 'canvas') return new MockCanvas() as unknown as HTMLCanvasElement;
    return {};
  }
});
