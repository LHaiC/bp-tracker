// netlify/functions/update-data.js (完整代码)
const { Octokit } = require("@octokit/rest");

// 定义 headers，用于允许来自 GitHub Pages 的跨域请求
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async function(event, context) {
  // 响应浏览器的 OPTIONS "预检"请求
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  // 从环境变量中同时获取 GITHUB_TOKEN 和 BP_PASSWORD
  const { GITHUB_TOKEN, BP_PASSWORD } = process.env;

  if (!GITHUB_TOKEN || !BP_PASSWORD) {
    const missingVar = !GITHUB_TOKEN ? "GitHub Token" : "Blood Pressure Password";
    return { statusCode: 500, headers, body: JSON.stringify({ message: `服务器配置错误: ${missingVar} 未设置。` }) };
  }
  
  const GITHUB_OWNER = 'LHaiC'; // 已根据你的截图自动填入
  const GITHUB_REPO = "bp-tracker";
  const DATA_FILE_PATH = 'blood_pressure_data.json';
  
  const newRecord = JSON.parse(event.body);

  // --- 新增: 密码验证逻辑 ---
  if (newRecord.password !== BP_PASSWORD) {
    return {
      statusCode: 401, // 401 Unauthorized
      headers,
      body: JSON.stringify({ message: "密码错误，禁止访问。" })
    };
  }
  // --- 密码验证结束 ---

  // 从记录中删除密码，我们绝不把密码存入JSON文件
  delete newRecord.password;

  try {
    const { data: fileData } = await octokit.repos.getContent({
      owner: GITHUB_OWNER, repo: GITHUB_REPO, path: DATA_FILE_PATH,
    });
    const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
    const data = JSON.parse(content);
    data.unshift(newRecord);
    await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_OWNER, repo: GITHUB_REPO, path: DATA_FILE_PATH,
      message: `feat: Add new blood pressure record on ${newRecord.dateTime}`,
      content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
      sha: fileData.sha,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "数据保存成功！" }),
    };
  } catch (error) {
    console.error("Error updating data:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: `保存数据时出错: ${error.message}` }),
    };
  }
};