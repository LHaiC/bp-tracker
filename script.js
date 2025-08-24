document.addEventListener('DOMContentLoaded', () => {
    // ****** 在这里修改成你自己的信息 ******
    const GITHUB_OWNER = 'LHaiC';
    const GITHUB_REPO = 'bp-tracker';
    // ************************************

    const bpForm = document.getElementById('bp-form');
    const statusMessage = document.getElementById('status-message');
    const bpHistory = document.getElementById('bp-history');
    const submitBtn = document.getElementById('submit-btn');
    const dataFilePath = 'blood_pressure_data.json';

    // 函数：加载并显示历史数据
    async function loadHistory() {
        bpHistory.innerHTML = '<tr><td colspan="5">正在加载历史记录...</td></tr>';
        try {
            // 使用随机查询参数避免浏览器缓存旧数据
            const response = await fetch(`https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${dataFilePath}?_=${new Date().getTime()}`);
            if (!response.ok) {
                throw new Error(`网络错误: ${response.statusText}`);
            }
            const data = await response.json();

            bpHistory.innerHTML = ''; // 清空列表
            if (data.length === 0) {
                bpHistory.innerHTML = '<tr><td colspan="5">还没有任何记录。</td></tr>';
                return;
            }

            data.forEach(record => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${record.dateTime}</td>
                    <td>${record.systolic}</td>
                    <td>${record.diastolic}</td>
                    <td>${record.pulse || 'N/A'}</td>
                    <td>${record.notes || ''}</td>
                `;
                bpHistory.appendChild(row);
            });
        } catch (error) {
            console.error('加载历史数据时出错:', error);
            bpHistory.innerHTML = `<tr><td colspan="5">加载历史数据失败: ${error.message}</td></tr>`;
        }
    }

    // 表单提交事件
    bpForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newRecord = {
            systolic: parseInt(document.getElementById('systolic').value),
            diastolic: parseInt(document.getElementById('diastolic').value),
            pulse: parseInt(document.getElementById('pulse').value) || null,
            notes: document.getElementById('notes').value.trim(),
            dateTime: new Date().toLocaleString('zh-CN', { hour12: false })
        };

        submitBtn.disabled = true;
        statusMessage.textContent = '正在保存，请稍候...';
        statusMessage.style.color = '#333';

        try {
            // 调用我们部署在 Netlify 上的无服务器函数
            const response = await fetch('/.netlify/functions/update-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRecord),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || '来自服务器的未知错误');
            }

            statusMessage.textContent = '保存成功！数据正在刷新...';
            statusMessage.style.color = 'green';
            bpForm.reset();
            
            // 等待2-3秒，给 GitHub 一点时间来更新文件，然后再重新加载历史记录
            setTimeout(loadHistory, 3000);

        } catch (error) {
            console.error('保存数据时出错:', error);
            statusMessage.textContent = `错误: ${error.message}`;
            statusMessage.style.color = 'red';
        } finally {
            // 3秒后无论成功失败都重新启用按钮
            setTimeout(() => {
                submitBtn.disabled = false;
            }, 3000);
        }
    });

    // 页面加载后，立即加载一次历史数据
    loadHistory();
});