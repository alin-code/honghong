'use client';

import React, { useState } from 'react';

interface StarParticle {
  id: number;
  left: string;
  top: string;
  duration: string;
  delay: string;
  size: number;
}

function generateParticles(): StarParticle[] {
  return Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: `${1.5 + Math.random() * 2}s`,
    delay: `${Math.random() * 3}s`,
    size: 2 + Math.random() * 4,
  }));
}

export function StarParticles() {
  const [particles] = useState<StarParticle[]>(generateParticles);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="star-particle"
          style={{
            left: p.left,
            top: p.top,
            '--duration': p.duration,
            '--delay': p.delay,
            width: p.size,
            height: p.size,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}