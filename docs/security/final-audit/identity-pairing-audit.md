# Device Identity & Secure Pairing Audit — Between Us

## 1. Device Identity Generation & Storage
- **Algorithm**: ECDSA P-256 (prime256v1) using Web Crypto API.
- **Key Extractability**: `extractable: false` set during key generation.
- **Persistence**: Key pair persisted in local browser storage via standard Web Crypto key store.
- **Identity Invariant**: Re-generation of key pair invalidates prior pairing states, requiring re-pairing with partner devices.

## 2. Secure Pairing Protocol
- **Pairing Code**: 6-digit numeric string / high-entropy challenge generated via `crypto.getRandomValues()`.
- **Entropy**: Pairing code serves as a temporary rendez-vous key; authentication is fortified by ECDSA challenge-response exchange.
- **Expiration**: Pairing requests automatically expire after 600 seconds (10 minutes).
- **Challenge-Response**: Each peer signs a random challenge using their private key to prove key possession before establishing trust.

## 3. Safety Verification Fingerprint
- **Derivation**: Derived by taking `SHA-256(Sort(LocalPublicKey, RemotePublicKey))`.
- **Format**: Displayed as a grouped numeric string for out-of-band verification.
- **Identity Change Handling**: If a partner regenerates their key, the safety fingerprint changes immediately, alerting both users to a trust boundary shift.
