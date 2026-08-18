'use client';

import { useEffect, useRef, useState } from 'react';

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

export function CustomCursor() {
  const fishRef = useRef<HTMLDivElement>(null);
  const tailRef = useRef<SVGGElement>(null);
  const [label, setLabel] = useState<string>('');
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isClicking, setIsClicking] = useState<boolean>(false);
  const [isTouch, setIsTouch] = useState<boolean>(true);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const bubbleIdRef = useRef(0);

  useEffect(() => {
    // Detect touch / coarse devices
    const touchCheck = window.matchMedia('(hover: none) or (pointer: coarse)').matches;
    setIsTouch(touchCheck);
    if (touchCheck) return;

    const fish = fishRef.current;
    if (!fish) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let fishX = mouseX;
    let fishY = mouseY;
    let angle = 0;
    let targetAngle = 0;
    let speed = 0;
    let animFrame: number;
    let lastBubbleTime = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const onMouseDown = () => setIsClicking(true);
    const onMouseUp = () => setIsClicking(false);

    // Global event delegation for interactive elements (works seamlessly across route changes)
    const onMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest(
        'a, button, [role="button"], input, textarea, select, [data-cursor], .ba-handle'
      ) as HTMLElement | null;

      if (target) {
        setIsHovered(true);
        const customLabel = target.dataset.cursor || '';
        setLabel(customLabel);
      } else {
        setIsHovered(false);
        setLabel('');
      }
    };

    const animate = () => {
      // Smooth lerp movement (fish glides effortlessly)
      const dx = mouseX - fishX;
      const dy = mouseY - fishY;
      const dist = Math.hypot(dx, dy);

      speed = dist;
      fishX += dx * 0.18;
      fishY += dy * 0.18;

      // Calculate direction of movement when moving
      if (dist > 1.5) {
        targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
      }

      // Smooth angle interpolation
      let angleDiff = targetAngle - angle;
      while (angleDiff < -180) angleDiff += 360;
      while (angleDiff > 180) angleDiff -= 360;
      angle += angleDiff * 0.2;

      // Flip fish vertically if moving left so belly stays downward
      const isMovingLeft = Math.abs(angle) > 90;
      const scaleY = isMovingLeft ? -1 : 1;
      const scale = isHovered ? 1.15 : isClicking ? 0.9 : 1;

      fish.style.transform = `translate3d(${fishX}px, ${fishY}px, 0) rotate(${angle}deg) scale(1, ${scaleY}) scale(${scale})`;

      // Dynamic tail wag intensity based on speed
      if (tailRef.current) {
        const wagSpeed = Math.min(speed * 0.8, 15);
        const wagAngle = Math.sin(Date.now() * 0.015) * (15 + wagSpeed * 1.5);
        tailRef.current.style.transform = `rotate(${wagAngle}deg)`;
      }

      // Spawn trailing water bubbles when swimming
      const now = Date.now();
      if (dist > 4 && now - lastBubbleTime > 120) {
        lastBubbleTime = now;
        // Position bubble near the tail of the fish
        const tailOffsetX = -Math.cos((angle * Math.PI) / 180) * 25;
        const tailOffsetY = -Math.sin((angle * Math.PI) / 180) * 25;
        const newBubble: Bubble = {
          id: ++bubbleIdRef.current,
          x: fishX + tailOffsetX + (Math.random() * 8 - 4),
          y: fishY + tailOffsetY + (Math.random() * 8 - 4),
          size: Math.random() * 4 + 3,
          opacity: 0.6,
        };

        setBubbles((prev) => [...prev.slice(-12), newBubble]);
      }

      animFrame = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseover', onMouseOver, { passive: true });

    animFrame = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseover', onMouseOver);
      cancelAnimationFrame(animFrame);
    };
  }, [isHovered, isClicking]);

  // Bubble lifecycles
  useEffect(() => {
    if (bubbles.length === 0) return;
    const timer = setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => Date.now() - b.id < 1200));
    }, 100);
    return () => clearTimeout(timer);
  }, [bubbles]);

  if (isTouch) return null;

  return (
    <>
      {/* Trailing water bubbles */}
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="fish-bubble pointer-events-none fixed rounded-full z-[9997]"
          style={{
            left: `${b.x}px`,
            top: `${b.y}px`,
            width: `${b.size}px`,
            height: `${b.size}px`,
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(0,184,217,0.4))',
            boxShadow: '0 0 4px rgba(0, 184, 217, 0.5)',
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* Main Fish Cursor */}
      <div
        ref={fishRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] will-change-transform"
        style={{
          width: '56px',
          height: '38px',
          marginLeft: '-14px', // Snout aligned with mouse click coordinates
          marginTop: '-19px',
        }}
        aria-hidden="true"
      >
        {/* Glow halo when hovering interactive elements */}
        {isHovered && (
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-30 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, #00B8D9 0%, transparent 70%)',
              transform: 'scale(1.8)',
            }}
          />
        )}

        {/* Precision SVG Clownfish based on reference artwork */}
        <svg
          viewBox="0 0 120 80"
          className="w-full h-full overflow-visible drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top Dorsal Fin */}
          <path
            d="M 40,26 C 48,10 75,12 85,24 C 75,22 55,24 40,26 Z"
            fill="#FF7A00"
            stroke="#12181C"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Dorsal Fin highlight ridge */}
          <path
            d="M 52,18 C 62,14 74,16 80,22"
            stroke="#FFB366"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />

          {/* Bottom Anal/Pelvic Fins */}
          <path
            d="M 46,54 C 52,68 68,66 74,54 C 65,56 54,56 46,54 Z"
            fill="#FF7A00"
            stroke="#12181C"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M 30,50 C 32,60 38,62 42,52 Z"
            fill="#E65C00"
            stroke="#12181C"
            strokeWidth="2.5"
          />

          {/* Oscillating Tail (Caudal Fin) Group */}
          <g
            ref={tailRef}
            style={{
              transformOrigin: '22px 40px',
              transition: 'transform 0.05s ease-out',
            }}
          >
            {/* Tail base connection */}
            <path
              d="M 24,33 C 14,24 4,20 2,28 C 0,36 6,40 2,48 C 0,56 12,54 24,47 Z"
              fill="#FF8000"
              stroke="#12181C"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {/* Tail white stripe */}
            <path
              d="M 18,31 C 13,35 13,44 18,48 C 21,44 21,34 18,31 Z"
              fill="#FFFFFF"
              stroke="#12181C"
              strokeWidth="2"
            />
            {/* Tail inner fin rays */}
            <path
              d="M 12,32 C 6,34 5,38 7,40 M 12,46 C 6,44 5,41 7,40"
              stroke="#CC5200"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* Main Fish Body (Smooth curved organic shape) */}
          <path
            d="M 108,40 C 104,26 88,18 64,20 C 40,22 24,32 22,40 C 24,48 40,58 64,60 C 88,62 104,54 108,40 Z"
            fill="#FF8000"
            stroke="#12181C"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Body Depth Shadow/Shading */}
          <path
            d="M 24,42 C 40,56 70,58 98,48 C 88,58 64,60 24,42 Z"
            fill="#E65500"
            opacity="0.5"
          />

          {/* White Stripe 1: Mid-body vertical curved band */}
          <path
            d="M 52,21 C 62,28 62,52 52,59 C 60,59 66,57 66,57 C 76,48 76,31 66,22 C 62,21 56,21 52,21 Z"
            fill="#FFFFFF"
            stroke="#12181C"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* White Stripe 2: Head/Neck vertical curved band */}
          <path
            d="M 80,24 C 88,30 88,49 80,56 C 88,54 92,51 92,51 C 98,44 98,34 92,28 C 88,25 84,24 80,24 Z"
            fill="#FFFFFF"
            stroke="#12181C"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Pectoral Side Fin */}
          <path
            d="M 58,40 C 64,36 74,40 70,48 C 66,54 58,50 56,43 Z"
            fill="#FFA347"
            stroke="#12181C"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M 60,42 C 65,42 67,45 66,48"
            stroke="#CC5200"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* Cute Fish Eye */}
          <circle cx="96" cy="33" r="6.5" fill="#FFFFFF" stroke="#12181C" strokeWidth="2.5" />
          <circle cx="97" cy="33" r="3.8" fill="#12181C" />
          {/* Eye Sparkle Catchlight */}
          <circle cx="95.5" cy="31.5" r="1.5" fill="#FFFFFF" />

          {/* Cute Fish Smile / Mouth (Pointer tip) */}
          <path
            d="M 104,41 C 106,42 108,41 110,40"
            stroke="#12181C"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Cheek blush */}
          <ellipse cx="90" cy="42" rx="4" ry="2.5" fill="#FF5500" opacity="0.4" />
        </svg>

        {/* Hover Action Badge / Text Bubble */}
        {label && (
          <div
            className="absolute left-1/2 -top-7 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-medium tracking-widest uppercase text-white whitespace-nowrap shadow-lg transition-all duration-300 pointer-events-none"
            style={{
              background: 'rgba(2, 7, 11, 0.9)',
              border: '1px solid rgba(0, 184, 217, 0.6)',
              boxShadow: '0 2px 10px rgba(0, 184, 217, 0.3)',
            }}
          >
            {label}
          </div>
        )}
      </div>
    </>
  );
}

