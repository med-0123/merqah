// =====================================
// Dashboard Widgets (يُحمَّل بعد app.js)
// =====================================

window.pageRenderers = window.pageRenderers || {};

let studyChartInstance = null;

function getStudySessions() {
    return getSection("studySessions") || [];
}

function getTotalStudySeconds() {
    return getStudySessions().reduce((sum, s) => sum + (Number(s.seconds) || 0), 0);
}

function formatHours(seconds) {
    const hours = seconds / 3600;
    return hours >= 10 ? Math.round(hours) : Math.round(hours * 10) / 10;
}

function localDateKey(date) {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${month}-${day}`;
}


// ---------- إنجاز المواد ----------

function renderDashboardSubjects() {
    const box = document.getElementById("dashboard-subjects");
    if (!box) return;

    const subjects = getSubjects();

    if (subjects.length === 0) {
        box.innerHTML = `<p class="empty-message">لم تتم إضافة مواد دراسية بعد.</p>`;
        return;
    }

    box.innerHTML = subjects.slice(0, 5).map(subject => {
        const p = getSubjectProgress(subject);
        return `
            <div class="dash-subject">
                <div class="dash-subject-top">
                    <strong>${escapeHTML(subject.name)}</strong>
                    <span>${p.completed} / ${p.total} درس · ${p.percentage}%</span>
                </div>
                <div class="progress-track">
                    <div class="progress-fill" style="width: ${p.percentage}%"></div>
                </div>
            </div>
        `;
    }).join("");
}


// ---------- جدول اليوم ----------
// عنصر الجدول المتوقع: { id, day (0=الأحد ... 6=السبت), time: "HH:MM", subjectId, title }

function renderTodaySchedule() {
    const box = document.getElementById("today-schedule");
    if (!box) return;

    const todayIndex = new Date().getDay();
    const subjects = getSubjects();
    const items = (getSection("schedule") || [])
        .filter(item => Number(item.day) === todayIndex)
        .sort((a, b) => String(a.time).localeCompare(String(b.time)));

    if (items.length === 0) {
        box.innerHTML = `<p class="empty-message">لا توجد جلسات مذاكرة اليوم.</p>`;
        return;
    }

    box.innerHTML = items.map(item => {
        const subject = subjects.find(s => s.id === item.subjectId);
        const name = item.title || (subject ? subject.name : "جلسة مذاكرة");
        return `
            <div class="mini-item">
                <i class="fa-regular fa-clock"></i>
                <div>
                    <strong>${escapeHTML(name)}</strong>
                    <span>${escapeHTML(item.time || "")}</span>
                </div>
            </div>
        `;
    }).join("");
}


// ---------- المهام القادمة ----------

function renderUpcomingTasks() {
    const box = document.getElementById("upcoming-tasks");
    if (!box) return;

    const tasks = (getSection("tasks") || [])
        .filter(task => !task.completed)
        .sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return a.dueDate.localeCompare(b.dueDate);
        })
        .slice(0, 5);

    if (tasks.length === 0) {
        box.innerHTML = `<p class="empty-message">لا توجد مهام حالياً.</p>`;
        return;
    }

    box.innerHTML = tasks.map(task => `
        <label class="mini-item mini-task">
            <input type="checkbox" data-tk="toggle" data-task="${task.id}">
            <div>
                <strong>${escapeHTML(task.title)}</strong>
                ${task.dueDate ? `<span>${formatDueDate(task.dueDate)}</span>` : ""}
            </div>
        </label>
    `).join("");
}


// ---------- الرسم البياني ----------

function renderStudyChart() {
    const canvas = document.getElementById("study-chart");
    if (!canvas || typeof Chart === "undefined") return;

    const sessions = getStudySessions();
    const labels = [];
    const values = [];

    for (let i = 6; i >= 0; i--) {
        const day = new Date();
        day.setDate(day.getDate() - i);
        const key = localDateKey(day);

        const seconds = sessions
            .filter(s => localDateKey(s.date) === key)
            .reduce((sum, s) => sum + (Number(s.seconds) || 0), 0);

        labels.push(day.toLocaleDateString("ar-EG", { weekday: "short" }));
        values.push(Math.round(seconds / 360) / 10);
    }

    if (studyChartInstance) studyChartInstance.destroy();

    const styles = getComputedStyle(document.body);
    const primary = styles.getPropertyValue("--primary-color").trim() || "#668b72";
    const muted = styles.getPropertyValue("--secondary-text").trim() || "#829087";

    studyChartInstance = new Chart(canvas, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "ساعات",
                data: values,
                backgroundColor: primary,
                borderRadius: 8,
                maxBarThickness: 36
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: muted, font: { family: "Cairo" } }, grid: { display: false } },
                y: { beginAtZero: true, ticks: { color: muted, font: { family: "Cairo" } } }
            }
        }
    });
}


// ---------- تجميع كل الودجتات ----------

function renderDashboardExtras() {
    const hours = document.getElementById("study-hours");
    if (hours) hours.textContent = formatHours(getTotalStudySeconds());

    renderDashboardSubjects();
    renderTodaySchedule();
    renderUpcomingTasks();
    renderStudyChart();
}

// نضيف الودجتات فوق الدالة الأصلية في app.js
const baseRenderDashboardStats = renderDashboardStats;

renderDashboardStats = function () {
    baseRenderDashboardStats();
    renderDashboardExtras();
};

// تحديث المظهر يعيد رسم المخطط بألوان المظهر الجديد
document.getElementById("theme-toggle").addEventListener("click", function () {
    setTimeout(renderStudyChart, 0);
});

renderDashboardStats();
