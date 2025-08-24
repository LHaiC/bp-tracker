// script.js
document.addEventListener('DOMContentLoaded', () => {
    // 你的 GitHub 用户名和仓库名 (用于读取数据)
    const GITHUB_OWNER = 'LHaiC';
    const GITHUB_REPO = 'bp-tracker';

    // 你的 Netlify 函数的完整 URL (用于写入数据)
    // 这是最关键的修改！
    const NETLIFY_FUNCTION_URL = 'https://clever-bublanina-226ced.netlify.app/.netlify/functions/update-data';

    const bpForm = document.getElementById('bp-form');
    const statusMessage = document.getElementById('status-message');
    const bpHistory = document.getElementById('bp-history');
    const submitBtn = document.getElementById('submit-btn');
    const dataFilePath = 'blood_pressure_data.json';
    
    let myChart = null;

    function renderChart(data) {
        const ctx = document.getElementById('bpChart').getContext('2d');
        if (myChart) {
            myChart.destroy();
        }
        const reversedData = [...data].reverse();
        const labels = reversedData.map(d => d.dateTime);
        const systolicData = reversedData.map(d => d.systolic);
        const diastolicData = reversedData.map(d => d.diastolic);
        const pulseData = reversedData.map(d => d.pulse);
        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: '收缩压 (高压)', data: systolicData, borderColor: 'rgba(255, 99, 132, 1)', backgroundColor: 'rgba(255, 99, 132, 0.2)', tension: 0.1, yAxisID: 'y' },
                    { label: '舒张压 (低压)', data: diastolicData, borderColor: 'rgba(54, 162, 235, 1)', backgroundColor: 'rgba(54, 162, 235, 0.2)', tension: 0.1, yAxisID: 'y' },
                    { label: '心率', data: pulseData, borderColor: 'rgba(75, 192, 192, 1)', backgroundColor: 'rgba(75, 192, 192, 0.2)', tension: 0.1, yAxisID: 'yPulse', hidden: true }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    y: { type: 'linear', display: true, position: 'left', title: { display: true, text: '血压 (mmHg)' } },
                    yPulse: { type: 'linear', display: true, position: 'right', title: { display: true, text: '心率 (次/分)' }, grid: { drawOnChartArea: false } }
                }
            }
        });
    }

    async function loadHistory() {
        bpHistory.innerHTML = '<tr><td colspan="5">正在加载历史记录...</td></tr>';
        try {
            const response = await fetch(`https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${dataFilePath}?_=${new Date().getTime()}`);
            if (!response.ok) throw new Error(`网络错误: ${response.statusText}`);
            const data = await response.json();
            bpHistory.innerHTML = '';
            if (data.length === 0) {
                bpHistory.innerHTML = '<tr><td colspan="5">还没有任何记录。</td></tr>';
                document.getElementById('chart-container').style.display = 'none';
                return;
            } else {
                document.getElementById('chart-container').style.display = 'block';
            }
            data.forEach(record => {
                const row = document.createElement('tr');
                row.innerHTML = `<td>${record.dateTime}</td><td>${record.systolic}</td><td>${record.diastolic}</td><td>${record.pulse || 'N/A'}</td><td>${record.notes || ''}</td>`;
                bpHistory.appendChild(row);
            });
            renderChart(data);
        } catch (error) {
            console.error('加载历史数据时出错:', error);
            bpHistory.innerHTML = `<tr><td colspan="5">加载历史数据失败: ${error.message}</td></tr>`;
        }
    }

    bpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newRecord = {
            systolic: parseInt(document.getElementById('systolic').value),
            diastolic: parseInt(document.getElementById('diastolic').value),
            pulse: parseInt(document.getElementById('pulse').value) || null,
            notes: document.getElementById('notes').value.trim(),
            dateTime: new Date().toLocaleString('zh-CN', { hour12: false }),
            password: document.getElementById('password').value
        };
        submitBtn.disabled = true;
        statusMessage.textContent = '正在保存，请稍候...';
        statusMessage.style.color = '#333';
        try {
            // 这里是关键修改：使用完整的 URL 来调用函数
            const response = await fetch(NETLIFY_FUNCTION_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRecord),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || '来自服务器的未知错误');
            statusMessage.textContent = '保存成功！数据正在刷新...';
            statusMessage.style.color = 'green';
            bpForm.reset();
            setTimeout(loadHistory, 3000);
        } catch (error) {
            console.error('保存数据时出错:', error);
            statusMessage.textContent = `错误: ${error.message}`;
            statusMessage.style.color = 'red';
        } finally {
            setTimeout(() => {
                submitBtn.disabled = false;
            }, 3000);
        }
    });
    loadHistory();
});