import React, { useEffect, useRef } from 'react';

const MatrixBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mousePos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas to full screen
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Mouse move handler
        const handleMouseMove = (e: MouseEvent) => {
            mousePos.current = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener('mousemove', handleMouseMove);

        // Enhanced configuration
        const fontSize = 14;
        const columns = canvas.width / fontSize;
        const characters = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
        const drops: Array<{
            x: number;
            y: number;
            speed: number;
            opacity: number;
            chars: string[];
            targetX: number;
        }> = [];

        // Initialize drops
        for (let i = 0; i < columns; i++) {
            drops.push({
                x: i * fontSize,
                y: Math.random() * canvas.height,
                speed: 1 + Math.random(),
                opacity: 0.05 + Math.random() * 0.15, // Reduced max opacity
                chars: Array(Math.floor(5 + Math.random() * 15))
                    .fill('')
                    .map(() => characters[Math.floor(Math.random() * characters.length)]),
                targetX: i * fontSize
            });
        }

        const draw = () => {
            if (!ctx) return;

            // Slightly darker fade for better contrast
            ctx.fillStyle = 'rgba(0, 0, 0, 0.085)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw each stream
            drops.forEach((drop, i) => {
                // Mouse interaction - streams try to avoid mouse
                const dx = mousePos.current.x - drop.x;
                const dy = mousePos.current.y - drop.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 100) {
                    // Push streams away from mouse
                    const angle = Math.atan2(dy, dx);
                    drop.targetX = drop.x - Math.cos(angle) * 20;
                } else {
                    // Slowly return to original position
                    drop.targetX = i * fontSize;
                }

                // Smooth x position movement
                drop.x += (drop.targetX - drop.x) * 0.05;

                // Draw characters
                drop.chars.forEach((char, j) => {
                    const y = drop.y - (j * fontSize);
                    if (y < 0) return;

                    const opacity = drop.opacity * (1 - j / drop.chars.length);

                    // Minimal glow effect
                    ctx.shadowBlur = 0;

                    // First character slightly brighter but not too much
                    if (j === 0) {
                        ctx.fillStyle = `rgba(180, 255, 180, ${opacity * 1.2})`;
                    } else {
                        ctx.fillStyle = `rgba(51, 255, 0, ${opacity * 0.7})`; // Reduced opacity
                    }

                    ctx.font = `${fontSize}px monospace`;
                    ctx.fillText(char, drop.x, y);
                });

                // Update position with variable speed
                drop.y += drop.speed * (1 + Math.sin(Date.now() * 0.001 + i) * 0.2);

                // Reset when off screen
                if (drop.y - (drop.chars.length * fontSize) > canvas.height) {
                    drop.y = 0;
                    drop.speed = 1 + Math.random();
                    drop.opacity = 0.1 + Math.random() * 0.2;
                    drop.chars = Array(Math.floor(5 + Math.random() * 15))
                        .fill('')
                        .map(() => characters[Math.floor(Math.random() * characters.length)]);
                }

                // Randomly change characters with wave pattern
                if (Math.random() < 0.02 + Math.sin(Date.now() * 0.001 + i) * 0.01) {
                    const idx = Math.floor(Math.random() * drop.chars.length);
                    drop.chars[idx] = characters[Math.floor(Math.random() * characters.length)];
                }
            });
        };

        // Run animation
        const intervalId = setInterval(draw, 33);

        // Cleanup
        return () => {
            clearInterval(intervalId);
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1,
            }}
        />
    );
};

export default MatrixBackground;