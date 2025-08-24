// netlify/functions/update-data.js (最终版)
const { Octokit } = require("@octokit/rest");

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  const { GITHUB_TOKEN, BP_PASSWORD } = process.env;

  if (!GITHUB_TOKEN || !BP_PASSWORD) {
    const missingVar = !GITHUB_TOKEN ? "GitHub Token" : "Password";
    return { statusCode: 500, headers, body: JSON.stringify({ message: `服务器配置错误: ${missingVar} 未设置。` }) };
  }
  
  const GITHUB_OWNER = 'LHaiC';
  const GITHUB_REPO = "bp-tracker";
  const DATA_FILE_PATH = 'blood_pressure_data.json';
  
  const octokit = new Octokit({ auth: GITHUB_TOKEN });
  
  const newRecord = JSON.parse(event.body);

  if (newRecord.password !== BP_PASSWORD) {
    return { statusCode: 401, headers, body: JSON.stringify({ message: "密码错误，禁止访问。" }) };
  }

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

    return { statusCode: 200, headers, body: JSON.stringify({ message: "数据保存成功！" }) };
  } catch (error) {
    console.error("Error updating data:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ message: `保存数据时出错: ${error.message}` }) };
  }
};