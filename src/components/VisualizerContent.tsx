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
  Imaging: [6, 182, 212], // Cyan-500
  Shipped: [245, 158, 11], // Amber-500
  Completed: [16, 185, 129], // Emerald-500
  Background: [15, 23, 42], // Slate-900
  Text: [148, 163, 184], // Slate-400
  Grid: [30, 41, 59], // Slate-800
};

interface VisualizerContentProps {
  width?: number;
  height?: number;
}

const VisualizerContent: React.FC<VisualizerContentProps> = ({ width = 800, height = 600 }) => {
  const { pcs } = usePCContext();
  const pcsRef = useRef(pcs);
  const p5Ref = useRef<p5Types | null>(null);

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
  const particles = useRef<Record<string, { x: number; y: number; targetX: number; targetY: number; color: number[] }>>({});

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    p5Ref.current = p5;
    p5.createCanvas(width, height).parent(canvasParentRef);
    p5.frameRate(60);
  };

  const draw = (p5: p5Types) => {
    p5.background(COLORS.Background);

    // Draw grid lines
    p5.stroke(COLORS.Grid);
    p5.strokeWeight(1);

    const colWidth = width / COLS;
    const rowHeight = height / BRANCHES.length;

    // Vertical lines
    for (let i = 1; i < COLS; i++) {
      p5.line(i * colWidth, 0, i * colWidth, height);
    }
    // Horizontal lines
    for (let i = 1; i < BRANCHES.length; i++) {
      p5.line(0, i * rowHeight, width, i * rowHeight);
    }

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

    // --- Calculate Targets ---
    // We only need to recalculate targets if pcs changed or layout changed.
    // Ideally, this should be outside draw loop for performance, but inside is fine for 200 items.

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
            particles.current[pc.id].targetX = targetX;
            particles.current[pc.id].targetY = targetY;
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

        if (p5.mouseX >= p.x && p5.mouseX <= p.x + 12 &&
            p5.mouseY >= p.y && p5.mouseY <= p.y + 12) {
             const pc = currentPCs.find(item => item.id === id);
             if (pc) {
                 hoveredPC = pc;
                 hoveredX = p.x;
                 hoveredY = p.y;
             }
             p5.stroke(255);
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

        p5.fill(15, 23, 42, 240); // Darker background
        p5.stroke(100);
        p5.strokeWeight(1);
        p5.rect(tx, ty, tooltipWidth, tooltipHeight, 6);

        p5.fill(255);
        p5.noStroke();
        p5.textAlign(p5.LEFT, p5.TOP);
        p5.textSize(12);
        // Cast to PC to satisfy TS in case of inference issues inside p5 loop context
        const info = hoveredPC as PC;
        p5.text(`S/N: ${info.serial}`, tx + 10, ty + 10);
        p5.text(`Branch: ${info.branch}`, tx + 10, ty + 25);
        p5.text(`Status: ${info.status}`, tx + 10, ty + 40);
    }
  };

  // Cast to any to resolve type mismatch between p5 package and @types/p5 expected by react-p5
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <Sketch setup={setup as any} draw={draw as any} />;
};

export default VisualizerContent;
