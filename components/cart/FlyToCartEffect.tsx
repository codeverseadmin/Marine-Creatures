'use client';

import React, { useEffect, useState } from 'react';
import { useCart, FlyingItem } from '@/lib/context/CartContext';

export function FlyToCartEffect() {
  const { flyingItems } = useCart();
  const [targetPos, setTargetPos] = useState<{ x: number; y: number }>({
    x: typeof window !== 'undefined' ? window.innerWidth - 60 : 1200,
    y: 35,
  });

  useEffect(() => {
    const updateTarget = () => {
      const cartBtn = document.getElementById('navbar-cart-btn');
      if (cartBtn) {
        const rect = cartBtn.getBoundingClientRect();
        setTargetPos({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
      } else {
        setTargetPos({
          x: window.innerWidth - 60,
          y: 35,
        });
      }
    };

    updateTarget();
    window.addEventListener('resize', updateTarget);
    window.addEventListener('scroll', updateTarget);
    return () => {
      window.removeEventListener('resize', updateTarget);
      window.removeEventListener('scroll', updateTarget);
    };
  }, []);

  if (flyingItems.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100000] overflow-hidden">
      {flyingItems.map((item) => (
        <FlyingOrb key={item.id} item={item} targetPos={targetPos} />
      ))}
    </div>
  );
}

function FlyingOrb({
  item,
  targetPos,
}: {
  item: FlyingItem;
  targetPos: { x: number; y: number };
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    const duration = 700; // ms

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const t = Math.min(elapsed / duration, 1);
      // Ease in-out cubic
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      setProgress(ease);

      if (t < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, []);

  // Parabolic trajectory: arc upwards then dive into the cart icon
  const currentX = item.startX + (targetPos.x - item.startX) * progress;
  const linearY = item.startY + (targetPos.y - item.startY) * progress;
  const arcHeight = -120 * Math.sin(progress * Math.PI); // upward bulge
  const currentY = linearY + arcHeight;

  const currentScale = 1 - progress * 0.65; // scale down
  const currentOpacity = progress > 0.85 ? (1 - progress) / 0.15 : 1;

  return (
    <div
      className="absolute will-change-transform"
      style={{
        transform: `translate3d(${currentX - 28}px, ${currentY - 28}px, 0) scale(${currentScale})`,
        opacity: currentOpacity,
      }}
    >
      {/* Outer Aquatic Glow Aura */}
      <div className="relative w-14 h-14 rounded-full p-1 bg-gradient-to-tr from-[#00B8D9] via-[#00D2F7] to-white shadow-[0_0_20px_rgba(0,210,247,0.9)] flex items-center justify-center animate-spin">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt=""
          className="w-11 h-11 rounded-full object-cover border border-white"
        />
      </div>
      {/* Trailing sparkle particles */}
      <div className="absolute inset-0 rounded-full animate-ping bg-[#00D2F7] opacity-60 pointer-events-none" />
    </div>
  );
}
