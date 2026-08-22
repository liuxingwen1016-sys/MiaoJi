import { db, formatDate } from '@/utils/local-db.js'

async function updateAssetBalance(template) {
	const sourceAssetResult = await db.collection('mj-user-assets').doc(template.asset_id).get()
	const sourceAsset = sourceAssetResult.result.data[0]
	if (!sourceAsset) return

	if (template.bill_type === 0) {
		await db.collection('mj-user-assets').doc(template.asset_id).update({
			asset_balance: sourceAsset.asset_balance - template.bill_amount
		})
		return
	}

	if (template.bill_type === 1) {
		await db.collection('mj-user-assets').doc(template.asset_id).update({
			asset_balance: sourceAsset.asset_balance + template.bill_amount
		})
		return
	}

	const targetAssetResult = await db.collection('mj-user-assets').doc(template.destination_asset_id).get()
	const targetAsset = targetAssetResult.result.data[0]
	if (!targetAsset) return
	await db.collection('mj-user-assets').doc(template.asset_id).update({
		asset_balance: sourceAsset.asset_balance - template.bill_amount - template.transfer_amount
	})
	await db.collection('mj-user-assets').doc(template.destination_asset_id).update({
		asset_balance: targetAsset.asset_balance + template.transfer_amount
	})
}

export async function executeCronTaskById(id) {
	const cronResult = await db.collection('mj-user-cron-accounting').doc(id).get()
	const cron = cronResult.result.data[0]
	if (!cron || cron.state !== 1) return false

	const templateResult = await db.collection('mj-user-templates').doc(cron.template_id).get()
	const template = templateResult.result.data[0]
	if (!template) {
		await db.collection('mj-user-cron-accounting').doc(id).update({ state: 0 })
		return false
	}

	const bill = JSON.parse(JSON.stringify(template))
	delete bill._id
	delete bill.template_creation_date
	const notes = bill.bill_notes ? `${bill.bill_notes} · ` : ''
	bill.bill_notes = `${notes}来自本地定时记账`
	bill.bill_date = new Date(cron.rule.expected_next_execution_time).getTime()
	await db.collection('mj-user-bills').add(bill)
	await updateAssetBalance(template)

	const executedCount = Number(cron.rule.executed_count || 0) + 1
	const shouldEnd = cron.rule.end_manner.type !== 'infinite' && executedCount >= cron.rule.end_manner.count
	const recentExecutionTime = cron.rule.expected_next_execution_time
	const nextTimestamp = new Date(recentExecutionTime).getTime() + Number(cron.rule.repetition_cycle.count) * 86400000
	await db.collection('mj-user-cron-accounting').doc(id).update({
		state: shouldEnd ? -1 : cron.state,
		rule: {
			executed_count: executedCount,
			recent_execution_time: recentExecutionTime,
			expected_next_execution_time: formatDate(nextTimestamp)
		}
	})
	return true
}

export async function processDueCronTasks() {
	const today = formatDate(Date.now())
	let executed = 0
	let safetyCount = 0
	while (safetyCount < 365) {
		const result = await db.collection('mj-user-cron-accounting').get()
		const dueTask = result.result.data.find(item =>
			item.state === 1 && item.rule && item.rule.expected_next_execution_time <= today
		)
		if (!dueTask) break
		if (await executeCronTaskById(dueTask._id)) executed += 1
		safetyCount += 1
	}
	if (executed > 0) {
		uni.$emit('updateBillsList')
		uni.$emit('updateAssetsList')
		uni.$emit('updateMonthlyBillBalance')
		uni.$emit('updateBillPage')
	}
	return executed
}
