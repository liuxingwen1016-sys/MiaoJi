const STORAGE_KEY = 'miaoji-local-database-v1'
const LOCAL_USER_ID = 'local-user'
const DEFAULT_ASSET_ID = 'local-default-asset'

const COLLECTION_NAMES = [
	'mj-user-assets',
	'mj-user-bills',
	'mj-user-templates',
	'mj-user-seconds',
	'mj-user-cron-accounting'
]

function clone(value) {
	if (value === undefined) return undefined
	return JSON.parse(JSON.stringify(value))
}

function formatDate(timestamp, includeDay = true) {
	const date = new Date(timestamp)
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	if (!includeDay) return `${year}-${month}`
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

function createInitialState() {
	const now = Date.now()
	return {
		version: 1,
		collections: {
			'mj-user-assets': [{
				_id: DEFAULT_ASSET_ID,
				user_id: LOCAL_USER_ID,
				asset_type: 'default',
				asset_creation_date: now,
				asset_balance: 0,
				hide_in_interface: false,
				include_in_total_assets: true,
				default_asset: true,
				asset_name: '默认账户'
			}],
			'mj-user-bills': [],
			'mj-user-templates': [],
			'mj-user-seconds': [],
			'mj-user-cron-accounting': []
		}
	}
}

function ensureUserInfo() {
	let userInfo = uni.getStorageSync('mj-user-info')
	if (!userInfo || typeof userInfo !== 'object') {
		userInfo = {
			avatarSrc: '',
			nickname: '本地用户',
			registerDate: formatDate(Date.now()),
			userLabel: 'LOCAL-0001'
		}
		uni.setStorageSync('mj-user-info', userInfo)
	}
	return userInfo
}

function readState() {
	const saved = uni.getStorageSync(STORAGE_KEY)
	if (!saved || typeof saved !== 'object' || !saved.collections) {
		const initialState = createInitialState()
		uni.setStorageSync(STORAGE_KEY, initialState)
		return initialState
	}
	COLLECTION_NAMES.forEach(name => {
		if (!Array.isArray(saved.collections[name])) saved.collections[name] = []
	})
	return saved
}

function writeState(state) {
	uni.setStorageSync(STORAGE_KEY, state)
}

function makeId(collectionName) {
	return `${collectionName}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function defaultsFor(collectionName) {
	const now = Date.now()
	const common = { user_id: LOCAL_USER_ID }
	const defaults = {
		'mj-user-assets': {
			...common,
			asset_creation_date: now,
			asset_balance: 0,
			hide_in_interface: false,
			include_in_total_assets: true,
			default_asset: false
		},
		'mj-user-bills': {
			...common,
			category_type: 'dining',
			bill_type: 0,
			bill_date: now,
			bill_notes: ''
		},
		'mj-user-templates': {
			...common,
			template_creation_date: now,
			category_type: 'dining',
			bill_type: 0,
			bill_notes: ''
		},
		'mj-user-seconds': common,
		'mj-user-cron-accounting': {
			...common,
			create_date: now,
			state: 1
		}
	}
	return clone(defaults[collectionName] || common)
}

function getPathValue(object, path) {
	return path.split('.').reduce((value, key) => value == null ? undefined : value[key], object)
}

function mergeDeep(target, patch) {
	Object.keys(patch || {}).forEach(key => {
		const next = patch[key]
		if (next && typeof next === 'object' && !Array.isArray(next)) {
			target[key] = mergeDeep({ ...(target[key] || {}) }, next)
		} else {
			target[key] = clone(next)
		}
	})
	return target
}

function matchesClause(record, rawClause) {
	const clause = rawClause.trim().replace(/^\(+|\)+$/g, '')
	if (!clause || clause.includes('user_id == $cloudEnv_uid')) return true

	const dateFormatMatch = clause.match(/dateToString\([\s\S]*?bill_date[\s\S]*?"(%Y-%m(?:-%d)?)"[\s\S]*?==\s*"(\d{4}-\d{2}(?:-\d{2})?)"/)
	if (dateFormatMatch) {
		const includeDay = dateFormatMatch[1] === '%Y-%m-%d'
		return formatDate(record.bill_date, includeDay) === dateFormatMatch[2]
	}

	const recentMatch = clause.match(/bill_date\s*>\s*\(new Date\(\)\.getTime\(\)\s*-\s*(\d+)\)/)
	if (recentMatch) return Number(record.bill_date) > Date.now() - Number(recentMatch[1])

	const stringMatch = clause.match(/^([\w.]+)\s*==\s*"([^"]*)"$/)
	if (stringMatch) return String(getPathValue(record, stringMatch[1])) === stringMatch[2]

	const numberMatch = clause.match(/^([\w.]+)\s*==\s*(-?\d+)$/)
	if (numberMatch) return Number(getPathValue(record, numberMatch[1])) === Number(numberMatch[2])

	return true
}

function matchesWhere(record, expression) {
	if (!expression) return true
	if (typeof expression === 'object') {
		return Object.keys(expression).every(key => getPathValue(record, key) === expression[key])
	}
	const orGroups = String(expression).split(/\s+\|\|\s+/)
	return orGroups.some(group => group.split(/\s+&&\s+/).every(clause => matchesClause(record, clause)))
}

function selectFields(record, fieldExpression) {
	if (!fieldExpression) return record
	const selected = {}
	fieldExpression.split(',').map(item => item.trim()).filter(Boolean).forEach(path => {
		selected[path] = clone(getPathValue(record, path))
	})
	return selected
}

class LocalQuery {
	constructor(source, joins = []) {
		this.source = source
		this.joins = joins
		this.whereExpression = null
		this.fieldExpression = null
		this.orderExpression = null
		this.groupKey = null
		this.groupExpression = null
		this.documentId = null
	}

	where(expression) {
		this.whereExpression = expression
		return this
	}

	field(expression) {
		this.fieldExpression = expression
		return this
	}

	orderBy(expression) {
		this.orderExpression = expression
		return this
	}

	groupBy(key) {
		this.groupKey = key
		return this
	}

	groupField(expression) {
		this.groupExpression = expression
		return this
	}

	doc(id) {
		this.documentId = id
		return this
	}

	getTemp() {
		return this
	}

	getCollectionName() {
		return typeof this.source === 'string' ? this.source : this.source.getCollectionName()
	}

	async executeRaw() {
		let records
		if (typeof this.source === 'string') {
			const state = readState()
			records = clone(state.collections[this.source] || [])
		} else {
			records = await this.source.executeRaw()
		}

		if (this.documentId) records = records.filter(item => item._id === this.documentId)
		records = records.filter(item => matchesWhere(item, this.whereExpression))

		if (this.joins.length) {
			const joinData = []
			for (const join of this.joins) joinData.push(...await join.executeRaw())
			const assets = joinData.filter(item => item && item._id)
			records = records.map(item => {
				const hydrated = clone(item)
				if (typeof hydrated.asset_id === 'string') {
					const asset = assets.find(candidate => candidate._id === hydrated.asset_id)
					hydrated.asset_id = asset ? [clone(asset)] : []
				}
				if (typeof hydrated.destination_asset_id === 'string') {
					const asset = assets.find(candidate => candidate._id === hydrated.destination_asset_id)
					hydrated.destination_asset_id = asset ? [clone(asset)] : []
				}
				return hydrated
			})
		}

		if (this.groupKey && this.groupExpression) {
			const sumMatch = this.groupExpression.match(/sum\(([^)]+)\)\s+as\s+([\w_]+)/)
			const groups = {}
			records.forEach(item => {
				const key = getPathValue(item, this.groupKey)
				if (!groups[key]) groups[key] = { [this.groupKey]: key, [sumMatch[2]]: 0 }
				groups[key][sumMatch[2]] += Number(getPathValue(item, sumMatch[1])) || 0
			})
			records = Object.values(groups)
		}

		if (this.orderExpression) {
			const rules = this.orderExpression.split(',').map(rule => {
				const [path, direction = 'asc'] = rule.trim().split(/\s+/)
				return { path, direction: direction.toLowerCase() }
			})
			records.sort((left, right) => {
				for (const rule of rules) {
					const a = getPathValue(left, rule.path)
					const b = getPathValue(right, rule.path)
					if (a === b) continue
					const result = a > b ? 1 : -1
					return rule.direction === 'desc' ? -result : result
				}
				return 0
			})
		}

		if (this.fieldExpression) records = records.map(item => selectFields(item, this.fieldExpression))
		return records
	}

	async get() {
		const data = await this.executeRaw()
		return { result: { data, affectedDocs: data.length }, data, affectedDocs: data.length }
	}

	async add(data) {
		const collectionName = this.getCollectionName()
		const state = readState()
		const record = mergeDeep(defaultsFor(collectionName), clone(data || {}))
		record._id = record._id || makeId(collectionName)
		state.collections[collectionName].push(record)
		writeState(state)
		return { result: { id: record._id }, id: record._id }
	}

	async update(patch) {
		const collectionName = this.getCollectionName()
		const state = readState()
		let affectedDocs = 0
		state.collections[collectionName] = state.collections[collectionName].map(item => {
			const matchesDocument = !this.documentId || item._id === this.documentId
			if (matchesDocument && matchesWhere(item, this.whereExpression)) {
				affectedDocs += 1
				return mergeDeep(item, clone(patch || {}))
			}
			return item
		})
		writeState(state)
		return { result: { affectedDocs }, affectedDocs }
	}

	async remove() {
		const collectionName = this.getCollectionName()
		const state = readState()
		const originalLength = state.collections[collectionName].length
		state.collections[collectionName] = state.collections[collectionName].filter(item => {
			const matchesDocument = !this.documentId || item._id === this.documentId
			return !(matchesDocument && matchesWhere(item, this.whereExpression))
		})
		const affectedDocs = originalLength - state.collections[collectionName].length
		writeState(state)
		return { result: { affectedDocs }, affectedDocs }
	}
}

export const db = {
	collection(source, ...joins) {
		return new LocalQuery(source, joins)
	},
	async multiSend(...queries) {
		const dataList = []
		for (const query of queries) {
			const data = await query.executeRaw()
			dataList.push({ data, affectedDocs: data.length })
		}
		return { result: { dataList } }
	}
}

export function initializeLocalData() {
	const state = readState()
	ensureUserInfo()
	const assets = clone(state.collections['mj-user-assets']).map(asset => ({
		...asset,
		asset_balance: asset.asset_balance / 100
	}))
	uni.setStorageSync('mj-user-assets', assets)
	return state
}

export function getLocalUserInfo() {
	return clone(ensureUserInfo())
}

export function saveLocalUserInfo(userInfo) {
	uni.setStorageSync('mj-user-info', clone(userInfo))
}

export function resetLocalData() {
	[
		STORAGE_KEY,
		'mj-user-info',
		'mj-user-assets',
		'mj-user-bills',
		'mj-user-temp-template',
		'mj-bill-edit',
		'mj-asset-edit',
		'oneCronData',
		'mj-local-feedback',
		'isEyeShow',
		'mj-category-style-for-expend',
		'mj-category-style-for-income',
		'mj-assets-style',
		'icon-expired'
	].forEach(key => uni.removeStorageSync(key))
	return initializeLocalData()
}

export { formatDate }
