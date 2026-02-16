'use client';

import React, { useRef, useEffect } from 'react';
import Sketch from 'react-p5';
import p5Types from 'p5';
import { usePCContext } from '../context/PCContext';
import { PC, Branch, Status } from '../types/pc';

// Constants
const COLS = 3;
const BRANCHES: Branch[] = ['HQ', 'Sales', 'Engineering', 'HR', 'Warehouse'];
const STATUS_ORDER: Status[] = ['Imaging', 'Shipped', 'Completed'];

// Colors
const COLORS: Record<string, number[]> = {
  Imaging: [59, 130, 246], // Blue-500
  Shipped: [249, 115, 22], // Orange-500
  Completed: [16, 185, 129], // Emerald-500
  Background: [255, 255, 255], // White
  Text: [71, 85, 105], // Slate-600
  Grid: [241, 245, 249], // Slate-100
};

interface VisualizerContentProps {
  width?: number;
  height?: number;
}

const VisualizerContent: React.FC<VisualizerContentProps> = ({ width = 800, height = 600 }) => {
  const { pcs, movePC } = usePCContext();
  const pcsRef = useRef(pcs);
  const p5Ref = useRef<p5Types | null>(null);

  // Drag state
  const draggedId = useRef<string | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Update ref when pcs changes
  useEffect(() => {
    pcsRef.current = pcs;
  }, [pcs]);

  // Resize canvas when dimensions change
  useEffect(() => {
    if (p5Ref.current) {
      p5Ref.current.resizeCanvas(width, height);
    }
  }, [width, height]);

  // Ref to store particle positions independent of React render cycle
  const particles = useRef<Record<string, { x: number; y: number; targetX: number; targetY: number; color: number[]; isManual?: boolean }>>({});

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    p5Ref.current = p5;
    const renderer = p5.createCanvas(width, height).parent(canvasParentRef);
    p5.frameRate(60);

    // Native DOM event listeners for robust handling
    const canvas = renderer.elt;

    const onMouseDown = (e: MouseEvent) => {
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;

      const ids = Object.keys(particles.current);
      for (let i = ids.length - 1; i >= 0; i--) {
          const id = ids[i];
          const p = particles.current[id];
          if (mouseX >= p.x && mouseX <= p.x + 12 &&
              mouseY >= p.y && mouseY <= p.y + 12) {

              draggedId.current = id;
              dragOffset.current = { x: mouseX - p.x, y: mouseY - p.y };
              p.isManual = true;
              break;
          }
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (draggedId.current && particles.current[draggedId.current]) {
          const p = particles.current[draggedId.current];
          const newX = e.offsetX - dragOffset.current.x;
          const newY = e.offsetY - dragOffset.current.y;

          p.x = newX;
          p.y = newY;
          p.targetX = newX;
          p.targetY = newY;
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (draggedId.current) {
          const currentP5 = p5Ref.current;
          if (currentP5) {
              const w = currentP5.width;
              const h = currentP5.height;
              const colW = w / COLS;
              const rowH = h / BRANCHES.length;

              const mx = e.offsetX;
              const my = e.offsetY;

              let cIdx = Math.floor(mx / colW);
              let rIdx = Math.floor(my / rowH);

              cIdx = Math.max(0, Math.min(cIdx, COLS - 1));
              rIdx = Math.max(0, Math.min(rIdx, BRANCHES.length - 1));

              const newStatus = STATUS_ORDER[cIdx];
              const newBranch = BRANCHES[rIdx];

              movePC(draggedId.current, newStatus, newBranch);

              if (particles.current[draggedId.current]) {
                  particles.current[draggedId.current].isManual = false;
              }
          }
          draggedId.current = null;
      }
    };

    // Attach listeners
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseUp);
  };

  const draw = (p5: p5Types) => {
    p5.background(COLORS.Background);

    // Draw grid lines - DISABLED for cleaner look
    // p5.stroke(COLORS.Grid);
    // p5.strokeWeight(1);

    const colWidth = width / COLS;
    const rowHeight = height / BRANCHES.length;

    // Vertical lines
    // for (let i = 1; i < COLS; i++) {
    //   p5.line(i * colWidth, 0, i * colWidth, height);
    // }
    // Horizontal lines
    // for (let i = 1; i < BRANCHES.length; i++) {
    //   p5.line(0, i * rowHeight, width, i * rowHeight);
    // }

    // Draw Column Headers
    p5.noStroke();
    p5.fill(COLORS.Text);
    p5.textSize(16);
    p5.textAlign(p5.CENTER, p5.TOP);
    p5.textStyle(p5.BOLD);

    STATUS_ORDER.forEach((status, i) => {
      p5.text(status.toUpperCase(), i * colWidth + colWidth / 2, 10);
    });

    // Draw Branch Labels (Rotated on the left)
    p5.textAlign(p5.CENTER, p5.CENTER);
    p5.textSize(12);
    p5.textStyle(p5.NORMAL);

    BRANCHES.forEach((branch, i) => {
      p5.push();
      p5.translate(15, i * rowHeight + rowHeight / 2);
      p5.rotate(-p5.HALF_PI);
      p5.fill(COLORS.Text);
      p5.text(branch, 0, 0);
      p5.pop();
    });

    const currentPCs = pcsRef.current;

    // Counters for grid positioning
    const gridCounts: Record<string, number> = {};

    currentPCs.forEach(pc => {
        const statusIdx = STATUS_ORDER.indexOf(pc.status);
        const branchIdx = BRANCHES.indexOf(pc.branch);

        const cellKey = `${pc.status}-${pc.branch}`;
        if (gridCounts[cellKey] === undefined) gridCounts[cellKey] = 0;

        const countInCell = gridCounts[cellKey];
        gridCounts[cellKey]++;

        const cellX = statusIdx * colWidth;
        const cellY = branchIdx * rowHeight;

        const padding = 30; // space for labels
        const blockSize = 12;
        const gap = 4;
        const availableWidth = Math.max(10, colWidth - padding * 2);

        const colsInCell = Math.floor(availableWidth / (blockSize + gap)) || 1;
        const rowInStack = Math.floor(countInCell / colsInCell);
        const colInStack = countInCell % colsInCell;

        const targetX = cellX + padding + colInStack * (blockSize + gap);
        const targetY = cellY + 20 + rowInStack * (blockSize + gap);

        if (!particles.current[pc.id]) {
            particles.current[pc.id] = {
                x: targetX,
                y: targetY,
                targetX,
                targetY,
                color: COLORS[pc.status] || [255, 255, 255]
            };
        } else {
            // Only update target from grid if NOT manually controlled
            if (!particles.current[pc.id].isManual) {
                particles.current[pc.id].targetX = targetX;
                particles.current[pc.id].targetY = targetY;
            }
            // Always update color based on status
            particles.current[pc.id].color = COLORS[pc.status] || [255, 255, 255];
        }
    });

    // Clean up removed particles
    const currentIds = new Set(currentPCs.map(p => p.id));
    Object.keys(particles.current).forEach(id => {
        if (!currentIds.has(id)) {
            delete particles.current[id];
        }
    });

    // --- Animation & Rendering ---
    let hoveredPC: PC | null = null;
    let hoveredX = 0;
    let hoveredY = 0;

    Object.entries(particles.current).forEach(([id, p]) => {

        p.x += (p.targetX - p.x) * 0.1;
        p.y += (p.targetY - p.y) * 0.1;

        p5.fill(p.color);
        p5.noStroke();
        p5.rect(p.x, p.y, 12, 12, 2);

        // Hover detection
        // Use mouseX from p5 which is updated automatically
        if (!draggedId.current && p5.mouseX >= p.x && p5.mouseX <= p.x + 12 &&
            p5.mouseY >= p.y && p5.mouseY <= p.y + 12) {
             const pc = currentPCs.find(item => item.id === id);
             if (pc) {
                 hoveredPC = pc;
                 hoveredX = p.x;
                 hoveredY = p.y;
             }
             p5.stroke(30, 41, 59); // Dark stroke for hover
             p5.strokeWeight(2);
             p5.rect(p.x, p.y, 12, 12, 2);
        }
    });

    // Draw Tooltip
    if (hoveredPC) {
        const tooltipWidth = 140;
        const tooltipHeight = 65;
        let tx = hoveredX + 20;
        let ty = hoveredY - 20;

        if (tx + tooltipWidth > width) tx = hoveredX - tooltipWidth - 10;
        if (ty + tooltipHeight > height) ty = height - tooltipHeight;
        if (ty < 0) ty = 10;

        p5.fill(255, 255, 255, 240); // White background
        p5.stroke(203, 213, 225); // Slate-300 border
        p5.strokeWeight(1);
        p5.rect(tx, ty, tooltipWidth, tooltipHeight, 6);

        p5.fill(30, 41, 59); // Slate-800 text
        p5.noStroke();
        p5.textAlign(p5.LEFT, p5.TOP);
        p5.textSize(12);
        const info = hoveredPC as PC;
        p5.text(`S/N: ${info.serial}`, tx + 10, ty + 10);
        p5.text(`Branch: ${info.branch}`, tx + 10, ty + 25);
        p5.text(`Status: ${info.status}`, tx + 10, ty + 40);
    }
  };

  return <Sketch setup={setup} draw={draw} />;
};

export default VisualizerContent;
