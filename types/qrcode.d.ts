declare module 'qrcode' {
  export interface QRCodeRenderersOptions {
    margin?: number;
    scale?: number;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export interface QRCodeOptions extends QRCodeRenderersOptions {
    version?: number;
    errorCorrectionLevel?: 'low' | 'medium' | 'quartile' | 'high' | 'L' | 'M' | 'Q' | 'H';
    maskPattern?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
    toSJISFunc?: Function;
  }

  export interface QRCodeToStringOptions extends QRCodeOptions {
    type?: 'utf8' | 'svg' | 'terminal';
  }

  export function toDataURL(text: string | Buffer, options?: QRCodeOptions): Promise<string>;
  export function toDataURL(text: string | Buffer, callback: (error: Error | null, url: string) => void): void;
  export function toDataURL(text: string | Buffer, options: QRCodeOptions, callback: (error: Error | null, url: string) => void): void;

  export function toString(text: string | Buffer, options?: QRCodeToStringOptions): Promise<string>;
  export function toString(text: string | Buffer, callback: (error: Error | null, string: string) => void): void;
  export function toString(text: string | Buffer, options: QRCodeToStringOptions, callback: (error: Error | null, string: string) => void): void;
}

