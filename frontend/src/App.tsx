import { useState, useEffect, useCallback } from 'react';
import { saleAPI, SaleStatus, SaleInfo, OrderDetail, PurchaseResponse } from './services/api';
import SaleStatusCard from './components/SaleStatusCard';
import PurchaseForm from './components/PurchaseForm';
import PurchaseResult from './components/PurchaseResult';
import PurchaseHistory from './components/PurchaseHistory';
import './index.css';

interface PurchaseAttempt {
  userId: string;
  result: PurchaseResponse;
  timestamp: Date;
}

function App() {
  const [saleInfo, setSaleInfo] = useState<SaleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [purchaseResult, setPurchaseResult] = useState<PurchaseAttempt | null>(null);
  const [userPurchase, setUserPurchase] = useState<OrderDetail | null>(null);
  const [checkingPurchase, setCheckingPurchase] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const fetchSaleInfo = useCallback(async () => {
    try {
      const [statusRes, infoRes] = await Promise.all([
        saleAPI.getStatus(),
        saleAPI.getInfo(),
      ]);

      setSaleInfo(infoRes.data);
    } catch (err: any) {
      console.error('Failed to fetch sale info:', err);
      setError('Failed to connect to server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  const checkPurchaseStatus = useCallback(async () => {
    if (!userId.trim()) return;

    setCheckingPurchase(true);
    try {
      const response = await saleAPI.checkPurchase(userId.trim());
      setUserPurchase(response.data);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        console.error('Error checking purchase:', err);
      }
      setUserPurchase(null);
    } finally {
      setCheckingPurchase(false);
    }
  }, [userId]);

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPurchaseResult(null);

    if (!userId.trim()) {
      setError('Please enter your user ID');
      return;
    }

    try {
      const response = await saleAPI.purchase(userId.trim());
      setPurchaseResult({
        userId: userId.trim(),
        result: response.data,
        timestamp: new Date(),
      });

      if (response.data.success) {
        // Refresh sale info to update stock count
        fetchSaleInfo();
        // Check purchase status after successful purchase
        await checkPurchaseStatus();
      }
    } catch (err: any) {
      if (err.response) {
        setPurchaseResult({
          userId: userId.trim(),
          result: {
            success: false,
            message: err.response.data.message || 'Purchase failed',
          },
          timestamp: new Date(),
        });
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    }
  };

  useEffect(() => {
    fetchSaleInfo();

    // Set up polling for sale status (every 5 seconds)
    const interval = setInterval(fetchSaleInfo, 5000);
    return () => clearInterval(interval);
  }, [fetchSaleInfo]);

  useEffect(() => {
    // Auto-check purchase when userId changes
    if (userId.trim()) {
      const timeout = setTimeout(checkPurchaseStatus, 500);
      return () => clearTimeout(timeout);
    } else {
      setUserPurchase(null);
    }
  }, [userId, checkPurchaseStatus]);

  // Calculate countdown timer
  useEffect(() => {
    if (!saleInfo) return;

    const updateCountdown = () => {
      const now = new Date();
      let endTime: Date;

      if (saleInfo.status === 'upcoming') {
        endTime = new Date(saleInfo.startTime);
      } else if (saleInfo.status === 'active') {
        endTime = new Date(saleInfo.endTime);
      } else {
        setTimeRemaining('');
        return;
      }

      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('00:00:00');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [saleInfo]);

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="loading" style={{ width: 40, height: 40, margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem' }}>Loading sale information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <h2 style={{ color: 'var(--danger-color)' }}>Connection Error</h2>
          <p>{error}</p>
          <button className="button button-primary" onClick={fetchSaleInfo} style={{ marginTop: '1rem' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isSaleActive = saleInfo?.status === 'active';
  const isSaleEnded = saleInfo?.status === 'ended' || saleInfo?.status === 'sold_out';

  return (
    <div className="container">
      <header>
        <h1>Flash Sale</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Limited Edition Product</p>
        {saleInfo && saleInfo.status !== 'ended' && (
          <div className="countdown">
            {saleInfo.status === 'upcoming' ? 'Sale starts in: ' : 'Sale ends in: '}
            {timeRemaining}
          </div>
        )}
        {saleInfo?.status === 'sold_out' && (
          <div className="status-badge" style={{ background: 'var(--danger-color)', color: 'white', marginTop: '1rem' }}>
            Sold Out
          </div>
        )}
      </header>

      <SaleStatusCard saleInfo={saleInfo!} />

      <div className="card">
        <h2>Make Your Purchase</h2>
        <PurchaseForm
          userId={userId}
          onUserIdChange={setUserId}
          onSubmit={handlePurchase}
          isActive={isSaleActive}
          saleStatus={saleInfo?.status || 'upcoming'}
          purchaseResult={purchaseResult}
        />
        {purchaseResult && (
          <PurchaseResult result={purchaseResult} />
        )}
        {error && !purchaseResult && (
          <div className="message message-error">{error}</div>
        )}
      </div>

      <div className="card">
        <h2>Check Your Purchase</h2>
        <PurchaseHistory
          userId={userId}
          purchase={userPurchase}
          loading={checkingPurchase}
          onUserIdChange={setUserId}
        />
      </div>

      <footer>
        <p>Flash Sale Platform Demo • Built with React + Node.js + Redis</p>
        <p style={{ marginTop: '0.5rem' }}>Each user can purchase only one item. Sale ends when stock runs out.</p>
      </footer>
    </div>
  );
}

export default App;
