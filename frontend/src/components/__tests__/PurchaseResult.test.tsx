import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PurchaseResult from '../PurchaseResult';
import { PurchaseAttempt } from '../../App';

describe('PurchaseResult', () => {
  const successResult: PurchaseAttempt = {
    userId: 'user123',
    result: {
      success: true,
      message: 'Purchase successful!',
      orderId: '550e8400-e29b-41d4-a716-446655440000',
      purchasedAt: '2026-05-01T12:34:56.789Z',
    },
    timestamp: new Date('2026-05-01T12:34:56.789Z'),
  };

  const failureResult: PurchaseAttempt = {
    userId: 'user456',
    result: {
      success: false,
      message: 'You have already purchased this item',
    },
    timestamp: new Date(),
  };

  it('displays success message with correct styling when purchase succeeds', () => {
    render(<PurchaseResult result={successResult} />);

    expect(screen.getByText('✓ Purchase Successful!')).toBeDefined();
    expect(screen.getByText('Purchase successful!')).toBeDefined();
  });

  it('displays failure message with correct styling when purchase fails', () => {
    render(<PurchaseResult result={failureResult} />);

    expect(screen.getByText('✗ Purchase Failed')).toBeDefined();
    expect(screen.getByText('You have already purchased this item')).toBeDefined();
  });

  it('shows order ID when purchase is successful', () => {
    render(<PurchaseResult result={successResult} />);

    expect(screen.getByText('Order ID')).toBeDefined();
    expect(screen.getByText(/550e8400/)).toBeDefined();
  });

  it('shows purchased timestamp when successful', () => {
    render(<PurchaseResult result={successResult} />);

    expect(screen.getByText('Purchased At')).toBeDefined();
  });

  it('does not show order details when purchase fails', () => {
    render(<PurchaseResult result={failureResult} />);

    expect(screen.queryByText('Order ID')).toBeNull();
    expect(screen.queryByText('Purchased At')).toBeNull();
  });

  it('applies success styling for successful purchase', () => {
    const { container } = render(<PurchaseResult result={successResult} />);

    const messageDiv = container.querySelector('.message-success');
    expect(messageDiv).toBeDefined();
  });

  it('applies error styling for failed purchase', () => {
    const { container } = render(<PurchaseResult result={failureResult} />);

    const messageDiv = container.querySelector('.message-error');
    expect(messageDiv).toBeDefined();
  });
});
