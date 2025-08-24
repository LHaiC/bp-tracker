# 个人血压追踪器 (BP Tracker)

这是一款免费、完全由你掌控的个人血压记录与可视化工具。它利用 GitHub Pages 作为前端展示，并通过 Netlify Functions 提供的无服务器后端，将你的血压数据安全地存储在你自己的 GitHub 仓库中。

**[查看 Demo](https://www.haichuanliu.top/bp-tracker/)**

## ✨ 功能特性

*   **数据可视化**: 将历史血压和心率数据以清晰的图表展示。
*   **健康参考线**: 在图表上自动绘制“较高血压”和“高血压”的警戒线。
*   **智能颜色标注**: 在历史记录表格中，根据血压水平（正常、较高、高血压）为单元格独立着色。
*   **密码保护**: 只有输入正确的密码才能提交新纪录，确保数据安全。
*   **完全免费**: 整个系统搭建在 GitHub Pages 和 Netlify 的免费套餐上，无任何服务器费用。
*   **数据私有**: 所有血压数据都存储在你自己的 GitHub 仓库中，由你完全掌控。
*   **响应式设计**: 在桌面和移动设备上均有良好体验。

## 🛠️ 技术架构

本项目采用前后端分离的无服务器（Serverless）架构，数据流清晰且安全：

```mermaid
graph LR
    subgraph 浏览器
        A[用户访问你的 GitHub Pages 网站]
    end

    subgraph Netlify 云服务
        B[Netlify Function (API)]
    end

    subgraph 你的 GitHub 仓库
        C[blood_pressure_data.json]
    end

    A -- "1. 提交新数据(带密码)" --> B
    B -- "2. 验证密码并使用Token安全更新" --> C
    A -- "3. 页面加载时直接读取" --> C
```

## 🚀 部署你自己的血压追踪器

你可以轻松地 Fork 本仓库，并部署一个完全属于你自己的版本。

### 第 1 步：Fork 本仓库

点击本页面右上角的 **Fork** 按钮，将此仓库复制到你自己的 GitHub 账户下。

### 第 2 步：个性化代码

在你 Fork 后的仓库中，有 **2 个文件**需要修改，将 `LHaiC` 替换成你自己的 GitHub 用户名。

1.  **`script.js`**:
    *   找到 `const GITHUB_OWNER = 'LHaiC';` 这一行，将其中的 `'LHaiC'` 改成 `'你的GitHub用户名'`。
    *   `const NETLIFY_FUNCTION_URL = '...';` 这一行**先不要修改**，我们会在第4步获得正确的地址后再回来修改。

2.  **`netlify/functions/update-data.js`**:
    *   找到 `const GITHUB_OWNER = 'LHaiC';` 这一行，同样将其中的 `'LHaiC'` 改成 `'你的GitHub用户名'`。

### 第 3 步：部署到 Netlify

1.  访问 [Netlify.com](https://www.netlify.com) 并使用你的 GitHub 账户登录。
2.  在仪表盘中，点击 **"Add new site"** -> **"Import an existing project"**。
3.  选择 **"Deploy with GitHub"** 并授权。
4.  在仓库列表中，选择你刚刚 Fork 的 `bp-tracker` 仓库。
5.  Netlify 会自动识别 `netlify.toml` 配置文件，你**无需修改任何构建设置**，直接点击 **"Deploy site"**。
6.  部署成功后，Netlify 会提供给你一个默认的网址，例如 `https://some-name-12345.netlify.app`。**请复制这个网址**，我们下一步会用到。

### 第 4 步：更新前端代码中的 API 地址

现在回到你 GitHub 仓库中的 `script.js` 文件，进行编辑。

1.  找到下面这一行：
    ```javascript
    const NETLIFY_FUNCTION_URL = 'https://clever-bublanina-226ced.netlify.app/.netlify/functions/update-data';
    ```
2.  将其中的 `https://clever-bublanina-226ced.netlify.app` 替换成**你在第3步复制的你自己的 Netlify 网站地址**。
3.  提交这个修改。

### 第 5 步：在 Netlify 中设置密码和API密钥

这是保证安全的核心步骤。

1.  **生成 GitHub 访问令牌 (PAT)**:
    *   前往你的 [GitHub Fine-grained tokens 设置页面](https://github.com/settings/tokens?type=beta)。
    *   点击 **"Generate new token"**。
    *   **Token name**: 任意填写，例如 `bp-tracker-token`。
    *   **Repository access**: 选择 **"Only select repositories"**，然后选择你的 `bp-tracker` 仓库。
    *   **Permissions**: 找到 **"Contents"**，将其权限设置为 **"Read and write"**。
    *   点击 **"Generate token"**，并**立即复制生成的令牌**（`github_pat_...`），这个令牌只会显示一次。

2.  **在 Netlify 中设置变量**:
    *   进入你刚刚在 Netlify 上创建的站点。
    *   前往 **"Site configuration"** -> **"Build & deploy"** -> **"Environment"**。
    *   点击 **"Edit variables"**，添加以下两个变量：
        *   **Key**: `GITHUB_TOKEN` | **Value**: (粘贴你刚刚复制的 GitHub 令牌)
        *   **Key**: `BP_PASSWORD` | **Value**: (设置一个你自己的用于提交数据的强密码)
    *   点击 **"Save"**。

3.  **重新部署**:
    *   由于你刚刚在第4步提交了代码更新，Netlify 应该会自动开始一次新的部署。如果没有，可以去站点的 **"Deploys"** 页面，点击 **"Trigger deploy"** 下拉菜单 -> **"Deploy project without cache"**。(选项的文字可能会更新，选择清除缓存并部署的那个即可)

### 第 6 步：启用 GitHub Pages

1.  在你的 GitHub `bp-tracker` 仓库页面，点击 **Settings** -> **Pages**。
2.  在 **Branch** 部分，选择 `main` 作为源，然后点击 **Save**。
3.  等待片刻，页面会刷新并显示你的 GitHub Pages 网址。

### 第 7 步：开始使用！

恭喜！现在访问你的 GitHub Pages 网址，就可以开始记录你的血压了！
