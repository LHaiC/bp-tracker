const { Octokit } = require("@octokit/rest");

exports.handler = async function(event, context) {
  // 只接受 POST 请求
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // 从环境变量中安全地获取 GitHub 令牌
  const { GITHUB_TOKEN } = process.env;
  if (!GITHUB_TOKEN) {
    return { statusCode: 500, body: JSON.stringify({ message: "GitHub Token not configured." }) };
  }
  
  // ****** 在这里修改成你自己的信息 ******
  const GITHUB_OWNER = "[你的GitHub用户名]";
  const GITHUB_REPO = "bp-tracker";
  // ************************************

  const octokit = new Octokit({ auth: GITHUB_TOKEN });
  const DATA_FILE_PATH = 'blood_pressure_data.json';
  const newRecord = JSON.parse(event.body);

  try {
    // 1. 获取现有文件的内容和 SHA
    const { data: fileData } = await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: DATA_FILE_PATH,
    });

    const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
    const data = JSON.parse(content);

    // 2. 将新记录添加到数组的开头
    data.unshift(newRecord);

    // 3. 更新 GitHub 上的文件
    await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: DATA_FILE_PATH,
      message: `feat: Add new blood pressure record on ${newRecord.dateTime}`,
      content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
      sha: fileData.sha, // 提供文件的 SHA 是必须的，以防止覆盖冲突
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "数据保存成功！" }),
    };
  } catch (error) {
    console.error("Error updating data:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: `保存数据时出错: ${error.message}` }),
    };
  }
};