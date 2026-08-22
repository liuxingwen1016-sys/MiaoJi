<template>
	<view class="my">
		<view class="linear-gradient"></view>
		<!-- 用户卡片 -->
		<uni-card :is-shadow="true" @click="clickUserCard" shadow="rgba(149, 157, 165, 0.2) 0px 8px 24px;">
			<view class="user-card">
				<view class="left">
					<u-avatar :src="userInfo.avatarSrc" size="100rpx"></u-avatar>
					<view class="main">
						<view class="username">
							Hi {{userInfo.nickname || '朋友'}}
						</view>
						<view class="day">
							本机离线保存 · 第{{userInfo.useDate}}天
						</view>
					</view>
				</view>
				<view class="right">
					<u-icon name="arrow-right"></u-icon>
				</view>
			</view>
		</uni-card>
		<!-- 修改了uni-section的样式，背景色和装饰line颜色改变,padding -->
		<view class="options">
			<!-- 功能 -->
			<uni-section class="section" title="功能" type="line" titleFontSize="32rpx"
				titleColor="#212121"></uni-section>
			<!-- grid组件 -->
			<u-grid :border="false" @click="clickOption" col="4">
				<u-grid-item v-for="item,index in optionList" :key="index" >
					<view class="content">
						<view class="grid-item">
							<uni-icons :type="item.icon" size="48rpx" :customPrefix="item.customPrefix"></uni-icons>
							<view class="grid-text">{{item.title}}</view>
						</view>
					</view>
				</u-grid-item>
			</u-grid>
			<!-- 偏好 -->
			<uni-section class="section" title="偏好" type="line" titleFontSize="32rpx"
				titleColor="#212121"></uni-section>
			<u-grid :border="false" @click="clickLike" col="4">
				<u-grid-item v-for="item,index in likeList" :key="index" >
					<view class="content">
						<view class="grid-item">
							<uni-icons :type="item.icon" size="48rpx" :customPrefix="item.customPrefix"></uni-icons>
							<view class="grid-text">{{item.title}}</view>
						</view>
					</view>
				</u-grid-item>
			</u-grid>

			<!-- 其他 -->
			<uni-section class="section" title="其他" type="line" titleFontSize="32rpx"
				titleColor="#212121"></uni-section>
			<u-cell-group :border="false">
				<u-cell :isLink="true" @click="clickAbout">
					<view slot="title" class="about">
						<view>
							关于妙记
						</view>
						<view class="about-tag">
							<u-tag text="🎉v1.0.0" size="mini" @click="clickAbout"></u-tag>
						</view>
					</view>
					<uni-icons slot="icon" type="info" size="36rpx"></uni-icons>
				</u-cell>
				<u-cell title="使用建议（本地）" :isLink="true" @click="clickFeedback">
					<uni-icons slot="icon" type="compose" size="36rpx"></uni-icons>
				</u-cell>
				<u-cell title="本地数据说明" :isLink="true" @click="clickDataInfo">
					<uni-icons slot="icon" type="locked" size="36rpx"></uni-icons>
				</u-cell>
				<u-cell title="清除本地数据" :isLink="true" @click="clearLocalData">
					<uni-icons slot="icon" type="trash" size="36rpx"></uni-icons>
				</u-cell>
			</u-cell-group>
		</view>
	</view>
</template>

<script>
	import { getLocalUserInfo, resetLocalData } from '@/utils/local-db.js'
	export default {
		data() {
			return {
				userInfo: {
					avatarSrc: '',
					nickname: '',
					registerDate: '',
					useDate: 0,
				},
				optionList: [{
						icon: 'mj-wallet',
						title: '我的资产',
						customPrefix: "miaoji"
					},
					{
						icon: 'mj-layout',
						title: '模板管理',
						customPrefix: "miaoji"
					},
					{
						icon: 'mj-second',
						title: '秒记管理',
						customPrefix: "miaoji"
					},
					{
						icon: 'mj-reloadtime',
						title: '定时记账',
						customPrefix: "miaoji"
					},
					{
						icon: 'mj-yuan-circle',
						title: '预算设置',
						customPrefix: "miaoji"
					}
				],
				likeList: [
					{
						icon: 'mj-individuation',
						title: '个性化',
						customPrefix: "miaoji"
					}
				],
				showUserAssetsList: false,
			};
		},
		onReady() {
			this.getUserInfo()
		},
		onShow() {
			this.resetUserInfo()
		},
		methods: {
			clickUserCard() {
				uni.navigateTo({
					url: "/pagesMy/user-info/user-info"
				})
			},
			clickOption(index) {
				switch (index) {
					case 0:
						uni.navigateTo({
							url:"/pagesMy/my-assets/my-assets"
						})
						break
					case 1:
						uni.navigateTo({
							url:"/pagesMy/bill-template/bill-template"
						})
						break
					case 2:
						uni.navigateTo({
							url:"/pagesMy/seconds/seconds"
						})
						break
					case 3:
						uni.navigateTo({
							url:"/pagesMy/cron-accounting/cron-accounting"
						})
						break
					default:
						uni.showToast({
							title:"正在开发中~",
							icon: "none"
						})
				}
			},
			clickLike(index) {
				switch (index) {
					default:
						uni.showToast({
							title:"正在开发中~",
							icon: "none"
						})
				}
			},
			clickFeedback() {
				uni.navigateTo({
					url: "/pagesMy/feedback/feedback"
				})
			},
			clickDataInfo() {
				uni.showModal({
					content: "账单、资产、模板和个人资料仅保存在当前设备，不会上传到任何服务器。卸载应用或清除数据后无法恢复。",
					cancelColor: "rgba(0,0,0,0.6)",
					confirmColor:"#9fcba7",
					showCancel:false
				})
			},
			clickAbout(){
				uni.navigateTo({
					url:"/pagesMy/about/about"
				})
			},
			clearLocalData() {
				uni.showModal({
					title: '清除本地数据',
					content: '确定清除全部账单、资产、模板和个人资料吗？此操作无法撤销。',
					confirmColor: '#e94459',
					success: res => {
						if (!res.confirm) return
						resetLocalData()
						uni.reLaunch({ url: '/pages/index/index' })
					}
				})
			},
			getUserInfo() {
				Object.assign(this.userInfo, getLocalUserInfo())
				this.getUserDate()
			},
			resetUserInfo() {
				const storageUserInfo = uni.getStorageSync('mj-user-info')
				if(!storageUserInfo) {
					// 如果没有用户信息的缓存
					this.getUserInfo()
					return
				}
				Object.assign(this.userInfo, storageUserInfo)
				this.getUserDate()
			},
			// 获取使用妙记天数
			getUserDate() {
				const registerDateTimestamp = Date.parse(this.userInfo.registerDate) || Date.now()
				let useDate = Date.now() - registerDateTimestamp
				this.userInfo.useDate = Math.max(1, Math.ceil(useDate / (1000 * 60 * 60 * 24)))
			}
		},
		// 分享功能
		onShareAppMessage () {
			return {
				title: "妙记——记录你的生活",
				path: "/pages/index/index",
				imageUrl: "/static/share.png"
			}
		},
		// 分享到朋友圈功能
		onShareTimeline(){
			return {
				title: '妙记——记录你的生活'
			}
		}
	}
</script>

<style lang="scss" scoped>
	.my {
		position: relative;
		.linear-gradient {
			position: absolute;
			top: -15px;
			left: 0;
			right: 0;
			height: 130rpx;
			background-image: linear-gradient(#9fcba7, #fafafa);
		}
		.user-card {
			display: flex;
			justify-content: space-between;
			align-items: center;

			.left {
				display: flex;
				justify-content: start;
				align-items: center;

				.main {
					margin-left: 24rpx;
					margin-top: 8rpx;
					display: flex;
					flex-direction: column;
					justify-content: center;
					align-items: flex-start;

					.username {
						font-size: 40rpx;
						line-height: 40rpx;
						color: $mj-text-color;
						margin-bottom: 16rpx;
					}

					.day {
						font-size: 28rpx;
						line-height: 28rpx;
						color: $mj-text-color-grey;
					}
				}
			}
		}

		.options {
			box-sizing: border-box;
			padding: 0 28rpx;

			.content {
				padding-bottom: 14px;

				.grid-item {
					display: flex;
					flex-direction: column;
					justify-content: center;
					align-items: center;
					width: 148rpx;
					height: 124rpx;
					background-color: #f1f1f1;
					border-radius: 30%;
					color: $mj-text-color;

					.grid-text {
						font-size: 28rpx;
					}
				}
			}
			.about {
				display: flex;
				justify-content: start;
				align-items: center;
				.about-tag {
					margin-left: 16rpx;
				}
			}
		}
	}
</style>
