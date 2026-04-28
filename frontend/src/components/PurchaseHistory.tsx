import { OrderDetail } from '../services/api';

interface Props {
  userId: string;
  purchase: OrderDetail | null;
  loading: boolean;
  onUserIdChange: (value: string) => void;
}

export default function PurchaseHistory({ userId, purchase, loading, onUserIdChange }: Props) {
  return (
    <div>
      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label htmlFor="checkUserId">Check Purchase Status</label>
        <input
          type="text"
          id="checkUserId"
          value={userId}
          onChange={(e) => onUserIdChange(e.target.value)}
          placeholder="Enter user ID to check purchase"
          style={{ marginBottom: '0' }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading"></div>
          <p style={{ marginTop: '0.5rem' }}>Checking...</p>
        </div>
      ) : purchase ? (
        <div className="check-result">
          <h3>✓ Purchase Found</h3>
          <div className="order-detail">
            <span className="order-label">Order ID</span>
            <span className="order-value" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
              {purchase.orderId.slice(0, 12)}...
            </span>
          </div>
          <div className="order-detail">
            <span className="order-label">User ID</span>
            <span className="order-value">{purchase.userId}</span>
          </div>
          <div className="order-detail">
            <span className="order-label">Product</span>
            <span className="order-value">{purchase.productId}</span>
          </div>
          <div className="order-detail">
            <span className="order-label">Status</span>
            <span className="order-value" style={{ color: 'var(--primary-color)' }}>
              {purchase.status}
            </span>
          </div>
          <div className="order-detail">
            <span className="order-label">Purchased At</span>
            <span className="order-value">
              {new Date(purchase.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
      ) : userId ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          No purchase found for this user ID
        </div>
      ) : null}
    </div>
  );
}
