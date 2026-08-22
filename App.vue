<script>
import { initializeLocalData } from '@/utils/local-db.js'
import { processDueCronTasks } from '@/utils/local-cron.js'

export default {
  onLaunch: async function () {
	initializeLocalData()
	await processDueCronTasks()
    console.log("妙记本地版已启动");
  },
  onShow: async function () {
	await processDueCronTasks()
  },
  onHide: function () {
    console.log("App Hide");
  },
};
</script>

<style lang="scss">
/*每个页面公共css */
// 引入uView基础样式
@import "@/uni_modules/uview-ui/index.scss";
// 引入自定义图标库
@import "@/static/iconfont.css";

// 为每个页面设置公共样式
page {
	background-color: $mj-bg-color;
}

</style>
