import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { EconomyChart, EconomyWelfare } from './EconomyChart'

test('economy components default to Italian and support English', () => {
  for (const [Component, italianTitle, englishTitle] of [
    [EconomyChart, 'Dalla produzione ai cittadini', 'From production to citizens'],
    [EconomyWelfare, 'Utilità dei cittadini', 'Citizens’ utility'],
  ] as const) {
    const italian = renderToStaticMarkup(React.createElement(Component))
    const english = renderToStaticMarkup(React.createElement(Component, { language: 'en' }))
    assert.equal(italian, renderToStaticMarkup(React.createElement(Component, { language: 'it' })))
    assert.ok(italian.includes(italianTitle) && italian.includes('Imposta profitti'))
    assert.ok(english.includes(englishTitle) && english.includes('Profit tax'))
    assert.ok(!english.includes('Imposta profitti'))
  }
})
