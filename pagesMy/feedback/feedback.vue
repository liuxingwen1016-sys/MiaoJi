<template>
	<view class="feedback">
		<mj-card title="本地建议">
			<view class="tip">这里用于记录你的使用建议或待改进事项，内容仅保存在本机，不会发送到服务器。</view>
			<u--textarea v-model="content" placeholder="写下建议或备忘（最多300字）" maxlength="300" count></u--textarea>
			<u-button class="save-btn" text="保存到本机" color="#9fcba7" shape="circle" @click="saveFeedback"></u-button>
		</mj-card>

		<mj-card title="已保存内容" v-if="feedbackList.length">
			<view class="feedback-item" v-for="item in feedbackList" :key="item.id">
				<view class="item-header">
					<text>{{item.date}}</text>
					<text class="delete" @click="deleteFeedback(item.id)">删除</text>
				</view>
				<view class="item-content">{{item.content}}</view>
			</view>
		</mj-card>
		<u-empty v-else mode="list" text="还没有保存过建议"></u-empty>
	</view>
</template>

<script>
	const STORAGE_KEY = 'mj-local-feedback'

	export default {
		data() {
			return {
				content: '',
				feedbackList: []
			}
		},
		onLoad() {
			this.feedbackList = uni.getStorageSync(STORAGE_KEY) || []
		},
		methods: {
			saveFeedback() {
				const content = this.content.trim()
				if (!content) {
					uni.showToast({ title: '请先填写内容', icon: 'none' })
					return
				}
				this.feedbackList.unshift({
					id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
					date: uni.$u.timeFormat(Date.now(), 'yyyy-mm-dd hh:MM'),
					content
				})
				uni.setStorageSync(STORAGE_KEY, this.feedbackList)
				this.content = ''
				uni.showToast({ title: '已保存', icon: 'success' })
			},
			deleteFeedback(id) {
				this.feedbackList = this.feedbackList.filter(item => item.id !== id)
				uni.setStorageSync(STORAGE_KEY, this.feedbackList)
			}
		}
	}
</script>

<style lang="scss" scoped>
	.feedback {
		padding-bottom: 32rpx;
		.tip {
			margin-bottom: 24rpx;
			font-size: 28rpx;
			line-height: 44rpx;
			color: $mj-text-color-grey;
		}
		.save-btn {
			margin-top: 24rpx;
		}
		.feedback-item {
			padding: 20rpx 0;
			border-bottom: 1px solid #eeeeee;
			.item-header {
				display: flex;
				justify-content: space-between;
				font-size: 24rpx;
				color: $mj-text-color-grey;
				.delete {
					color: #e94459;
				}
			}
			.item-content {
				margin-top: 12rpx;
				font-size: 30rpx;
				line-height: 44rpx;
				white-space: pre-wrap;
			}
		}
	}
</style>
