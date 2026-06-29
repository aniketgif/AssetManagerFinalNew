import React, { useRef, useEffect, useState, useMemo } from 'react';
import Globe from 'react-globe.gl';

const GlobeView = ({ assets, onSelectAsset }) => {
  const globeEl = useRef();
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Handle window resize with debounce
  useEffect(() => {
    let timeoutId = null;
    const handleResize = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight
        });
      }, 150);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutId) clearTimeout(timeoutId);
    };
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

  const markers = useMemo(() => assets.map(asset => ({
    lat: asset.latitude,
    lng: asset.longitude,
    size: asset.risk_status === 'Red' ? 1.5 : 1,
    color: getMarkerColor(asset.risk_status),
    label: asset.asset_id,
    assetData: asset
  })), [assets]);

  const ringsData = useMemo(() => assets.map(asset => ({
    lat: asset.latitude,
    lng: asset.longitude,
    color: asset.risk_status === 'Red' ? (t) => `rgba(239, 68, 68, ${1-t})` 
         : asset.risk_status === 'Yellow' ? (t) => `rgba(245, 158, 11, ${1-t})` 
         : (t) => `rgba(16, 185, 129, ${1-t})`,
    maxR: asset.risk_status === 'Red' ? 12 : asset.risk_status === 'Yellow' ? 7 : 4,
    propagationSpeed: asset.risk_status === 'Red' ? 5 : asset.risk_status === 'Yellow' ? 2 : 1,
    repeatPeriod: asset.risk_status === 'Red' ? 600 : asset.risk_status === 'Yellow' ? 1200 : 2500,
  })), [assets]);


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
        ringsData={ringsData}
        ringColor="color"
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
        onPointClick={(point) => onSelectAsset(point.assetData)}
        onLabelClick={(label) => onSelectAsset(label.assetData)}
      />
    </div>
  );
};

export default React.memo(GlobeView);
