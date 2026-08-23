import assert from 'node:assert/strict'
import fs from 'node:fs'

const source = fs.readFileSync(new URL('../utils/formatAsset.js', import.meta.url), 'utf8')
const assetFormat = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)

const [legacyAsset, visibleAsset, hiddenAsset] = assetFormat.formatStoredAssetsForDisplay([
	{ _id: 'legacy', asset_balance: '12345', asset_type: 'default' },
	{ _id: 'visible', asset_balance: 2500, hide_in_interface: 0, include_in_total_assets: 'true' },
	{ _id: 'hidden', asset_balance: 800, hide_in_interface: 1, include_in_total_assets: 'false' }
])

assert.equal(legacyAsset.asset_balance, 123.45)
assert.equal(legacyAsset.hide_in_interface, false)
assert.equal(legacyAsset.include_in_total_assets, true)
assert.equal(visibleAsset.hide_in_interface, false)
assert.equal(visibleAsset.include_in_total_assets, true)
assert.equal(hiddenAsset.hide_in_interface, true)
assert.equal(hiddenAsset.include_in_total_assets, false)
assert.deepEqual(assetFormat.formatStoredAssetsForDisplay(undefined), [])
assert.equal(assetFormat.normalizeAsset({ asset_balance: 'invalid' }).asset_balance, 0)

console.log('Asset display formatting tests passed.')
