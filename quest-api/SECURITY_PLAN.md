# Security Implementation Plan

## Current Security Issues

### 🔴 Critical
1. **No Wallet Verification** - Anyone can check/redeem points for any wallet
2. **No Rate Limiting** - API can be spammed
3. **Open CORS** - Any origin can call the API
4. **No API Authentication** - No way to verify requests are from your frontend

### 🟡 Important
5. **No Request Validation** - Malformed requests not properly validated
6. **Error Messages Leak Info** - Stack traces exposed in production
7. **No Logging/Monitoring** - Can't detect abuse

## Recommended Security Architecture

### Phase 1: Wallet Ownership Verification (CRITICAL)

**Problem:** Users can check/redeem points for wallets they don't own.

**Solution:** Implement EIP-712 signature verification

```typescript
// Frontend signs a message
const message = {
  wallet: userWalletAddress,
  timestamp: Date.now(),
  action: 'check_progress'
};

const signature = await wallet.signTypedData(domain, types, message);

// Send to backend
fetch('/api/quests/progress/0x...', {
  headers: {
    'X-Wallet-Signature': signature,
    'X-Wallet-Timestamp': timestamp
  }
});
```

**Backend verifies:**
```typescript
import { verifyTypedData } from 'ethers';

function verifyWalletOwnership(walletAddress, signature, timestamp) {
  // Check timestamp is recent (< 5 minutes)
  if (Date.now() - timestamp > 5 * 60 * 1000) {
    throw new Error('Signature expired');
  }

  // Verify signature
  const recovered = verifyTypedData(domain, types, message, signature);
  if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
    throw new Error('Invalid signature');
  }
}
```

**Implementation:**
- Add `ethers` package to quest-api
- Create middleware to verify all wallet-specific requests
- Add signature to frontend API calls

### Phase 2: API Key Authentication

**Problem:** Anyone can call your API.

**Solution:** API key verification

```typescript
// Backend middleware
function verifyApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const validKeys = process.env.API_KEYS?.split(',') || [];

  if (!validKeys.includes(apiKey)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

app.use('/api', verifyApiKey);
```

**Frontend:**
```typescript
fetch('/api/quests', {
  headers: {
    'X-API-Key': import.meta.env.PUBLIC_QUEST_API_KEY
  }
});
```

**Implementation:**
- Generate secure API keys (use `openssl rand -hex 32`)
- Store in environment variables
- Rotate keys periodically

### Phase 3: Rate Limiting

**Problem:** API can be spammed, wasting resources and GraphQL credits.

**Solution:** Implement express-rate-limit

```typescript
import rateLimit from 'express-rate-limit';

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later'
});

// Strict limit for refresh endpoint (costs GraphQL credits)
const refreshLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 refreshes per minute per IP
  message: 'Too many refresh requests, please wait'
});

app.use('/api', apiLimiter);
app.post('/api/quests/refresh/:walletAddress', refreshLimiter, ...);
```

**Implementation:**
- Install `express-rate-limit`
- Apply different limits to different endpoints
- Consider wallet-based limiting (not just IP)

### Phase 4: CORS Configuration

**Problem:** Any website can call your API.

**Solution:** Restrict CORS to your domains

```typescript
import cors from 'cors';

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://yourdomain.com',
      'https://www.yourdomain.com'
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
```

### Phase 5: Request Validation

**Problem:** Malformed requests can cause errors or exploits.

**Solution:** Use validation library

```typescript
import { z } from 'zod';

const redeemPointsSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  projectId: z.string().min(1).max(50),
  amount: z.number().int().positive().max(1000000),
  reason: z.string().max(200)
});

app.post('/api/points/redeem', (req, res) => {
  try {
    const data = redeemPointsSchema.parse(req.body);
    // Proceed with validated data
  } catch (error) {
    return res.status(400).json({ error: 'Invalid request data' });
  }
});
```

## Implementation Priority

### Week 1: Critical Security
1. **Wallet Signature Verification**
   - Prevents unauthorized access to wallet data
   - Most important security measure

2. **API Key Authentication**
   - Prevents random people from hitting your API
   - Easy to implement

3. **Rate Limiting**
   - Prevents abuse and saves GraphQL credits
   - Protects against DoS

### Week 2: Additional Security
4. **CORS Restrictions**
   - Prevents other websites from using your API
   - Simple configuration change

5. **Request Validation**
   - Prevents malformed requests
   - Improves stability

6. **Error Handling**
   - Don't leak stack traces in production
   - Add proper logging

## Estimated Effort

| Task | Time | Difficulty |
|------|------|------------|
| Wallet Signature Verification | 4-6 hours | Medium |
| API Key Authentication | 1 hour | Easy |
| Rate Limiting | 2 hours | Easy |
| CORS Configuration | 30 min | Easy |
| Request Validation | 3-4 hours | Medium |
| Error Handling | 2 hours | Easy |

**Total: ~13-16 hours**

## Testing Security

After implementation, test:

```bash
# 1. Try accessing API without API key
curl http://localhost:3001/api/quests?projectId=rtb
# Should return 401

# 2. Try with wrong API key
curl -H "X-API-Key: wrong-key" http://localhost:3001/api/quests?projectId=rtb
# Should return 401

# 3. Try accessing another wallet's data without signature
curl http://localhost:3001/api/quests/progress/0xOTHER_WALLET?projectId=rtb
# Should return 401

# 4. Spam refresh endpoint
for i in {1..20}; do curl -X POST http://localhost:3001/api/quests/refresh/0x...?projectId=rtb; done
# Should get rate limited after 5 requests

# 5. Try from wrong origin (use browser console on different domain)
fetch('http://localhost:3001/api/quests?projectId=rtb')
# Should fail with CORS error
```

## Production Checklist

Before deploying to production:

- [ ] Wallet signature verification enabled
- [ ] API keys rotated and secure
- [ ] Rate limiting configured
- [ ] CORS restricted to production domains
- [ ] Request validation on all endpoints
- [ ] Error messages don't leak info
- [ ] Logging configured (consider Sentry, LogRocket, etc.)
- [ ] Environment variables secured
- [ ] HTTPS enforced
- [ ] Supabase RLS policies reviewed
- [ ] Database backups configured

## Advanced Security (Future)

### JWT Tokens
Replace API keys with JWT tokens for better session management:
- Short-lived access tokens
- Refresh tokens for re-authentication
- Per-user rate limiting

### Webhook Verification
If you add webhooks for external integrations:
- Verify webhook signatures
- Replay attack prevention

### DDoS Protection
For production at scale:
- Cloudflare or similar CDN
- Advanced rate limiting per wallet/IP
- Request queue management

## Questions to Consider

1. **Should users be able to check other wallets' progress?**
   - If yes: Make it read-only, no signature required
   - If no: Require signature for all progress checks

2. **Should there be a cost to redeem points?**
   - Prevents spam redemptions
   - Could require small transaction fee

3. **Should progress refresh be manual or automatic?**
   - Manual: User clicks button (current)
   - Automatic: Cron job checks periodically (costs more)

4. **How to handle compromised API keys?**
   - Key rotation process
   - Multiple keys for different environments
   - Monitoring for suspicious usage
