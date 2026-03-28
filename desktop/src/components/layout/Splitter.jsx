import { useRef } from "react";

export function Splitter({ axis = "vertical", onResize, onDragEnd, className = "", title }) {
  const draggingRef = useRef(false);

  function startDrag(event) {
    event.preventDefault();
    draggingRef.current = true;
    const startPos = axis === "vertical" ? event.clientX : event.clientY;

    function handleMove(moveEvent) {
      if (!draggingRef.current) return;
      const currentPos = axis === "vertical" ? moveEvent.clientX : moveEvent.clientY;
      onResize(currentPos - startPos);
    }

    function handleUp() {
      draggingRef.current = false;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      onDragEnd?.();
    }

    document.body.style.cursor = axis === "vertical" ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  }

  return (
    <div
      className={`splitter splitter--${axis} ${className}`.trim()}
      onPointerDown={startDrag}
      role="separator"
      tabIndex={0}
      title={title || "Resize panel"}
      aria-orientation={axis === "vertical" ? "vertical" : "horizontal"}
    />
  );
}
