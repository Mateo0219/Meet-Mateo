import { useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

type MarginValue = `${number}${"px" | "%"}`;
type MarginType = MarginValue | `${MarginValue} ${MarginValue}` | `${MarginValue} ${MarginValue} ${MarginValue}` | `${MarginValue} ${MarginValue} ${MarginValue} ${MarginValue}`;

// Debug 模式：设置为 true 来启用控制台日志
const DEBUG = true;

/**
 * 平滑的视口检测 hook，每次进入视口都会重新触发动画
 * 使用 key 机制避免闪动，确保动画平滑重置
 */
export function useSmoothInView(margin: MarginType = "-50px", resetDelay = 300) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, margin });
  // 使用更大的负 margin 来检测元素是否完全离开视口（用于决定是否重置）
  // useInView 的 margin: "-200px" 表示元素可以离开视口 200px 仍然算 inView
  // 所以如果返回 false，说明元素离开视口超过 200px，即 fullyOutOfView = true
  const inViewWithLargeMargin = useInView(ref, { once: false, margin: "-200px" as MarginType });
  const fullyOutOfView = !inViewWithLargeMargin; // 如果不在大 margin 范围内，说明完全离开
  
  const [animationKey, setAnimationKey] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const lastInViewStateRef = useRef(false);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAnimatedRef = useRef(false);
  const componentIdRef = useRef(Math.random().toString(36).substr(2, 9)); // 用于标识不同组件实例
  const lastScrollYRef = useRef(0); // 用于检测滚动方向
  const elementTopRef = useRef<number | null>(null); // 记录元素顶部位置

  useEffect(() => {
    const componentId = componentIdRef.current;
    const wasInView = lastInViewStateRef.current;
    const justEntered = inView && !wasInView;
    const justLeft = !inView && wasInView;
    lastInViewStateRef.current = inView;

    // 检测滚动方向：true 表示向下滚动，false 表示向上滚动
    const currentScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    const isScrollingDown = currentScrollY > lastScrollYRef.current;
    lastScrollYRef.current = currentScrollY;

    // 获取元素位置来判断是从上方还是下方进入
    let isEnteringFromBottom = true; // 默认从下方进入
    if (ref.current && typeof window !== 'undefined') {
      const rect = (ref.current as HTMLElement).getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      // 判断逻辑：
      // - 如果元素顶部在视口下方（rect.top > 0），说明是从下方进入
      // - 如果元素顶部在视口上方（rect.top < 0），说明是从上方进入
      // - 如果元素在视口中间，根据滚动方向判断
      if (rect.top > 0) {
        // 元素在视口下方，肯定是从下方进入
        isEnteringFromBottom = true;
      } else if (rect.top < -rect.height) {
        // 元素完全在视口上方，肯定是从上方进入
        isEnteringFromBottom = false;
      } else {
        // 元素在视口内，根据滚动方向判断
        isEnteringFromBottom = isScrollingDown;
      }
      elementTopRef.current = rect.top;
    }

    if (DEBUG) {
      console.log(`[${componentId}] 状态更新:`, {
        inView,
        wasInView,
        justEntered,
        justLeft,
        inViewWithLargeMargin,
        fullyOutOfView,
        shouldAnimate,
        hasAnimated: hasAnimatedRef.current,
        animationKey,
        hasResetTimeout: !!resetTimeoutRef.current,
        isScrollingDown,
        isEnteringFromBottom,
      });
    }

    if (inView) {
      // 进入视口时，清除任何待执行的重置定时器
      if (resetTimeoutRef.current) {
        if (DEBUG) {
          console.log(`[${componentId}] 清除重置定时器（进入视口）`);
        }
        clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = null;
      }
      
      // 每次进入视口时都重新触发动画
      // 关键：只有从下方进入时才触发动画
      if (justEntered) {
        if (DEBUG) {
          console.log(`[${componentId}] 刚刚进入视口，isEnteringFromBottom=${isEnteringFromBottom}, isScrollingDown=${isScrollingDown}`);
        }
        
        // 只有从下方进入时才触发动画
        if (isEnteringFromBottom) {
          // 如果之前已经动画过，需要重新触发动画
          if (hasAnimatedRef.current) {
            if (DEBUG) {
              console.log(`[${componentId}] 从下方进入，之前已动画过，更新 key 来重新触发动画`);
            }
            // 关键优化：不先设置 shouldAnimate = false，直接更新 key 来触发新动画
            // 这样可以避免闪烁
            setAnimationKey(prev => prev + 1);
            // 确保 shouldAnimate 为 true
              setShouldAnimate(true);
          } else {
            // 第一次从下方进入，直接触发动画
            if (DEBUG) {
              console.log(`[${componentId}] 第一次从下方进入视口，直接触发动画`);
            }
          setShouldAnimate(true);
            hasAnimatedRef.current = true;
          }
        } else {
          // 从上方进入，不触发动画，但保持当前状态
          if (DEBUG) {
            console.log(`[${componentId}] 从上方进入视口，不触发动画，保持当前状态`);
          }
          // 如果之前已经动画过，保持动画状态
          if (hasAnimatedRef.current && shouldAnimate) {
            // 保持 shouldAnimate 为 true，不更新 key
          } else if (hasAnimatedRef.current && !shouldAnimate) {
            // 如果之前动画过但被重置了，从上方进入时不恢复
            if (DEBUG) {
              console.log(`[${componentId}] 从上方进入，之前动画被重置，但不恢复（只从下方进入时恢复）`);
            }
          }
        }
      } else {
        // 重要：即使不是 justEntered，也要检查是否需要恢复动画
        // 但只有从下方进入时才恢复
        if (!shouldAnimate && hasAnimatedRef.current) {
          // 检查是否是从下方进入（通过滚动方向和元素位置判断）
          if (isScrollingDown && isEnteringFromBottom) {
            if (DEBUG) {
              console.log(`[${componentId}] 在视口中但动画被重置，从下方进入，恢复动画并更新 key`);
            }
            // 更新 key 来触发重新动画
            setAnimationKey(prev => prev + 1);
        setShouldAnimate(true);
          } else {
            if (DEBUG) {
              console.log(`[${componentId}] 在视口中但动画被重置，不是从下方进入（isScrollingDown=${isScrollingDown}, isEnteringFromBottom=${isEnteringFromBottom}），不恢复动画`);
        }
          }
        }
      }
    } else {
      // 离开视口时（inView = false）
      if (DEBUG) {
        console.log(`[${componentId}] 离开视口:`, {
          justLeft,
          fullyOutOfView,
          hasAnimated: hasAnimatedRef.current,
          currentShouldAnimate: shouldAnimate,
        });
      }
      
      // 关键优化：只有当元素完全离开视口足够远时才考虑重置
      // 这样可以避免在视口边缘时的闪烁
      if (justLeft) {
        // 只有当 fullyOutOfView 为 true（元素完全离开）时才考虑重置
        // 注意：fullyOutOfView 为 true 表示元素完全不在视口内（超过 200px）
        if (fullyOutOfView && hasAnimatedRef.current) {
          // 完全离开视口，设置重置定时器
        if (resetTimeoutRef.current) {
          clearTimeout(resetTimeoutRef.current);
        }
          if (DEBUG) {
            console.log(`[${componentId}] 设置重置定时器，延迟 ${resetDelay}ms（完全离开视口）`);
          }
        resetTimeoutRef.current = setTimeout(() => {
            // 双重检查：只有在仍然完全离开视口且不在视口内时才真正重置
          if (fullyOutOfView && !inView) {
              if (DEBUG) {
                console.log(`[${componentId}] ⚠️ 执行重置：设置 shouldAnimate = false（完全离开视口超过 ${resetDelay}ms）`);
              }
              // 关键：只在完全离开视口足够长时间后才重置
              // 这样当用户快速滚动回来时，不会触发重置
            setShouldAnimate(false);
              // 注意：不重置 hasAnimatedRef，这样下次进入时会触发重置逻辑
            } else {
              if (DEBUG) {
                console.log(`[${componentId}] 重置定时器触发，但元素已回到视口（inView=${inView}, fullyOutOfView=${fullyOutOfView}），取消重置`);
              }
            }
          }, resetDelay);
        } else {
          // 重要：不完全离开视口时（fullyOutOfView = false），保持 shouldAnimate 为 true，避免闪烁
          if (DEBUG) {
            console.log(`[${componentId}] 离开视口但未完全离开（fullyOutOfView=${fullyOutOfView}），保持动画状态，不重置`);
          }
          // 确保 shouldAnimate 保持为 true，避免闪烁
          if (!shouldAnimate) {
            if (DEBUG) {
              console.log(`[${componentId}] 恢复 shouldAnimate = true（避免闪烁）`);
            }
            setShouldAnimate(true);
      }
        }
      } else if (!inView) {
        // 如果不在视口内但也不完全离开（在边缘），保持动画状态
        // 这样可以避免在滚动过程中的闪烁
        if (!fullyOutOfView && !shouldAnimate && hasAnimatedRef.current) {
          if (DEBUG) {
            console.log(`[${componentId}] 在视口边缘（!inView && !fullyOutOfView），恢复动画状态`);
          }
          setShouldAnimate(true);
        }
      }
    }

    return () => {
      if (resetTimeoutRef.current) {
        if (DEBUG) {
          console.log(`[${componentId}] 清理：清除重置定时器`);
        }
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, [inView, inViewWithLargeMargin, fullyOutOfView, resetDelay, shouldAnimate, animationKey]);

  return { ref, shouldAnimate, animationKey };
}

