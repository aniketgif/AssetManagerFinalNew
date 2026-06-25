import React, { useRef, useEffect, useState } from 'react';
import Globe from 'react-globe.gl';

const GlobeView = ({ assets, onSelectAsset }) => {
  const globeEl = useRef();
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set initial camera position
  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.pointOfView({ lat: 20, lng: -20, altitude: 2.5 }, 2000);
    }
  }, []);

  // Map risk status to colors
  const getMarkerColor = (status) => {
    switch (status) {
      case 'Green': return '#10b981';
      case 'Yellow': return '#f59e0b';
      case 'Red': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const markers = assets.map(asset => ({
    lat: asset.latitude,
    lng: asset.longitude,
    size: asset.risk_status === 'Red' ? 1.5 : 1,
    color: getMarkerColor(asset.risk_status),
    label: asset.asset_id,
    assetData: asset
  }));

  return (
    <div className="absolute inset-0 cursor-move">
      <Globe
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        pointsData={markers}
        pointAltitude="size"
        pointColor="color"
        pointRadius={0.5}
        pointResolution={32}
        labelsData={markers}
        labelLat={d => d.lat}
        labelLng={d => d.lng}
        labelText={d => d.label}
        labelSize={1.2}
        labelDotRadius={0.3}
        labelColor={() => 'white'}
        labelResolution={2}
        onPointClick={(point) => onSelectAsset(point.assetData)}
        onLabelClick={(label) => onSelectAsset(label.assetData)}
      />
    </div>
  );
};

export default GlobeView;
