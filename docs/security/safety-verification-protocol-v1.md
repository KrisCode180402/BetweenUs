# Safety Verification Protocol Specification V1 (`BETWEEN_US_SAFETY_FINGERPRINT_V1`)

## Protocol Overview
The **Between Us Safety Verification Protocol V1** defines the deterministic canonical encoding, SHA-256 digest computation, human-readable word/emoji mapping, and identity pinning rules for verifying partner device identities.

---

## 1. Canonical Payload & Domain Separation

### Domain Separator
`BETWEEN_US_SAFETY_FINGERPRINT_V1`

### Canonical Payload Input String
```
BETWEEN_US_SAFETY_FINGERPRINT_V1:ECDSA-P256:<spkiHex>
```
where `<spkiHex>` is the lowercase hex-encoded SubjectPublicKeyInfo of the partner's ECDSA P-256 public key.

---

## 2. Cryptographic Hash & Representation Mapping

### Hash Primitive
W3C Web Crypto API `subtle.digest("SHA-256", payload)` producing a 32-byte (256-bit) digest.

### Mappings
1. **Short Code (16 chars)**: Uppercase hex format `ABCD-1234-EFGH-5678` derived from bytes 0..7.
2. **6-Word Sequence**: Derived from bytes 0..5 indexed into the 256-entry `WORD_DICTIONARY`.
3. **5-Emoji Sequence**: Derived from bytes 6..10 indexed into the 64-entry `EMOJI_VOCABULARY`.
4. **Full Fingerprint Hex**: Complete 64-char lowercase/uppercase hex string of SHA-256 digest.

---

## 3. Identity Pinning & Substitution Protocol

1. **Initial Pairing**: Device enters `PAIRED_UNVERIFIED`.
2. **User Manual Review**: User reviews out-of-band representation on both devices.
3. **User Confirmation (`MATCH`)**: Pinned fingerprint set to `partnerPublicIdentity.fingerprint`. State becomes `VERIFIED`.
4. **Key Change Detection**: On any session load, if `currentPartnerIdentity.fingerprint !== pinnedFingerprint`, state immediately transitions to `IDENTITY_CHANGED`.
