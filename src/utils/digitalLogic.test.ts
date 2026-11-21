import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateCacheMetrics,
  calculateEffectiveAddresses,
  convertNumberFormats,
  simulateHamming74,
  traceBoothMultiplication,
  traceRestoringDivision,
} from './digitalLogic.ts';

test('Base, 2s complement, Gray code, and IEEE 754 conversion for 13.625 and -18', () => {
  const res1 = convertNumberFormats('13.625', 'dec');
  assert.equal(res1.valid, true);
  assert.equal(res1.binary, '1101.101');
  assert.equal(res1.octal, '15.5');
  assert.equal(res1.hexadecimal, 'D.A');
  assert.equal(res1.grayCode, '1011');
  assert.equal(res1.ieee754.signBit, '0');
  assert.equal(res1.ieee754.exponentBits, '10000010');
  assert.equal(res1.ieee754.hex, '0x415A0000');

  const res2 = convertNumberFormats('-18', 'dec');
  assert.equal(res2.valid, true);
  assert.equal(res2.twosComplement8Bit, '11101110');
});

test('Fractional decimal 72.01 conversion works cleanly', () => {
  const res = convertNumberFormats('72.01', 'dec');
  assert.equal(res.valid, true);
  assert.ok(res.binary.startsWith('1001000.'));
  assert.equal(res.grayCode, '1101100');
});

test('Hamming (7,4) encoding and single-bit error correction for 1011', () => {
  const clean = simulateHamming74('1011', 'even', null);
  assert.deepEqual(clean.encodedBits, [0, 1, 1, 0, 0, 1, 1]);
  assert.equal(clean.syndrome.errorPosition, 0);

  const flipped = simulateHamming74('1011', 'even', 5);
  assert.equal(flipped.syndrome.errorPosition, 5);
  assert.equal(flipped.recoveredData, '1011');
  assert.deepEqual(flipped.correctedBits, clean.encodedBits);
});

test('Booth multiplication signed tracer (5 * -3 = -15)', () => {
  const booth = traceBoothMultiplication(5, -3, 4);
  assert.equal(booth.valid, true);
  assert.equal(booth.productDecimal, -15);
  assert.equal(booth.productBinary, '11110001');
});

test('Restoring division unsigned tracer (11 / 3 = Q 3, R 2)', () => {
  const div = traceRestoringDivision(11, 3, 4);
  assert.equal(div.valid, true);
  assert.equal(div.quotientDecimal, 3);
  assert.equal(div.remainderDecimal, 2);
});

test('Cache memory metrics and bit fields calculation', () => {
  const cache = calculateCacheMetrics({
    hitRatio: 0.95,
    cacheAccessNs: 10,
    mainMemoryAccessNs: 100,
    mainMemoryBytes: 64 * 1024 * 1024, // 64 MB -> 26 bits
    cacheSizeBytes: 64 * 1024, // 64 KB -> 1024 lines
    blockSizeBytes: 64, // 6 bits word offset
    associativity: 4, // 256 sets -> 8 bits set index
  });
  assert.equal(cache.valid, true);
  assert.equal(cache.avgAccessTimeSimultaneousNs, 14.5);
  assert.equal(cache.avgAccessTimeHierarchicalNs, 15);
  assert.equal(cache.addressBits, 26);
  assert.equal(cache.wordOffsetBits, 6);
  assert.equal(cache.setIndexBits, 8);
  assert.equal(cache.tagBits, 12);
});

test('Effective address calculation across 8 addressing modes', () => {
  const modes = calculateEffectiveAddresses({
    pc: 200,
    instructionSize: 2,
    adrField: 500,
    registerValue: 400,
    indexRegister: 100,
    baseRegister: 1000,
    memoryMap: { 500: 800, 800: 900, 400: 700, 702: 325, 600: 900, 1500: 444 },
  });
  assert.equal(modes.length, 8);
  assert.equal(modes.find((m) => m.mode === 'PC-Relative')?.effectiveAddress, '702');
  assert.equal(modes.find((m) => m.mode === 'Indirect')?.effectiveAddress, '800');
  assert.equal(modes.find((m) => m.mode === 'Indirect')?.operandValue, '900');
});
