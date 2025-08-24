// script.js (最终版 - 包含所有高级功能)
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
    
    let myChart = null;

    // --- 新增: 血压水平判断函数 ---
    // 根据 systolic (收缩压) 和 diastolic (舒张压) 返回对应的CSS类名
    function getBloodPressureLevel(systolic, diastolic) {
        if (systolic >= 140 || diastolic >= 90) {
            return 'bp-high'; // 高血压
        } else if (systolic >= 130 || diastolic >= 80) {
            return 'bp-elevated'; // 较高血压
        } else {
            return 'bp-normal'; // 正常
        }
    }

    // --- 升级: 渲染图表的函数 ---
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

        // 动态计算Y轴范围，增加上下边距
        const bpValues = [...systolicData, ...diastolicData];
        const bpMin = Math.min(...bpValues) - 10;
        const bpMax = Math.max(...bpValues) + 10;
        const pulseMin = Math.min(...pulseData.filter(p => p)) - 10;
        const pulseMax = Math.max(...pulseData.filter(p => p)) + 10;

        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: '收缩压 (高压)', data: systolicData, borderColor: 'rgba(255, 99, 132, 1)', tension: 0.1, yAxisID: 'y' },
                    { label: '舒张压 (低压)', data: diastolicData, borderColor: 'rgba(54, 162, 235, 1)', tension: 0.1, yAxisID: 'y' },
                    { label: '心率', data: pulseData, borderColor: 'rgba(75, 192, 192, 1)', tension: 0.1, yAxisID: 'yPulse', hidden: true }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    y: {
                        min: bpMin, max: bpMax, // 应用动态范围
                        title: { display: true, text: '血压 (mmHg)' }
                    },
                    yPulse: {
                        position: 'right',
                        min: pulseMin, max: pulseMax, // 应用动态范围
                        title: { display: true, text: '心率 (次/分)' },
                        grid: { drawOnChartArea: false },
                    }
                },
                // --- 新增: Annotation插件配置，用于画参考线 ---
                plugins: {
                    annotation: {
                        annotations: {
                            highBP: {
                                type: 'line',
                                yMin: 140,
                                yMax: 140,
                                borderColor: 'rgba(255, 99, 132, 0.8)',
                                borderWidth: 2,
                                borderDash: [6, 6],
                                label: {
                                    content: '高血压',
                                    position: 'start',
                                    backgroundColor: 'rgba(255, 99, 132, 0.8)',
                                    color: 'white',
                                    font: { size: 10 }
                                }
                            },
                            elevatedBP: {
                                type: 'line',
                                yMin: 130,
                                yMax: 130,
                                borderColor: 'rgba(255, 159, 64, 0.8)',
                                borderWidth: 2,
                                borderDash: [6, 6],
                                label: {
                                    content: '较高血压',
                                    position: 'start',
                                    backgroundColor: 'rgba(255, 159, 64, 0.8)',
                                    color: 'white',
                                    font: { size: 10 }
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    // --- 升级: 加载历史数据的函数 ---
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
                const row = document.createElement('tr');
                // --- 新增: 根据血压水平给表格行添加CSS类 ---
                const levelClass = getBloodPressureLevel(record.systolic, record.diastolic);
                row.classList.add(levelClass);

                row.innerHTML = `<td>${record.dateTime}</td><td>${record.systolic}</td><td>${record.diastolic}</td><td>${record.pulse || 'N/A'}</td><td>${record.notes || ''}</td>`;
                bpHistory.appendChild(row);
            });
            renderChart(data);
        } catch (error) {
            console.error('加载历史数据出错:', error);
            bpHistory.innerHTML = `<tr><td colspan="5">加载失败: ${error.message}</td></tr>`;
        }
    }

    // --- 升级: 为手动刷新按钮添加事件 ---
    refreshBtn.addEventListener('click', () => {
        statusMessage.textContent = '正在刷新数据...';
        statusMessage.style.color = '#333';
        loadHistory();
        setTimeout(() => { statusMessage.textContent = ''; }, 2000);
    });

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
        statusMessage.textContent = '正在保存...';
        statusMessage.style.color = '#333';
        try {
            const response = await fetch(NETLIFY_FUNCTION_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRecord),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || '未知错误');
            statusMessage.textContent = '保存成功！';
            statusMessage.style.color = 'green';
            bpForm.reset();
            setTimeout(loadHistory, 3000);
        } catch (error) {
            console.error('保存数据出错:', error);
            statusMessage.textContent = `错误: ${error.message}`;
            statusMessage.style.color = 'red';
        } finally {
            setTimeout(() => { submitBtn.disabled = false; }, 3000);
        }
    });
    
    loadHistory();
});