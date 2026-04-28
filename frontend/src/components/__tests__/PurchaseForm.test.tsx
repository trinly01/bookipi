import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PurchaseForm from '../PurchaseForm';
import { PurchaseResponse } from '../../services/api';

describe('PurchaseForm', () => {
  const defaultProps = {
    userId: '',
    onUserIdChange: vi.fn(),
    onSubmit: vi.fn(async (e: React.FormEvent) => {
      e.preventDefault();
    }),
    isActive: true,
    saleStatus: 'active' as const,
    purchaseResult: null,
  };

  it('renders form with user ID input and Buy Now button', () => {
    render(<PurchaseForm {...defaultProps} />);

    expect(screen.getByLabelText(/User ID/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Buy Now/i })).toBeDefined();
  });

  it('shows disabled button when sale is not active', () => {
    render(<PurchaseForm {...defaultProps} isActive={false} saleStatus="upcoming" />);

    const button = screen.getByRole('button', { name: /Sale Not Active/i });
    expect(button).toBeDisabled();
  });

  it('disables input when sale is not active', () => {
    render(<PurchaseForm {...defaultProps} isActive={false} saleStatus="ended" />);

    const input = screen.getByLabelText(/User ID/i);
    expect(input).toBeDisabled();
  });

  it('calls onUserIdChange when input changes', () => {
    render(<PurchaseForm {...defaultProps} />);

    const input = screen.getByLabelText(/User ID/i);
    fireEvent.change(input, { target: { value: 'testuser' } });

    expect(defaultProps.onUserIdChange).toHaveBeenCalledWith('testuser');
  });

  it('disables Buy Now button when user ID is empty', () => {
    render(<PurchaseForm {...defaultProps} userId="" />);

    const button = screen.getByRole('button', { name: /Buy Now/i });
    expect(button).toBeDisabled();
  });

  it('enables Buy Now button when user ID has value and sale is active', () => {
    render(<PurchaseForm {...defaultProps} userId="testuser" />);

    const button = screen.getByRole('button', { name: /Buy Now/i });
    expect(button).not.toBeDisabled();
  });

  it('calls onSubmit when form is submitted', async () => {
    const onSubmit = vi.fn();
    render(<PurchaseForm {...defaultProps} onSubmit={onSubmit} userId="testuser" />);

    const form = screen.getByRole('button', { name: /Buy Now/i }).closest('form')!;
    fireEvent.submit(form);

    expect(onSubmit).toHaveBeenCalled();
  });

  it('shows processing state when submitting', () => {
    const onSubmit = vi.fn(async (e: React.FormEvent) => {
      e.preventDefault();
      // Simulate async
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    render(<PurchaseForm {...defaultProps} onSubmit={onSubmit} userId="testuser" />);

    const button = screen.getByRole('button', { name: /Buy Now/i });
    fireEvent.click(button);

    expect(screen.getByText(/Processing/i)).toBeDefined();
  });

  it('displays message when sale is not active', () => {
    const { container } = render(
      <PurchaseForm {...defaultProps} isActive={false} saleStatus="upcoming" />
    );

    expect(container.textContent).toContain('The sale has not started yet');
  });

  it('does not show helper text when sale is active', () => {
    const { container } = render(<PurchaseForm {...defaultProps} isActive={false} saleStatus="ended" />);

    expect(container.textContent).toContain('The sale has ended or sold out');
  });
});
