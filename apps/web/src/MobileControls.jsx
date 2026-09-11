import React, { useRef, useState, useEffect, useCallback } from 'react';

export default function MobileControls({ onMove, onAction, actionVisible = false, actionLabel = '对话' }) {
  const [touchActive, setTouchActive] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [runActive, setRunActive] = useState(false);
  const baseRef = useRef(null);
  const touchIdRef = useRef(null);
  const centerRef = useRef({ x: 0, y: 0 });
  const radius = 46;

  const updateKnob = useCallback((clientX, clientY) => {
    const dx = clientX - centerRef.current.x;
    const dy = clientY - centerRef.current.y;
    const dist = Math.hypot(dx, dy);

    let normX = 0;
    let normY = 0;

    if (dist > 0) {
      const clampedDist = Math.min(dist, radius);
      normX = (dx / dist) * (clampedDist / radius);
      normY = (dy / dist) * (clampedDist / radius);

      setKnobPos({
        x: (dx / dist) * clampedDist,
        y: (dy / dist) * clampedDist
      });
    } else {
      setKnobPos({ x: 0, y: 0 });
    }

    onMove({
      x: normX,
      y: normY,
      run: runActive
    });
  }, [onMove, radius, runActive]);

  const handleTouchStart = (e) => {
    e.stopPropagation();
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;

    if (baseRef.current) {
      const rect = baseRef.current.getBoundingClientRect();
      centerRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    }

    setTouchActive(true);
    updateKnob(touch.clientX, touch.clientY);
  };

  const handleTouchMove = useCallback((e) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        updateKnob(touch.clientX, touch.clientY);
        break;
      }
    }
  }, [updateKnob]);

  const handleTouchEnd = useCallback((e) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setTouchActive(false);
        setKnobPos({ x: 0, y: 0 });
        onMove({ x: 0, y: 0, run: runActive });
        break;
      }
    }
  }, [onMove, runActive]);

  useEffect(() => {
    const onGlobalMove = (e) => {
      if (touchIdRef.current !== null) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchIdRef.current) {
            updateKnob(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
          }
        }
      }
    };
    const onGlobalEnd = (e) => {
      if (touchIdRef.current !== null) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchIdRef.current) {
            touchIdRef.current = null;
            setTouchActive(false);
            setKnobPos({ x: 0, y: 0 });
            onMove({ x: 0, y: 0, run: runActive });
          }
        }
      }
    };
    window.addEventListener('touchmove', onGlobalMove, { passive: false });
    window.addEventListener('touchend', onGlobalEnd, { passive: false });
    window.addEventListener('touchcancel', onGlobalEnd, { passive: false });
    return () => {
      window.removeEventListener('touchmove', onGlobalMove);
      window.removeEventListener('touchend', onGlobalEnd);
      window.removeEventListener('touchcancel', onGlobalEnd);
    };
  }, [updateKnob, onMove, runActive]);

  return (
    <div className="mobile-controls-layer">
      {/* Virtual Joystick Pad on bottom-left */}
      <div
        ref={baseRef}
        className={`virtual-joystick-base ${touchActive ? 'active' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div
          className="virtual-joystick-knob"
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`
          }}
        />
        <div className="joystick-arrow up">▲</div>
        <div className="joystick-arrow down">▼</div>
        <div className="joystick-arrow left">◀</div>
        <div className="joystick-arrow right">▶</div>
      </div>

      {/* Right side Touch Action Buttons */}
      <div className="mobile-action-group">
        {/* Sprint / Run Toggle */}
        <button
          type="button"
          className={`mobile-action-btn run-btn ${runActive ? 'active' : ''}`}
          onTouchStart={(e) => {
            e.stopPropagation();
            setRunActive(prev => {
              const next = !prev;
              onMove({ x: 0, y: 0, run: next });
              return next;
            });
          }}
          onClick={() => {
            setRunActive(prev => {
              const next = !prev;
              onMove({ x: 0, y: 0, run: next });
              return next;
            });
          }}
        >
          <span>⚡</span>
          <small>{runActive ? '跑步' : '走步'}</small>
        </button>

        {/* Talk / Interact Button ('E') */}
        {actionVisible && (
          <button
            type="button"
            className="mobile-action-btn talk-btn"
            onTouchStart={(e) => {
              e.stopPropagation();
              onAction();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
          >
            <span>💬</span>
            <small>{actionLabel}</small>
          </button>
        )}
      </div>
    </div>
  );
}
