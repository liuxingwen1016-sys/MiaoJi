function normalizeBoolean(value, defaultValue) {
	if (value === true || value === 1 || value === '1' || value === 'true') return true
	if (value === false || value === 0 || value === '0' || value === 'false') return false
	return defaultValue
}

/**
 * 兼容旧版资产数据中缺失的显示设置，并保证金额始终为可计算的数字。
 */
export function normalizeAsset(asset = {}) {
	const assetBalance = Number(asset.asset_balance)
	return {
		...asset,
		asset_balance: Number.isFinite(assetBalance) ? assetBalance : 0,
		hide_in_interface: normalizeBoolean(asset.hide_in_interface, false),
		include_in_total_assets: normalizeBoolean(asset.include_in_total_assets, true),
		default_asset: normalizeBoolean(asset.default_asset, false)
	}
}

/**
 * 数据库存储金额单位为分，页面统一使用元。
 */
export function formatStoredAssetsForDisplay(assets) {
	if (!Array.isArray(assets)) return []
	return assets.map(asset => {
		const normalizedAsset = normalizeAsset(asset)
		return {
			...normalizedAsset,
			asset_balance: normalizedAsset.asset_balance / 100
		}
	})
}
