<section className={`card green ${factorMode === 'row' ? 'mode-row' : 'mode-col'}`}>
  <h2>整数でくくる</h2>
  <div className="tabs"><button className={factorMode === 'row' ? 'on' : ''} onClick={() => setFactorMode('row')}>行</button><button className={factorMode === 'col' ? 'on' : ''} onClick={() => setFactorMode('col')}>列</button></div>
  <p className="mode-note">現在: {factorMode === 'row' ? '行でくくる' : '列でくくる'}</p>
  ...
</section>

<section className={`card amber ${expandMode === 'row' ? 'mode-row' : 'mode-col'}`}>
  <h2>展開</h2>
  <div className="tabs"><button className={expandMode === 'row' ? 'on' : ''} onClick={() => setExpandMode('row')}>行</button><button className={expandMode === 'col' ? 'on' : ''} onClick={() => setExpandMode('col')}>列</button></div>
  <p className="mode-note">現在: {expandMode === 'row' ? '行で展開' : '列で展開'}</p>
  ...
</section>
