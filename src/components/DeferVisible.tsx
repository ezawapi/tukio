import { forwardRef, useEffect, useRef, useState, Suspense } from "react";

/**
 * Progressive rendering helper: mounts children only when the placeholder
 * approaches the viewport (or after the browser is idle).
 */
const DeferVisible = forwardRef<HTMLDivElement, {
  children: React.ReactNode;
  minHeight?: number;
  rootMargin?: string;
}>(({
  children,
  minHeight = 0,
  rootMargin = "300px",
}, _forwardedRef) => {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (show) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show, rootMargin]);

  return (
    <div ref={ref} style={!show && minHeight ? { minHeight } : undefined}>
      {show ? <Suspense fallback={null}>{children}</Suspense> : null}
    </div>
  );
});
DeferVisible.displayName = "DeferVisible";

export default DeferVisible;
