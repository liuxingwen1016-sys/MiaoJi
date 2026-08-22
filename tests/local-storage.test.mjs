import assert from 'node:assert/strict'
import fs from 'node:fs'

const storage = new Map()
const emittedEvents = []

globalThis.uni = {
	getStorageSync(key) {
		return storage.has(key) ? structuredClone(storage.get(key)) : ''
	},
	setStorageSync(key, value) {
		storage.set(key, structuredClone(value))
	},
	removeStorageSync(key) {
		storage.delete(key)
	},
	$emit(name) {
		emittedEvents.push(name)
	}
}

async function importSource(file, transform = source => source) {
	const source = transform(fs.readFileSync(file, 'utf8'))
	return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
}

const localDb = await importSource(new URL('../utils/local-db.js', import.meta.url))
globalThis.__localDbModule = localDb
const localCron = await importSource(new URL('../utils/local-cron.js', import.meta.url), source =>
	source.replace(
		"import { db, formatDate } from '@/utils/local-db.js'",
		'const { db, formatDate } = globalThis.__localDbModule'
	)
)

localDb.initializeLocalData()

const initialAssets = await localDb.db.collection('mj-user-assets').get()
assert.equal(initialAssets.result.data.length, 1)
assert.equal(initialAssets.result.data[0].asset_balance, 0)

await localDb.db.collection('mj-user-assets').doc('local-default-asset').update({ asset_balance: 10000 })
await localDb.db.collection('mj-user-bills').add({
	asset_id: 'local-default-asset',
	category_type: 'dining',
	bill_type: 0,
	bill_amount: 1250,
	bill_date: Date.now(),
	bill_notes: '午餐'
})

const month = localDb.formatDate(Date.now(), false)
const billsQuery = localDb.db.collection('mj-user-bills')
	.where(`user_id == $cloudEnv_uid && dateToString(add(new Date(0),bill_date),"%Y-%m","+0800") == "${month}"`)
	.orderBy('bill_date desc')
	.getTemp()
const assetsQuery = localDb.db.collection('mj-user-assets').getTemp()
const joined = await localDb.db.collection(billsQuery, assetsQuery).get()
assert.equal(joined.result.data.length, 1)
assert.equal(joined.result.data[0].asset_id[0]._id, 'local-default-asset')

const grouped = await localDb.db.collection('mj-user-bills')
	.where(`dateToString(add(new Date(0),bill_date),"%Y-%m","+0800") == "${month}"`)
	.groupBy('bill_type')
	.groupField('sum(bill_amount) as bill_amount_total')
	.get()
assert.equal(grouped.result.data[0].bill_amount_total, 1250)

const template = await localDb.db.collection('mj-user-templates').add({
	asset_id: 'local-default-asset',
	category_type: 'transportation',
	bill_type: 0,
	bill_amount: 500,
	bill_notes: '通勤'
})
const cron = await localDb.db.collection('mj-user-cron-accounting').add({
	name: '通勤测试',
	template_id: template.result.id,
	state: 1,
	rule: {
		repetition_cycle: { type: 'day', count: 1 },
		start_time: localDb.formatDate(Date.now()),
		end_manner: { type: 'count', count: 1 },
		expected_next_execution_time: localDb.formatDate(Date.now()),
		recent_execution_time: undefined,
		executed_count: 0
	}
})

assert.equal(await localCron.executeCronTaskById(cron.result.id), true)
const assetsAfterCron = await localDb.db.collection('mj-user-assets').doc('local-default-asset').get()
assert.equal(assetsAfterCron.result.data[0].asset_balance, 9500)
const cronAfterRun = await localDb.db.collection('mj-user-cron-accounting').doc(cron.result.id).get()
assert.equal(cronAfterRun.result.data[0].state, -1)
assert.equal(cronAfterRun.result.data[0].rule.executed_count, 1)

const billsAfterCron = await localDb.db.collection('mj-user-bills').get()
assert.equal(billsAfterCron.result.data.length, 2)
assert.match(billsAfterCron.result.data[1].bill_notes, /本地定时记账/)

localDb.resetLocalData()
const resetBills = await localDb.db.collection('mj-user-bills').get()
assert.equal(resetBills.result.data.length, 0)

console.log('Local storage and cron tests passed.')
