/**
 * Between Us — Pure JavaScript SHA-256 Engine
 * Deterministic cross-platform hashing across HTTPS, HTTP, mobile WebViews, and desktop browsers.
 */

export function sha256Pure(ascii: string): string {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = "length";
  let i: number, j: number;
  let result = "";

  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, boolean> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 300; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      primeCounter++;
    }
  }

  let str = ascii + "\x80";
  while (str[lengthProperty] % 64 !== 56) {
    str += "\x00";
  }

  for (i = 0; i < str[lengthProperty]; i++) {
    j = str.charCodeAt(i);
    words[i >> 2] = (words[i >> 2] || 0) | (j << ((3 - (i % 4)) * 8));
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength | 0;

  let currentHash = hash.slice(0);

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = currentHash.slice(0);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15] || 0;
      const w2 = w[i - 2] || 0;

      const a = currentHash[0] || 0;
      const e = currentHash[4] || 0;
      const rightRotate = (v: number, n: number) => (v >>> n) | (v << (32 - n));

      const temp1 =
        ((currentHash[7] || 0) +
          (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
          ((e & (currentHash[5] || 0)) ^ (~e & (currentHash[6] || 0))) +
          (k[i] || 0) +
          (w[i] =
            i < 16
              ? w[i] || 0
              : ((w[i - 16] || 0) +
                  (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                  (w[i - 7] || 0) +
                  (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
                0)) |
        0;

      const temp2 =
        ((rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
          ((a & (currentHash[1] || 0)) ^
            (a & (currentHash[2] || 0)) ^
            ((currentHash[1] || 0) & (currentHash[2] || 0)))) |
        0;

      currentHash = [(temp1 + temp2) | 0].concat(currentHash);
      currentHash[4] = ((currentHash[4] || 0) + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      currentHash[i] = ((currentHash[i] || 0) + (oldHash[i] || 0)) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = ((currentHash[i] || 0) >> (j * 8)) & 255;
      result += (b < 16 ? "0" : "") + b.toString(16);
    }
  }

  return result;
}
