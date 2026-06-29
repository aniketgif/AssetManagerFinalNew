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



  return (
    <div className="absolute inset-0 cursor-move">
      <Globe
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        htmlElementsData={assets}
        htmlElement={d => {
          const el = document.createElement('div');
          const color = getMarkerColor(d.risk_status);
          el.innerHTML = `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <div style="
                width: 14px; 
                height: 14px; 
                background: ${color}; 
                border: 2px solid rgba(255,255,255,0.8); 
                border-radius: 50%; 
                box-shadow: 0 0 12px ${color};
                transition: transform 0.2s;
              " onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'">
              </div>
              <div style="
                position: absolute;
                left: 20px;
                background: rgba(15, 23, 42, 0.85);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-family: monospace;
                font-size: 11px;
                pointer-events: none;
                white-space: nowrap;
                backdrop-filter: blur(4px);
                border: 1px solid rgba(255,255,255,0.1);
              ">${d.asset_id}</div>
            </div>
          `;
          el.onclick = () => onSelectAsset(d);
          return el;
        }}
      />
    </div>
  );
};

export default React.memo(GlobeView);
