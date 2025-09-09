# GitHub 发版到自定义域名指南

## 步骤1: 提交代码到GitHub

首先确保您的代码已经提交到GitHub仓库：

```bash
git add .
git commit -m "准备部署到生产环境"
git push origin main
```

## 步骤2: 在GitHub上配置Pages

1. 访问您的GitHub仓库页面
2. 点击 "Settings" 标签
3. 在左侧菜单中选择 "Pages"
4. 在 "Build and deployment" 部分：
   - Source: 选择 "GitHub Actions"
5. 保存设置

## 步骤3: 配置自定义域名

1. 在GitHub Pages设置页面的 "Custom domain" 部分：
   - 输入您的域名: `litiezhu.xyz`
   - 勾选 "Enforce HTTPS"
2. 在您的域名注册商处设置DNS：
   - 添加CNAME记录：`@` -> `your-username.github.io`
   - 或者添加A记录：`@` -> `185.199.108.153` (GitHub Pages IP)

## 步骤4: 触发部署

当您推送代码到main分支时，GitHub Actions会自动触发部署。您也可以手动触发：

1. 访问仓库的 "Actions" 标签
2. 选择 "Deploy to GitHub Pages" workflow
3. 点击 "Run workflow"

## 步骤5: 验证部署

部署完成后，访问以下地址验证：
- GitHub Pages地址: `https://your-username.github.io/repo-name`
- 自定义域名: `https://litiezhu.xyz`

## 故障排除

### 如果部署失败：
1. 检查GitHub Actions日志
2. 确保所有文件都已提交
3. 验证CNAME文件内容正确

### 如果自定义域名无法访问：
1. 检查DNS设置是否正确
2. 等待DNS传播（最多24小时）
3. 验证GitHub Pages设置中的自定义域名

## 自动化部署流程

每次您推送代码到main分支时，GitHub Actions会自动：
1. 检出代码
2. 构建项目（如果需要）
3. 部署到GitHub Pages
4. 更新自定义域名内容

## 注意事项

1. 确保您的域名已正确配置SSL证书
2. GitHub Pages有构建限制，请确保项目文件大小合理
3. 部署过程通常需要1-5分钟完成