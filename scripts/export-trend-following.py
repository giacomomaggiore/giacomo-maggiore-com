"""Offline, local-only export of the reviewed trend-following notebook inputs."""

import argparse
import hashlib
import json
from contextlib import chdir
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
NOTEBOOK_SHA256 = 'b9834af30b57ee189988897fd205b430b8ad81d29ce3f3eb3bb1c02b84bf71ef'
MANIFEST_SHA256 = '83f36042f0683ad3d556ec6593a2e1f263e2d5537708b271f17eee3922171048'
CUTOFF = pd.Timestamp('2024-03-28')
METRICS = ['CAGR', 'Volatility', 'Sharpe ratio', 'Sortino ratio', 'Max drawdown', 'Average drawdown duration (days)']


def verified_bytes(path, expected):
    contents = path.read_bytes()
    if hashlib.sha256(contents).hexdigest() != expected:
        raise ValueError(f'{path.name}: checksum mismatch; review the new source before exporting')
    return contents


def load_notebook(notebook, data):
    cells = json.loads(verified_bytes(notebook, NOTEBOOK_SHA256))['cells']
    verified_bytes(data / 'sources_manifest.json', MANIFEST_SHA256)
    state = {}
    # Skip plotting, widgets, diagnostics output and the separate SG Trend study.
    with chdir(ROOT / 'wiki/notebooks'):
        for index in (1, 7, 9, 10, 12, 14, 16, 18):
            source = ''.join(cells[index]['source'])
            if index == 1:
                source = source.replace("DATA = Path('data/trend_following_futures')", f'DATA = Path({str(data)!r})', 1)
            elif index == 14:
                source = source.split('# Run the risk-ready comparison', 1)[0]
            elif index == 16:
                source = source[source.index('def drawdown('):source.index('def rolling_five_year_returns(')]
            elif index == 18:
                source = source.split('summary = comparison_summary(comparison)', 1)[0]
            exec(compile(source, f'{notebook.name}: cell {index}', 'exec'), state)
    return state


def nullable(value):
    return None if pd.isna(value) else float(value)


def comparison(state, settings):
    return state['run_comparison'](
        settings['maType'], settings['fast'], settings['slow'], settings['entry'], settings['exit'],
        settings['rebalanceDays'], settings['riskMultiplier'], settings['transactionBps'] / 10_000,
        settings['rollPercent'] / 100, settings['cashMultiplier'],
    ).loc[:CUTOFF]


def build_payload(state, levels):
    dates = state['dates']
    keep = dates.searchsorted(CUTOFF, side='right')
    shared = dates.get_indexer(levels.index)
    if not dates.is_monotonic_increasing or shared[0] < state['start'] or shared[-1] >= keep:
        raise ValueError('Unexpected calendar alignment')

    markets = []
    for name, panel in state['futures'].items():
        j = state['moves'].columns.get_loc(name)
        if list(state['futures'])[j] != name:
            raise ValueError('Unexpected notebook market order')
        observed_dates = panel.index[panel.index <= CUTOFF]
        rows = [
            [int(i), float(adjusted), int(state['reset'][i, j]), float(state['daily_moves'][i, j]),
             float(state['daily_risk_moves'][i, j]), float(state['notional'][i, j]), nullable(risk)]
            for i, adjusted, risk in zip(
                dates.get_indexer(observed_dates), panel.loc[observed_dates, 'adjusted'],
                state['instrument_risk'][name].loc[observed_dates], strict=True,
            )
        ]
        markets.append({'name': name, 'rows': rows})

    return {
        'version': 1,
        'dates': (dates[:keep] - pd.Timestamp('1970-01-01')).days.tolist(),
        'start': int(state['start']),
        'shared': shared.tolist(),
        'benchmark': levels.iloc[:, 1].tolist(),
        'cashGrowth': state['cash_growth'].loc[levels.index].tolist(),
        'cashRate': [nullable(value) for value in state['cash_rate'][:keep]],
        'benchmarkRisk': [nullable(value) for value in state['benchmark_risk'][:keep]],
        'markets': markets,
    }


def parity_scenario(state, settings, levels):
    trend, benchmark = levels.columns
    returns = levels.pct_change()
    window = returns.rolling(252)
    # Pandas can leave nonzero residuals in rolling variance for constant windows.
    varying = window.max().gt(window.min()).all(axis=1)
    correlation = window[trend].corr(returns[benchmark]).where(varying).clip(-1, 1)
    summary = state['comparison_summary'](levels).loc[METRICS].copy()
    cash_returns = state['cash_growth'].loc[levels.index].pct_change()
    for name in levels:
        excess = returns[name].sub(cash_returns).dropna()
        if excess.min() == excess.max():
            summary.loc['Sharpe ratio', name] = np.nan
        if excess.ge(0).all():
            summary.loc['Sortino ratio', name] = np.nan
    if settings['riskMultiplier'] == 0 and settings['cashMultiplier'] == 1:
        # The same cash accrual compounded on different starting NAVs is identical before round-off.
        summary.loc[['Sharpe ratio', 'Sortino ratio'], trend] = np.nan
    return {
        'settings': settings,
        'trend': levels[trend].tolist(),
        'correlation': [nullable(value) for value in correlation],
        'trendMetrics': [nullable(value) for value in summary[trend]],
        'benchmarkMetrics': [nullable(value) for value in summary[benchmark]],
    }


def baseline_settings(state):
    return {
        'maType': state['MA_TYPE'], 'fast': state['MA_FAST_SESSIONS'], 'slow': state['MA_SLOW_SESSIONS'],
        'entry': state['ENTRY_LOOKBACK_SESSIONS'], 'exit': state['EXIT_LOOKBACK_SESSIONS'],
        'rebalanceDays': state['REBALANCY_FREQ_DAYS'], 'riskMultiplier': state['TARGET_RISK_MULTIPLIER'],
        'transactionBps': state['TRANSACTION_COST_RATE_BP'] * 10_000,
        'rollPercent': state['ANNUAL_ROLL_COST_RATE'] * 100,
        'cashMultiplier': state['CASH_RATE_MULTIPLIER'],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('notebook', type=Path, help='Path to the reviewed local notebook')
    parser.add_argument('data', type=Path, help='Path to the verified local CSV and manifest directory')
    args = parser.parse_args()
    state = load_notebook(args.notebook.resolve(), args.data.resolve())
    baseline = baseline_settings(state)
    levels = comparison(state, baseline)
    if (state['first_date'] != pd.Timestamp('2000-05-25') or levels.index[0] != pd.Timestamp('2001-03-28')
            or levels.index[-1] != CUTOFF or len(levels) != 5930):
        raise ValueError('Unexpected baseline comparison dates')
    np.testing.assert_allclose(levels.iloc[-1], [788.718588, 494.398473], rtol=0, atol=5e-7)
    scenarios = [parity_scenario(state, baseline, levels)]
    for overrides in (
        dict(maType='sma', fast=80, slow=300, entry=250, exit=80),
        dict(rebalanceDays=7, riskMultiplier=0.75, transactionBps=12.5, rollPercent=0.85, cashMultiplier=0.5),
        dict(riskMultiplier=0),
        dict(riskMultiplier=0, cashMultiplier=0),
    ):
        settings = baseline | overrides
        alternative = comparison(state, settings)
        if not alternative.index.equals(levels.index):
            raise ValueError('Scenario comparison dates diverged from baseline')
        scenarios.append(parity_scenario(state, settings, alternative))

    payload = build_payload(state, levels)
    artifacts = {
        'public/data/trend-following-v1.json': payload,
        'tests/fixtures/trend-following-v1.json': {'scenarios': scenarios},
    }
    encoded = {name: json.dumps(data, allow_nan=False, separators=(',', ':')) + '\n' for name, data in artifacts.items()}
    for name, contents in encoded.items():
        target = ROOT / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(contents, encoding='utf-8')
    print(f"Exported {len(payload['dates'])} union dates, {len(levels)} shared closes, "
          f"{len(payload['markets'])} markets, and {len(scenarios)} parity scenarios.")


if __name__ == '__main__':
    main()
