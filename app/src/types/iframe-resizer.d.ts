// Types for the parent part of iframe-resizer 4.4.5 (MIT), used by the order form.
// The package ships no types; only what the site uses is declared here.
declare module 'iframe-resizer/js/iframeResizer' {
  export type ResizedData = { iframe: HTMLIFrameElement; height: number | string; width: number | string; type: string };
  export type Options = {
    checkOrigin?: boolean | string[];
    scrolling?: boolean | 'omit';
    log?: boolean;
    warningTimeout?: number;
    heightCalculationMethod?: string;
    minHeight?: number;
    maxHeight?: number;
    onResized?: (data: ResizedData) => void;
  };
  export default function iframeResize(options: Options, target: HTMLIFrameElement): HTMLIFrameElement[];
}

interface HTMLIFrameElement {
  // Added by iframe-resizer to every iframe it manages.
  iFrameResizer?: { removeListeners: () => void; close: () => void };
}
