<template>
	<view class="bill-template">
		<!-- 需要从数据库中获取数据进行渲染 -->
		<view @click.native="clickTemp(temp)" v-for="temp in formatTempList" :key="temp._id">
			<mj-card :title="temp.bill_type === 0 ? '支出' : '收入'" v-if="temp.bill_type !== 2">
				<view class="one-bill-template">
					<view class="left">
						<mj-icon-with-background :type="temp.billStyle.icon" size="48rpx" customPrefix="miaoji"></mj-icon-with-background>
						<view class="info">
							<view>{{temp.billStyle.title}}</view>
							<view class="minor" v-if="temp.bill_notes"><u--text :lines="1" :text="temp.bill_notes" color="rgba(0,0,0, 0.6)" size="24rpx"></u--text></view> <!-- 设置超过一行就... 可以使用u-text组件 -->
						</view>
					</view>
					<view class="right">
						<u--text mode="price" :text="temp.bill_amount" :color="temp.bill_type === 0 ? '#dd524d' : '#219a6d'" size="32rpx" bold></u--text>
						<view class="minor">{{temp.assetTitle}}</view>
					</view>
				</view>
			</mj-card>
			<mj-card v-else title="转账">
				<view class="one-bill-template">
					<view class="left">
						<mj-icon-with-background :type="temp.billStyle.icon" size="48rpx" customPrefix="miaoji"></mj-icon-with-background>
						<view class="info">
							<view>{{temp.billStyle.title}}</view>
							<view class="minor" v-if="temp.bill_notes"><u--text :lines="1" :text="temp.bill_notes" color="rgba(0,0,0, 0.6)" size="24rpx"></u--text></view> <!-- 设置超过一行就... 可以使用u-text组件 -->
						</view>
					</view>
					<view class="right">
						<u--text mode="price" :text="temp.transfer_amount / 100" color="#212121" size="32rpx" bold></u--text>
						<view class="minor">{{temp.assetTitle}}</view>
					</view>
				</view>
			</mj-card>
		</view>
		<view v-show="formatTempList.length == 0">
			<u-empty mode="list" text="暂时没有模板哦,快去添加一个吧"></u-empty>
		</view>

		
		<mj-bill-details-popup
			type="temp"
			:bill="templateDetails"
			:show="showBillDetails" 
			@close="showBillDetails = false" 
			@updateBill="updateTemp" 
			@deleteBill="deleteTemp"
		>
		</mj-bill-details-popup>
	</view>
</template>

	<script>
	import { db } from '@/utils/local-db.js'
	import { formatOneTemplate } from '@/utils/formatTemplate.js'
	export default {
		name:"mj-bill-template",
		// templateList 原始模板列表；pageType 页面类型:account 记一笔页面  temp 管理模板页面
		props: {
			templateList: {
				type: Array,
				default: () => []
			},
			pageType: {
				type: String,
				default: 'account'
			}
		},
		data() {
			return {
				templateDetails: {},
				showBillDetails: false,
				formatTempList: []
			};
		},
		watch: {
			templateList: {
				handler() {
					this.formatTemp()
				},
				immediate: true
			}
		},
		methods: {
			updateTemp() {
				// 修改模板
				// 1 将改模板存入缓存，在记一笔页面读取缓存
				// 2 进入记一笔页面
				// 3 隐藏pop框
				uni.setStorageSync('mj-user-temp-template',this.templateDetails)
				uni.navigateTo({
					url: `/pagesAccount/make-an-account/make-an-account?type=templateEdit`
				})
				setTimeout(() => {
					this.showBillDetails = false
				}, 2000)
			},
			async deleteTemp() {
				uni.showModal({
					content: "你确定删除该模板吗？（删除之后不可恢复哦）",
					cancelColor: "rgba(0,0,0,0.6)",
					confirmColor:"#9fcba7",
					success:async res =>  {
						if(res.confirm) {
							uni.showLoading({
								title: "删除中",
								mask: true
							})
							await db.collection('mj-user-templates').doc(this.templateDetails._id).remove()
							this.$emit('updateList')
							uni.hideLoading()
							uni.showToast({
								title: "删除成功",
								icon: "success"
							})
							this.showBillDetails = false
						}
					}
				})
			},
			// 点击每个模板卡片触发
			clickTemp(temp) {
				// 只有在模板管理页面才能查看模板详情
				console.log('mj-bill-template:点击每个模板卡片触发',temp);
				if(this.pageType === 'temp') {
					this.templateDetails = {}
					this.templateDetails = temp
					this.showBillDetails = true
				}
				// 如果在记一笔页面，返回当前点击的模板数据
				if(this.pageType === 'account') {
					this.$emit('getTemp',temp)
				}
			},
			formatTemp() {
				this.formatTempList = this.templateList
					.filter(temp => temp && typeof temp === 'object')
					.map(temp => formatOneTemplate(temp))
			}
		}
	}
</script>

<style lang="scss" scoped>
.bill-template {
	.one-bill-template {
		display: flex;
		justify-content: space-between;
		color: $mj-text-color;
		
		font-size: 32rpx;
		padding: 8rpx 0;
	
		.left {
			display: flex;
			justify-content: right;
			align-items: center;
	
			.info {
				display: flex;
				flex-direction: column;
				justify-content: center;
				padding-left: 24rpx;
			}
		}
	
		.right {
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: flex-end;
			padding-right: 20rpx;
			
		}
		.minor {
			color: $mj-text-color-grey;
			font-size: 24rpx;
		}
	
		
	}
}
</style>
