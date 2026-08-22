<template>
	<view class="userInfo">
		<view class="linear-gradient"></view>
		<mj-card title="我的">
			<view class="me">
				<view class="avatar">
					<u-avatar :src="userInfo.avatarSrc" size="100rpx"></u-avatar>
					<view class="avatarBtn" @click="chooseAvatar"></view>
				</view>
				<view class="main">
					<view class="username" @click="clickName">
						Hi {{userInfo.nickname || '朋友'}}
					</view>
					<view class="day">
						{{registerDateForTitle}}加入妙记
					</view>
				</view>
			</view>
		</mj-card>
		<mj-card title="个人信息">
			<u-cell-group :border="false">
				<u-cell title="会员编号" :label="userInfo.userLabel" :border="false" clickable>
					<uni-icons type="vip" size="48rpx" slot="icon" class="userinfo-icon"></uni-icons>
				</u-cell>
				<u-cell @click="clickName" title="昵称" :label="userInfo.nickname || '点我设置昵称'" :border="false" clickable>
					<uni-icons type="person" size="48rpx" slot="icon" class="userinfo-icon"></uni-icons>
				</u-cell>
				<u-cell title="加入时间" :label="userInfo.registerDate" :border="false">
					<uni-icons type="paperplane" size="48rpx" slot="icon" class="userinfo-icon"></uni-icons>
				</u-cell>
			</u-cell-group>
		</mj-card>
		<u-popup :show="showNicaNamePop" mode="center" :round="10" @close="showNicaNamePop = false"
			:customStyle="popStyle" :safeAreaInsetBottom="false">
			<form @submit="submitName">
				<input type="nickname" placeholder="请输入昵称(10个字以内)" maxlength="10" name="nickname">
				<button form-type="submit" class="btn">确认</button>
			</form>
		</u-popup>
		<u-toast ref="uToastForNickname"></u-toast>
	</view>
</template>

<script>
	import { getLocalUserInfo, saveLocalUserInfo } from '@/utils/local-db.js'
	export default {
		data() {
			return {
				userInfo: {
					avatarSrc: '',
					nickname: '',
					registerDate: '',  //格式为 yyyy-mm-dd
					userLabel: '00000001'
				},
				registerDateForTitle: '', //格式为 yyyy年mm
				showNicaNamePop: false,
				popStyle: {
					'box-sizing': 'border-box',
					'padding': '40rpx'
				}
			}
		},
		methods: {
			chooseAvatar() {
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: res => {
						const tempFilePath = res.tempFilePaths[0]
						const saveAvatar = path => {
							this.userInfo.avatarSrc = path
							saveLocalUserInfo(this.userInfo)
						}
						if (typeof uni.saveFile !== 'function') {
							saveAvatar(tempFilePath)
							return
						}
						uni.saveFile({
							tempFilePath,
							success: saved => saveAvatar(saved.savedFilePath),
							fail: () => saveAvatar(tempFilePath)
						})
					}
				})
			},
			clickName() {
				// console.log("昵称被点击");
				// 修改昵称  修改后保存在本地存储中 并修改数据库中的nickname
				this.showNicaNamePop = true
			},
			// 点击修改昵称pop的确认按钮触发
			submitName(res) {
				// 需要判断是否为空
				if (!res.detail.value.nickname.trim()) {
					this.$refs.uToastForNickname.show({
						message :"输入内容不可以为空！",
						type: 'error',
						position: 'top'
					})
					return
				}
				this.userInfo.nickname = res.detail.value.nickname
				saveLocalUserInfo(this.userInfo)
				this.showNicaNamePop = false
			},
			getUserInfo() {
				Object.assign(this.userInfo, getLocalUserInfo())
				this.registerDateForTitle = uni.$u.timeFormat(Date.parse(this.userInfo.registerDate),'yyyy年mm月')
			}
		},
		onReady() {
			this.getUserInfo()
		}
	}
</script>

<style lang="scss" scoped>
	.userInfo {
		position: relative;
		.linear-gradient {
			position: absolute;
			top: -24rpx;
			left: 0;
			right: 0;
			height: 130rpx;
			background-image: linear-gradient(#9fcba7, #fafafa);
			z-index: -1;
		}
		.me {
			display: flex;
			justify-content: start;
			align-items: center;
			.avatar {
				position: relative;
				.avatarBtn {
					position: absolute;
					top: 0;
					right: 0;
					bottom: 0;
					left: 0;
					opacity: 0;
				}
			}
			.main {
				margin-left: 20rpx;
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
		.userinfo-icon {
			padding-right: 24rpx;
		}
		.btn {
			margin-top: 10px;
			font-size: 32rpx;
			border: none;
			color: $mj-theme-color;
			background-color: #fff;
		}
	}
</style>
