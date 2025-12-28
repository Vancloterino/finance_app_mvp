/**
 * VirtualList Component
 *
 * Efficiently renders large lists by only rendering visible items in the viewport.
 * This improves performance for lists with hundreds or thousands of items.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface VirtualListProps<T> {
  /** Array of items to render */
  items: T[];
  /** Height of each item in pixels (for uniform items) */
  itemHeight: number;
  /** Height of the scrollable container in pixels */
  containerHeight: number;
  /** Function to render each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Number of items to render outside visible area (default: 3) */
  overscan?: number;
  /** Optional function to get dynamic height for each item */
  getItemHeight?: (index: number) => number;
  /** Scroll to specific index */
  scrollToIndex?: number;
  /** Additional CSS class for container */
  className?: string;
  /** Callback when scrolling */
  onScroll?: (scrollTop: number) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Scroll direction: vertical or horizontal */
  direction?: 'vertical' | 'horizontal';
}

function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  getItemHeight,
  scrollToIndex,
  className = '',
  onScroll,
  isLoading = false,
  direction = 'vertical',
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate total height of all items
  const getTotalHeight = useCallback(() => {
    if (getItemHeight) {
      return items.reduce((sum, _, index) => sum + getItemHeight(index), 0);
    }
    return items.length * itemHeight;
  }, [items, itemHeight, getItemHeight]);

  // Get height of specific item
  const getHeightAtIndex = useCallback(
    (index: number) => {
      return getItemHeight ? getItemHeight(index) : itemHeight;
    },
    [itemHeight, getItemHeight]
  );

  // Calculate start index based on scroll position
  const getStartIndex = useCallback(() => {
    if (getItemHeight) {
      // For variable height items, calculate by accumulating heights
      let accumulatedHeight = 0;
      for (let i = 0; i < items.length; i++) {
        if (accumulatedHeight >= scrollTop) {
          return Math.max(0, i - overscan);
        }
        accumulatedHeight += getItemHeight(i);
      }
      return Math.max(0, items.length - overscan);
    }
    // For uniform height items, simple division
    const index = Math.floor(scrollTop / itemHeight);
    return Math.max(0, index - overscan);
  }, [scrollTop, itemHeight, overscan, items.length, getItemHeight]);

  // Calculate end index
  const getEndIndex = useCallback(() => {
    const startIndex = getStartIndex();
    let visibleHeight = 0;
    let endIndex = startIndex;

    while (visibleHeight < containerHeight + overscan * itemHeight && endIndex < items.length) {
      visibleHeight += getHeightAtIndex(endIndex);
      endIndex++;
    }

    return Math.min(items.length, endIndex + overscan);
  }, [getStartIndex, containerHeight, overscan, itemHeight, items.length, getHeightAtIndex]);

  // Calculate offset for first visible item
  const getOffsetForIndex = useCallback(
    (index: number) => {
      if (getItemHeight) {
        let offset = 0;
        for (let i = 0; i < index; i++) {
          offset += getItemHeight(i);
        }
        return offset;
      }
      return index * itemHeight;
    },
    [itemHeight, getItemHeight]
  );

  // Handle scroll event
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const newScrollTop = direction === 'vertical' ? target.scrollTop : target.scrollLeft;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);
    },
    [onScroll, direction]
  );

  // Scroll to specific index
  useEffect(() => {
    if (scrollToIndex !== undefined && containerRef.current) {
      const offset = getOffsetForIndex(scrollToIndex);
      if (direction === 'vertical') {
        containerRef.current.scrollTop = offset;
      } else {
        containerRef.current.scrollLeft = offset;
      }
    }
  }, [scrollToIndex, getOffsetForIndex, direction]);

  const totalHeight = getTotalHeight();
  const startIndex = getStartIndex();
  const endIndex = getEndIndex();
  const visibleItems = items.slice(startIndex, endIndex);
  const offsetTop = getOffsetForIndex(startIndex);

  // Loading skeleton
  if (isLoading) {
    const skeletonCount = Math.ceil(containerHeight / itemHeight);
    return (
      <div
        ref={containerRef}
        data-testid="virtual-list-container"
        className={`overflow-auto ${className}`}
        style={{
          height: containerHeight,
          ...(direction === 'horizontal' && {
            overflowX: 'auto',
            overflowY: 'hidden',
          }),
        }}
      >
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            data-testid="skeleton-item"
            className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded mb-2"
            style={{ height: itemHeight }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-testid="virtual-list-container"
      className={`overflow-auto ${className}`}
      style={{
        height: containerHeight,
        ...(direction === 'horizontal' && {
          overflowX: 'auto',
          overflowY: 'hidden',
        }),
      }}
      onScroll={handleScroll}
      tabIndex={0}
    >
      <div
        data-testid="virtual-list-inner"
        style={{
          height: direction === 'vertical' ? totalHeight : undefined,
          width: direction === 'horizontal' ? totalHeight : undefined,
          position: 'relative',
        }}
      >
        <div
          style={{
            transform:
              direction === 'vertical'
                ? `translateY(${offsetTop}px)`
                : `translateX(${offsetTop}px)`,
            willChange: 'transform',
          }}
        >
          {visibleItems.map((item, i) => {
            const actualIndex = startIndex + i;
            return (
              <React.Fragment key={actualIndex}>
                {renderItem(item, actualIndex)}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default VirtualList;
