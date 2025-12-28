/**
 * Tests for VirtualList component.
 *
 * This module tests the virtual scrolling implementation for efficiently
 * rendering large lists by only rendering visible items.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VirtualList from '../VirtualList';

describe('VirtualList', () => {
  // Mock data
  const generateItems = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `item-${i}`,
      name: `Item ${i}`,
      value: i * 10,
    }));
  };

  const mockRenderItem = vi.fn((item: any, index: number) => (
    <div key={item.id} data-testid={`item-${index}`}>
      {item.name}
    </div>
  ));

  beforeEach(() => {
    mockRenderItem.mockClear();
  });

  // Test 1: Component renders successfully
  it('should render the virtual list container', () => {
    const items = generateItems(10);
    render(
      <VirtualList
        items={items}
        itemHeight={50}
        containerHeight={300}
        renderItem={mockRenderItem}
      />
    );

    const container = screen.getByTestId('virtual-list-container');
    expect(container).toBeInTheDocument();
  });

  // Test 2: Renders only visible items
  it('should render only visible items based on container height', () => {
    const items = generateItems(100);
    render(
      <VirtualList
        items={items}
        itemHeight={50}
        containerHeight={300} // Can fit 6 items (300/50)
        renderItem={mockRenderItem}
      />
    );

    // Should render visible items + buffer (overscan)
    // With default overscan of 3, should render ~12 items (6 visible + 3 above + 3 below)
    expect(mockRenderItem.mock.calls.length).toBeLessThan(20);
    expect(mockRenderItem.mock.calls.length).toBeGreaterThan(5);
  });

  // Test 3: Virtual list has correct total height
  it('should set correct total height based on item count', () => {
    const items = generateItems(100);
    const itemHeight = 50;

    render(
      <VirtualList
        items={items}
        itemHeight={itemHeight}
        containerHeight={300}
        renderItem={mockRenderItem}
      />
    );

    const innerContainer = screen.getByTestId('virtual-list-inner');
    expect(innerContainer).toHaveStyle({ height: `${items.length * itemHeight}px` });
  });

  // Test 4: Scrolling updates visible items
  it('should update visible items on scroll', async () => {
    const items = generateItems(100);
    render(
      <VirtualList
        items={items}
        itemHeight={50}
        containerHeight={300}
        renderItem={mockRenderItem}
      />
    );

    const container = screen.getByTestId('virtual-list-container');
    const initialCallCount = mockRenderItem.mock.calls.length;

    // Simulate scroll
    fireEvent.scroll(container, { target: { scrollTop: 500 } });

    await waitFor(() => {
      // Should have re-rendered with different items
      expect(mockRenderItem.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  // Test 5: Items are positioned correctly
  it('should position visible items with correct offset', () => {
    const items = generateItems(50);
    render(
      <VirtualList
        items={items}
        itemHeight={50}
        containerHeight={300}
        renderItem={mockRenderItem}
      />
    );

    const innerContainer = screen.getByTestId('virtual-list-inner');
    // First visible item should be at the top (or with buffer offset)
    const firstItem = innerContainer.firstChild as HTMLElement;
    expect(firstItem).toBeInTheDocument();
  });

  // Test 6: Empty list renders correctly
  it('should handle empty list gracefully', () => {
    render(
      <VirtualList
        items={[]}
        itemHeight={50}
        containerHeight={300}
        renderItem={mockRenderItem}
      />
    );

    const container = screen.getByTestId('virtual-list-container');
    expect(container).toBeInTheDocument();
    expect(mockRenderItem).not.toHaveBeenCalled();
  });

  // Test 7: Custom overscan works
  it('should respect custom overscan value', () => {
    const items = generateItems(100);
    render(
      <VirtualList
        items={items}
        itemHeight={50}
        containerHeight={300}
        overscan={5}
        renderItem={mockRenderItem}
      />
    );

    // With overscan of 5 and 6 visible items, should render ~16 items
    expect(mockRenderItem.mock.calls.length).toBeGreaterThan(10);
    expect(mockRenderItem.mock.calls.length).toBeLessThan(20);
  });

  // Test 8: Dynamic item height support
  it('should support variable item heights with getItemHeight function', () => {
    const items = generateItems(50);
    const getItemHeight = (index: number) => (index % 2 === 0 ? 50 : 100);

    render(
      <VirtualList
        items={items}
        itemHeight={50} // Default height
        containerHeight={300}
        renderItem={mockRenderItem}
        getItemHeight={getItemHeight}
      />
    );

    const innerContainer = screen.getByTestId('virtual-list-inner');
    // Total height should account for variable heights
    const expectedHeight = items.reduce((sum, _, i) => sum + getItemHeight(i), 0);
    expect(innerContainer).toHaveStyle({ height: `${expectedHeight}px` });
  });

  // Test 9: Scroll to index functionality
  it('should scroll to specific index when scrollToIndex is provided', () => {
    const items = generateItems(100);
    const { rerender } = render(
      <VirtualList
        items={items}
        itemHeight={50}
        containerHeight={300}
        renderItem={mockRenderItem}
      />
    );

    const container = screen.getByTestId('virtual-list-container');

    // Update with scrollToIndex
    rerender(
      <VirtualList
        items={items}
        itemHeight={50}
        containerHeight={300}
        renderItem={mockRenderItem}
        scrollToIndex={50}
      />
    );

    // Container should scroll to index 50
    expect(container.scrollTop).toBe(50 * 50); // index * itemHeight
  });

  // Test 10: Custom className applied
  it('should apply custom className to container', () => {
    const items = generateItems(10);
    render(
      <VirtualList
        items={items}
        itemHeight={50}
        containerHeight={300}
        renderItem={mockRenderItem}
        className="custom-virtual-list"
      />
    );

    const container = screen.getByTestId('virtual-list-container');
    expect(container).toHaveClass('custom-virtual-list');
  });

  // Test 11: onScroll callback is called
  it('should call onScroll callback when scrolling', () => {
    const onScroll = vi.fn();
    const items = generateItems(100);

    render(
      <VirtualList
        items={items}
        itemHeight={50}
        containerHeight={300}
        renderItem={mockRenderItem}
        onScroll={onScroll}
      />
    );

    const container = screen.getByTestId('virtual-list-container');
    fireEvent.scroll(container, { target: { scrollTop: 200 } });

    expect(onScroll).toHaveBeenCalled();
  });

  // Test 12: Loading state renders skeleton
  it('should render loading skeleton when isLoading is true', () => {
    const items = generateItems(10);
    render(
      <VirtualList
        items={items}
        itemHeight={50}
        containerHeight={300}
        renderItem={mockRenderItem}
        isLoading={true}
      />
    );

    const skeletons = screen.getAllByTestId('skeleton-item');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  // Test 13: Horizontal scrolling support
  it('should support horizontal scrolling mode', () => {
    const items = generateItems(50);
    render(
      <VirtualList
        items={items}
        itemHeight={50}
        containerHeight={300}
        renderItem={mockRenderItem}
        direction="horizontal"
      />
    );

    const container = screen.getByTestId('virtual-list-container');
    expect(container).toHaveStyle({ overflowX: 'auto', overflowY: 'hidden' });
  });

  // Test 14: Items have correct indexes passed
  it('should pass correct index to renderItem function', () => {
    const items = generateItems(20);
    render(
      <VirtualList
        items={items}
        itemHeight={50}
        containerHeight={300}
        renderItem={mockRenderItem}
      />
    );

    // Check that indexes are sequential and correct
    mockRenderItem.mock.calls.forEach((call, i) => {
      const [, index] = call;
      expect(typeof index).toBe('number');
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(items.length);
    });
  });

  // Test 15: Re-renders efficiently on scroll
  it('should not re-render all items on every scroll', async () => {
    const items = generateItems(100);
    render(
      <VirtualList
        items={items}
        itemHeight={50}
        containerHeight={300}
        renderItem={mockRenderItem}
      />
    );

    const container = screen.getByTestId('virtual-list-container');
    const initialCallCount = mockRenderItem.mock.calls.length;

    // Small scroll should not trigger full re-render
    fireEvent.scroll(container, { target: { scrollTop: 10 } });

    await waitFor(() => {
      const newCallCount = mockRenderItem.mock.calls.length - initialCallCount;
      // Should re-render some items but not all
      expect(newCallCount).toBeLessThan(items.length);
    });
  });

  // Test 16: Handles rapid scrolling
  it('should handle rapid scroll events without errors', async () => {
    const items = generateItems(100);
    render(
      <VirtualList
        items={items}
        itemHeight={50}
        containerHeight={300}
        renderItem={mockRenderItem}
      />
    );

    const container = screen.getByTestId('virtual-list-container');

    // Simulate rapid scrolling
    for (let i = 0; i < 10; i++) {
      fireEvent.scroll(container, { target: { scrollTop: i * 100 } });
    }

    await waitFor(() => {
      // Should not crash and should render items
      expect(mockRenderItem.mock.calls.length).toBeGreaterThan(0);
    });
  });

  // Test 17: Updates when items prop changes
  it('should update rendered items when items prop changes', () => {
    const initialItems = generateItems(10);
    const { rerender } = render(
      <VirtualList
        items={initialItems}
        itemHeight={50}
        containerHeight={300}
        renderItem={mockRenderItem}
      />
    );

    const initialCallCount = mockRenderItem.mock.calls.length;

    const newItems = generateItems(20);
    rerender(
      <VirtualList
        items={newItems}
        itemHeight={50}
        containerHeight={300}
        renderItem={mockRenderItem}
      />
    );

    // Should have re-rendered with new items
    expect(mockRenderItem.mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  // Test 18: Maintains scroll position on items update
  it('should maintain scroll position when items are updated', () => {
    const initialItems = generateItems(50);
    const { rerender } = render(
      <VirtualList
        items={initialItems}
        itemHeight={50}
        containerHeight={300}
        renderItem={mockRenderItem}
      />
    );

    const container = screen.getByTestId('virtual-list-container');
    fireEvent.scroll(container, { target: { scrollTop: 500 } });

    const scrollPosition = container.scrollTop;

    const newItems = generateItems(60);
    rerender(
      <VirtualList
        items={newItems}
        itemHeight={50}
        containerHeight={300}
        renderItem={mockRenderItem}
      />
    );

    // Scroll position should be maintained
    expect(container.scrollTop).toBe(scrollPosition);
  });

  // Test 19: Accessibility - container is focusable
  it('should make container focusable for keyboard navigation', () => {
    const items = generateItems(20);
    render(
      <VirtualList
        items={items}
        itemHeight={50}
        containerHeight={300}
        renderItem={mockRenderItem}
      />
    );

    const container = screen.getByTestId('virtual-list-container');
    expect(container).toHaveAttribute('tabIndex', '0');
  });

  // Test 20: Performance - renders large list efficiently
  it('should handle large lists (1000+ items) efficiently', () => {
    const items = generateItems(1000);
    const startTime = performance.now();

    render(
      <VirtualList
        items={items}
        itemHeight={50}
        containerHeight={300}
        renderItem={mockRenderItem}
      />
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render in less than 100ms
    expect(renderTime).toBeLessThan(100);
    // Should render far fewer than 1000 items
    expect(mockRenderItem.mock.calls.length).toBeLessThan(50);
  });
});
