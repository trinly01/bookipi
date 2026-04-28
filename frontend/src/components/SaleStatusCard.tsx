import { SaleInfo } from '../services/api';

interface Props {
  saleInfo: SaleInfo;
}

export default function SaleStatusCard({ saleInfo }: Props) {
  const getStatusLabel = () => {
    switch (saleInfo.status) {
      case 'upcoming':
        return 'Upcoming';
      case 'active':
        return 'Live Now';
      case 'sold_out':
        return 'Sold Out';
      case 'ended':
        return 'Ended';
      default:
        return 'Unknown';
    }
  };

  const getStatusClass = () => {
    switch (saleInfo.status) {
      case 'active':
        return 'status-active';
      case 'upcoming':
        return 'status-upcoming';
      default:
        return 'status-ended';
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Sale Status</h2>
        <span className={`status-badge ${getStatusClass()}`}>
          {getStatusLabel()}
        </span>
      </div>

      <div className="stats">
        <div className="stat-item">
          <div className="stat-label">Total Stock</div>
          <div className="stat-value highlight">{saleInfo.totalStock}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Remaining</div>
          <div className={`stat-value ${saleInfo.remainingStock <= 0 ? 'danger' : 'highlight'}`}>
            {saleInfo.remainingStock}
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Product ID</div>
          <div className="stat-value">{saleInfo.productId}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Max Per User</div>
          <div className="stat-value">{saleInfo.maxPurchasePerUser}</div>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        <div>Starts: {new Date(saleInfo.startTime).toLocaleString()}</div>
        <div>Ends: {new Date(saleInfo.endTime).toLocaleString()}</div>
      </div>
    </div>
  );
}
