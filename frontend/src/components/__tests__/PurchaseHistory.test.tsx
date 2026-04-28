import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PurchaseHistory from '../PurchaseHistory';
import { OrderDetail } from '../../services/api';

describe('PurchaseHistory', () => {
  const mockOnUserIdChange = vi.fn();

  const mockPurchase: OrderDetail = {
    orderId: '550e8400-e29b-41d4-a716-446655440000',
    userId: 'user123',
    productId: 'prod_001',
    status: 'completed',
    createdAt: '2026-05-01T12:34:56.789Z',
  };

  beforeEach(() => {
    mockOnUserIdChange.mockClear();
  });

  it('renders check purchase section with input', () => {
    render(
      <PurchaseHistory
        userId=""
        purchase={null}
        loading={false}
        onUserIdChange={mockOnUserIdChange}
      />
    );

    expect(screen.getByLabelText(/Check Purchase Status/i)).toBeDefined();
  });

  it('displays purchase details when purchase exists', () => {
    render(
      <PurchaseHistory
        userId="user123"
        purchase={mockPurchase}
        loading={false}
        onUserIdChange={mockOnUserIdChange}
      />
    );

    expect(screen.getByText('✓ Purchase Found')).toBeDefined();
    expect(screen.getByText(/550e8400/)).toBeDefined(); // Truncated order ID
    expect(screen.getByText('user123')).toBeDefined();
    expect(screen.getByText('prod_001')).toBeDefined();
    expect(screen.getByText('completed')).toBeDefined();
  });

  it('shows loading spinner while checking purchase', () => {
    render(
      <PurchaseHistory
        userId="user123"
        purchase={null}
        loading={true}
        onUserIdChange={mockOnUserIdChange}
      />
    );

    expect(screen.getByText('Checking...')).toBeDefined();
  });

  it('shows "No purchase found" when user has no purchase and not loading', () => {
    render(
      <PurchaseHistory
        userId="nonexistent"
        purchase={null}
        loading={false}
        onUserIdChange={mockOnUserIdChange}
      />
    );

    expect(screen.getByText('No purchase found for this user ID')).toBeDefined();
  });

  it('does not show any message when userId is empty', () => {
    render(
      <PurchaseHistory
        userId=""
        purchase={null}
        loading={false}
        onUserIdChange={mockOnUserIdChange}
      />
    );

    expect(screen.queryByText('No purchase found for this user ID')).toBeNull();
    expect(screen.queryByText('✓ Purchase Found')).toBeNull();
  });

  it('calls onUserIdChange when input value changes', () => {
    render(
      <PurchaseHistory
        userId=""
        purchase={null}
        loading={false}
        onUserIdChange={mockOnUserIdChange}
      />
    );

    const input = screen.getByLabelText(/Check Purchase Status/i);
    fireEvent.change(input, { target: { value: 'newuser' } });

    expect(mockOnUserIdChange).toHaveBeenCalledWith('newuser');
  });

  it('formats order ID with truncation (shows first 12 chars)', () => {
    render(
      <PurchaseHistory
        userId="user123"
        purchase={mockPurchase}
        loading={false}
        onUserIdChange={mockOnUserIdChange}
      />
    );

    // Order ID is truncated to 12 characters + "..."
    expect(screen.getByText(/550e8400-e29/)).toBeDefined();
  });

  it('formats purchase date as locale string', () => {
    render(
      <PurchaseHistory
        userId="user123"
        purchase={mockPurchase}
        loading={false}
        onUserIdChange={mockOnUserIdChange}
      />
    );

    // Check that the date is displayed (locale format varies)
    expect(screen.getByText(/May 1, 2026|05\/01\/2026|2026-05-01/)).toBeDefined();
  });
});
