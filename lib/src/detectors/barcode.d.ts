/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
declare global {
    interface Window {
        BarcodeDetector: typeof BarcodeDetector;
    }
}
import { Barcode } from '../../defs/barcode.js';
/**
 * Detects barcodes from image sources.
 */
export declare function detectBarcodes(data: ImageData | ImageBitmap | HTMLCanvasElement, { context, forceNewDetector, polyfillRequired, polyfillPrefix }?: {
    context?: Window | undefined;
    forceNewDetector?: boolean | undefined;
    polyfillRequired?: boolean | undefined;
    polyfillPrefix?: string | undefined;
}): Promise<Barcode[]>;