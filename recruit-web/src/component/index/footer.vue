<!-- 页面的页脚模块（用于显示版权信息） -->
<template>
	<div class="footer">
		<div class="footerContain">
			<div class="footeright">
				<span v-for="(list, index) in lists" :key="index" @click="handleLinkClick(list)">{{ list }}</span>
				<p>&copy; {{ currentYear }} 蜗牛兼职平台 <a href="https://beian.miit.gov.cn/" target="_blank">自强不息、厚德载物</a></p>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	data() {
		return {
			currentYear: new Date().getFullYear(),
			lists: ['蜗牛兼职平台', '帮助中心', '联系我们', '招聘解决方案', '服务热线：13888888888']
		}
	},
	methods: {
		handleLinkClick(item) {
			// 可以根据点击的链接执行不同的操作
			console.log('点击了:', item);
			// 如果需要，这里可以添加导航或其他功能
		}
	}
}
</script>

<style lang="scss">
$nx-color3: #62b7f3;
$nx-color4: #0f46a0;

.footer {
	width: 100%;
	height: auto;
	min-height: 9rem;
	margin-top: 1rem;
	border-top: 1px solid #ddd;
	background: linear-gradient(to right, #5ba4e5, #62b7f3);
	box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
	overflow: hidden;
	
	.footerContain {
		position: relative;
		width: 76.25rem;
		max-width: 95%;
		margin: 2rem auto;
		
		.footeright {
			text-align: center;
			padding: 0 1rem;
			
			span {
				display: inline-block;
				padding: 0.6rem 1rem 1rem 0;
				color: #fff;
				cursor: pointer;
				transition: all 0.3s ease;
				font-size: 1rem;
				margin: 0 0.3rem;
				position: relative;
				
				&:hover {
					color: $nx-color4;
					transform: translateY(-2px);
				}
				
				&:after {
					content: '';
					position: absolute;
					bottom: 0.7rem;
					left: 0;
					width: 0;
					height: 2px;
					background-color: #fff;
					transition: width 0.3s ease;
				}
				
				&:hover:after {
					width: calc(100% - 1rem);
				}
			}
			
			p {
				padding-bottom: 0.6rem;
				color: #fff;
				margin-top: 1rem;
				font-size: 0.9rem;
				
				a {
					color: #fff;
					text-decoration: none;
					position: relative;
					transition: all 0.3s ease;
					
					&:hover {
						color: $nx-color4;
					}
					
					&:after {
						content: '';
						position: absolute;
						bottom: -2px;
						left: 0;
						width: 0;
						height: 1px;
						background-color: #fff;
						transition: width 0.3s ease;
					}
					
					&:hover:after {
						width: 100%;
					}
				}
			}
		}
	}
}

/* 响应式设计 */
@media (max-width: 768px) {
	.footer {
		.footerContain {
			.footeright {
				padding: 0;
				
				span {
					padding: 0.5rem 0.7rem;
					margin: 0 0.1rem;
					font-size: 0.9rem;
				}
			}
		}
	}
}
</style>