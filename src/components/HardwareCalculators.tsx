import { ArrowRightLeft, Binary, Calculator, Cpu, RotateCcw, ShieldAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  calculateCacheMetrics,
  calculateEffectiveAddresses,
  convertNumberFormats,
  type InputBase,
  simulateHamming74,
  traceBoothMultiplication,
  traceRestoringDivision,
} from '../utils/digitalLogic';

export type CalculatorTab = 'base-ieee' | 'hamming' | 'arithmetic' | 'cache-ea';

interface HardwareCalculatorsProps {
  activeTab: CalculatorTab;
  onSelectTab: (tab: CalculatorTab) => void;
}

export function HardwareCalculators({
  activeTab,
  onSelectTab,
}: HardwareCalculatorsProps) {
  // Tool 1: Base & IEEE 754
  const [numInput, setNumInput] = useState('13.625');
  const [inputBase, setInputBase] = useState<InputBase>('dec');
  const baseResult = useMemo(
    () => convertNumberFormats(numInput, inputBase),
    [numInput, inputBase]
  );

  // Tool 2: Hamming (7,4)
  const [hammingData, setHammingData] = useState('1011');
  const [parityType, setParityType] = useState<'even' | 'odd'>('even');
  const [flippedBitPos, setFlippedBitPos] = useState<number | null>(5);
  const hammingResult = useMemo(
    () => simulateHamming74(hammingData, parityType, flippedBitPos),
    [hammingData, parityType, flippedBitPos]
  );

  // Tool 3: Booth & Restoring Division
  const [arithMode, setArithMode] = useState<'booth' | 'division'>('booth');
  const [boothM, setBoothM] = useState(5);
  const [boothQ, setBoothQ] = useState(-3);
  const [boothBits, setBoothBits] = useState(4);
  const boothTrace = useMemo(
    () => traceBoothMultiplication(boothM, boothQ, boothBits),
    [boothM, boothQ, boothBits]
  );

  const [divDividend, setDivDividend] = useState(11);
  const [divDivisor, setDivDivisor] = useState(3);
  const [divBits, setDivBits] = useState(4);
  const divTrace = useMemo(
    () => traceRestoringDivision(divDividend, divDivisor, divBits),
    [divDividend, divDivisor, divBits]
  );

  // Tool 4: Cache & Effective Address
  const [cacheMode, setCacheMode] = useState<'cache' | 'ea'>('cache');
  const [hitRatio, setHitRatio] = useState(0.95);
  const [tcNs, setTcNs] = useState(10);
  const [tmNs, setTmNs] = useState(100);
  const [mainMemMB, setMainMemMB] = useState(64);
  const [cacheSizeKB, setCacheSizeKB] = useState(64);
  const [blockSizeBytes, setBlockSizeBytes] = useState(64);
  const [associativity, setAssociativity] = useState(4);

  const cacheResult = useMemo(
    () =>
      calculateCacheMetrics({
        hitRatio,
        cacheAccessNs: tcNs,
        mainMemoryAccessNs: tmNs,
        mainMemoryBytes: mainMemMB * 1024 * 1024,
        cacheSizeBytes: cacheSizeKB * 1024,
        blockSizeBytes,
        associativity,
      }),
    [hitRatio, tcNs, tmNs, mainMemMB, cacheSizeKB, blockSizeBytes, associativity]
  );

  const [pcVal, setPcVal] = useState(200);
  const [instrSize, setInstrSize] = useState(2);
  const [adrVal, setAdrVal] = useState(500);
  const [regR1, setRegR1] = useState(400);
  const [xrVal, setXrVal] = useState(100);
  const [brVal, setBrVal] = useState(1000);
  const [mem500, setMem500] = useState(800);
  const [mem800, setMem800] = useState(900);
  const [mem400, setMem400] = useState(700);
  const [mem702, setMem702] = useState(325);
  const [mem600, setMem600] = useState(900);
  const [mem1500, setMem1500] = useState(444);

  const eaRows = useMemo(
    () =>
      calculateEffectiveAddresses({
        pc: pcVal,
        instructionSize: instrSize,
        adrField: adrVal,
        registerValue: regR1,
        indexRegister: xrVal,
        baseRegister: brVal,
        memoryMap: {
          [adrVal]: mem500,
          [mem500]: mem800,
          [regR1]: mem400,
          [pcVal + instrSize + adrVal]: mem702,
          [adrVal + xrVal]: mem600,
          [brVal + adrVal]: mem1500,
        },
      }),
    [pcVal, instrSize, adrVal, regR1, xrVal, brVal, mem500, mem800, mem400, mem702, mem600, mem1500]
  );

  const TABS: Array<{ id: CalculatorTab; label: string; icon: typeof Binary }> = [
    { id: 'base-ieee', label: 'Base, 2’s Comp & IEEE 754', icon: Binary },
    { id: 'hamming', label: 'Hamming (7,4) Simulator', icon: ShieldAlert },
    { id: 'arithmetic', label: 'Booth’s & Restoring Division', icon: Calculator },
    { id: 'cache-ea', label: 'Cache & Effective Address', icon: Cpu },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
            Interactive Digital Logic &amp; CO Hardware Lab
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Built-In Hardware Simulators &amp; Tracers
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Verify assignment and CIE numerical problems step-by-step across number representations,
            Hamming error correction, signed CPU arithmetic, cache bit fields, and addressing modes.
          </p>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Hardware calculator tools"
        className="flex flex-wrap gap-1.5 p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/90"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelectTab(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                active
                  ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TOOL 1: BASE, 2's COMP & IEEE 754 */}
      {activeTab === 'base-ieee' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-5">
                <label
                  htmlFor="conv-input"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Number Input (supports negatives &amp; fractions)
                </label>
                <input
                  id="conv-input"
                  type="text"
                  value={numInput}
                  onChange={(e) => setNumInput(e.target.value)}
                  placeholder="e.g. 13.625, 72.01, -18"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-3">
                <label
                  htmlFor="conv-base"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Input Radix
                </label>
                <select
                  id="conv-base"
                  value={inputBase}
                  onChange={(e) => setInputBase(e.target.value as InputBase)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="dec">Decimal (Base 10)</option>
                  <option value="bin">Binary (Base 2)</option>
                  <option value="oct">Octal (Base 8)</option>
                  <option value="hex">Hexadecimal (Base 16)</option>
                </select>
              </div>

              <div className="md:col-span-4 flex flex-wrap gap-2">
                {[
                  { label: '13.625', base: 'dec' as InputBase },
                  { label: '72.01', base: 'dec' as InputBase },
                  { label: '-18', base: 'dec' as InputBase },
                  { label: '1101.101', base: 'bin' as InputBase },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setInputBase(preset.base);
                      setNumInput(preset.label);
                    }}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {!baseResult.valid ? (
              <p className="text-sm text-rose-600 dark:text-rose-400">{baseResult.error}</p>
            ) : (
              <div className="space-y-6 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-slate-200 dark:border-slate-800 pt-5">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Decimal (Base 10)</div>
                    <div className="font-mono text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-1 break-all">
                      {baseResult.decimalValue}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Binary (Base 2)</div>
                    <div className="font-mono text-base font-semibold tabular-nums text-indigo-600 dark:text-indigo-400 mt-1 break-all">
                      {baseResult.binary}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Octal (Base 8)</div>
                    <div className="font-mono text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-1 break-all">
                      {baseResult.octal}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Hexadecimal (Base 16)</div>
                    <div className="font-mono text-base font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 mt-1 break-all">
                      {baseResult.hexadecimal}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 border-t border-slate-200 dark:border-slate-800 pt-5">
                  <div className="space-y-3">
                    <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                      8-Bit Signed &amp; Gray Code Representations
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                        <div className="text-slate-500 dark:text-slate-400">Sign-Magnitude</div>
                        <div className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-1">
                          {baseResult.signMagnitude8Bit}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                        <div className="text-slate-500 dark:text-slate-400">1’s Complement</div>
                        <div className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-1">
                          {baseResult.onesComplement8Bit}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                        <div className="text-slate-500 dark:text-slate-400">2’s Complement (8-bit)</div>
                        <div className="font-mono text-sm font-semibold tabular-nums text-indigo-600 dark:text-indigo-400 mt-1">
                          {baseResult.twosComplement8Bit}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                        <div className="text-slate-500 dark:text-slate-400">Gray Code (Integer)</div>
                        <div className="font-mono text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
                          {baseResult.grayCode}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-mono text-slate-600 dark:text-slate-400 space-y-1">
                      {baseResult.twosComplementSteps.map((s, idx) => (
                        <div key={idx}>{s}</div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                        IEEE 754 Single-Precision (32-Bit)
                      </h3>
                      <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {baseResult.ieee754.hex}
                      </span>
                    </div>

                    <div className="grid grid-cols-12 gap-1.5 font-mono text-center">
                      <div className="col-span-2 p-2.5 rounded-lg border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/10">
                        <div className="text-[11px] text-rose-700 dark:text-rose-300">Sign (1)</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">
                          {baseResult.ieee754.signBit}
                        </div>
                      </div>
                      <div className="col-span-4 p-2.5 rounded-lg border border-indigo-300 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/10">
                        <div className="text-[11px] text-indigo-700 dark:text-indigo-300">
                          Exp (8 · E={baseResult.ieee754.biasedExponent})
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums truncate">
                          {baseResult.ieee754.exponentBits}
                        </div>
                      </div>
                      <div className="col-span-6 p-2.5 rounded-lg border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10">
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-300">
                          Mantissa (23 bits)
                        </div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums break-all">
                          {baseResult.ieee754.mantissaBits}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs font-mono text-slate-600 dark:text-slate-400 space-y-1">
                      {baseResult.ieee754.steps.map((s, idx) => (
                        <div key={idx}>{s}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOOL 2: HAMMING (7,4) SIMULATOR */}
      {activeTab === 'hamming' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label
                  htmlFor="hamming-data-input"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  4-Bit Data Word (D3 D5 D6 D7)
                </label>
                <input
                  id="hamming-data-input"
                  type="text"
                  maxLength={4}
                  value={hammingData}
                  onChange={(e) => {
                    const filtered = e.target.value.replace(/[^01]/g, '').slice(0, 4);
                    setHammingData(filtered);
                  }}
                  placeholder="1011"
                  className="w-36 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-base tracking-widest text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Parity Mode
                </span>
                <div className="inline-flex p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950">
                  {(['even', 'odd'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setParityType(mode)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                        parityType === mode
                          ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFlippedBitPos(null)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors self-start"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Bit Error</span>
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Click any bit below to inject / toggle a 1-bit transmission error:
              </h3>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                {flippedBitPos ? `Simulated Flip at Bit ${flippedBitPos}` : 'No bit flipped'}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {['P1', 'P2', 'D3', 'P4', 'D5', 'D6', 'D7'].map((label, index) => {
                const pos = index + 1;
                const isParity = pos === 1 || pos === 2 || pos === 4;
                const isFlipped = flippedBitPos === pos;
                const bitVal = hammingResult.receivedBits[index];
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setFlippedBitPos(isFlipped ? null : pos)}
                    className={`p-3 rounded-xl border text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      isFlipped
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300'
                        : isParity
                        ? 'border-indigo-200 dark:border-indigo-500/40 bg-indigo-50/70 dark:bg-indigo-500/10 text-slate-900 dark:text-slate-100'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      Pos {pos} · {label}
                    </div>
                    <div className="font-mono text-xl font-bold tabular-nums mt-1">{bitVal}</div>
                    <div className="text-[11px] mt-1 font-medium">
                      {isFlipped ? 'Flipped' : isParity ? 'Parity' : 'Data'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 border-t border-slate-200 dark:border-slate-800 pt-5">
            <div className="space-y-2.5">
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                Syndrome Calculation (S4 S2 S1)
              </h3>
              <div className="font-mono text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                <div>
                  S1 = {hammingResult.p1CheckBits} ={' '}
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {hammingResult.syndrome.s1}
                  </span>
                </div>
                <div>
                  S2 = {hammingResult.p2CheckBits} ={' '}
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {hammingResult.syndrome.s2}
                  </span>
                </div>
                <div>
                  S4 = {hammingResult.p4CheckBits} ={' '}
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {hammingResult.syndrome.s4}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                Error Detection &amp; SEC Recovery
              </h3>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">3-Bit Syndrome (S4S2S1):</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {hammingResult.syndrome.binary} (Decimal: {hammingResult.syndrome.errorPosition})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Diagnosis:</span>
                  <span
                    className={
                      hammingResult.syndrome.errorPosition === 0
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-amber-600 dark:text-amber-400 font-semibold'
                    }
                  >
                    {hammingResult.syndrome.errorPosition === 0
                      ? 'Valid Word (No Single-Bit Error)'
                      : `Error Corrected at Position ${hammingResult.syndrome.errorPosition}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Corrected 7-bit Codeword:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {hammingResult.correctedBits.join(' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Recovered 4-bit Data:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {hammingResult.recoveredData}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOOL 3: BOOTH'S MULTIPLICATION & RESTORING DIVISION */}
      {activeTab === 'arithmetic' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 sm:p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950">
              <button
                type="button"
                onClick={() => setArithMode('booth')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  arithMode === 'booth'
                    ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Booth’s Signed Multiplication
              </button>
              <button
                type="button"
                onClick={() => setArithMode('division')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  arithMode === 'division'
                    ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Restoring Unsigned Division
              </button>
            </div>
          </div>

          {arithMode === 'booth' ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div>
                  <label
                    htmlFor="booth-m"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Multiplicand (M)
                  </label>
                  <input
                    id="booth-m"
                    type="number"
                    value={boothM}
                    onChange={(e) => setBoothM(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-sm tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="booth-q"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Multiplier (Q)
                  </label>
                  <input
                    id="booth-q"
                    type="number"
                    value={boothQ}
                    onChange={(e) => setBoothQ(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-sm tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="booth-bits"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Register Width
                  </label>
                  <select
                    id="booth-bits"
                    value={boothBits}
                    onChange={(e) => setBoothBits(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={4}>4-bit (−8..+7)</option>
                    <option value={5}>5-bit (−16..+15)</option>
                    <option value={6}>6-bit (−32..+31)</option>
                    <option value={8}>8-bit (−128..+127)</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBoothM(5);
                      setBoothQ(-3);
                      setBoothBits(4);
                    }}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    5 × (−3)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBoothM(-7);
                      setBoothQ(3);
                      setBoothBits(5);
                    }}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    (−7) × 3
                  </button>
                </div>
              </div>

              {!boothTrace.valid ? (
                <p className="text-sm text-rose-600 dark:text-rose-400">{boothTrace.error}</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800 pt-4">
                    <span>M = {boothTrace.mBinary}</span>
                    <span>−M = {boothTrace.negMBinary}</span>
                    <span>Q = {boothTrace.qBinary}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Product AQ = {boothTrace.productBinary} ({boothTrace.productDecimal})
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                    <table className="w-full text-left border-collapse font-mono text-xs tabular-nums">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400">
                          <th className="py-2.5 px-3">Cycle</th>
                          <th className="py-2.5 px-3">Q₀Q₋₁</th>
                          <th className="py-2.5 px-4">Operation</th>
                          <th className="py-2.5 px-3">A</th>
                          <th className="py-2.5 px-3">Q</th>
                          <th className="py-2.5 px-3">Q₋₁</th>
                          <th className="py-2.5 px-3">SC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                        {boothTrace.steps.map((st, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-2 px-3 text-slate-500">{st.cycle}</td>
                            <td className="py-2 px-3 text-indigo-600 dark:text-indigo-400">{st.q0qMinus1}</td>
                            <td className="py-2 px-4 text-slate-800 dark:text-slate-200 font-sans">
                              {st.action}
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100">{st.a}</td>
                            <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100">{st.q}</td>
                            <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{st.qMinus1}</td>
                            <td className="py-2 px-3 text-slate-500">{st.sc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div>
                  <label
                    htmlFor="div-dividend"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Dividend (Q ≥ 0)
                  </label>
                  <input
                    id="div-dividend"
                    type="number"
                    min={0}
                    value={divDividend}
                    onChange={(e) => setDivDividend(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-sm tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="div-divisor"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Divisor (M &gt; 0)
                  </label>
                  <input
                    id="div-divisor"
                    type="number"
                    min={1}
                    value={divDivisor}
                    onChange={(e) => setDivDivisor(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-sm tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="div-bits"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Bit Width
                  </label>
                  <select
                    id="div-bits"
                    value={divBits}
                    onChange={(e) => setDivBits(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={4}>4-bit (0..15)</option>
                    <option value={5}>5-bit (0..31)</option>
                    <option value={6}>6-bit (0..63)</option>
                    <option value={8}>8-bit (0..255)</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDivDividend(11);
                      setDivDivisor(3);
                      setDivBits(4);
                    }}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    11 ÷ 3
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDivDividend(29);
                      setDivDivisor(5);
                      setDivBits(5);
                    }}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    29 ÷ 5
                  </button>
                </div>
              </div>

              {!divTrace.valid ? (
                <p className="text-sm text-rose-600 dark:text-rose-400">{divTrace.error}</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800 pt-4">
                    <span>Dividend Q = {divTrace.dividendBinary}</span>
                    <span>Divisor M = {divTrace.divisorBinary}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Quotient Q = {divTrace.quotientBinary} ({divTrace.quotientDecimal})
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                      Remainder A = {divTrace.remainderBinary} ({divTrace.remainderDecimal})
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                    <table className="w-full text-left border-collapse font-mono text-xs tabular-nums">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400">
                          <th className="py-2.5 px-3">Cycle</th>
                          <th className="py-2.5 px-4">Operation</th>
                          <th className="py-2.5 px-3">A (n+1 bit)</th>
                          <th className="py-2.5 px-3">Q (n bit)</th>
                          <th className="py-2.5 px-3">SC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                        {divTrace.steps.map((st, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-2 px-3 text-slate-500">{st.cycle}</td>
                            <td className="py-2 px-4 text-slate-800 dark:text-slate-200 font-sans">
                              {st.action}
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100">{st.a}</td>
                            <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100">{st.q}</td>
                            <td className="py-2 px-3 text-slate-500">{st.sc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* TOOL 4: CACHE MEMORY & EFFECTIVE ADDRESS */}
      {activeTab === 'cache-ea' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 sm:p-6 space-y-6">
          <div className="inline-flex p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950">
            <button
              type="button"
              onClick={() => setCacheMode('cache')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                cacheMode === 'cache'
                  ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Cache T_avg &amp; Bit Fields
            </button>
            <button
              type="button"
              onClick={() => setCacheMode('ea')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                cacheMode === 'ea'
                  ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>8 Addressing Modes (EA)</span>
            </button>
          </div>

          {cacheMode === 'cache' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    Hit Ratio (h)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={hitRatio}
                    onChange={(e) => setHitRatio(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    Cache t_c (ns)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={tcNs}
                    onChange={(e) => setTcNs(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    Main Mem t_m (ns)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={tmNs}
                    onChange={(e) => setTmNs(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    Main Mem (MB)
                  </label>
                  <select
                    value={mainMemMB}
                    onChange={(e) => setMainMemMB(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-sm"
                  >
                    {[1, 4, 16, 64, 256, 1024].map((v) => (
                      <option key={v} value={v}>
                        {v} MB
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    Cache Size (KB)
                  </label>
                  <select
                    value={cacheSizeKB}
                    onChange={(e) => setCacheSizeKB(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-sm"
                  >
                    {[4, 8, 16, 32, 64, 128, 256].map((v) => (
                      <option key={v} value={v}>
                        {v} KB
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    Block Size (B)
                  </label>
                  <select
                    value={blockSizeBytes}
                    onChange={(e) => setBlockSizeBytes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-sm"
                  >
                    {[16, 32, 64, 128, 256].map((v) => (
                      <option key={v} value={v}>
                        {v} B
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    Mapping
                  </label>
                  <select
                    value={associativity}
                    onChange={(e) => setAssociativity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-sm"
                  >
                    <option value={1}>Direct (1-way)</option>
                    <option value={2}>2-way Set</option>
                    <option value={4}>4-way Set</option>
                    <option value={8}>8-way Set</option>
                    <option value={0}>Fully Assoc</option>
                  </select>
                </div>
              </div>

              {!cacheResult.valid ? (
                <p className="text-sm text-rose-600 dark:text-rose-400">{cacheResult.error}</p>
              ) : (
                <div className="space-y-5 border-t border-slate-200 dark:border-slate-800 pt-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        T_avg (Simultaneous: h·t_c + (1−h)·t_m)
                      </div>
                      <div className="font-mono text-xl font-bold tabular-nums text-indigo-600 dark:text-indigo-400 mt-1">
                        {cacheResult.avgAccessTimeSimultaneousNs} ns
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        T_avg (Hierarchical: t_c + (1−h)·t_m)
                      </div>
                      <div className="font-mono text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100 mt-1">
                        {cacheResult.avgAccessTimeHierarchicalNs} ns
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Memory Speedup (t_m / T_avg)
                      </div>
                      <div className="font-mono text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
                        {cacheResult.speedupSimultaneous}×
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Physical Address Partition ({cacheResult.mappingLabel})
                      </span>
                      <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        Total Address Width = {cacheResult.addressBits} bits · {cacheResult.numLinesCache} lines · {cacheResult.numSets} sets
                      </span>
                    </div>

                    <div className="grid grid-cols-12 gap-2 font-mono text-center">
                      <div className="col-span-5 p-3 rounded-lg border border-indigo-300 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/10">
                        <div className="text-xs text-indigo-700 dark:text-indigo-300">Tag Field</div>
                        <div className="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                          {cacheResult.tagBits} bits
                        </div>
                      </div>
                      <div className="col-span-4 p-3 rounded-lg border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10">
                        <div className="text-xs text-emerald-700 dark:text-emerald-300">
                          Set / Line Index
                        </div>
                        <div className="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                          {cacheResult.setIndexBits} bits
                        </div>
                      </div>
                      <div className="col-span-3 p-3 rounded-lg border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10">
                        <div className="text-xs text-amber-700 dark:text-amber-300">Word Offset</div>
                        <div className="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                          {cacheResult.wordOffsetBits} bits
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: 'PC', val: pcVal, set: setPcVal },
                  { label: 'Instr Size', val: instrSize, set: setInstrSize },
                  { label: 'ADR Field', val: adrVal, set: setAdrVal },
                  { label: 'Reg R1', val: regR1, set: setRegR1 },
                  { label: 'Index XR', val: xrVal, set: setXrVal },
                  { label: 'Base BR', val: brVal, set: setBrVal },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                      {f.label}
                    </label>
                    <input
                      type="number"
                      value={f.val}
                      onChange={(e) => f.set(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-sm tabular-nums"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                {[
                  { label: `M[${adrVal}]`, val: mem500, set: setMem500 },
                  { label: `M[${mem500}]`, val: mem800, set: setMem800 },
                  { label: `M[${regR1}]`, val: mem400, set: setMem400 },
                  { label: `M[${pcVal + instrSize + adrVal}]`, val: mem702, set: setMem702 },
                  { label: `M[${adrVal + xrVal}]`, val: mem600, set: setMem600 },
                  { label: `M[${brVal + adrVal}]`, val: mem1500, set: setMem1500 },
                ].map((m) => (
                  <div key={m.label}>
                    <label className="block font-mono text-slate-500 dark:text-slate-400 mb-1">
                      {m.label}
                    </label>
                    <input
                      type="number"
                      value={m.val}
                      onChange={(e) => m.set(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs tabular-nums"
                    />
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 font-mono text-slate-500 dark:text-slate-400">
                      <th className="py-2.5 px-4">Addressing Mode</th>
                      <th className="py-2.5 px-3">Formula</th>
                      <th className="py-2.5 px-3">Effective Address (EA)</th>
                      <th className="py-2.5 px-3">Operand</th>
                      <th className="py-2.5 px-4">Mechanism</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                    {eaRows.map((row) => (
                      <tr key={row.mode} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {row.mode}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                          {row.formula}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {row.effectiveAddress}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {row.operandValue}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                          {row.explanation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
