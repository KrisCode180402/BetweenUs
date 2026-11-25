import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPushAuthPayload,
  isValidPushKeys,
  isValidWebPushEndpoint,
  PushApiRateLimiter,
  verifyPushRequestProof,
} from "../../lib/push/push-security";
import {
  buildSignalingCanonicalBytes,
  SupabaseSignalingClient,
  SupabaseSignalingPayload,
} from "../../lib/signaling/supabase-signaling";
import { generateDeviceKeyPair, bufferToHex } from "../../lib/crypto/identity/key-gen";
import { signIdentityData } from "../../lib/crypto/identity/signing";
import { computeSafetyDigest } from "../../lib/safety/canonical";
import { SafetyVerificationManager } from "../../lib/safety/service";
import { VerificationState } from "../../lib/safety/types";
import { removePartnerVerification } from "../../lib/safety/service";

test("Phase 26 — Realtime Signaling, Push SSRF & Dual-Identity HKDF Security Suite", async (t) => {
  await t.test("1. Web Push SSRF validator blocks unsafe, non-HTTPS, and internal endpoints", () => {
    assert.equal(
      isValidWebPushEndpoint("https://fcm.googleapis.com/fcm/send/valid-token-123"),
      true
    );
    assert.equal(
      isValidWebPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/abc"),
      true
    );

    // Block HTTP, localhost, loopback, cloud metadata, and RFC1918 private IPs
    assert.equal(isValidWebPushEndpoint("http://fcm.googleapis.com/fcm/send/123"), false);
    assert.equal(isValidWebPushEndpoint("https://localhost:8080/hook"), false);
    assert.equal(isValidWebPushEndpoint("https://127.0.0.1/admin"), false);
    assert.equal(isValidWebPushEndpoint("https://169.254.169.254/latest/meta-data/"), false);
    assert.equal(isValidWebPushEndpoint("https://10.0.0.5/internal"), false);
    assert.equal(isValidWebPushEndpoint("https://192.168.1.10/router"), false);
    assert.equal(isValidWebPushEndpoint("https://172.20.0.2/service"), false);
    assert.equal(isValidWebPushEndpoint("https://[::1]/loopback"), false);
    assert.equal(isValidWebPushEndpoint("https://user:pass@fcm.googleapis.com/send"), false);

    assert.equal(
      isValidPushKeys({ p256dh: "BOr8validBase64KeyMaterial123456", auth: "validAuthKey123" }),
      true
    );
    assert.equal(isValidPushKeys({ p256dh: "short", auth: "x" }), false);
  });

  await t.test("2. Push API sliding-window rate limiter enforces request thresholds", () => {
    const limiter = new PushApiRateLimiter(3, 60_000);
    assert.equal(limiter.allow("203.0.113.10"), true);
    assert.equal(limiter.allow("203.0.113.10"), true);
    assert.equal(limiter.allow("203.0.113.10"), true);
    assert.equal(limiter.allow("203.0.113.10"), false);
    assert.equal(limiter.allow("203.0.113.99"), true);
  });

  await t.test("3. Push ECDSA P-256 request proof verifies genuine caller and rejects spoofing", async () => {
    const devA = await generateDeviceKeyPair();
    const devAttacker = await generateDeviceKeyPair();
    const timestamp = Date.now();

    const payloadBytes = buildPushAuthPayload("subscribe", devA.fingerprint, timestamp);
    const sigBuf = await signIdentityData(devA.privateKey, payloadBytes);

    const validResult = await verifyPushRequestProof(
      "subscribe",
      devA.fingerprint,
      {
        timestamp,
        spkiHex: devA.spkiHex,
        signatureHex: bufferToHex(sigBuf),
      },
      true
    );
    assert.equal(validResult.valid, true);

    // Reject attacker public key claiming victim's deviceId fingerprint
    const attackerSig = await signIdentityData(devAttacker.privateKey, payloadBytes);
    const spoofedResult = await verifyPushRequestProof(
      "subscribe",
      devA.fingerprint,
      {
        timestamp,
        spkiHex: devAttacker.spkiHex,
        signatureHex: bufferToHex(attackerSig),
      },
      true
    );
    assert.equal(spoofedResult.valid, false);
  });

  await t.test("4. Supabase Realtime ECDSA signaling verifies authentic SDP and blocks MITM tampering", async () => {
    const partner = await generateDeviceKeyPair();
    const attacker = await generateDeviceKeyPair();

    const client = new SupabaseSignalingClient(
      "couple-sec-test",
      "local-device-fp",
      {},
      partner.spkiHex
    );

    const basePayload: SupabaseSignalingPayload = {
      sessionId: "sess-ecdsa-1",
      senderId: partner.fingerprint,
      callType: "video",
      sdp: "v=0\r\no=- 123 2 IN IP4 127.0.0.1\r\n",
      timestamp: Date.now(),
      senderSpkiHex: partner.spkiHex,
    };

    const canonical = buildSignalingCanonicalBytes("sdp_offer", basePayload);
    const sig = await signIdentityData(partner.privateKey, canonical);
    const signedPayload: SupabaseSignalingPayload = {
      ...basePayload,
      signatureHex: bufferToHex(sig),
    };

    assert.equal(await client.verifyAndValidatePayload("sdp_offer", signedPayload), true);

    // Tamper SDP after signing -> must reject
    const tamperedPayload: SupabaseSignalingPayload = {
      ...signedPayload,
      sessionId: "sess-ecdsa-2",
      sdp: "v=0\r\no=attacker 999 2 IN IP4 198.51.100.1\r\n",
    };
    assert.equal(await client.verifyAndValidatePayload("sdp_offer", tamperedPayload), false);

    // Signed by unpinned attacker key -> must reject
    const attackerPayload: SupabaseSignalingPayload = {
      sessionId: "sess-ecdsa-3",
      senderId: attacker.fingerprint,
      callType: "video",
      sdp: "v=0\r\n",
      timestamp: Date.now(),
      senderSpkiHex: attacker.spkiHex,
    };
    const attackerSig = await signIdentityData(
      attacker.privateKey,
      buildSignalingCanonicalBytes("sdp_offer", attackerPayload)
    );
    attackerPayload.signatureHex = bufferToHex(attackerSig);
    assert.equal(await client.verifyAndValidatePayload("sdp_offer", attackerPayload), false);
  });

  await t.test("5. Dual-identity HKDF safety digest is symmetric across both peers and recovers from mismatch", async () => {
    await removePartnerVerification();
    const peerA = await generateDeviceKeyPair();
    const peerB = await generateDeviceKeyPair();

    const digestAB = await computeSafetyDigest(peerB.spkiHex, peerA.spkiHex);
    const digestBA = await computeSafetyDigest(peerA.spkiHex, peerB.spkiHex);
    assert.equal(digestAB.digestHex, digestBA.digestHex);

    // Verify VERIFICATION_FAILED -> confirmVerificationMatch recovery
    const mgr = new SafetyVerificationManager();
    await mgr.initializeSafetySession({
      algorithm: "ECDSA-P256",
      spkiHex: peerB.spkiHex,
      fingerprint: peerB.fingerprint,
      createdAt: peerB.createdAt,
    });
    const failed = await mgr.rejectVerificationMismatch();
    assert.equal(failed.state, VerificationState.VERIFICATION_FAILED);

    const recovered = await mgr.confirmVerificationMatch();
    assert.equal(recovered.state, VerificationState.VERIFIED);
    await removePartnerVerification();
  });
});
