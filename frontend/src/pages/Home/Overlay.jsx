import { useEffect, useRef } from "react";

/**
 * Overlay Canvas:
 *  - Draws animated amoeboid white overlay
 *  - Lets you erase with a brush effect (click + drag)
 */
export default function Overlay({
  blobCount = 3,        // number of amoeboid blobs
  blurPx = 5,          // softness of blob edges
  eraserRadius = 40,    // brush size (px)
  pointsPerBlob = 60,   // polygon points per blob
}) {
  const canvasRef = useRef(null);
  const eraserOffscreenRef = useRef(null);
  const rafRef = useRef(null);

  

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let dpr = window.devicePixelRatio || 1;

    // offscreen canvas for cumulative erasing
    let eraserCanvas = document.createElement("canvas");
    let eraserCtx = eraserCanvas.getContext("2d");
    eraserOffscreenRef.current = eraserCanvas;

    let width = window.innerWidth;
    let height = window.innerHeight;

    function setupSize() {
      width = window.innerWidth;
      height = window.innerHeight;

      // main canvas
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";

      // the code for viewing on high dpi screens
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // eraser canvas
      eraserCanvas.width = Math.floor(width * dpr);
      eraserCanvas.height = Math.floor(height * dpr);
      eraserCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      eraserCtx.clearRect(0, 0, width, height);
    }

    setupSize();
    const positions = [
  { x: 0, y: height, r:300},       // Bottom-left corner
  { x: width-80, y: 100 , r:85},   // Top-right corner
  { x: 200, y:220, r:90}, 
  { x:width, y:height, r:200}   
];

    // Blob class (organic shapes)
    class Blob {
      constructor(x, y, r) {
        this.baseX = x;
        this.baseY = y;
        this.r = r;
        this.points = pointsPerBlob;
        this.offsets = Array.from({ length: this.points }).map(
          ((_, i) => i * 137) 
        );
        this.moveAmpX = 40;
        this.moveAmpY = 30 ;
        this.moveSpeed = 0.0003 ;
        this.noiseRadius = 5;
        this.noiseSpeed = 0.001 ;
        this.phase = 500;
      }

      drawInto(ctxLocal, time) {
        const t = time || performance.now();
        const cx =
          this.baseX + Math.cos(t * this.moveSpeed + this.phase) * this.moveAmpX;
        const cy =
          this.baseY + Math.sin(t * this.moveSpeed + this.phase * 0.7) *
          this.moveAmpY;

        ctxLocal.beginPath();
        for (let i = 0; i < this.points; i++) {
          const angle = (i / this.points) * Math.PI * 2;
          const noise =
            Math.sin(t * this.noiseSpeed + this.offsets[i]) * this.noiseRadius;
          const radius = this.r + noise;
          const px = cx + Math.cos(angle) * radius;
          const py = cy + Math.sin(angle) * radius;
          if (i === 0) ctxLocal.moveTo(px, py);
          else ctxLocal.lineTo(px, py);
        }
        ctxLocal.closePath();
        ctxLocal.fill();
      }
    }

    // create blobs
    const blobs = [];
    for (let i = 0; i < 4; i++) {
      const {x,y,r} = positions[i];
      
      // const r = 100 + Math.random() * 150;
      blobs.push(new Blob(x, y, r));
    }

    // main render loop
    function render(time) {
      ctx.clearRect(0, 0, width, height);

      // draw white cover
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, width, height);

      // cut animated amoeba holes
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "black";
      ctx.filter = `blur(${blurPx}px)`;
      blobs.forEach((b) => b.drawInto(ctx, time));
      ctx.filter = "none";

      // apply eraser strokes (brush)
      ctx.drawImage(eraserCanvas, 0, 0);
      ctx.restore();

      rafRef.current = requestAnimationFrame(render);
    }
    rafRef.current = requestAnimationFrame(render);

    // ---- Brush Eraser ----
    let isErasing = false;
    let prevX = null,
      prevY = null;

    function pointerDownHandler(e) {
      isErasing = true;
      const rect = canvas.getBoundingClientRect();
      prevX = e.clientX - rect.left;
      prevY = e.clientY - rect.top;
    }

    function pointerUpHandler() {
      isErasing = false;
      prevX = prevY = null;
    }

    function pointerMoveHandler(e) {
      if (!isErasing) return;

      const rect = canvas.getBoundingClientRect();
       const x = (e.clientX - rect.left);
       const y = (e.clientY - rect.top) ;

      eraserCtx.globalCompositeOperation = "source-over";
      eraserCtx.strokeStyle = "rgba(0,0,0,1)";
      eraserCtx.lineWidth = eraserRadius * 2;
      eraserCtx.lineCap = "round";
      eraserCtx.lineJoin = "round";

      eraserCtx.beginPath();
      if (prevX !== null && prevY !== null) {
        eraserCtx.moveTo(prevX, prevY);
      } else {
        eraserCtx.moveTo(x, y);
      }
      eraserCtx.lineTo(x, y);
      eraserCtx.stroke();

      prevX = x;
      prevY = y;
    }

    canvas.addEventListener("pointerdown", pointerDownHandler);
    canvas.addEventListener("pointerup", pointerUpHandler);
    canvas.addEventListener("pointerout", pointerUpHandler);
    canvas.addEventListener("pointermove", pointerMoveHandler);

    // resize handling
    function onResize() {
      dpr = window.devicePixelRatio || 1;
      setupSize();
    }
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("pointerdown", pointerDownHandler);
      canvas.removeEventListener("pointerup", pointerUpHandler);
      canvas.removeEventListener("pointerout", pointerUpHandler);
      canvas.removeEventListener("pointermove", pointerMoveHandler);
      window.removeEventListener("resize", onResize);
    };
  }, [blobCount, blurPx, eraserRadius, pointsPerBlob]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full z-10"
      style={{ touchAction: "none" }}
    />
  );
}
