import assert from 'node:assert/strict'
import fs from 'node:fs'

const storage = new Map()

globalThis.uni = {
	$u: {
		deepClone(value) {
			return structuredClone(value)
		}
	},
	getStorageSync(key) {
		return storage.has(key) ? structuredClone(storage.get(key)) : ''
	},
	setStorageSync(key, value) {
		storage.set(key, structuredClone(value))
	},
	setStorage({ key, data, success }) {
		storage.set(key, structuredClone(data))
		if (success) success()
	}
}

async function importSource(file, transform = source => source) {
	const source = transform(fs.readFileSync(file, 'utf8'))
	return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
}

const iconConfig = await importSource(new URL('../utils/icon-config.js', import.meta.url))
globalThis.__iconConfigModule = iconConfig
const templateFormatter = await importSource(
	new URL('../utils/formatTemplate.js', import.meta.url),
	source => source.replace(
		'import {getAllIconList, getAssetsStyle} from "@/utils/icon-config.js";',
		'const { getAllIconList, getAssetsStyle } = globalThis.__iconConfigModule'
	)
)

const defaultAsset = {
	_id: 'local-default-asset',
	asset_type: 'default',
	asset_name: '默认账户'
}
const savingsAsset = {
	_id: 'local-savings-asset',
	asset_type: 'bank',
	asset_name: '储蓄卡'
}
storage.set('mj-user-assets', [defaultAsset, savingsAsset])

const expenseTemplate = templateFormatter.formatOneTemplate({
	_id: 'expense-template',
	asset_id: [defaultAsset],
	category_type: 'dining',
	bill_type: 0,
	bill_amount: 1250,
	bill_notes: '午餐'
})
assert.equal(expenseTemplate.bill_amount, 12.5)
assert.equal(expenseTemplate.assetTitle, '默认账户')
assert.equal(expenseTemplate.hasAsset, true)
assert.deepEqual(expenseTemplate.destination_asset_id, [])
assert.equal(expenseTemplate.hasDestinationAsset, false)

const transferTemplate = templateFormatter.formatOneTemplate({
	_id: 'transfer-template',
	asset_id: 'local-default-asset',
	destination_asset_id: 'local-savings-asset',
	category_type: 'transfer',
	bill_type: 2,
	bill_amount: 0,
	transfer_amount: 5000
})
assert.equal(transferTemplate.assetTitle, '默认账户')
assert.equal(transferTemplate.destinationAssetTitle, '储蓄卡')
assert.equal(transferTemplate.hasDestinationAsset, true)
assert.equal(transferTemplate.transfer_amount, 5000)

const deletedAssetTemplate = templateFormatter.formatOneTemplate({
	_id: 'deleted-asset-template',
	asset_id: [],
	destination_asset_id: undefined,
	category_type: 'unknown-category',
	bill_type: 0,
	bill_amount: undefined
})
assert.equal(deletedAssetTemplate.bill_amount, 0)
assert.equal(deletedAssetTemplate.billStyle.title, '未分类')
assert.equal(deletedAssetTemplate.assetTitle, '资产已删除')
assert.equal(deletedAssetTemplate.destinationAssetTitle, '资产已删除')

console.log('Template formatting tests passed.')
