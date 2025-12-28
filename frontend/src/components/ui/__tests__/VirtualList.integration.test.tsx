/**
 * Integration tests for VirtualList component with real-world scenarios.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import VirtualList from '../VirtualList';

describe('VirtualList Integration Tests', () => {
  // Test 1: Rendering space members list
  it('should render a list of space members efficiently', () => {
    const members = Array.from({ length: 500 }, (_, i) => ({
      id: `member-${i}`,
      name: `Member ${i}`,
      email: `member${i}@example.com`,
      balance: Math.random() * 1000,
    }));

    const renderMember = (member: any) => (
      <div className="p-4 border-b" data-testid={`member-${member.id}`}>
        <h3>{member.name}</h3>
        <p>{member.email}</p>
        <p>${member.balance.toFixed(2)}</p>
      </div>
    );

    render(
      <VirtualList
        items={members}
        itemHeight={80}
        containerHeight={600}
        renderItem={renderMember}
      />
    );

    // Should render container
    const container = screen.getByTestId('virtual-list-container');
    expect(container).toBeInTheDocument();

    // Should not render all 500 items
    const renderedMembers = screen.queryAllByTestId(/member-member-\d+/);
    expect(renderedMembers.length).toBeLessThan(100);
  });

  // Test 2: Rendering transaction history
  it('should render a long transaction history list', () => {
    const transactions = Array.from({ length: 1000 }, (_, i) => ({
      id: `tx-${i}`,
      date: new Date(Date.now() - i * 86400000).toISOString(),
      description: `Transaction ${i}`,
      amount: Math.random() * 500 - 250,
    }));

    const renderTransaction = (tx: any) => (
      <div className="p-3 hover:bg-gray-50" key={tx.id}>
        <div className="flex justify-between">
          <span>{tx.description}</span>
          <span className={tx.amount > 0 ? 'text-green-600' : 'text-red-600'}>
            ${Math.abs(tx.amount).toFixed(2)}
          </span>
        </div>
        <div className="text-sm text-gray-500">{new Date(tx.date).toLocaleDateString()}</div>
      </div>
    );

    render(
      <VirtualList
        items={transactions}
        itemHeight={60}
        containerHeight={500}
        renderItem={renderTransaction}
      />
    );

    const container = screen.getByTestId('virtual-list-container');
    expect(container).toBeInTheDocument();
  });

  // Test 3: Search and filter with virtual scrolling
  it('should work with filtered/searched items', () => {
    const allItems = Array.from({ length: 200 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      category: i % 2 === 0 ? 'even' : 'odd',
    }));

    const filteredItems = allItems.filter((item) => item.category === 'even');

    const renderItem = (item: any) => (
      <div key={item.id} className="p-2">
        {item.name} - {item.category}
      </div>
    );

    render(
      <VirtualList
        items={filteredItems}
        itemHeight={40}
        containerHeight={400}
        renderItem={renderItem}
      />
    );

    const container = screen.getByTestId('virtual-list-container');
    expect(container).toBeInTheDocument();
    // Should have 100 items (half of 200)
    expect(filteredItems.length).toBe(100);
  });

  // Test 4: Infinite scroll pattern
  it('should support infinite scroll pattern with onScroll callback', () => {
    const items = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      text: `Item ${i}`,
    }));

    const loadMore = vi.fn();
    const handleScroll = (scrollTop: number) => {
      const container = screen.getByTestId('virtual-list-container');
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      // If scrolled to bottom 80%, load more
      if (scrollTop + clientHeight >= scrollHeight * 0.8) {
        loadMore();
      }
    };

    const renderItem = (item: any) => (
      <div key={item.id} className="p-4">
        {item.text}
      </div>
    );

    render(
      <VirtualList
        items={items}
        itemHeight={50}
        containerHeight={300}
        renderItem={renderItem}
        onScroll={handleScroll}
      />
    );

    const container = screen.getByTestId('virtual-list-container');

    // Scroll near the bottom
    fireEvent.scroll(container, { target: { scrollTop: 4000 } });

    // Load more should have been called
    expect(loadMore).toHaveBeenCalled();
  });

  // Test 5: Variable height items (like different pledge amounts)
  it('should handle variable height items', () => {
    const pledges = Array.from({ length: 100 }, (_, i) => ({
      id: `pledge-${i}`,
      user: `User ${i}`,
      amount: (i + 1) * 10,
      description: i % 3 === 0 ? 'This is a long description that takes more space' : 'Short',
    }));

    const getItemHeight = (index: number) => {
      return pledges[index].description.length > 10 ? 100 : 60;
    };

    const renderPledge = (pledge: any) => (
      <div className="p-4 border-b">
        <div className="font-semibold">{pledge.user}</div>
        <div className="text-lg">${pledge.amount}</div>
        <div className="text-sm text-gray-600">{pledge.description}</div>
      </div>
    );

    render(
      <VirtualList
        items={pledges}
        itemHeight={60}
        containerHeight={500}
        renderItem={renderPledge}
        getItemHeight={getItemHeight}
      />
    );

    const innerContainer = screen.getByTestId('virtual-list-inner');
    expect(innerContainer).toBeInTheDocument();
    // Total height should account for variable heights
    const expectedHeight = pledges.reduce((sum, _, i) => sum + getItemHeight(i), 0);
    expect(innerContainer).toHaveStyle({ height: `${expectedHeight}px` });
  });

  // Test 6: Keyboard navigation
  it('should support keyboard navigation', () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      text: `Item ${i}`,
    }));

    const renderItem = (item: any) => (
      <div key={item.id} className="p-2 focus:bg-blue-100" tabIndex={0}>
        {item.text}
      </div>
    );

    render(
      <VirtualList
        items={items}
        itemHeight={40}
        containerHeight={300}
        renderItem={renderItem}
      />
    );

    const container = screen.getByTestId('virtual-list-container');
    expect(container).toHaveAttribute('tabIndex', '0');

    // Container should be focusable
    container.focus();
    expect(container).toHaveFocus();

    // Can scroll with arrow keys (browser behavior)
    fireEvent.keyDown(container, { key: 'ArrowDown' });
    fireEvent.keyDown(container, { key: 'ArrowUp' });
  });

  // Test 7: Loading state integration
  it('should show loading skeleton while data is loading', () => {
    const renderItem = (item: any) => <div key={item.id}>{item.name}</div>;

    const { rerender } = render(
      <VirtualList
        items={[]}
        itemHeight={50}
        containerHeight={400}
        renderItem={renderItem}
        isLoading={true}
      />
    );

    // Should show skeleton items
    const skeletons = screen.getAllByTestId('skeleton-item');
    expect(skeletons.length).toBeGreaterThan(0);

    // After loading
    const items = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));

    rerender(
      <VirtualList
        items={items}
        itemHeight={50}
        containerHeight={400}
        renderItem={renderItem}
        isLoading={false}
      />
    );

    // Should show actual items
    expect(screen.queryByTestId('skeleton-item')).not.toBeInTheDocument();
  });

  // Test 8: Responsive height
  it('should adapt to different container heights', () => {
    const items = Array.from({ length: 100 }, (_, i) => ({ id: i, text: `Item ${i}` }));
    const renderItem = (item: any) => <div key={item.id}>{item.text}</div>;

    const { rerender } = render(
      <VirtualList
        items={items}
        itemHeight={50}
        containerHeight={300}
        renderItem={renderItem}
      />
    );

    let container = screen.getByTestId('virtual-list-container');
    expect(container).toHaveStyle({ height: '300px' });

    // Change container height (simulating window resize)
    rerender(
      <VirtualList
        items={items}
        itemHeight={50}
        containerHeight={600}
        renderItem={renderItem}
      />
    );

    container = screen.getByTestId('virtual-list-container');
    expect(container).toHaveStyle({ height: '600px' });
  });
});
