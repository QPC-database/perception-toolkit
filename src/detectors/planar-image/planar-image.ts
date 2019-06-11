
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

import { DetectableImage, DetectedImage } from '../../../defs/detected-image.js';
import { DEBUG_LEVEL, log } from '../../utils/logger.js';

class Detector {
  private readonly targets = new Map<number, DetectableImage>();
  private isReadyInternal: Promise<void>;
  private worker!: Worker;

  constructor(root = '') {
    this.isReadyInternal = new Promise((resolve) => {
      this.worker = new Worker(`${root}/lib/planar/planar-image_worker.js`);
      this.worker.onmessage = async (e) => {
        /* istanbul ignore if */
        if (e.data === 'ready') {
          resolve();
        }
      };

      this.worker.postMessage(root);

      // Attempt to prevent worker GC.
      (window as any).planarWorker = this.worker;
    });
  }

  get isReady() {
    return this.isReadyInternal;
  }

  detect(data: ImageData): Promise<DetectedImage[]> {
    if (this.targets.size === 0) {
      return Promise.resolve([]);
    }

    return new Promise((resolve) => {
      const startTime = performance.now();
      this.worker.postMessage({ type: 'process', data });
      this.worker.onmessage = (e) => {
        /* istanbul ignore if */
        if (e.data === null) {
          return [];
        }

        const matches = e.data as number[];

        // Remap to actual DetectedImage targets (and filter out empties).
        const detectedImages = matches.map((id) => this.targets.get(id))
            .filter(detectedImage => !!detectedImage) as DetectedImage[];

        resolve(detectedImages);
        log(`Time taken (ms): ${performance.now() - startTime} ` +
            `for ${data.width} * ${data.height}`, DEBUG_LEVEL.VERBOSE);
      };
    });
  }

  getTarget(id: string) {
    for (const target of this.targets.values()) {
      if (target.id === id) {
        return target;
      }
    }
  }

  addTarget(data: Uint8Array, image: DetectableImage): Promise<number> {
    return new Promise((resolve) => {
      this.worker.postMessage({ type: 'add', data });
      this.worker.onmessage = (e) => {
        this.targets.set(e.data as number, image);
        log(`Target stored: ${image.id}, number ${e.data}`, DEBUG_LEVEL.VERBOSE);
        resolve(e.data);
      };
    });
  }

  removeTarget(data: number): Promise<void> {
    return new Promise((resolve) => {
      this.worker.postMessage({ type: 'remove', data });
      this.worker.onmessage = (e) => {
        this.targets.delete(e.data as number);
        log(`Target removed: number ${e.data}`, DEBUG_LEVEL.VERBOSE);
        resolve();
      };
    });
  }

  clear() {
    this.targets.clear();
  }
}

let detector: Detector;
export async function detectPlanarImages(data: ImageData, {root = ''} = {}) {
  /* istanbul ignore if */
  if (!detector) {
    detector = new Detector(root);
  }

  await detector.isReady;
  return detector.detect(data);
}

export async function addDetectionTarget(data: Uint8Array,
                                         image: DetectableImage,
                                         {root = ''} = {}): Promise<number> {
  /* istanbul ignore if */
  if (!detector) {
    detector = new Detector(root);
  }

  await detector.isReady;
  return detector.addTarget(data, image);
}

export async function removeDetectionTarget(id: number,
                                            {root = ''} = {}): Promise<void> {
  /* istanbul ignore if */
  if (!detector) {
    detector = new Detector(root);
  }

  await detector.isReady;
  return detector.removeTarget(id);
}

export async function getTarget(id: string,
                                {root = ''} = {}) {
  /* istanbul ignore if */
  if (!detector) {
    detector = new Detector(root);
  }

  await detector.isReady;
  return detector.getTarget(id);
}

export async function reset({root = ''} = {}) {
  /* istanbul ignore if */
  if (!detector) {
    detector = new Detector(root);
  }

  await detector.isReady;
  return detector.clear();
}
