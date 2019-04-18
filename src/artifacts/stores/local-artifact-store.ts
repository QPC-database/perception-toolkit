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

import { Marker } from '../../../defs/marker.js';
import { NearbyResult } from '../artifact-dealer.js';
import { ARArtifact, ARTarget } from '../schema/extension-ar-artifacts.js';
import { Thing, GeoCoordinates } from '../schema/core-schema-org.js';
import { ArtifactStore } from './artifact-store.js';
import { LocalMarkerStore } from './local-marker-store.js';

export class LocalArtifactStore implements ArtifactStore {
  private readonly markerStore = new LocalMarkerStore();

  addArtifact(artifact: ARArtifact): void {
    if (!artifact.arTarget) {
      return;
    }

    let targets: ARTarget[] = [];
    if (Array.isArray(artifact.arTarget)) {
      targets = artifact.arTarget;
    } else {
      targets = [artifact.arTarget];
    }

    const targetIsThing = (target: ARTarget): target is Thing => (target as Thing).hasOwnProperty('@type');

    for (const target of targets) {
      if (!targetIsThing(target)) {
        continue;
      }
      const targetType = target['@type'] || '';

      switch (targetType) {
        case 'Barcode':
          this.markerStore.addMarker(artifact, target);
          break;

        default:
          break; // We ignore types we don't support, and move on
      }
    }
  }

  findRelevantArtifacts(nearbyMarkers: Marker[], geo: GeoCoordinates): NearbyResult[] {
    return this.markerStore.findRelevantArtifacts(nearbyMarkers);
  }
}
