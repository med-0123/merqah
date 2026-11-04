// =====================================
// Statistics
// =====================================

let statsDailyChart = null;
let statsSubjectChart = null;

const CHART_COLORS = ["#668b72", "#5486c2", "#e49a52", "#9676c8", "#c0504d", "#4bacc6", "#b5a642", "#8a8a8a"];

function secondsOnDay(sessions, dateKey) {
    return sessions
        .filter(s => localDateKey(s.date) === dateKey)
        .reduce((sum, s) => sum + (Number(s.seconds) || 0), 0);
}

function lessonTotals() {
    let total = 0;
    let done = 0;

    getSubjects().forEach(subject => {
        const p = getSubjectProgress(subject);
        total += p.total;
        done += p.completed;
    });

    return { total, done };
}

function renderStatisticsPage(container) {
    const target = container || pagesContainer;
    const sessions = getStudySessions();
    const totalSeconds = getTotalStudySeconds();
    const tasks = readList("tasks");
    const tasksDone = tasks.filter(t => t.completed).length;
    const lessons = lessonTotals();

    const last7 = Array.from({ length: 7 }, (_, i) => secondsOnDay(sessions, addDaysToKey(todayKey(), -i)));
    const weekAverage = formatHours(last7.reduce((a, b) => a + b, 0) / 7);

    const cards = [
        ["green", "fa-clock", "إجمالي ساعات المذاكرة", formatHours(totalSeconds)],
        ["blue", "fa-bolt", "عدد الجلسات", sessions.length],
        ["orange", "fa-fire", "أيام متتالية من المذاكرة", studyStreak()],
        ["purple", "fa-hourglass-half", "متوسط الساعات يومياً (آخر 7 أيام)", weekAverage],
        ["green", "fa-list-check", "نسبة إنجاز المهام",
            tasks.length ? Math.round(tasksDone / tasks.length * 100) + "%" : "0%"],
        ["blue", "fa-book-open", "نسبة إنجاز الدروس",
            lessons.total ? Math.round(lessons.done / lessons.total * 100) + "%" : "0%"]
    ];

    target.innerHTML = `
        <div class="page-stack">

            <div class="subjects-toolbar">
                <div>
                    <h2>الإحصائيات</h2>
                    <p>نظرة شاملة على أدائك الدراسي</p>
                </div>
            </div>

            <div class="stats-wide">
                ${cards.map(([color, icon, label, value]) => `
                    <div class="stat-card">
                        <div class="stat-icon ${color}"><i class="fa-solid ${icon}"></i></div>
                        <div>
                            <span>${label}</span>
                            <h3>${value}</h3>
                        </div>
                    </div>
                `).join("")}
            </div>

            ${sessions.length === 0 ? `
                <div class="content-card">
                    <p class="empty-message">ابدأ جلسة مذاكرة من المؤقت لتظهر الرسوم البيانية هنا.</p>
                </div>
            ` : `
                <div class="charts-grid">
                    <div class="content-card">
                        <h3 class="section-title">ساعات المذاكرة آخر 30 يوماً</h3>
                        <div class="chart-box"><canvas id="stats-daily"></canvas></div>
                    </div>

                    <div class="content-card">
                        <h3 class="section-title">التوزيع على المواد</h3>
                        <div class="chart-box"><canvas id="stats-subjects"></canvas></div>
                    </div>
                </div>
            `}

        </div>
    `;

    renderStatisticsCharts();
}

function renderStatisticsCharts() {
    if (statsDailyChart) { statsDailyChart.destroy(); statsDailyChart = null; }
    if (statsSubjectChart) { statsSubjectChart.destroy(); statsSubjectChart = null; }

    const dailyCanvas = document.getElementById("stats-daily");
    const subjectCanvas = document.getElementById("stats-subjects");

    if (!dailyCanvas || !subjectCanvas || typeof Chart === "undefined") return;

    const sessions = getStudySessions();
    const styles = getComputedStyle(document.body);
    const primary = styles.getPropertyValue("--primary-color").trim() || "#668b72";
    const muted = styles.getPropertyValue("--secondary-text").trim() || "#829087";
    const font = { family: "Cairo" };

    const labels = [];
    const values = [];

    for (let i = 29; i >= 0; i--) {
        const key = addDaysToKey(todayKey(), -i);
        const d = new Date(key + "T00:00:00");

        labels.push(d.toLocaleDateString("ar-EG", { day: "numeric", month: "numeric" }));
        values.push(Math.round(secondsOnDay(sessions, key) / 360) / 10);
    }

    statsDailyChart = new Chart(dailyCanvas, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "ساعات",
                data: values,
                borderColor: primary,
                backgroundColor: primary + "33",
                fill: true,
                tension: 0.35,
                pointRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: muted, font, maxTicksLimit: 8 }, grid: { display: false } },
                y: { beginAtZero: true, ticks: { color: muted, font } }
            }
        }
    });

    // توزيع الساعات على المواد
    const bySubject = new Map();

    sessions.forEach(s => {
        const name = subjectNameById(s.subjectId) || "بدون مادة";
        bySubject.set(name, (bySubject.get(name) || 0) + (Number(s.seconds) || 0));
    });

    const names = [...bySubject.keys()];

    statsSubjectChart = new Chart(subjectCanvas, {
        type: "doughnut",
        data: {
            labels: names,
            datasets: [{
                data: names.map(n => Math.round(bySubject.get(n) / 360) / 10),
                backgroundColor: names.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "bottom", labels: { color: muted, font } }
            }
        }
    });
}

pageRenderers.statistics = renderStatisticsPage;
