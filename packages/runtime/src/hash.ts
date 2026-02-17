// MurmurHash3 32-bit -- deterministic, pure JS
export function murmurhash3(key: string, seed: number = 0): number {
  let h = seed >>> 0;
  const len = key.length;
  let i = 0;

  while (i + 4 <= len) {
    let k =
      (key.charCodeAt(i) & 0xff) |
      ((key.charCodeAt(i + 1) & 0xff) << 8) |
      ((key.charCodeAt(i + 2) & 0xff) << 16) |
      ((key.charCodeAt(i + 3) & 0xff) << 24);

    k = Math.imul(k, 0xcc9e2d51);
    k = (k << 15) | (k >>> 17);
    k = Math.imul(k, 0x1b873593);

    h ^= k;
    h = (h << 13) | (h >>> 19);
    h = Math.imul(h, 5) + 0xe6546b64;
    i += 4;
  }

  let k = 0;
  switch (len - i) {
    case 3: k ^= (key.charCodeAt(i + 2) & 0xff) << 16; // fallthrough
    case 2: k ^= (key.charCodeAt(i + 1) & 0xff) << 8;  // fallthrough
    case 1:
      k ^= key.charCodeAt(i) & 0xff;
      k = Math.imul(k, 0xcc9e2d51);
      k = (k << 15) | (k >>> 17);
      k = Math.imul(k, 0x1b873593);
      h ^= k;
  }

  h ^= len;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;

  return h >>> 0;
}
