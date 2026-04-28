import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import SaleStatusCard from '../SaleStatusCard';
import { SaleInfo } from '../../services/api';

// Mock the API types
const mockSaleInfo: SaleInfo = {
  status: 'active',
  startTime: '2026-05-01T00:00:00Z',
  endTime: '2026-05-02T00:00:00Z',
  totalStock: 100,
  remainingStock: 47,
  productId: 'prod_001',
  maxPurchasePerUser: 1,
  rules: [
    'Each user can purchase only one item',
    'Purchase is only allowed during the sale period',
    'First come, first served',
  ],
};

describe('SaleStatusCard', () => {
  it('renders sale status correctly when active', () => {
    render(<SaleStatusCard saleInfo={mockSaleInfo} />);

    expect(screen.getByText('Sale Status')).toBeDefined();
    expect(screen.getByText('Live Now')).toBeDefined();
  });

  it('displays upcoming status', () => {
    const upcomingInfo = { ...mockSaleInfo, status: 'upcoming' as const };
    render(<SaleStatusCard saleInfo={upcomingInfo} />);

    expect(screen.getByText('Upcoming')).toBeDefined();
  });

  it('displays sold out status', () => {
    const soldOutInfo = { ...mockSaleInfo, status: 'sold_out' as const, remainingStock: 0 };
    render(<SaleStatusCard saleInfo={soldOutInfo} />);

    expect(screen.getByText('Sold Out')).toBeDefined();
  });

  it('displays ended status', () => {
    const endedInfo = { ...mockSaleInfo, status: 'ended' as const };
    render(<SaleStatusCard saleInfo={endedInfo} />);

    expect(screen.getByText('Ended')).toBeDefined();
  });

  it('shows total stock, remaining stock, product ID, and max per user', () => {
    render(<SaleStatusCard saleInfo={mockSaleInfo} />);

    expect(screen.getByText('100')).toBeDefined(); // totalStock
    expect(screen.getByText('47')).toBeDefined();  // remainingStock
    expect(screen.getByText('prod_001')).toBeDefined(); // productId
    expect(screen.getByText('1')).toBeDefined();  // maxPurchasePerUser
  });

  it('displays start and end times', () => {
    render(<SaleStatusCard saleInfo={mockSaleInfo} />);

    expect(screen.getByText(/Starts:/)).toBeDefined();
    expect(screen.getByText(/Ends:/)).toBeDefined();
  });
});
