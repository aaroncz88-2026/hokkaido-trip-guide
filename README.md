# 夏日北行

2026 年 8 月 23–30 日北海道亲子自驾手机攻略。内容基于腾讯文档
`2026·日本暑期游·23~30` 的脱敏快照，并参考旅行规划对话补充现场信息。

## 功能

- DAY1–DAY8 每日时间轴、分工、费用与资料链接
- 景点一键打开 Google Maps 导航
- 餐饮预约、预算、行李和应急速查
- 行程与行李勾选状态保存在当前设备
- 手机竖屏布局、可添加到桌面、访问后可离线打开
- 全局搜索景点、餐厅、家庭分工与旅行手册

## 本地运行

```bash
npm install
npm run dev
```

生产验证：

```bash
npm run lint
npm run build
npm run preview
```

## 发布到 GitHub Pages

1. 在 GitHub 新建一个空仓库。
2. 将本项目提交并推送到仓库的 `main` 分支。
3. 在仓库 `Settings → Pages → Build and deployment` 中选择 `GitHub Actions`。
4. 工作流完成后，Pages 页面会显示 HTTPS 访问地址。

项目中的 `.github/workflows/deploy.yml` 会自动构建并发布 `dist`。

## 更新攻略数据

- 腾讯文档脱敏快照位于 `src/data/sheetData.json`。
- 每日标题、导航、天气备选和旅行手册位于 `src/data/trip.ts`。
- 在线表格修改后需要重新导入快照；网页不会在旅行中实时依赖腾讯文档。
- 公开发布前继续检查是否包含护照、证件、订单、电话或私人住址。
