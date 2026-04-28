# Flash Sale Platform - System Architecture

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│────│  API Gateway    │────│   Rate Limiter  │
│   (Vite + TS)   │    │   (Express)     │    │  (In-Memory/   │
│                 │    │                 │    │   Redis)        │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                     │                      │
         │    ┌────────────────▼──────────────────────┐
         │    │         Flash Sale Service            │
         │    │   (Business Logic + Redis Atomic Ops) │
         │    └────────────────┬──────────────────────┘
         │                     │
         │    ┌────────────────▼─────────────────────┐
         │    │           Redis Cache                │
         │    │  • Inventory Counter (Atomic DECR)  │
         │    │  • User Purchase Flags (SET NX)     │
         │    │  • TTL Management                   │
         │    └────────────────┬─────────────────────┘
         │                     │
         └─────────────────────┼─────────────────────┘
                               │
                    ┌──────────▼─────────┐
                    │  Persistence Layer │
                    │  (Optional - for   │
                    │   audit/analytics) │
                    └────────────────────┘
```

## Component Details

### 1. Frontend (React + TypeScript + Vite)
- **Purpose**: User interface for flash sale interaction
- **Key Features**:
  - Real-time sale countdown timer
  - Live stock updates via polling/websockets
  - One-click purchase with instant feedback
  - Purchase status checking
- **Build**: Vite for fast development and optimized production builds

### 2. API Server (Express.js + TypeScript)
- **Purpose**: HTTP endpoint handling and business logic orchestration
- **Endpoints**:
  - `GET /api/sale/status` - Current sale status, stock levels
  - `GET /api/sale/info` - Sale details, rules, timing
  - `POST /api/sale/purchase` - Attempt purchase with user ID
  - `GET /api/sale/purchase/:userId` - Check purchase status
- **Middleware**:
  - Helmet (security headers)
  - CORS (cross-origin resource sharing)
  - Rate limiting (prevent abuse)
  - Error handling

### 3. Flash Sale Service (Core Business Logic)
- **Purpose**: Atomic transaction handling for inventory and user purchases
- **Key Methods**:
  - `getSaleStatus()` - Determine current sale phase
  - `attemptPurchase(userId)` - Atomic purchase operation using Lua script
  - `checkUserPurchase(userId)` - Verify user purchase status
- **Concurrency Control**: 
  - Uses Redis Lua scripts for atomic operations
  - Prevents race conditions and overselling
  - Ensures "one per user" rule

### 4. Redis (Distributed Cache)
- **Purpose**: Fast, atomic operations for critical counters
- **Data Structures**:
  - String key: `flashsale:stock:{productId}` - Inventory counter (DECR atomic)
  - String key: `flashsale:purchase:{userId}` - User purchase flag (SET NX)
  - Hash key: `flashsale:order:{orderId}` - Order details
- **TTL**: All keys expire after sale ends to auto-cleanup
- **Atomicity**: Lua scripts guarantee atomic multi-key operations

## Data Flow

### Successful Purchase Flow:
1. User clicks "Buy Now" → Frontend sends POST `/api/sale/purchase` with `userId`
2. API validates request and passes to FlashSaleService
3. Service checks: Sale active? User already purchased? (Redis EXISTS)
4. **Atomic Lua script execution**:
   - Check stock > 0
   - DECR stock counter
   - SET user purchase flag
   - Return remaining stock
5. If successful: Generate order ID, store order details, set TTLs
6. Return success response to user
7. Frontend displays success message with order ID

### Failed Purchase Flow:
- Validation errors (sale not active, already purchased, invalid input) return immediately
- Stock depletion detected during atomic operation returns "sold out"

## Why This Design?

### Redis for Concurrency Control
- **Atomic Operations**: Redis single-threaded model ensures atomicity
- **Lua Scripts**: Multi-key operations execute atomically without race conditions
- **Performance**: In-memory operations at ~1M ops/sec, more than enough for flash sale traffic
- **Simple Scale-out**: Redis Cluster can distribute load if needed

### Node.js + Express
- **Event-driven**: Non-blocking I/O handles high concurrency well
- **Lightweight**: Minimal overhead allows more resources for business logic
- **Mature Ecosystem**: Extensive middleware and tooling
- **TypeScript**: Type safety and better development experience

### Lua Scripts for Atomicity
```lua
-- Ensures: check-stock-and-reserve happens as single operation
-- Prevents: overselling between check and reserve steps
-- Guarantees: exactly-once semantics per user per item
```

### Rate Limiting (In-Memory)
- Simple implementation for demo
- Production would use Redis + sliding window algorithm
- Prevents abuse and DDoS

## Trade-offs & Assumptions

### Assumptions:
1. Single product flash sale (simplified scope)
2. Single Redis instance (not clustered)
3. In-memory rate limiting (production: Redis-based)
4. Synchronous purchase flow (no async message queues)
5. No payment gateway integration (conceptual only)

### Trade-offs:
1. **No persistent database**: All data is volatile (Redis only)
   - **Rationale**: Focus on concurrency control, not persistence
   - **Production**: Add PostgreSQL for audit trail and analytics

2. **In-memory rate limiting**: Not distributed
   - **Rationale**: Simplicity for demo
   - **Production**: Use Redis with consistent hashing

3. **No WebSocket for real-time updates**: Polling-based frontend
   - **Rationale**: Keep frontend simple
   - **Production**: Add WebSockets or Server-Sent Events

4. **No payment processing**: Purchase = order creation only
   - **Rationale**: Payment ≠ inventory reservation
   - **Production**: Decouple order creation from payment

5. **Single service monolith**: All logic in one service
   - **Rationale**: Simple for demo
   - **Production**: Microservices (Inventory, Order, User services)

## Scalability Path

### Vertical Scaling
- Increase Redis memory and CPU
- Increase Node.js server resources
- Connect to managed Redis (AWS ElastiCache, Redis Cloud)

### Horizontal Scaling
- Multiple API servers behind load balancer
- Redis Cluster for sharded data
- Stateless API design (all state in Redis)
- Use consistent hashing for rate limiting distributed state

### Performance Optimizations
1. **Connection pooling**: Reuse Redis connections
2. **Pipeline requests**: Batch Redis operations
3. **Compression**: Gzip responses
4. **CDN**: Cache static assets
5. **Edge Caching**: CloudFlare or similar for API response caching

## Expected Load Capacity

With current implementation (single Redis, single Node instance):
- **Throughput**: ~10,000 - 50,000 requests/sec (Redis 1M ops/sec, Node adds overhead)
- **Latency**: <10ms for Redis ops, <50ms API response
- **Concurrent Users**: 100K+ sustained with proper connection pooling

For flash sale of 100 items with 10,000 users:
- Spike duration: 1-5 seconds of intense traffic
- System handles: 95%+ requests served quickly (success or sold-out)
- No overselling guaranteed by atomic operations

## Security Considerations

1. **Input Validation**: Joi schemas for request validation
2. **SQL/NoSQL Injection**: Not applicable (Redis key construction safe)
3. **Rate Limiting**: Prevent brute-force and abuse
4. **Helmet.js**: Security headers
5. **CORS**: Controlled cross-origin access

## Monitoring & Observability (Production)

In a production system, you would add:
- Structured logging (Winston/Pino)
- Metrics collection (Prometheus)
- Distributed tracing (OpenTelemetry)
- Health checks with detailed status
- Redis memory and command monitoring
- Alerting on anomalies
