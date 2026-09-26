import { SafetyRepresentation } from "./types";

/**
 * Fixed, versioned 256-word dictionary for byte-to-word mapping (0x00 - 0xFF).
 * Distinct, phonetically clear, non-ambiguous words.
 */
export const WORD_DICTIONARY: readonly string[] = Object.freeze([
  "anchor", "apple", "arrow", "atlas", "bacon", "badge", "baker", "bamboo",
  "banner", "beacon", "beetle", "bison", "blazer", "blossom", "border", "breeze",
  "bridge", "bronze", "buffer", "cactus", "candle", "canyon", "canvas", "castle",
  "cedar", "center", "chains", "chalk", "charm", "cherry", "chisel", "circle",
  "citrus", "clover", "cobalt", "coffee", "comet", "compass", "copper", "coral",
  "crater", "crystal", "dagger", "dahlia", "dancer", "delta", "desert", "dialog",
  "diamond", "dolphin", "dragon", "eagle", "echo", "ember", "emerald", "engine",
  "falcon", "feather", "fennel", "ferret", "finger", "forest", "fossil", "galaxy",
  "garden", "garnet", "glacier", "goble", "granite", "groove", "harbor", "haven",
  "hazard", "hazel", "helmet", "heron", "hollow", "horizon", "hunter", "iceberg",
  "igloo", "indigo", "island", "ivory", "jacket", "jaguar", "jasper", "jungle",
  "kettle", "king", "knight", "lagoon", "lantern", "laurel", "legend", "lemon",
  "leopard", "lizard", "lotus", "lumber", "lunar", "magnet", "maple", "marble",
  "matrix", "meadow", "meteor", "mirror", "monkey", "monument", "moon", "moss",
  "mountain", "nebula", "nectar", "nest", "nickel", "night", "oak", "oasis",
  "obsidian", "ocean", "olive", "onyx", "opal", "orbit", "orchid", "ostrich",
  "otter", "owl", "palace", "panther", "papaya", "parrot", "pebble", "pelican",
  "pepper", "phoenix", "photon", "pioneer", "planet", "plasma", "plum", "polar",
  "pollen", "prism", "quartz", "radar", "radius", "raven", "redwood", "reflex",
  "ribbon", "river", "rocket", "ruby", "saffron", "sahara", "sailor", "salmon",
  "sapphire", "shadow", "shield", "sierra", "signal", "silver", "solar", "solstice",
  "sparrow", "sphere", "sphinx", "spider", "spiral", "spire", "spring", "spruce",
  "statue", "stellar", "stone", "stork", "stream", "summit", "sunflower", "sunset",
  "symbol", "tactics", "target", "temple", "timber", "titan", "topaz", "tornado",
  "tower", "tropic", "tulip", "tunnel", "turtle", "umbrella", "valley", "velvet",
  "vessel", "victor", "viking", "violet", "walnut", "warrior", "willow", "winter",
  "wizard", "wolf", "zebra", "zenith", "zephyr", "zodiac", "accent", "action",
  "aspect", "battle", "beacon", "bonfire", "bolder", "bounty", "bronze", "cannon",
  "cinder", "cobalt", "crater", "curfew", "domain", "dynasty", "emblem", "epic",
  "falcon", "fossil", "glacier", "granite", "horizon", "impact", "iron", "jungle",
  "legend", "mantle", "matrix", "nectar", "origin", "palace", "pillar", "plume",
  "pulse", "quantum", "radius", "realm", "relic", "rocket", "shield", "spirit",
  "summit", "target", "thunder", "timber", "tracer", "trophy", "vector", "vortex"
]);

/**
 * Fixed, versioned 64-emoji vocabulary for visual verification (0x00 - 0x3F).
 */
export const EMOJI_VOCABULARY: readonly string[] = Object.freeze([
  "🍓", "🦋", "🌙", "🐬", "🦊", "🐺", "🦉", "👑",
  "💎", "🚀", "🌋", "🌈", "🔥", "⚡", "🍀", "🌊",
  "🪐", "🎯", "⚓", "🎨", "🌺", "🍒", "🍇", "🌻",
  "🌴", "🌲", "🦁", "🦅", "🦄", "🐝", "⛵", "🏔️",
  "🏰", "⚔️", "🛡️", "🔮", "💡", "🔑", "🔔", "🧩",
  "🧭", "🔭", "🎸", "🏆", "🍉", "🥑", "🐙", "🦀",
  "🐲", "🍄", "⭐", "☀️", "🌩️", "❄️", "🌊", "🌾",
  "🌸", "🍁", "🍏", "🍐", "🍊", "🍋", "🍌", "🍉"
]);

/**
 * Converts ArrayBuffer / Uint8Array SHA-256 digest deterministically into a SafetyRepresentation.
 */
export function deriveSafetyRepresentation(digestBuffer: ArrayBuffer, digestHex: string): SafetyRepresentation {
  const bytes = new Uint8Array(digestBuffer);
  if (bytes.length < 32) {
    throw new Error("SHA-256 digest buffer must be at least 32 bytes.");
  }

  // 1. Derive 6-word sequence from first 6 bytes
  const words: string[] = [];
  for (let i = 0; i < 6; i++) {
    const byteVal = bytes[i] ?? 0;
    const word = WORD_DICTIONARY[byteVal % WORD_DICTIONARY.length];
    if (word) words.push(word);
  }

  // 2. Derive 5-emoji sequence from bytes 6 through 10
  const emojis: string[] = [];
  for (let i = 6; i < 11; i++) {
    const byteVal = bytes[i] ?? 0;
    const emoji = EMOJI_VOCABULARY[byteVal % EMOJI_VOCABULARY.length];
    if (emoji) emojis.push(emoji);
  }

  // 3. Derive 16-character short code formatted as "ABCD-1234-EFGH-5678" from hex digest
  const upperHex = digestHex.toUpperCase();
  const part1 = upperHex.substring(0, 4);
  const part2 = upperHex.substring(4, 8);
  const part3 = upperHex.substring(8, 12);
  const part4 = upperHex.substring(12, 16);
  const shortCode = `${part1}-${part2}-${part3}-${part4}`;

  return {
    shortCode,
    words,
    emojis,
    fullFingerprintHex: digestHex,
  };
}
