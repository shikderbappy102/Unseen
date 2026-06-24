import { useEffect, useState, useRef, RefObject } from "react";

export function useIntersectionObserver(
  ref: RefObject<Element | null>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const target = ref.current;
    if (!target) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [ref, options.root, options.rootMargin, options.threshold]);

  return isIntersecting;
}
