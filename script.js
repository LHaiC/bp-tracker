// script.js (最终完美版 - 滚动图表)
document.addEventListener('DOMContentLoaded', () => {
    const GITHUB_OWNER = 'LHaiC';
    const GITHUB_REPO = 'bp-tracker';
    const NETLIFY_FUNCTION_URL = 'https://clever-bublanina-226ced.netlify.app/.netlify/functions/update-data';
    const dataFilePath = 'blood_pressure_data.json';
    const bpForm = document.getElementById('bp-form');
    const statusMessage = document.getElementById('status-message');
    const bpHistory = document.getElementById('bp-history');
    const submitBtn = document.getElementById('submit-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const chartWrapper = document.getElementById('chart-scroll-wrapper');
    let myChart = null;

    function getSystolicLevel(systolic) { if (systolic >= 140) return 'bp-high'; if (systolic >= 130) return 'bp-elevated'; return 'bp-normal'; }
    function getDiastolicLevel(diastolic) { if (diastolic >= 90) return 'bp-high'; if (diastolic >= 80) return 'bp-elevated'; return 'bp-normal'; }

    function renderChart(data) {
        const ctx = document.getElementById('bpChart').getContext('2d');
        if (myChart) myChart.destroy();
        const reversedData = [...data].reverse();
        const labels = reversedData.map(d => d.dateTime);
        const systolicData = reversedData.map(d => d.systolic);
        const diastolicData = reversedData.map(d => d.diastolic);
        const pulseData = reversedData.map(d => d.pulse);

        // --- 核心修改：动态设置图表canvas的父容器宽高 ---
        const baseWidth = chartWrapper.offsetWidth > 0 ? chartWrapper.offsetWidth - 30 : 600; // 获取滚动容器的可见宽度并减去内边距
        const calculatedWidth = reversedData.length * 50; // 每个数据点分配50px宽度
        const finalWidth = Math.max(baseWidth, calculatedWidth); // 最终宽度取较大者
        
        ctx.canvas.parentElement.style.width = finalWidth + 'px';
        ctx.canvas.parentElement.style.height = '350px'; // 固定一个美观的纵向高度

        myChart = new Chart(ctx, {
            type: 'line',
            data: { labels: labels, datasets: [ { label: '收缩压 (高压)', data: systolicData, borderColor: 'rgba(255, 99, 132, 1)', tension: 0.1, yAxisID: 'y' }, { label: '舒张压 (低压)', data: diastolicData, borderColor: 'rgba(54, 162, 235, 1)', tension: 0.1, yAxisID: 'y' }, { label: '心率', data: pulseData, borderColor: 'rgba(75, 192, 192, 1)', tension: 0.1, yAxisID: 'yPulse', hidden: true } ] },
            options: {
                responsive: true,
                maintainAspectRatio: false, // 必须设置为false！
                scales: { y: { min: 50, max: 180, title: { display: true, text: '血压 (mmHg)' } }, yPulse: { position: 'right', min: 40, max: 120, title: { display: true, text: '心率 (次/分)' }, grid: { drawOnChartArea: false }, } },
                plugins: { annotation: { annotations: { systolicHigh: { type: 'line', yMin: 140, yMax: 140, borderColor: 'rgba(255, 99, 132, 0.5)', borderWidth: 2, borderDash: [6, 6], label: { content: '高压-高', position: 'end', backgroundColor: 'rgba(255, 99, 132, 0.5)', color: 'white', font: { size: 10 } } }, systolicElevated: { type: 'line', yMin: 130, yMax: 130, borderColor: 'rgba(255, 159, 64, 0.5)', borderWidth: 2, borderDash: [6, 6], label: { content: '高压-较高', position: 'end', backgroundColor: 'rgba(255, 159, 64, 0.5)', color: 'white', font: { size: 10 } } }, diastolicHigh: { type: 'line', yMin: 90, yMax: 90, borderColor: 'rgba(54, 162, 235, 0.5)', borderWidth: 2, borderDash: [6, 6], label: { content: '低压-高', position: 'end', backgroundColor: 'rgba(54, 162, 235, 0.5)', color: 'white', font: { size: 10 } } }, diastolicElevated: { type: 'line', yMin: 80, yMax: 80, borderColor: 'rgba(75, 192, 192, 0.5)', borderWidth: 2, borderDash: [6, 6], label: { content: '低压-较高', position: 'end', backgroundColor: 'rgba(75, 192, 192, 0.5)', color: 'white', font: { size: 10 } } } } } }
            }
        });
        // 渲染后，让滚动条自动滚动到最右侧，显示最新的数据
        chartWrapper.scrollLeft = chartWrapper.scrollWidth;
    }
    
    async function loadHistory() {
        bpHistory.innerHTML = '<tr><td colspan="5">正在加载...</td></tr>';
        try {
            const response = await fetch(`https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${dataFilePath}?_=${new Date().getTime()}`);
            if (!response.ok) throw new Error(`网络错误: ${response.statusText}`);
            const data = await response.json();
            bpHistory.innerHTML = '';
            if (data.length === 0) {
                bpHistory.innerHTML = '<tr><td colspan="5">无记录。</td></tr>';
                document.getElementById('chart-container').style.display = 'none';
                return;
            } else {
                document.getElementById('chart-container').style.display = 'block';
            }
            data.forEach(record => {
                const row = bpHistory.insertRow();
                const systolicClass = getSystolicLevel(record.systolic);
                const diastolicClass = getDiastolicLevel(record.diastolic);
                row.insertCell(0).textContent = record.dateTime;
                const systolicCell = row.insertCell(1);
                systolicCell.textContent = record.systolic;
                systolicCell.className = systolicClass;
                const diastolicCell = row.insertCell(2);
                diastolicCell.textContent = record.diastolic;
                diastolicCell.className = diastolicClass;
                row.insertCell(3).textContent = record.pulse || 'N/A';
                row.insertCell(4).textContent = record.notes || '';
            });
            renderChart(data);
        } catch (error) {
            console.error('加载历史数据出错:', error);
            bpHistory.innerHTML = `<tr><td colspan="5">加载失败: ${error.message}</td></tr>`;
        }
    }
    refreshBtn.addEventListener('click', () => { statusMessage.textContent = '正在刷新数据...'; statusMessage.style.color = '#333'; loadHistory(); setTimeout(() => { statusMessage.textContent = ''; }, 2000); });
    bpForm.addEventListener('submit', async (e) => { e.preventDefault(); const newRecord = { systolic: parseInt(document.getElementById('systolic').value), diastolic: parseInt(document.getElementById('diastolic').value), pulse: parseInt(document.getElementById('pulse').value) || null, notes: document.getElementById('notes').value.trim(), dateTime: new Date().toLocaleString('zh-CN', { hour12: false }), password: document.getElementById('password').value }; submitBtn.disabled = true; statusMessage.textContent = '正在保存...'; statusMessage.style.color = '#333'; try { const response = await fetch(NETLIFY_FUNCTION_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRecord), }); const result = await response.json(); if (!response.ok) throw new Error(result.message || '未知错误'); statusMessage.textContent = '保存成功！'; statusMessage.style.color = 'green'; bpForm.reset(); setTimeout(loadHistory, 3000); } catch (error) { console.error('保存数据出错:', error); statusMessage.textContent = `错误: ${error.message}`; statusMessage.style.color = 'red'; } finally { setTimeout(() => { submitBtn.disabled = false; }, 3000); } });
    loadHistory();
});