import React, { useEffect, useRef, useCallback } from 'react';

interface Pcontent {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

const NetworkBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pcontentsRef = useRef<Pcontent[]>([]);
  const animationFrameRef = useRef<number>();
  const resizeTimeoutRef = useRef<NodeJS.Timeout>();
  // Initialize pcontents
  const initializePcontents = useCallback((width: number, height: number) => {
    const numPcontents = Math.min(70, Math.floor((width * height) / 12000));
    const pcontentSpeed = 0.2;
    // Use a jittered grid for even distribution
    const gridCols = Math.ceil(Math.sqrt(numPcontents));
    const gridRows = Math.ceil(numPcontents / gridCols);
    const cellWidth = width / gridCols;
    const cellHeight = height / gridRows;
    const pcontents: Pcontent[] = [];
    let count = 0;
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        if (count >= numPcontents) break;
        // Jitter within cell
        const jitterX = (Math.random() - 0.5) * cellWidth * 0.6;
        const jitterY = (Math.random() - 0.5) * cellHeight * 0.6;
        pcontents.push({
          x: (col + 0.5) * cellWidth + jitterX,
          y: (row + 0.5) * cellHeight + jitterY,
          vx: (Math.random() - 0.5) * pcontentSpeed * 2,
          vy: (Math.random() - 0.5) * pcontentSpeed * 2,
          radius: Math.random() * 1.5 + 0.8,
        });
        count++;
      }
    }
    pcontentsRef.current = pcontents;
  }, []);

  // Debounced resize handler
  const handleResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    resizeTimeoutRef.current = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Reinitialize pcontents after resize
      initializePcontents(canvas.width, canvas.height);
    }, 250); // 250ms debounce
  }, [initializePcontents]);

  useEffect(() => {
    console.log('NetworkBackground mounted');
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }

    // Initial setup
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    initializePcontents(canvas.width, canvas.height);

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Make the network edges longer (nodes more distant)
    const maxDistance = Math.min(canvas.width, canvas.height) * 0.5; // Increased connection distance even more
    let lastTime = performance.now();
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;

      if (deltaTime >= frameInterval) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set composite operation for pcontents
        ctx.globalCompositeOperation = 'difference';

        const pcontents = pcontentsRef.current;
        const pcontentCount = pcontents.length;

        // Update and draw pcontents
        for (let i = 0; i < pcontentCount; i++) {
          const p1 = pcontents[i];

          // Update position with delta time
          p1.x += p1.vx * (deltaTime / frameInterval);
          p1.y += p1.vy * (deltaTime / frameInterval);

          // Bounce off edges with smooth transition
          if (p1.x < 0) {
            p1.x = 0;
            p1.vx = Math.abs(p1.vx);
          } else if (p1.x > canvas.width) {
            p1.x = canvas.width;
            p1.vx = -Math.abs(p1.vx);
          }

          if (p1.y < 0) {
            p1.y = 0;
            p1.vy = Math.abs(p1.vy);
          } else if (p1.y > canvas.height) {
            p1.y = canvas.height;
            p1.vy = -Math.abs(p1.vy);
          }

          // Draw pcontent with reduced opacity
          ctx.beginPath();
          ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 250, 225, 0.6)'; // Soft yellowish node
          ctx.fill();
          // Add subtle glow effect
          ctx.beginPath();
          ctx.arc(p1.x, p1.y, p1.radius * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 235, 150, 0.13)';
          ctx.fill();

          // Draw connections
          for (let j = i + 1; j < pcontentCount; j++) {
            const p2 = pcontents[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < maxDistance) {
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              const connectionOpacity = (1 - (distance / maxDistance)) ** 2 * 0.7; // Slightly reduced connection opacity for yellow
              ctx.strokeStyle = `rgba(255, 235, 150, ${connectionOpacity})`;
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }
          }
        }

        lastTime = currentTime;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      console.log('NetworkBackground unmounting');
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [handleResize, initializePcontents]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        opacity: 0.8,
        mixBlendMode: 'difference',
        background: 'transparent',
        width: '100%',
        height: '100%',
        filter: 'blur(2.5px)',
      }}
    />
  );
};

export default NetworkBackground;
