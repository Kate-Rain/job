<!-- 首页热门公司的公司卡片模块 -->
<template>
	<div class="hotCompany">
		<el-dialog :visible.sync="showDetail" :before-close="detailClose">
			<div style="margin-left:0; text-align: center">
				<company-detail v-if="showDetail" @detailClose="detailClose" :detailCompanyID="detailCompanyID" :temp="1">
				</company-detail>
			</div>
		</el-dialog>
		<ul class="companyContain">
			<li v-for="(company,index) in companys" :key="index" class="companylist">
				<div class="logo-img">
					<span v-if="company.poster" class="none_poster">
						<img :src="company.poster">
					</span>
					<span v-else class="none_poster">
						<div>
							<p>该公司没有上传招聘海报</p>
						</div>
						<img :src="defeult_poster">
					</span>
				</div>
				<div class="hotCompany_list">
					<div class="hotCompany_Up">
						<img :src="company.logo" alt="">
						<div class="companyName" @click="handleDetail(company)">
							{{company.name}}
							<span class="ref" :title="company.foreign_name">({{company.foreign_name}})</span>
						</div>
					</div>
					<div class="hotCompany_Down">
						<div>
							<p><i class="el-icon-map-location"></i> <span>{{company.city}}</span></p>
						</div>
						<div class="work-mission">
							<span style="line-height: 20px">{{company.mission}}</span>
						</div>
					</div>
				</div>
			</li>
		</ul>
	</div>
</template>

<script>
import CompanyDetail from '@/view/company/company-detail'

export default {
	components: {
		CompanyDetail
	},
	data() {
		return {
			defeult_poster: require("@/assets/image/company/none.png"),
			showDetail: false,
			detailCompanyID: 0
		}
	},
	props: ['companys'],
	methods: {
		handleDetail(company) {
			this.showDetail = true;
			this.detailCompanyID = company.id;
		},
		detailClose() {
			this.showDetail = false;
		}
	}
}
</script>

<style lang="scss">
$nx-width: 76.25rem;
$nx-color2: #0470B8;
.word {
	text-overflow: ellipsis;
	overflow: hidden;
	white-space: nowrap;
}
.hotCompany {
	width: 100%;
	.companyContain {
		width: 76rem;
		margin: 1rem auto;
		zoom: 1;
		&:after {
			display: block;
			content: '.';
			clear: both;
			line-height: 0;
			visibility: hidden;
		}
		.companylist {
			float: left;
			width: 17.8rem;
			height: 16.75rem;
			border: 1px solid #eee;
			margin: 1rem 1rem 0 0;
			overflow: hidden;
			position: relative;
			cursor: pointer;
			transition: transform 0.3s, box-shadow 0.3s;

			&:hover {
				transform: translateY(-5px);
				box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
				
				> .logo-img {
					left: -17.8rem;
					opacity: .5;
					background-color: #f5f5f536;
					border-radius: 5px;
				}
				
				.companyName {
					color: $nx-color2;
				}
			}
			> .hotCompany_list {
				width: 100%;
				height: 100%;
				overflow: hidden;
				text-align: center;
				padding: 1rem;
				display: flex;
				flex-direction: column;
				
				.hotCompany_Up {
					padding-bottom: 1rem;
					img {
						display: block;
						width: 7rem;
						height: 7rem;
						object-fit: contain;
						margin: 0 auto;
					}
					.companyName {
						display: block;
						margin-top: 1rem;
						line-height: 1rem;
						font-weight: bold;
						cursor: pointer;
						transition: color 0.3s ease;
						
						&:hover {
							color: $nx-color2;
						}
					}
					.ref {
						width: 100%;
						line-height: 1rem;
						font-size: 0.8rem;
						color: #444;
						@extend .word;
					}
				}
				.hotCompany_Down {
					display: flex;
					flex-direction: column;
					flex: 1;
					
					.work-mission {
						display: inline-block;
						margin-top: 10px !important;
						width: 100%;
						flex: 1;
						
						span {
							font-size: 0.9rem;
							color: #606266;
							display: -webkit-box;
							-webkit-line-clamp: 2;
							-webkit-box-orient: vertical;
							overflow: hidden;
							height: 2.8rem;
						}
					}
					
					.view-more-btn {
						margin-top: auto;
						align-self: center;
					}
				}
			}
		}

		.logo-img {
			position: absolute;
			width: 100%;
			height: 100%;
			padding: 0;
			margin: 0;
			pointer-events: none;
			transition: all .5s;
			left: 0;
			top: 0;
			background-color: #f5f5f5d9;
			z-index: 10;
			
			img {
				width: 100%;
				height: 100%;
				opacity: 1;
				object-fit: cover;
			}
			.none_poster div {
				width: 100%;
				height: 100%;
				font-size: 18px;
				position: absolute;
				font-weight: bolder;
				display: flex;
				align-items: center;
				justify-content: center;
				background: #1c1c1c24;

				p {
					background-color: #ffffffbd;
					padding: 10px;
					width: 100%;
					font-weight: bolder;
				}
			}
		}
	}
}

// 对话框样式调整
.el-dialog__header {
	padding: 10px;
}
.el-dialog__body {
	padding: 0;
}
</style>