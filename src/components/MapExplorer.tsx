/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WorldMap } from './WorldMap';

interface MapExplorerProps {
  onCitySelected: (country: string, city: string) => void;
}

export const MapExplorer: React.FC<MapExplorerProps> = ({ onCitySelected }) => {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in" id="map-explorer-view">
      {/* World Map Vector Component */}
      <WorldMap onCitySelected={onCitySelected} />
    </div>
  );
};
