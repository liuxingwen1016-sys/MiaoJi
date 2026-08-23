import {getAllIconList, getAssetsStyle} from "@/utils/icon-config.js";

const iconGather = getAllIconList()
const assetsStyle = getAssetsStyle()

function getLinkedAsset(value, assets) {
	if (Array.isArray(value)) return value[0] || null
	if (typeof value === 'string') return assets.find(item => item._id === value) || null
	if (value && typeof value === 'object') return value
	return null
}

function addAssetInfo(template, field, styleField, existsField, titleField, assets) {
	const linkedAsset = getLinkedAsset(template[field], assets)
	const currentAsset = linkedAsset
		? assets.find(item => item._id === linkedAsset._id)
		: null
	const assetStyle = currentAsset
		? assetsStyle.find(item => item.type === currentAsset.asset_type)
		: null

	template[field] = linkedAsset ? [linkedAsset] : []
	template[existsField] = Boolean(currentAsset)
	template[styleField] = assetStyle || {
		icon: '',
		color: '#6d6d6d',
		title: '资产已删除'
	}
	template[titleField] = currentAsset
		? (currentAsset.asset_name || template[styleField].title)
		: '资产已删除'
}

// 格式化一条模板数据，用于界面展示
export function formatOneTemplate(oneTemplate) {
	// 获取用户资产信息
	const storageAssets = uni.getStorageSync('mj-user-assets')
	const assets = Array.isArray(storageAssets) ? storageAssets : []
	const tempObj = uni.$u.deepClone(oneTemplate || {})
	// 1 修改金额单位 变为元
	// 2 通过category_type给每一条添加对应billStyle
	// 3 通过asset_type给每一条添加对应的assetStyle
	// 4 如果转入资产的id，给其添加对应的destinationAssetStyle
	tempObj.bill_amount = (Number(tempObj.bill_amount) || 0) / 100
	tempObj.transfer_amount = Number(tempObj.transfer_amount) || 0
	tempObj.billStyle = iconGather.find(item => item.type === tempObj.category_type) || {
		icon: '',
		title: '未分类',
		type: tempObj.category_type || ''
	}
	addAssetInfo(tempObj, 'asset_id', 'assetStyle', 'hasAsset', 'assetTitle', assets)
	addAssetInfo(
		tempObj,
		'destination_asset_id',
		'destinationAssetStyle',
		'hasDestinationAsset',
		'destinationAssetTitle',
		assets
	)
	return tempObj
}
