import { PurchaseAttempt } from '../App';

interface Props {
  result: PurchaseAttempt;
}

export default function PurchaseResult({ result }: Props) {
  const { result: purchaseResult, userId, timestamp } = result;

  return (
    <div className={`message ${purchaseResult.success ? 'message-success' : 'message-error'}`}>
      <strong>
        {purchaseResult.success ? '✓ Purchase Successful!' : '✗ Purchase Failed'}
      </strong>
      <p style={{ marginTop: '0.5rem' }}>
        {purchaseResult.message}
      </p>
      {purchaseResult.success && purchaseResult.orderId && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,255,136,0.1)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Order ID</div>
          <div style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {purchaseResult.orderId}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Purchased At</div>
          <div>{new Date(timestamp).toLocaleTimeString()}</div>
        </div>
      )}
    </div>
  );
}
