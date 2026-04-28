```mermaid
graph TB
    subgraph Frontend[React Frontend]
        UI[User Interface]
        Timer[Countdown Timer]
        Stock[Stock Display]
        Button[Buy Now Button]
    end

    subgraph API[API Layer]
        Gateway[Express Server]
        RateLimiter[Rate Limiter]
        Routes[Route Handlers]
    end

    subgraph Service[Business Logic]
        SaleService[FlashSaleService]
        Validator[Request Validator]
        AtomicOp[Lua Atomic Script]
    end

    subgraph Cache[Redis Cluster]
        StockKey[(Stock Counter<br/>DECR)]
        UserFlag[(User Purchase Flag<br/>SET NX)]
        OrderHash[(Order Details<br/>HMSET)]
    end

    UI -->|"1. Click Buy"| Gateway
    Gateway -->|"2. Rate Check"| RateLimiter
    RateLimiter -->|"3. Route"| Routes
    Routes -->|"4. Process"| SaleService
    SaleService -->|"5. Validate"| Validator
    Validator -->|"6. Atomic Operation"| AtomicOp
    AtomicOp -->|"Read/Write"| StockKey
    AtomicOp -->|"SET NX"| UserFlag
    AtomicOp -->|"HMSET"| OrderHash

    SaleService -->|"7. Success/Fail"| Routes
    Routes -->|"8. Response"| Gateway
    Gateway -->|"9. Result"| UI

    style Frontend fill:#e1f5ff
    style API fill:#fff4e1
    style Service fill:#e8f5e9
    style Cache fill:#f3e5f5
```

## Request Flow with Concurrency Control

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API Server
    participant S as Service
    participant R as Redis

    U->>F: Click "Buy Now"
    F->>A: POST /api/purchase {userId}
    A->>S: attemptPurchase(userId)
    S->>R: EXISTS user:key
    R-->>S: 0 (not purchased)

    S->>R: EVAL Lua script (ATOMIC)
    Note over S,R: Check stock > 0<br/>DECR stock<br/>SET user flag
    R-->>S: returns newStock (e.g., 97)

    alt Stock > 0
        S->>R: HSET order:details
        S->>R: EXPIRE keys
        S-->>A: {success:true, orderId}
        A-->>F: 200 OK
        F-->>U: "Purchase Successful!"
    else Stock = 0
        S-->>A: {success:false, "sold out"}
        A-->>F: 400
        F-->>U: "Sold Out"
    end
```

## System Scale & Capacity

```mermaid
graph LR
    subgraph Load[Load Scenario]
        L1[10,000 users<br/>1 second window]
        L2[100,000 requests/sec burst]
    end

    subgraph Redis[Redis Capability]
        R1[1M+ ops/sec]
        R2[<1ms latency]
        R3[Atomic Lua scripts]
    end

    subgraph Node[Node.js Capability]
        N1[Event-driven<br/>non-blocking I/O]
        N2[~50K req/sec single instance]
        N3[Horizontal scaling<br/>via load balancer]
    end

    subgraph Result[System Behavior]
        Res1[Stock never negative]
        Res2[One purchase per user]
        Res3[<100ms response time]
        Res4[99.9% availability]
    end

    Load --> Redis
    Load --> Node
    Redis --> Result
    Node --> Result

    style Load fill:#ffebee
    style Redis fill:#e8f5e9
    style Node fill:#e3f2fd
    style Result fill:#fff3e0
```

## Deployment Architecture (Production)

```mermaid
graph TB
    subgraph Cloud[Cloud Infrastructure]
        LB[Load Balancer<br/>HAProxy/Nginx]
        subgraph API[API Servers - Auto Scaling Group]
            AS1[Node.js Instance]
            AS2[Node.js Instance]
            AS3[Node.js Instance]
        end
        subgraph RedisCluster[Redis Cluster - 3 Masters + 3 Replicas]
            RM1[Master 1]
            RM2[Master 2]
            RM3[Master 3]
            RS1[Replica 1]
            RS2[Replica 2]
            RS3[Replica 3]
        end
        DB[(Persistent DB<br/>PostgreSQL<br/>for orders)]
        Monitor[Monitoring<br/>Prometheus/Grafana]
    end

    LB --> AS1
    LB --> AS2
    LB --> AS3

    AS1 --> RedisCluster
    AS2 --> RedisCluster
    AS3 --> RedisCluster

    AS1 --> DB
    AS2 --> DB
    AS3 --> DB

    RedisCluster --> Monitor
    AS1 --> Monitor

    style Cloud fill:#f0f0f0
    style LB fill:#ffe0b2
    style API fill:#c8e6c9
    style RedisCluster fill:#bbdefb
```

## Failure Scenarios & Mitigation

```mermaid
graph TD
    A[Failure Scenario] --> B1[Redis Down]
    A --> B2[API Crash]
    A --> B3[Network Partition]
    A --> B4[Traffic Spike]

    B1 --> C1[Mitigation: <br/>Redis Sentinel/Cluster<br/>Failover automatic]
    B2 --> C2[Mitigation: <br/>Process manager (PM2)<br/>Auto-restart<br/>Multiple instances]
    B3 --> C3[Mitigation: <br/>Circuit breaker pattern<br/>Graceful degradation]
    B4 --> C4[Mitigation: <br/>Rate limiting<br/>Queue (Redis Streams)<br/>Auto-scaling]

    C1 --> D[✓ Maintains consistency]
    C2 --> D
    C3 --> D
    C4 --> D

    style B1 fill:#ffcdd2
    style B2 fill:#ffcdd2
    style B3 fill:#ffcdd2
    style B4 fill:#ffcdd2
    style C1 fill:#c8e6c9
    style C2 fill:#c8e6c9
    style C3 fill:#c8e6c9
    style C4 fill:#c8e6c9
```
