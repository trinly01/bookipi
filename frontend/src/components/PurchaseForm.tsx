import { useState, FormEvent } from 'react';
import { PurchaseResponse } from '../services/api';

interface Props {
  userId: string;
  onUserIdChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  isActive: boolean;
  saleStatus: 'upcoming' | 'active' | 'ended' | 'sold_out';
  purchaseResult: { userId: string; result: PurchaseResponse; timestamp: Date } | null;
}

export default function PurchaseForm({
  userId,
  onUserIdChange,
  onSubmit,
  isActive,
  saleStatus,
  purchaseResult,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    setIsSubmitting(true);
    try {
      await onSubmit(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = !isActive || isSubmitting;

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="userId">User ID</label>
        <input
          type="text"
          id="userId"
          value={userId}
          onChange={(e) => onUserIdChange(e.target.value)}
          placeholder="Enter your username or email"
          disabled={isDisabled}
          autoComplete="off"
        />
      </div>

      <button
        type="submit"
        className={`button ${isActive ? 'button-primary' : 'button-danger'}`}
        disabled={isDisabled || !userId.trim()}
      >
        {isSubmitting ? (
          <>
            <span className="loading"></span>
            Processing...
          </>
        ) : isActive ? (
          'Buy Now'
        ) : (
          'Sale Not Active'
        )}
      </button>

      {!isActive && (
        <p style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          {saleStatus === 'upcoming' ? 'The sale has not started yet.' : 'The sale has ended or sold out.'}
        </p>
      )}
    </form>
  );
}
