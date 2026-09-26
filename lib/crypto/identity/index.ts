export * from "./types";
export {
  initializeDeviceIdentity,
  getPublicIdentity,
  getIdentityFingerprint,
  getLifecycleState,
  signDataWithIdentity,
  destroyDeviceIdentity,
} from "./service";
export { verifyIdentitySignature } from "./signing";
