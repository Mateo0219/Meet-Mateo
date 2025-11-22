import { useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

/**
 * 平滑的视口检测 hook，每次进入视口都会触发动画，但离开时保持最终状态避免闪烁
 * 只有当元素完全离开视口足够远时才重置，确保每次进入都能重新动画
 */
export function useSmoothInView(margin = "-50px", resetDelay = 1000) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, margin });
  // 使用更大的负 margin 来检测元素是否完全离开视口（用于决定是否重置）
  const fullyOutOfView = useInView(ref, { once: false, margin: "-400px" });
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCompletedAnimationRef = useRef(false);
  const lastInViewStateRef = useRef(false);
  const hasBeenResetRef = useRef(false);

  useEffect(() => {
    const wasInView = lastInViewStateRef.current;
    const justEntered = inView && !wasInView;
    const justLeft = !inView && wasInView;
    lastInViewStateRef.current = inView;

    if (inView) {
      // 进入视口时
      // 清除任何待执行的重置定时器
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = null;
      }
      
      // 如果是新进入视口，检查是否需要重新触发动画
      if (justEntered) {
        // 如果已经重置过（hasBeenResetRef = true），说明之前完全离开过，需要重新触发动画
        if (hasBeenResetRef.current) {
          // 先设置为 false 确保可以重新触发动画
          setShouldAnimate(false);
          hasCompletedAnimationRef.current = false;
          hasBeenResetRef.current = false;
          
          // 使用 requestAnimationFrame 确保状态更新后再触发动画
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setShouldAnimate(true);
              
              // 标记动画完成
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }
              timeoutRef.current = setTimeout(() => {
                hasCompletedAnimationRef.current = true;
              }, 1000);
            });
          });
        } else if (!hasCompletedAnimationRef.current) {
          // 如果还没有动画过，触发动画
          setShouldAnimate(true);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = setTimeout(() => {
            hasCompletedAnimationRef.current = true;
          }, 1000);
        } else {
          // 如果已经完成过动画且还没有重置过，保持动画状态（避免闪烁）
          setShouldAnimate(true);
        }
      } else if (hasCompletedAnimationRef.current && !hasBeenResetRef.current) {
        // 如果已经完成过动画且还没有重置过，保持动画状态（避免闪烁）
        setShouldAnimate(true);
      } else if (!shouldAnimate && !hasBeenResetRef.current) {
        // 如果还没有动画过且没有重置过，触发动画
        setShouldAnimate(true);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          hasCompletedAnimationRef.current = true;
        }, 1000);
      }
      
    } else {
      // 离开视口时
      // 只有当元素完全离开视口且动画已完成时，才延迟重置
      if (justLeft && fullyOutOfView && hasCompletedAnimationRef.current && !hasBeenResetRef.current) {
        if (resetTimeoutRef.current) {
          clearTimeout(resetTimeoutRef.current);
        }
        resetTimeoutRef.current = setTimeout(() => {
          // 完全离开视口后才重置，确保下次进入可以重新动画
          // 但只有在仍然完全离开视口时才真正重置
          if (fullyOutOfView && !inView) {
            setShouldAnimate(false);
            hasCompletedAnimationRef.current = false;
            hasBeenResetRef.current = true; // 标记已经重置，下次进入时可以重新动画
          }
        }, resetDelay);
      }
      // 如果只是稍微离开但还在附近（fullyOutOfView = false），保持动画状态（不重置）
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, [inView, fullyOutOfView, resetDelay, shouldAnimate]);

  return { ref, shouldAnimate };
}

