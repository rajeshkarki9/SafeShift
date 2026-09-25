// @ts-nocheck
import "aframe";
import React, { useEffect, useState, useRef } from "react";
import { nanoid } from "nanoid";

export interface VRModuleProps {
  imageUrl: string;
  text?: string;
  onComplete?: (score: number) => void;
}

interface Hazard {
  id: string;
  position: string;
  rotation: string;
  title: string;
  description: string;
  found: boolean;
}

export function VRModule({ imageUrl, text, onComplete }: VRModuleProps) {
  const [hazards, setHazards] = useState<Hazard[]>([
    {
      id: "h1",
      position: "-3 0 -4",
      rotation: "0 45 0",
      title: "Spill on Floor",
      description: "Slipping hazard. Needs immediate cleanup and wet floor signage.",
      found: false,
    },
    {
      id: "h2",
      position: "4 2 -3",
      rotation: "0 -45 0",
      title: "Unsecured Load",
      description: "Boxes stacked too high on the racking. Risk of falling objects.",
      found: false,
    },
    {
      id: "h3",
      position: "0 1.5 5",
      rotation: "0 180 0",
      title: "Blocked Fire Exit",
      description: "Pallets obstructing emergency exit path. Immediate violation.",
      found: false,
    }
  ]);

  const [allFound, setAllFound] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track hazard elements for event listeners
  const hazardRefs = useRef<(HTMLElement | null)[]>([]);

  // We need a custom background image if the provided one is the default park
  const defaultBg = "https://upload.wikimedia.org/wikipedia/commons/3/33/Spherical_panoramic_of_a_park_in_autumn.jpg";
  const industrialBg = "https://upload.wikimedia.org/wikipedia/commons/c/c5/13-11-02-olb-by-RalfR-03.jpg"; 
  const bgImage = imageUrl === defaultBg ? "https://upload.wikimedia.org/wikipedia/commons/b/b3/360_degree_panorama_of_the_interior_of_the_Bodleian_Library%2C_Oxford.jpg" : imageUrl;

  useEffect(() => {
    const foundCount = hazards.filter((h) => h.found).length;
    if (foundCount === hazards.length && hazards.length > 0 && !allFound) {
      setAllFound(true);
      if (onComplete) onComplete(100);
    }
  }, [hazards, allFound, onComplete]);

  const handleHazardClick = (id: string) => {
    setHazards((prev) =>
      prev.map((h) => (h.id === id ? { ...h, found: true } : h))
    );
  };

  useEffect(() => {
    // Attach click listeners manually to A-Frame spheres
    const handlers = hazards.map((h, i) => {
      const el = hazardRefs.current[i];
      if (!el || h.found) return null;
      
      const handler = () => handleHazardClick(h.id);
      el.addEventListener("click", handler);
      return { el, handler };
    });

    return () => {
      handlers.forEach(h => {
        if (h) h.el.removeEventListener("click", h.handler);
      });
    };
  }, [hazards]);

  const foundCount = hazards.filter(h => h.found).length;

  return (
    <div
      ref={containerRef}
      className="vr-module-container"
      style={{
        width: "100%",
        height: "500px",
        borderRadius: "12px",
        overflow: "hidden",
        position: "relative",
        marginBottom: "24px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        border: "4px solid #1e293b"
      }}
    >
      {/* 2D HUD OVERLAY */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', padding: '15px', zIndex: 10,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0))',
        color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>360° Hazard Perception</h3>
          <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.8 }}>Drag to look around. Click hazards to identify them.</p>
        </div>
        <div style={{ 
          background: foundCount === hazards.length ? '#16a34a' : '#ea580c',
          padding: '8px 16px', borderRadius: '999px', fontWeight: 'bold', border: '2px solid white'
        }}>
          {foundCount} / {hazards.length} Found
        </div>
      </div>

      {allFound && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(22, 163, 74, 0.95)', padding: '24px', borderRadius: '16px', 
          color: 'white', textAlign: 'center', zIndex: 20, border: '2px solid white',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)', minWidth: '300px'
        }}>
          <h2 style={{ fontSize: '2rem', margin: '0 0 10px 0' }}>Great Job!</h2>
          <p style={{ fontSize: '1.1rem', marginBottom: '20px' }}>You successfully identified all safety hazards in the environment.</p>
          <button 
            onClick={() => {
               // The parent component handles the advancement, but we can trigger it explicitly if it hasn't fired
               if (onComplete) onComplete(100);
            }}
            style={{
              padding: '12px 24px', background: 'white', color: '#16a34a', border: 'none',
              borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer'
            }}>
            Continue to Next Step
          </button>
        </div>
      )}

      {/* A-FRAME SCENE */}
      <a-scene embedded cursor="rayOrigin: mouse" vr-mode-ui="enabled: true">
        <a-assets>
          <img id="bg" src={bgImage} crossOrigin="anonymous" />
        </a-assets>
        
        <a-sky src="#bg" rotation="0 -90 0"></a-sky>
        
        {/* Camera with gaze cursor for VR mode */}
        <a-entity camera look-controls>
          <a-entity cursor="fuse: true; fuseTimeout: 1000"
                    position="0 0 -1"
                    geometry="primitive: ring; radiusInner: 0.02; radiusOuter: 0.03"
                    material="color: white; shader: flat"
                    raycaster="objects: .clickable">
          </a-entity>
        </a-entity>

        {hazards.map((hazard, i) => (
          <a-entity key={hazard.id} position={hazard.position} rotation={hazard.rotation}>
            {!hazard.found ? (
              <a-sphere
                ref={(el: any) => (hazardRefs.current[i] = el)}
                radius="0.4"
                color="#ef4444"
                opacity="0.6"
                animation="property: scale; to: 1.2 1.2 1.2; dir: alternate; loop: true; dur: 1000"
                class="clickable"
                onClick={() => handleHazardClick(hazard.id)}
                event-set__mouseenter="opacity: 1"
                event-set__mouseleave="opacity: 0.6"
              ></a-sphere>
            ) : (
              <a-entity>
                <a-plane 
                  width="2.5" height="1.2" color="#1e293b" opacity="0.9"
                  position="0 0.5 0"
                ></a-plane>
                <a-text
                  value={`[HAZARD]\n${hazard.title}`}
                  position="0 0.7 0.05"
                  align="center"
                  color="#22c55e"
                  width="3"
                ></a-text>
                <a-text
                  value={hazard.description}
                  position="0 0.2 0.05"
                  align="center"
                  color="#ffffff"
                  width="2.2"
                  wrap-count="30"
                ></a-text>
                <a-circle radius="0.1" color="#22c55e" position="0 -0.2 0.05"></a-circle>
              </a-entity>
            )}
          </a-entity>
        ))}

        {text && (
          <a-entity
            geometry="primitive: plane; width: 4; height: auto"
            material="color: #000; opacity: 0.6"
            position="0 -2 -3"
            text={`value: ${text}; align: center; width: 4; color: white`}
          ></a-entity>
        )}
      </a-scene>
    </div>
  );
}
