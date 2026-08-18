'use client';

import { useEffect, useRef, useState } from 'react';

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  glow: boolean;
}

export function CustomCursor() {
  const fishRef = useRef<HTMLDivElement>(null);
  const tailRef = useRef<SVGGElement>(null);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const bubbleIdRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const fish = fishRef.current;
    if (!fish) return;

    let mouseX = -200;
    let mouseY = -200;
    let fishX = -200;
    let fishY = -200;
    let angle = 0;
    let targetAngle = 0;
    let speed = 0;
    let animFrame: number;
    let lastBubbleTime = 0;
    let hasMoved = false;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!hasMoved) {
        hasMoved = true;
        fishX = mouseX;
        fishY = mouseY;
        setIsVisible(true);
        document.documentElement.classList.add('has-custom-cursor');
      }
    };

    const onMouseEnter = () => {
      setIsVisible(true);
      if (hasMoved) {
        document.documentElement.classList.add('has-custom-cursor');
      }
    };

    const onMouseLeave = () => {
      setIsVisible(false);
      document.documentElement.classList.remove('has-custom-cursor');
    };

    // Global event delegation for interactive elements (glowing fish without text popups)
    const onMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest(
        'a, button, [role="button"], input, textarea, select, [data-cursor], .ba-handle'
      ) as HTMLElement | null;

      setIsHovered(!!target);
    };

    // Burst bubbles on click
    const onMouseDown = (e: MouseEvent) => {
      const burstBubbles: Bubble[] = [];
      for (let i = 0; i < 6; i++) {
        const spreadAngle = (Math.PI * 2 * i) / 6 + (Math.random() * 0.4 - 0.2);
        const burstSpeed = Math.random() * 2 + 1.5;
        burstBubbles.push({
          id: ++bubbleIdRef.current,
          x: e.clientX,
          y: e.clientY,
          size: Math.random() * 5 + 3,
          vx: Math.cos(spreadAngle) * burstSpeed,
          vy: Math.sin(spreadAngle) * burstSpeed - 1,
          glow: true,
        });
      }
      setBubbles((prev) => [...prev.slice(-30), ...burstBubbles]);
    };

    const animate = () => {
      if (hasMoved) {
        // Smooth lerp glide
        const dx = mouseX - fishX;
        const dy = mouseY - fishY;
        const dist = Math.hypot(dx, dy);

        speed = dist;
        fishX += dx * 0.24;
        fishY += dy * 0.24;

        // Calculate swim direction angle
        if (dist > 1.2) {
          targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        }

        // Shortest angular distance interpolation
        let angleDiff = targetAngle - angle;
        while (angleDiff < -180) angleDiff += 360;
        while (angleDiff > 180) angleDiff -= 360;
        angle += angleDiff * 0.24;

        // Keep belly facing down when swimming to the left
        const isMovingLeft = Math.abs(angle) > 90;
        const scaleY = isMovingLeft ? -1 : 1;
        const scale = isHovered ? 1.18 : 1.0;

        fish.style.transform = `translate3d(${fishX}px, ${fishY}px, 0) rotate(${angle}deg) scale(1, ${scaleY}) scale(${scale})`;

        // Tail wagging animation
        if (tailRef.current) {
          const wagSpeed = Math.min(speed * 0.9, 22);
          const wagAngle = Math.sin(Date.now() * 0.02) * (15 + wagSpeed * 1.8);
          tailRef.current.style.transform = `rotate(${wagAngle}deg)`;
        }

        // Continuous trailing bubble generation while swimming
        const now = Date.now();
        const interval = isHovered ? 60 : dist > 2 ? 75 : 350; // More bubbles on movement & hover
        if (now - lastBubbleTime > interval) {
          lastBubbleTime = now;
          const tailOffsetX = -Math.cos((angle * Math.PI) / 180) * 26;
          const tailOffsetY = -Math.sin((angle * Math.PI) / 180) * 26;

          // Spawn 1 to 2 bubbles per tick
          const count = dist > 6 ? 2 : 1;
          const newBubbles: Bubble[] = [];
          for (let i = 0; i < count; i++) {
            newBubbles.push({
              id: ++bubbleIdRef.current,
              x: fishX + tailOffsetX + (Math.random() * 10 - 5),
              y: fishY + tailOffsetY + (Math.random() * 10 - 5),
              size: Math.random() * 4.5 + 2.5,
              vx: (Math.random() - 0.5) * 0.8,
              vy: -(Math.random() * 1.2 + 0.8),
              glow: Math.random() > 0.6,
            });
          }

          setBubbles((prev) => [...prev.slice(-35), ...newBubbles]);
        }
      }

      animFrame = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    document.addEventListener('mouseenter', onMouseEnter);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseover', onMouseOver, { passive: true });

    animFrame = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseenter', onMouseEnter);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseover', onMouseOver);
      cancelAnimationFrame(animFrame);
    };
  }, [isHovered]);

  // Bubble cleanup
  useEffect(() => {
    if (bubbles.length === 0) return;
    const timer = setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => Date.now() - b.id < 1400));
    }, 100);
    return () => clearTimeout(timer);
  }, [bubbles]);

  return (
    <>
      {/* Trailing water bubbles */}
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="fish-bubble pointer-events-none fixed rounded-full z-[99998]"
          style={{
            left: `${b.x}px`,
            top: `${b.y}px`,
            width: `${b.size}px`,
            height: `${b.size}px`,
            background: b.glow
              ? 'radial-gradient(circle at 30% 30%, rgba(255,255,255,1), rgba(0,210,247,0.7))'
              : 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(0,184,217,0.4))',
            boxShadow: b.glow
              ? '0 0 6px rgba(0, 210, 247, 0.8), inset -1px -1px 2px rgba(0,0,0,0.2)'
              : '0 0 3px rgba(0, 184, 217, 0.4), inset -1px -1px 2px rgba(0,0,0,0.2)',
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* Main Fish Cursor */}
      <div
        ref={fishRef}
        className={`pointer-events-none fixed top-0 left-0 z-[99999] will-change-transform transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          width: '54px',
          height: '38px',
          marginLeft: '-13px', // Snout aligned with mouse click coordinates
          marginTop: '-19px',
        }}
        aria-hidden="true"
      >
        {/* Aquatic ambient pulse when hovering interactive elements */}
        {isHovered && (
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-35 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, #00D2F7 0%, transparent 70%)',
              transform: 'scale(1.9)',
            }}
          />
        )}

        {/* Precision Clownfish SVG */}
        <svg
          viewBox="0 0 120 80"
          className="w-full h-full overflow-visible drop-shadow-[0_3px_12px_rgba(0,0,0,0.7)]"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top Dorsal Fin */}
          <path
            d="M 42,26 C 50,9 78,11 88,24 C 76,22 56,24 42,26 Z"
            fill="#FF7A00"
            stroke="#12181C"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path
            d="M 54,17 C 64,13 76,15 82,22"
            stroke="#FFB366"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />

          {/* Bottom Anal/Pelvic Fins */}
          <path
            d="M 48,54 C 54,69 70,67 76,54 C 67,56 56,56 48,54 Z"
            fill="#FF7A00"
            stroke="#12181C"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path
            d="M 32,50 C 34,61 40,63 44,52 Z"
            fill="#E65C00"
            stroke="#12181C"
            strokeWidth="3"
          />

          {/* Oscillating Tail (Caudal Fin) Group */}
          <g
            ref={tailRef}
            style={{
              transformOrigin: '24px 40px',
              transition: 'transform 0.05s ease-out',
            }}
          >
            {/* Tail body */}
            <path
              d="M 26,33 C 15,22 4,17 2,28 C 0,36 6,40 2,48 C 0,56 12,55 26,47 Z"
              fill="#FF8000"
              stroke="#12181C"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            {/* Tail white stripe */}
            <path
              d="M 19,30 C 14,35 14,45 19,48 C 22,44 22,34 19,30 Z"
              fill="#FFFFFF"
              stroke="#12181C"
              strokeWidth="2.5"
            />
            {/* Tail fin details */}
            <path
              d="M 13,32 C 7,34 6,38 8,40 M 13,46 C 7,44 6,41 8,40"
              stroke="#CC5200"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* Main Fish Body */}
          <path
            d="M 108,40 C 104,26 88,18 64,20 C 40,22 24,32 22,40 C 24,48 40,58 64,60 C 88,62 104,54 108,40 Z"
            fill="#FF8000"
            stroke="#12181C"
            strokeWidth="4"
            strokeLinejoin="round"
          />

          {/* Body Depth Shadow */}
          <path
            d="M 24,42 C 40,56 70,58 98,48 C 88,58 64,60 24,42 Z"
            fill="#E65500"
            opacity="0.6"
          />

          {/* White Stripe 1: Mid-body band */}
          <path
            d="M 52,21 C 62,28 62,52 52,59 C 60,59 66,57 66,57 C 76,48 76,31 66,22 C 62,21 56,21 52,21 Z"
            fill="#FFFFFF"
            stroke="#12181C"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* White Stripe 2: Head/Neck band */}
          <path
            d="M 80,24 C 88,30 88,49 80,56 C 88,54 92,51 92,51 C 98,44 98,34 92,28 C 88,25 84,24 80,24 Z"
            fill="#FFFFFF"
            stroke="#12181C"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Pectoral Side Fin */}
          <path
            d="M 58,40 C 64,36 74,40 70,48 C 66,54 58,50 56,43 Z"
            fill="#FFA347"
            stroke="#12181C"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M 60,42 C 65,42 67,45 66,48"
            stroke="#CC5200"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />

          {/* Cute Fish Eye */}
          <circle cx="96" cy="33" r="6.8" fill="#FFFFFF" stroke="#12181C" strokeWidth="3" />
          <circle cx="97" cy="33" r="4" fill="#12181C" />
          <circle cx="95.5" cy="31.5" r="1.6" fill="#FFFFFF" />

          {/* Fish Smile / Mouth */}
          <path
            d="M 104,41 C 106,42 108,41 110,40"
            stroke="#12181C"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          {/* Cheek blush */}
          <ellipse cx="90" cy="42" rx="4.5" ry="2.8" fill="#FF5500" opacity="0.5" />
        </svg>
      </div>
    </>
  );
}



