import React, { useEffect, useMemo, useState } from 'react';

const randint = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const abs = (x) => (x < 0n ? -x : x);
const fmt = (x) => x.toString();

function gcd(a, b) {
  let x = abs(a);
  let y = abs(b);
  while (y !== 0n) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x;
}

function gcdList(values) {
  let g = 0n;
  for (const v of values) {
    if (v !== 0n) g = g === 0n ? abs(v) : gcd(g, v);
  }
  return g;
}

function clone(m) {
  return m.map((r) => r.slice());
}

function det(m) {
  const n = m.length;
  if (n === 1) return m[0][0];
  if (n === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
  let s = 0n;
  for (let c = 0; c < n; c++) {
    if (m[0][c] === 0n) continue;
    const minor = m.slice(1).map((row) => row.filter((_, j) => j !== c));
    s += (c % 2 === 0 ? 1n : -1n) * m[0][c] * det(minor);
  }
  return s;
}

function countNonZero(values) {
  return values.reduce((a, v) => a + (v !== 0n ? 1 : 0), 0);
}

function zeroLine(m) {
  const n = m.length;
  for (let r = 0; r < n; r++) if (m[r].every((v) => v === 0n)) return { type: 'row', index: r };
  for (let c = 0; c < n; c++) if (m.every((row) => row[c] === 0n)) return { type: 'col', index: c };
  return null;
}

function removeRowCol(m, rr, cc) {
  return m.filter((_, r) => r !== rr).map((row) => row.filter((_, c) => c !== cc));
}

function signAt(r, c) {
  return (r + c) % 2 === 0 ? 1n : -1n;
}

function randomEntry() {
  const values = [-9, -8, -7, -6, -5, -4, -3, -2, 0, 2, 3, 4, 5, 6, 7, 8, 9];
  return BigInt(values[randint(0, values.length - 1)]);
}

function randomMatrix(n) {
  return Array.from({ length: n }, () => Array.from({ length: n }, randomEntry));
}

function expandable(m) {
  const rows = [];
  const cols = [];
  for (let r = 0; r < m.length; r++) if (countNonZero(m[r]) === 1) rows.push(r + 1);
  for (let c = 0; c < m.length; c++) if (countNonZero(m.map((row) => row[c])) === 1) cols.push(c + 1);
  return { rows, cols };
}

function factorable(m) {
  const rows = [];
  const cols = [];
  for (let r = 0; r < m.length; r++) {
    const g = gcdList(m[r]);
    if (g > 1n) rows.push({ index: r + 1, g });
  }
  for (let c = 0; c < m.length; c++) {
    const g = gcdList(m.map((row) => row[c]));
    if (g > 1n) cols.push({ index: c + 1, g });
  }
  return { rows, cols };
}

function tooTrivial(m) {
  if (zeroLine(m)) return true;
  const e = expandable(m);
  return m.length > 2 && (e.rows.length > 0 || e.cols.length > 0);
}

function makeProblem(n) {
  const wantZero = Math.random() < 0.05;
  for (let i = 0; i < 400; i++) {
    const m = randomMatrix(n);
    if (tooTrivial(m)) continue;
    const d = det(m);
    if (wantZero ? d === 0n : d !== 0n) return m;
  }
  for (let i = 0; i < 100; i++) {
    const m = randomMatrix(n);
    if (!tooTrivial(m)) return m;
  }
  return randomMatrix(n);
}

function newGame(size = 3) {
  const matrix = makeProblem(size);
  return {
    stage: size - 2,
    size,
    coefficient: 1n,
    matrix,
    moves: 0,
    status: 'playing',
    message: '整数の基本変形で0を作りましょう。',
    history: [`${size}次行列式スタート`],
    lastExpansion: null,
    initialDet: det(matrix),
  };
}

function validIntText(s) {
  return /^-?[0-9]+$/.test(String(s));
}

function applyTransform(m, mode, source, k, target) {
  const n = m.length;
  const next = clone(m);
  const i = Number(source) - 1;
  const j = Number(target) - 1;
  const kk = BigInt(k);
  if (mode === 'row') for (let c = 0; c < n; c++) next[j][c] += kk * next[i][c];
  else for (let r = 0; r < n; r++) next[r][j] += kk * next[r][i];
  return next;
}

function checkZero(m, coeff, history) {
  const z = zeroLine(m);
  if (!z) return { matrix: m, coefficient: coeff, history, terminal: false };
  return {
    matrix: m,
    coefficient: 0n,
    history: history.concat(`${z.type === 'row' ? '第' : '第'}${z.index + 1}${z.type === 'row' ? '行' : '列'}が全て0なので、行列式は0です。`),
    terminal: true,
  };
}

function expansionChoice(m, mode, index) {
  const idx = Number(index) - 1;
  if (idx < 0 || idx >= m.length) return null;
  if (mode === 'row') {
    if (countNonZero(m[idx]) !== 1) return null;
    const c = m[idx].findIndex((v) => v !== 0n);
    return { mode, selected: idx, r: idx, c, value: m[idx][c] };
  }
  const col = m.map((row) => row[idx]);
  if (countNonZero(col) !== 1) return null;
  const r = col.findIndex((v) => v !== 0n);
  return { mode, selected: idx, r, c: idx, value: m[r][idx] };
}

function factorChoice(m, mode, index, factorText) {
  if (!validIntText(factorText)) return null;
  const f = BigInt(factorText);
  const idx = Number(index) - 1;
  if (idx < 0 || idx >= m.length || f === 0n || f === 1n) return null;
  if (mode === 'row') {
    if (!m[idx].every((v) => v % f === 0n)) return null;
  } else {
    if (!m.every((row) => row[idx] % f === 0n)) return null;
  }
  return { mode, index: idx, factor: f };
}

function MatrixDet({ matrix, coefficient, visualExpansion, selectMode, activeSlot, onPick }) {
  const display = visualExpansion?.before ?? matrix;
  const n = display.length;
  const showSigns = Boolean(visualExpansion);
  const isScalar = n === 1 && display[0]?.length === 1;

  if (isScalar) {
    return (
      <div className="det-wrap scalar-wrap">
        {coefficient !== 1n && <div className="coef">{fmt(coefficient)}<span>×</span></div>}
        <div className="scalar-value">{fmt(display[0][0])}</div>
      </div>
    );
  }

  function pick(r, c) {
    const value = selectMode === 'row' ? r + 1 : c + 1;
    onPick(value);
  }

  return (
    <div className="det-wrap">
      {coefficient !== 1n && <div className="coef">{fmt(coefficient)}<span>×</span></div>}
      <div className="matrix-block">
        <div className="col-heads" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
          {Array.from({ length: n }, (_, c) => <button key={c} onClick={() => selectMode === 'col' && onPick(c + 1)}>{c + 1}</button>)}
        </div>
        <div className="body-line">
          <div className="row-heads">
            {Array.from({ length: n }, (_, r) => <button key={r} onClick={() => selectMode === 'row' && onPick(r + 1)}>{r + 1}</button>)}
          </div>
          <div className="det-bars">
            <div className="cells" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
              {display.map((row, r) => row.map((v, c) => {
                const blast = visualExpansion && (r === visualExpansion.r || c === visualExpansion.c);
                const pivot = visualExpansion && r === visualExpansion.r && c === visualExpansion.c;
                return (
                  <button key={`${r}-${c}`} className={`cell ${blast ? 'blast' : ''} ${pivot ? 'pivot' : ''}`} onClick={() => pick(r, c)}>
                    {showSigns && <small>{(r + c) % 2 === 0 ? '+' : '-'}</small>}
                    <span>{fmt(v)}</span>
                    {blast && <b>{pivot ? '💣' : '🔥'}</b>}
                  </button>
                );
              }))}
            </div>
          </div>
        </div>
        <p className="hint">{selectMode === 'row' ? '成分を押すと行番号を入力' : '成分を押すと列番号を入力'}</p>
      </div>
    </div>
  );
}

export default function App() {
  const [game, setGame] = useState(() => newGame(3));
  const [undo, setUndo] = useState([]);
  const [visualExpansion, setVisualExpansion] = useState(null);

  const [transformMode, setTransformMode] = useState('row');
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [k, setK] = useState('');
  const [activeSlot, setActiveSlot] = useState('source');

  const [expandMode, setExpandMode] = useState('row');
  const [expandIndex, setExpandIndex] = useState('');

  const [factorMode, setFactorMode] = useState('row');
  const [factorIndex, setFactorIndex] = useState('');
  const [factorValue, setFactorValue] = useState('');

  const n = game.matrix.length;
  const exp = useMemo(() => expandable(game.matrix), [game.matrix]);
  const fac = useMemo(() => factorable(game.matrix), [game.matrix]);
  const canTransform = game.status === 'playing' && validIntText(source) && validIntText(target) && validIntText(k) && Number(source) >= 1 && Number(source) <= n && Number(target) >= 1 && Number(target) <= n && source !== target && BigInt(k) !== 0n;
  const canExpand = game.status === 'playing' && expansionChoice(game.matrix, expandMode, expandIndex);
  const canFactor = game.status === 'playing' && factorChoice(game.matrix, factorMode, factorIndex, factorValue);
  const finalValue = game.matrix.length === 1 ? game.coefficient * game.matrix[0][0] : game.coefficient === 0n ? 0n : null;

  useEffect(() => {
    if (!game.lastExpansion) { setVisualExpansion(null); return; }
    setVisualExpansion(game.lastExpansion);
    const t = setTimeout(() => setVisualExpansion(null), 1300);
    return () => clearTimeout(t);
  }, [game.lastExpansion, game.history.length]);

  function snapshot() {
    return { ...game, matrix: clone(game.matrix), history: game.history.slice(), lastExpansion: null };
  }

  function setAfter(next) {
    const terminal = next.matrix.length === 1 || next.terminal;
    const e = expandable(next.matrix);
    const f = factorable(next.matrix);
    const msg = terminal ? '行列式が求まりました。'
      : e.rows.length || e.cols.length ? '展開できる行または列があります。'
      : f.rows.length || f.cols.length ? 'くくれる行または列があります。'
      : next.message || '次の操作を考えましょう。';
    setGame({ ...game, matrix: next.matrix, coefficient: next.coefficient, history: next.history, status: terminal ? 'stageClear' : 'playing', message: msg, lastExpansion: next.lastExpansion ?? null, moves: next.moves ?? game.moves });
  }

  function runTransform() {
    if (!canTransform) return;
    setUndo((s) => s.concat(snapshot()));
    const nextM = applyTransform(game.matrix, transformMode, source, k, target);
    const label = transformMode === 'row' ? '行' : '列';
    const hist = game.history.concat(`第${source}${label}の${k}倍を第${target}${label}に加えました。`);
    const checked = checkZero(nextM, game.coefficient, hist);
    setAfter({ ...checked, moves: game.moves + 1 });
    setSource('');
    setK('');
    setTarget('');
    setActiveSlot('source');
  }

  function runFactor() {
    const choice = factorChoice(game.matrix, factorMode, factorIndex, factorValue);
    if (!choice) { setGame({ ...game, message: '指定した行または列は、その整数でくくれません。' }); return; }
    setUndo((s) => s.concat(snapshot()));
    const nextM = clone(game.matrix);
    if (choice.mode === 'row') nextM[choice.index] = nextM[choice.index].map((v) => v / choice.factor);
    else for (let r = 0; r < nextM.length; r++) nextM[r][choice.index] /= choice.factor;
    const label = choice.mode === 'row' ? '行' : '列';
    const hist = game.history.concat(`第${choice.index + 1}${label}を${fmt(choice.factor)}でくくりました。`);
    const checked = checkZero(nextM, game.coefficient * choice.factor, hist);
    setAfter({ ...checked, message: `第${choice.index + 1}${label}を${fmt(choice.factor)}でくくりました。` });
    setFactorIndex('');
    setFactorValue('');
    setActiveSlot('source');
  }

  function runExpand() {
    const choice = expansionChoice(game.matrix, expandMode, expandIndex);
    if (!choice) { setGame({ ...game, message: '0でない成分が1つだけの行または列を指定してください。' }); return; }
    setUndo((s) => s.concat(snapshot()));
    const sgn = signAt(choice.r, choice.c);
    const nextCoeff = game.coefficient * sgn * choice.value;
    const nextM = removeRowCol(game.matrix, choice.r, choice.c);
    const label = choice.mode === 'row' ? '行' : '列';
    const visual = { ...choice, before: clone(game.matrix), sign: Number(sgn) };
    const hist = game.history.concat(`第${choice.selected + 1}${label}で展開しました。a${choice.r + 1}${choice.c + 1}=${fmt(choice.value)}, 符号${sgn === 1n ? '+' : '-'}, 係数=${fmt(nextCoeff)}`);
    const checked = checkZero(nextM, nextCoeff, hist);
    setAfter({ ...checked, lastExpansion: visual, message: `第${choice.selected + 1}${label}で展開しました。` });
    setExpandIndex('');
    setActiveSlot('source');
  }

  function undoOne() {
    setUndo((s) => {
      if (!s.length) return s;
      setGame(s[s.length - 1]);
      setVisualExpansion(null);
      return s.slice(0, -1);
    });
  }

  function nextStage() {
    if (game.size >= 5) setGame({ ...game, status: 'gameClear', message: '全クリアです。' });
    else setGame(newGame(game.size + 1));
    setUndo([]);
    setActiveSlot('source');
  }

  function debugCycleSize() {
    const nextSize = game.size >= 8 ? 3 : game.size + 1;
    setGame(newGame(nextSize));
    setUndo([]);
    setActiveSlot('source');
  }

  function pick(v) {
    const value = String(v);
    if (activeSlot === 'source') setSource(value);
    if (activeSlot === 'target') setTarget(value);
    if (activeSlot === 'expand') setExpandIndex(value);
    if (activeSlot === 'factor') setFactorIndex(value);
  }

  function enter(e, action, enabled) {
    if (e.key === 'Enter' && enabled) { e.preventDefault(); action(); }
  }

  function selectAllOnFocus(e) {
    e.target.select();
  }

  const lineLabel = transformMode === 'row' ? '行' : '列';
  
  return (
    <div className="app">
      <header>
        <div><h1>行列式基本変形ゲーム</h1><p>3次→4次→5次。整数だけで基本変形します。</p></div>
        <div className="stats">
          <span>Stage {game.stage}/3</span>
          <span className="debug-size" role="button" tabIndex={0} title="デバッグ: クリックで次数変更" onClick={debugCycleSize} onKeyDown={(e) => e.key === 'Enter' && debugCycleSize()}>{n}次</span>
          <span>{game.moves}手</span>
        </div>
      </header>

      <main>
        <section className="board">
          <div className="message">{game.message}</div>
          <MatrixDet
            matrix={game.matrix}
            coefficient={game.coefficient}
            visualExpansion={visualExpansion}
            selectMode={activeSlot === 'expand' ? expandMode : activeSlot === 'factor' ? factorMode : transformMode}
            activeSlot={activeSlot}
            onPick={pick}
          />
          {game.status === 'stageClear' && <div className="clear"><b>ステージクリア</b><span>答え: {fmt(finalValue ?? 0n)}</span><button onClick={nextStage}>{game.size >= 5 ? 'ゲームクリアへ' : '次へ'}</button></div>}
          {game.status === 'gameClear' && <div className="clear"><b>全クリア！</b><button onClick={() => setGame(newGame(3))}>もう一度</button></div>}
        </section>

        <aside className="panel">
          <section className="card">
            <div className="tabs"><button className={transformMode === 'row' ? 'on' : ''} onClick={() => setTransformMode('row')}>行</button><button className={transformMode === 'col' ? 'on' : ''} onClick={() => setTransformMode('col')}>列</button></div>
            <div className="sentence" onKeyDown={(e) => enter(e, runTransform, canTransform)}>
              <input value={source} onFocus={(e) => { setActiveSlot('source'); selectAllOnFocus(e); }} onChange={(e) => setSource(e.target.value)} />
              <span>{lineLabel}の</span>
              <input value={k} onFocus={(e) => { setActiveSlot('k'); selectAllOnFocus(e); }} onChange={(e) => setK(e.target.value)} />
              <span>倍を</span>
              <input value={target} onFocus={(e) => { setActiveSlot('target'); selectAllOnFocus(e); }} onChange={(e) => setTarget(e.target.value)} />
              <span>{lineLabel}に加える</span>
            </div>
            <div className="formula">第{target || 'j'}{lineLabel}目 ← 第{target || 'j'}{lineLabel}目 {String(k).startsWith('-') ? '-' : '+'} {String(k).startsWith('-') ? String(k).slice(1) : k || 'k'}×第{source || 'i'}{lineLabel}目</div>
            <div className="buttons"><button disabled={!canTransform} onClick={runTransform}>基本変形</button><button disabled={!undo.length} onClick={undoOne}>やり直し</button></div>
          </section>

          <section className={`card green ${factorMode === 'row' ? 'mode-row' : 'mode-col'}`}>
            <h2>整数でくくる</h2>
            <div className="tabs"><button className={factorMode === 'row' ? 'on' : ''} onClick={() => setFactorMode('row')}>行</button><button className={factorMode === 'col' ? 'on' : ''} onClick={() => setFactorMode('col')}>列</button></div>
            <p className="mode-note">現在: {factorMode === 'row' ? '行でくくる' : '列でくくる'}</p>
            <div className="sentence" onKeyDown={(e) => enter(e, runFactor, canFactor)}><span>第</span><input value={factorIndex} onFocus={(e) => { setActiveSlot('factor'); selectAllOnFocus(e); }} onChange={(e) => setFactorIndex(e.target.value)} /><span>{factorMode === 'row' ? '行' : '列'}を</span><input value={factorValue} onFocus={selectAllOnFocus} onChange={(e) => setFactorValue(e.target.value)} /><span>でくくる</span></div>
            <p>候補: 行 {fac.rows.length ? fac.rows.map(x => `${x.index}(${fmt(x.g)})`).join(', ') : 'なし'} ／ 列 {fac.cols.length ? fac.cols.map(x => `${x.index}(${fmt(x.g)})`).join(', ') : 'なし'}</p>
            <button disabled={!canFactor} onClick={runFactor}>係数に出す</button>
          </section>

          <section className={`card amber ${expandMode === 'row' ? 'mode-row' : 'mode-col'}`}>
            <h2>展開</h2>
            <div className="tabs"><button className={expandMode === 'row' ? 'on' : ''} onClick={() => setExpandMode('row')}>行</button><button className={expandMode === 'col' ? 'on' : ''} onClick={() => setExpandMode('col')}>列</button></div>
            <p className="mode-note">現在: {expandMode === 'row' ? '行で展開' : '列で展開'}</p>
            <div className="sentence" onKeyDown={(e) => enter(e, runExpand, canExpand)}><span>第</span><input value={expandIndex} onFocus={(e) => { setActiveSlot('expand'); selectAllOnFocus(e); }} onChange={(e) => setExpandIndex(e.target.value)} /><span>{expandMode === 'row' ? '行' : '列'}で展開する</span></div>
            <p>展開可能: 行 {exp.rows.join(', ') || 'なし'} ／ 列 {exp.cols.join(', ') || 'なし'}</p>
            <button disabled={!canExpand} onClick={runExpand}>展開する</button>
          </section>

          <section className="history"><h2>履歴</h2>{game.history.slice().reverse().slice(0, 8).map((h, i) => <div key={i}>{h}</div>)}</section>
        </aside>
      </main>
    </div>
  );
}
