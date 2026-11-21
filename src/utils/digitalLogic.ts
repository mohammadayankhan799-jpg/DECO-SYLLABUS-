export type InputBase = 'dec' | 'bin' | 'oct' | 'hex';

export interface BaseConversionResult {
  valid: boolean;
  error?: string;
  decimalValue: number;
  isNegative: boolean;
  binary: string;
  octal: string;
  hexadecimal: string;
  signed8BitPossible: boolean;
  signMagnitude8Bit: string;
  onesComplement8Bit: string;
  twosComplement8Bit: string;
  twosComplementSteps: string[];
  grayCode: string;
  grayCodeSteps: string[];
  ieee754: {
    signBit: string;
    exponentBits: string;
    mantissaBits: string;
    biasedExponent: number;
    unbiasedExponent: number;
    hex: string;
    normalizedForm: string;
    steps: string[];
  };
}

function parseFractionalInBase(raw: string, radix: number): { value: number; isNegative: boolean } | null {
  const cleaned = raw.trim().toUpperCase();
  if (!cleaned) return null;

  const isNegative = cleaned.startsWith('-');
  const unsigned = isNegative || cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
  if (!unsigned) return null;

  const parts = unsigned.split('.');
  if (parts.length > 2) return null;

  const intPartStr = parts[0] || '0';
  const fracPartStr = parts[1] || '';

  const validChars: Record<number, RegExp> = {
    2: /^[01]+$/,
    8: /^[0-7]+$/,
    10: /^[0-9]+$/,
    16: /^[0-9A-F]+$/,
  };

  if (!validChars[radix].test(intPartStr)) return null;
  if (fracPartStr && !validChars[radix].test(fracPartStr)) return null;

  const intVal = parseInt(intPartStr, radix);
  let fracVal = 0;
  for (let i = 0; i < fracPartStr.length; i++) {
    const digit = parseInt(fracPartStr[i], radix);
    fracVal += digit / Math.pow(radix, i + 1);
  }

  const total = intVal + fracVal;
  return {
    value: isNegative && total !== 0 ? -total : total,
    isNegative: isNegative && total !== 0,
  };
}

function formatFractionInBase(frac: number, radix: number, precision = 12): { digits: string; repeating: boolean } {
  if (frac === 0) return { digits: '', repeating: false };
  let f = frac;
  let digits = '';
  for (let i = 0; i < precision; i++) {
    f *= radix;
    const digit = Math.floor(f + 1e-12);
    digits += digit.toString(radix).toUpperCase();
    f -= digit;
    if (Math.abs(f) < 1e-11) {
      return { digits, repeating: false };
    }
  }
  return { digits, repeating: true };
}

function formatMagnitudeInBase(absVal: number, radix: number, precision = 12): string {
  const intPart = Math.floor(absVal + 1e-12);
  const fracPart = Math.max(0, absVal - intPart);
  const intStr = intPart.toString(radix).toUpperCase();
  const fracResult = formatFractionInBase(fracPart, radix, precision);
  if (!fracResult.digits) return intStr;
  return `${intStr}.${fracResult.digits}${fracResult.repeating ? '...' : ''}`;
}

export function convertNumberFormats(rawInput: string, base: InputBase): BaseConversionResult {
  const radixMap: Record<InputBase, number> = {
    dec: 10,
    bin: 2,
    oct: 8,
    hex: 16,
  };
  const parsed = parseFractionalInBase(rawInput, radixMap[base]);
  if (!parsed || !Number.isFinite(parsed.value)) {
    return {
      valid: false,
      error: `Invalid ${base.toUpperCase()} number. Enter digits valid for base ${radixMap[base]} (optional '-' and '.').`,
      decimalValue: 0,
      isNegative: false,
      binary: '0',
      octal: '0',
      hexadecimal: '0',
      signed8BitPossible: true,
      signMagnitude8Bit: '00000000',
      onesComplement8Bit: '00000000',
      twosComplement8Bit: '00000000',
      twosComplementSteps: [],
      grayCode: '0',
      grayCodeSteps: [],
      ieee754: {
        signBit: '0',
        exponentBits: '00000000',
        mantissaBits: '00000000000000000000000',
        biasedExponent: 0,
        unbiasedExponent: -127,
        hex: '0x00000000',
        normalizedForm: '0.0 × 2^0',
        steps: [],
      },
    };
  }

  const val = parsed.value;
  const isNegative = parsed.isNegative;
  const absVal = Math.abs(val);
  const signPrefix = isNegative ? '-' : '';

  const binaryMag = formatMagnitudeInBase(absVal, 2, 12);
  const octalMag = formatMagnitudeInBase(absVal, 8, 8);
  const hexMag = formatMagnitudeInBase(absVal, 16, 8);

  // 8-bit signed integer representations on truncated integer part
  const intSigned = Math.trunc(val);
  const signed8BitPossible = intSigned >= -128 && intSigned <= 127;
  let signMagnitude8Bit = 'Out of 8-bit signed range [-128, 127]';
  let onesComplement8Bit = 'Out of 8-bit signed range [-128, 127]';
  let twosComplement8Bit = 'Out of 8-bit signed range [-128, 127]';
  const twosComplementSteps: string[] = [];

  if (signed8BitPossible) {
    const absInt = Math.abs(intSigned);
    const mag7 = absInt.toString(2).padStart(7, '0');
    const pos8 = absInt.toString(2).padStart(8, '0');
    if (intSigned >= 0) {
      signMagnitude8Bit = `0${mag7}`;
      onesComplement8Bit = pos8;
      twosComplement8Bit = pos8;
      twosComplementSteps.push(`Integer part ${intSigned} ≥ 0, so sign bit = 0.`);
      twosComplementSteps.push(`8-bit binary magnitude: ${pos8}.`);
    } else {
      signMagnitude8Bit = absInt === 128 ? 'N/A (range -127..+127)' : `1${mag7}`;
      const inverted = pos8
        .split('')
        .map((b) => (b === '0' ? '1' : '0'))
        .join('');
      onesComplement8Bit = absInt === 128 ? 'N/A (range -127..+127)' : inverted;
      const twos = ((256 + intSigned) & 0xff).toString(2).padStart(8, '0');
      twosComplement8Bit = twos;
      twosComplementSteps.push(`1. Represent |${intSigned}| = ${absInt} in 8-bit binary: ${pos8}`);
      twosComplementSteps.push(`2. Invert all bits (1's complement): ${inverted}`);
      twosComplementSteps.push(`3. Add 1 to LSB (2's complement): ${twos}`);
    }
  } else {
    twosComplementSteps.push(`Integer part ${intSigned} exceeds 8-bit signed range [-128, +127].`);
  }

  // Gray Code on integer magnitude
  const intAbs = Math.floor(absVal);
  const binInt = intAbs.toString(2);
  let grayCode = binInt[0];
  const grayCodeSteps: string[] = [
    `Integer magnitude = ${intAbs} -> Binary = ${binInt}`,
    `MSB G[${binInt.length - 1}] = B[${binInt.length - 1}] = ${binInt[0]}`,
  ];
  for (let i = 1; i < binInt.length; i++) {
    const prev = Number(binInt[i - 1]);
    const curr = Number(binInt[i]);
    const g = prev ^ curr;
    grayCode += String(g);
    grayCodeSteps.push(`G[${binInt.length - 1 - i}] = B[${binInt.length - i}] XOR B[${binInt.length - 1 - i}] = ${prev} ⊕ ${curr} = ${g}`);
  }

  // 32-bit IEEE 754 Single Precision
  const buf = new ArrayBuffer(4);
  const view = new DataView(buf);
  view.setFloat32(0, val, false);
  const uint32 = view.getUint32(0, false);
  const bits32 = uint32.toString(2).padStart(32, '0');
  const signBit = bits32[0];
  const exponentBits = bits32.slice(1, 9);
  const mantissaBits = bits32.slice(9);
  const biasedExponent = parseInt(exponentBits, 2);
  const unbiasedExponent = biasedExponent === 0 ? -126 : biasedExponent - 127;
  const hex32 = '0x' + uint32.toString(16).toUpperCase().padStart(8, '0');

  const ieeeSteps: string[] = [];
  if (val === 0) {
    ieeeSteps.push('Value is 0 -> All 32 bits are 0 (Sign = 0, Exponent = 00000000, Mantissa = 0...0).');
  } else {
    const exactBinMag = formatMagnitudeInBase(absVal, 2, 26).replace('...', '');
    ieeeSteps.push(`1. Sign bit S = ${signBit} (${isNegative ? 'negative' : 'positive'}).`);
    ieeeSteps.push(`2. Binary magnitude ≈ ${exactBinMag}.`);
    ieeeSteps.push(`3. Normalize to 1.xxxxx × 2^e: e = ${unbiasedExponent}.`);
    ieeeSteps.push(`4. Biased Exponent E = e + 127 = ${unbiasedExponent} + 127 = ${biasedExponent} (${exponentBits}).`);
    ieeeSteps.push(`5. 23-bit fractional Mantissa M (rounded to nearest even) = ${mantissaBits}.`);
  }

  return {
    valid: true,
    decimalValue: Number(val.toPrecision(12)),
    isNegative,
    binary: `${signPrefix}${binaryMag}`,
    octal: `${signPrefix}${octalMag}`,
    hexadecimal: `${signPrefix}${hexMag}`,
    signed8BitPossible,
    signMagnitude8Bit,
    onesComplement8Bit,
    twosComplement8Bit,
    twosComplementSteps,
    grayCode,
    grayCodeSteps,
    ieee754: {
      signBit,
      exponentBits,
      mantissaBits,
      biasedExponent,
      unbiasedExponent,
      hex: hex32,
      normalizedForm: val === 0 ? '0.0 × 2^0' : `${isNegative ? '-' : ''}1.${mantissaBits.slice(0, 8)}... × 2^${unbiasedExponent}`,
      steps: ieeeSteps,
    },
  };
}

export interface HammingResult {
  dataBits: [number, number, number, number]; // [D3, D5, D6, D7]
  parityType: 'even' | 'odd';
  encodedBits: [number, number, number, number, number, number, number]; // pos 1..7: [P1, P2, D3, P4, D5, D6, D7]
  receivedBits: [number, number, number, number, number, number, number];
  flippedPosition: number | null; // 1..7 or null
  syndrome: {
    s1: number;
    s2: number;
    s4: number;
    binary: string;
    errorPosition: number;
  };
  correctedBits: [number, number, number, number, number, number, number];
  recoveredData: string;
  p1CheckBits: string;
  p2CheckBits: string;
  p4CheckBits: string;
}

export function simulateHamming74(
  dataStr: string,
  parityType: 'even' | 'odd' = 'even',
  flipPosition: number | null = null
): HammingResult {
  const clean = dataStr.replace(/[^01]/g, '').padStart(4, '0').slice(0, 4);
  const d3 = Number(clean[0]);
  const d5 = Number(clean[1]);
  const d6 = Number(clean[2]);
  const d7 = Number(clean[3]);

  const targetParity = parityType === 'even' ? 0 : 1;
  const p1 = (d3 ^ d5 ^ d7) ^ targetParity;
  const p2 = (d3 ^ d6 ^ d7) ^ targetParity;
  const p4 = (d5 ^ d6 ^ d7) ^ targetParity;

  const encodedBits: [number, number, number, number, number, number, number] = [p1, p2, d3, p4, d5, d6, d7];
  const receivedBits: [number, number, number, number, number, number, number] = [...encodedBits];

  if (flipPosition !== null && flipPosition >= 1 && flipPosition <= 7) {
    receivedBits[flipPosition - 1] = receivedBits[flipPosition - 1] === 0 ? 1 : 0;
  }

  const [r1, r2, r3, r4, r5, r6, r7] = receivedBits;
  const s1 = (r1 ^ r3 ^ r5 ^ r7) ^ targetParity;
  const s2 = (r2 ^ r3 ^ r6 ^ r7) ^ targetParity;
  const s4 = (r4 ^ r5 ^ r6 ^ r7) ^ targetParity;
  const errorPosition = s4 * 4 + s2 * 2 + s1;

  const correctedBits: [number, number, number, number, number, number, number] = [...receivedBits];
  if (errorPosition >= 1 && errorPosition <= 7) {
    correctedBits[errorPosition - 1] = correctedBits[errorPosition - 1] === 0 ? 1 : 0;
  }

  const recoveredData = `${correctedBits[2]}${correctedBits[4]}${correctedBits[5]}${correctedBits[6]}`;

  return {
    dataBits: [d3, d5, d6, d7],
    parityType,
    encodedBits,
    receivedBits,
    flippedPosition: flipPosition,
    syndrome: {
      s1,
      s2,
      s4,
      binary: `${s4}${s2}${s1}`,
      errorPosition,
    },
    correctedBits,
    recoveredData,
    p1CheckBits: `P1(${r1}) ⊕ D3(${r3}) ⊕ D5(${r5}) ⊕ D7(${r7})`,
    p2CheckBits: `P2(${r2}) ⊕ D3(${r3}) ⊕ D6(${r6}) ⊕ D7(${r7})`,
    p4CheckBits: `P4(${r4}) ⊕ D5(${r5}) ⊕ D6(${r6}) ⊕ D7(${r7})`,
  };
}

export interface BoothStep {
  cycle: number;
  q0qMinus1: string;
  action: string;
  a: string;
  q: string;
  qMinus1: string;
  sc: number;
}

export interface BoothTraceResult {
  valid: boolean;
  error?: string;
  bitWidth: number;
  mBinary: string;
  negMBinary: string;
  qBinary: string;
  steps: BoothStep[];
  productBinary: string;
  productDecimal: number;
}

function toTwosCompBin(num: number, bits: number): string {
  const mask = (1 << bits) - 1;
  return (num & mask).toString(2).padStart(bits, '0');
}

function fromTwosCompBin(bin: string): number {
  const bits = bin.length;
  const unsigned = parseInt(bin, 2);
  const signBit = 1 << (bits - 1);
  if (unsigned & signBit) {
    return unsigned - (1 << bits);
  }
  return unsigned;
}

export function traceBoothMultiplication(
  multiplicand: number,
  multiplier: number,
  requestedBits?: number
): BoothTraceResult {
  if (!Number.isInteger(multiplicand) || !Number.isInteger(multiplier)) {
    return {
      valid: false,
      error: 'Multiplicand and Multiplier must be integers.',
      bitWidth: 4,
      mBinary: '0000',
      negMBinary: '0000',
      qBinary: '0000',
      steps: [],
      productBinary: '00000000',
      productDecimal: 0,
    };
  }

  const maxAbs = Math.max(Math.abs(multiplicand), Math.abs(multiplier));
  let minBits = 4;
  while (
    multiplicand < -(1 << (minBits - 1)) ||
    multiplicand > (1 << (minBits - 1)) - 1 ||
    multiplier < -(1 << (minBits - 1)) ||
    multiplier > (1 << (minBits - 1)) - 1
  ) {
    minBits++;
    if (minBits > 12) {
      return {
        valid: false,
        error: `Input magnitude (${maxAbs}) exceeds 12-bit signed tracer limit.`,
        bitWidth: 12,
        mBinary: '',
        negMBinary: '',
        qBinary: '',
        steps: [],
        productBinary: '',
        productDecimal: 0,
      };
    }
  }

  const n = requestedBits && requestedBits >= minBits && requestedBits <= 12 ? requestedBits : minBits;
  const mask = (1 << n) - 1;
  const mVal = multiplicand & mask;
  const negMVal = (-multiplicand) & mask;

  let A = 0;
  let Q = multiplier & mask;
  let qMinus1 = 0;
  let SC = n;

  const steps: BoothStep[] = [
    {
      cycle: 0,
      q0qMinus1: `${Q & 1}${qMinus1}`,
      action: 'Initial Load (A = 0, Q = Multiplier, Q₋₁ = 0)',
      a: A.toString(2).padStart(n, '0'),
      q: Q.toString(2).padStart(n, '0'),
      qMinus1: String(qMinus1),
      sc: SC,
    },
  ];

  for (let cycle = 1; cycle <= n; cycle++) {
    const q0 = Q & 1;
    const pair = `${q0}${qMinus1}`;
    let opLabel = 'No Add/Sub';

    if (pair === '10') {
      A = (A + negMVal) & mask;
      opLabel = 'A ← A − M';
      steps.push({
        cycle,
        q0qMinus1: pair,
        action: `${opLabel} (Q₀Q₋₁ = 10)`,
        a: A.toString(2).padStart(n, '0'),
        q: Q.toString(2).padStart(n, '0'),
        qMinus1: String(qMinus1),
        sc: SC,
      });
    } else if (pair === '01') {
      A = (A + mVal) & mask;
      opLabel = 'A ← A + M';
      steps.push({
        cycle,
        q0qMinus1: pair,
        action: `${opLabel} (Q₀Q₋₁ = 01)`,
        a: A.toString(2).padStart(n, '0'),
        q: Q.toString(2).padStart(n, '0'),
        qMinus1: String(qMinus1),
        sc: SC,
      });
    }

    // Arithmetic Shift Right (A, Q, qMinus1)
    const aMsb = (A >> (n - 1)) & 1;
    const aLsb = A & 1;
    const newQMinus1 = Q & 1;
    A = ((aMsb << (n - 1)) | (A >> 1)) & mask;
    Q = ((aLsb << (n - 1)) | (Q >> 1)) & mask;
    qMinus1 = newQMinus1;
    SC--;

    steps.push({
      cycle,
      q0qMinus1: pair,
      action: pair === '00' || pair === '11' ? `ASHR (Q₀Q₋₁ = ${pair})` : 'ASHR (Arithmetic Shift Right)',
      a: A.toString(2).padStart(n, '0'),
      q: Q.toString(2).padStart(n, '0'),
      qMinus1: String(qMinus1),
      sc: SC,
    });
  }

  const productBinary = `${A.toString(2).padStart(n, '0')}${Q.toString(2).padStart(n, '0')}`;
  const productDecimal = fromTwosCompBin(productBinary);

  return {
    valid: true,
    bitWidth: n,
    mBinary: toTwosCompBin(multiplicand, n),
    negMBinary: toTwosCompBin(-multiplicand, n),
    qBinary: toTwosCompBin(multiplier, n),
    steps,
    productBinary,
    productDecimal,
  };
}

export interface DivisionStep {
  cycle: number;
  action: string;
  a: string;
  q: string;
  sc: number;
}

export interface RestoringDivisionResult {
  valid: boolean;
  error?: string;
  bitWidth: number;
  dividendBinary: string;
  divisorBinary: string;
  steps: DivisionStep[];
  quotientBinary: string;
  quotientDecimal: number;
  remainderBinary: string;
  remainderDecimal: number;
}

export function traceRestoringDivision(
  dividend: number,
  divisor: number,
  requestedBits?: number
): RestoringDivisionResult {
  if (!Number.isInteger(dividend) || !Number.isInteger(divisor) || dividend < 0 || divisor <= 0) {
    return {
      valid: false,
      error: 'Dividend must be an integer ≥ 0 and Divisor must be an integer > 0.',
      bitWidth: 4,
      dividendBinary: '0000',
      divisorBinary: '0000',
      steps: [],
      quotientBinary: '0000',
      quotientDecimal: 0,
      remainderBinary: '0000',
      remainderDecimal: 0,
    };
  }

  const maxVal = Math.max(dividend, divisor, 1);
  let minBits = Math.max(4, Math.floor(Math.log2(maxVal)) + 1);
  if (minBits > 12) {
    return {
      valid: false,
      error: 'Values exceed 12-bit unsigned tracer limit.',
      bitWidth: 12,
      dividendBinary: '',
      divisorBinary: '',
      steps: [],
      quotientBinary: '',
      quotientDecimal: 0,
      remainderBinary: '',
      remainderDecimal: 0,
    };
  }

  const n = requestedBits && requestedBits >= minBits && requestedBits <= 12 ? requestedBits : minBits;
  const mask = (1 << n) - 1;

  let A = 0; // (n+1) bit signed internally, displayed as n+1 or n bits; using n+1 bit A prevents sign ambiguity when M has MSB=1
  const aBits = n + 1;
  const aMask = (1 << aBits) - 1;
  let Q = dividend & mask;
  const M = divisor;
  let SC = n;

  const fmtA = (val: number) => (val & aMask).toString(2).padStart(aBits, '0');
  const fmtQ = (val: number) => (val & mask).toString(2).padStart(n, '0');

  const steps: DivisionStep[] = [
    {
      cycle: 0,
      action: `Initial Load (A = 0, Q = ${dividend}, M = ${divisor})`,
      a: fmtA(A),
      q: fmtQ(Q),
      sc: SC,
    },
  ];

  for (let cycle = 1; cycle <= n; cycle++) {
    // 1. Shift Left (A, Q)
    const qMsb = (Q >> (n - 1)) & 1;
    A = ((A << 1) | qMsb) & aMask;
    Q = (Q << 1) & mask;
    steps.push({
      cycle,
      action: 'Shift Left (A, Q)',
      a: fmtA(A),
      q: fmtQ(Q),
      sc: SC,
    });

    // 2. A <- A - M
    const signedA = (A & (1 << (aBits - 1))) ? A - (1 << aBits) : A;
    const diff = signedA - M;
    A = diff & aMask;
    steps.push({
      cycle,
      action: `A ← A − M (${signedA} − ${M} = ${diff})`,
      a: fmtA(A),
      q: fmtQ(Q),
      sc: SC,
    });

    // 3. Check sign of A
    if (diff < 0) {
      Q = Q & ~1;
      A = (diff + M) & aMask;
      SC--;
      steps.push({
        cycle,
        action: 'A < 0: Set Q₀ = 0 & Restore A ← A + M',
        a: fmtA(A),
        q: fmtQ(Q),
        sc: SC,
      });
    } else {
      Q = Q | 1;
      SC--;
      steps.push({
        cycle,
        action: 'A ≥ 0: Set Q₀ = 1 (No Restore)',
        a: fmtA(A),
        q: fmtQ(Q),
        sc: SC,
      });
    }
  }

  return {
    valid: true,
    bitWidth: n,
    dividendBinary: fmtQ(dividend),
    divisorBinary: fmtA(M),
    steps,
    quotientBinary: fmtQ(Q),
    quotientDecimal: Q,
    remainderBinary: fmtA(A),
    remainderDecimal: A,
  };
}

export interface CacheCalcInput {
  hitRatio: number; // 0 to 1
  cacheAccessNs: number;
  mainMemoryAccessNs: number;
  mainMemoryBytes: number;
  cacheSizeBytes: number;
  blockSizeBytes: number;
  associativity: number; // 1 = Direct, k > 1 = k-way Set Associative, 0 = Fully Associative
}

export interface CacheCalcResult {
  valid: boolean;
  error?: string;
  avgAccessTimeSimultaneousNs: number;
  avgAccessTimeHierarchicalNs: number;
  speedupSimultaneous: number;
  addressBits: number;
  wordOffsetBits: number;
  setIndexBits: number;
  tagBits: number;
  numBlocksMain: number;
  numLinesCache: number;
  numSets: number;
  mappingLabel: string;
}

export function calculateCacheMetrics(input: CacheCalcInput): CacheCalcResult {
  const {
    hitRatio,
    cacheAccessNs,
    mainMemoryAccessNs,
    mainMemoryBytes,
    cacheSizeBytes,
    blockSizeBytes,
    associativity,
  } = input;

  if (
    hitRatio < 0 ||
    hitRatio > 1 ||
    cacheAccessNs <= 0 ||
    mainMemoryAccessNs <= 0 ||
    mainMemoryBytes < blockSizeBytes ||
    cacheSizeBytes < blockSizeBytes ||
    blockSizeBytes <= 0
  ) {
    return {
      valid: false,
      error: 'Ensure Hit Ratio is in [0, 1], latencies > 0, and Memory ≥ Cache ≥ Block Size.',
      avgAccessTimeSimultaneousNs: 0,
      avgAccessTimeHierarchicalNs: 0,
      speedupSimultaneous: 0,
      addressBits: 0,
      wordOffsetBits: 0,
      setIndexBits: 0,
      tagBits: 0,
      numBlocksMain: 0,
      numLinesCache: 0,
      numSets: 0,
      mappingLabel: 'Invalid',
    };
  }

  const avgSim = hitRatio * cacheAccessNs + (1 - hitRatio) * mainMemoryAccessNs;
  const avgHier = cacheAccessNs + (1 - hitRatio) * mainMemoryAccessNs;
  const speedup = mainMemoryAccessNs / avgSim;

  const addressBits = Math.ceil(Math.log2(mainMemoryBytes));
  const wordOffsetBits = Math.ceil(Math.log2(blockSizeBytes));
  const numLinesCache = Math.floor(cacheSizeBytes / blockSizeBytes);
  const numBlocksMain = Math.floor(mainMemoryBytes / blockSizeBytes);

  let numSets = 1;
  let mappingLabel = 'Fully Associative';
  if (associativity === 1) {
    numSets = numLinesCache;
    mappingLabel = 'Direct Mapped (1-way)';
  } else if (associativity > 1) {
    numSets = Math.max(1, Math.floor(numLinesCache / associativity));
    mappingLabel = `${associativity}-Way Set Associative`;
  }

  const setIndexBits = numSets <= 1 ? 0 : Math.ceil(Math.log2(numSets));
  const tagBits = Math.max(0, addressBits - setIndexBits - wordOffsetBits);

  return {
    valid: true,
    avgAccessTimeSimultaneousNs: Number(avgSim.toFixed(3)),
    avgAccessTimeHierarchicalNs: Number(avgHier.toFixed(3)),
    speedupSimultaneous: Number(speedup.toFixed(2)),
    addressBits,
    wordOffsetBits,
    setIndexBits,
    tagBits,
    numBlocksMain,
    numLinesCache,
    numSets,
    mappingLabel,
  };
}

export interface AddressingModeInput {
  pc: number;
  instructionSize: number;
  adrField: number;
  registerValue: number;
  indexRegister: number;
  baseRegister: number;
  memoryMap: Record<number, number>;
}

export interface AddressingModeRow {
  mode: string;
  formula: string;
  effectiveAddress: string;
  operandValue: string;
  explanation: string;
}

export function calculateEffectiveAddresses(input: AddressingModeInput): AddressingModeRow[] {
  const { pc, instructionSize, adrField, registerValue, indexRegister, baseRegister, memoryMap } = input;
  const lookup = (addr: number): string =>
    Object.prototype.hasOwnProperty.call(memoryMap, addr) ? String(memoryMap[addr]) : `M[${addr}]`;

  const nextPc = pc + instructionSize;
  const relativeEa = nextPc + adrField;
  const indexedEa = adrField + indexRegister;
  const baseEa = baseRegister + adrField;
  const indirectEaRaw = Object.prototype.hasOwnProperty.call(memoryMap, adrField) ? memoryMap[adrField] : null;

  return [
    {
      mode: 'Immediate',
      formula: 'Operand = ADR',
      effectiveAddress: `${pc} (Instruction field)`,
      operandValue: String(adrField),
      explanation: 'Operand is embedded directly inside the instruction address field.',
    },
    {
      mode: 'Direct (Absolute)',
      formula: 'EA = ADR',
      effectiveAddress: String(adrField),
      operandValue: lookup(adrField),
      explanation: 'Instruction field holds the exact memory address of the operand.',
    },
    {
      mode: 'Indirect',
      formula: 'EA = M[ADR]',
      effectiveAddress: indirectEaRaw !== null ? String(indirectEaRaw) : `M[${adrField}]`,
      operandValue: indirectEaRaw !== null ? lookup(indirectEaRaw) : `M[M[${adrField}]]`,
      explanation: 'Memory at ADR holds a pointer to the actual operand address.',
    },
    {
      mode: 'Register Direct',
      formula: 'EA = R1 (No Memory Ref)',
      effectiveAddress: 'Register R1',
      operandValue: String(registerValue),
      explanation: 'Operand resides directly inside CPU register R1.',
    },
    {
      mode: 'Register Indirect',
      formula: 'EA = R1',
      effectiveAddress: String(registerValue),
      operandValue: lookup(registerValue),
      explanation: 'CPU register R1 holds the memory address of the operand.',
    },
    {
      mode: 'PC-Relative',
      formula: `EA = (PC + ${instructionSize}) + ADR`,
      effectiveAddress: String(relativeEa),
      operandValue: lookup(relativeEa),
      explanation: `Updated PC (${nextPc}) added to signed displacement (${adrField}).`,
    },
    {
      mode: 'Indexed',
      formula: 'EA = ADR + XR',
      effectiveAddress: String(indexedEa),
      operandValue: lookup(indexedEa),
      explanation: `Base address (${adrField}) added to Index Register XR (${indexRegister}).`,
    },
    {
      mode: 'Base Register',
      formula: 'EA = BR + ADR',
      effectiveAddress: String(baseEa),
      operandValue: lookup(baseEa),
      explanation: `Base Register BR (${baseRegister}) added to offset (${adrField}).`,
    },
  ];
}
