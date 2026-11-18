// =====================================
// الإشعارات + اسم المستخدم (يُحمَّل بعد achievements.js)
// الإشعارات تُحسب من بيانات الموقع: مراجعات، مهام، امتحانات، جدول اليوم
// =====================================

function collectNotifications() {
    const today = todayKey();
    const todayIndex = new Date().getDay();
    const items = [];

    readList("revisions")
        .filter(r => !r.done && r.nextDate <= today)
        .forEach(r => items.push({
            icon: "fa-rotate", page: "revisions",
            level: r.nextDate < today ? "danger" : "warn",
            text: `مراجعة مستحقة: ${r.title}`,
            sub: r.nextDate < today ? "متأخرة" : "اليوم"
        }));

    readList("tasks")
        .filter(t => !t.completed && t.dueDate && t.dueDate <= today)
        .forEach(t => items.push({
            icon: "fa-list-check", page: "tasks",
            level: t.dueDate < today ? "danger" : "warn",
            text: `مهمة: ${t.title}`,
            sub: t.dueDate < today ? "متأخرة" : "تستحق اليوم"
        }));

    readList("exams")
        .filter(e => e.date && daysUntil(e.date) >= 0 && daysUntil(e.date) <= 3)
        .forEach(e => items.push({
            icon: "fa-file-circle-check", page: "exams", level: "warn",
            text: `امتحان: ${e.title}`,
            sub: countdownText(e.date)
        }));

    readList("schedule")
        .filter(s => Number(s.day) === todayIndex)
        .sort((a, b) => String(a.time).localeCompare(String(b.time)))
        .forEach(s => items.push({
            icon: "fa-regular fa-clock", page: "schedule", level: "info",
            text: `جلسة اليوم: ${s.title || subjectNameById(s.subjectId) || "مذاكرة"}`,
            sub: s.time || ""
        }));

    return items;
}

function renderNotifications() {
    const panel = document.getElementById("notif-panel");
    const badge = document.getElementById("notif-count");

    if (!panel || !badge) return;

    const items = collectNotifications();
    const urgent = items.filter(i => i.level !== "info").length;

    badge.textContent = urgent;
    badge.style.display = urgent ? "" : "none";

    panel.innerHTML = `
        <div class="notif-head">الإشعارات</div>
        ${items.length === 0
            ? `<p class="notif-empty">لا توجد إشعارات الآن.</p>`
            : items.map(i => `
                <button class="notif-item ${i.level === "info" ? "" : "warn"}" data-page="${i.page}">
                    <i class="${i.icon.includes(" ") ? i.icon : "fa-solid " + i.icon}"></i>
                    <span>${escapeHTML(i.text)}<small>${escapeHTML(i.sub)}</small></span>
                </button>`).join("")}
    `;
}

const notifToggle = document.getElementById("notif-toggle");
if (notifToggle) {
    notifToggle.addEventListener("click", function (event) {
        event.stopPropagation();
        const panel = document.getElementById("notif-panel");
        if (!panel) return;
        renderNotifications();
        panel.classList.toggle("open");
    });
}

document.addEventListener("click", function (event) {
    const panel = document.getElementById("notif-panel");

    if (!panel || !panel.classList.contains("open")) return;
    if (event.target.closest("#notif-toggle")) return;
    if (event.target.closest("#notif-panel") && !event.target.closest("[data-page]")) return;

    panel.classList.remove("open");
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") document.getElementById("notif-panel")?.classList.remove("open");
});

// ---------- اسم المستخدم ----------

function renderUserName() {
    const settings = getSection("settings") || {};
    const box = document.querySelector("#user-profile .user-info strong");

    if (box) box.textContent = settings.name ? settings.name : "مرحباً بك";
}

const userProfile = document.getElementById("user-profile");
if (userProfile) {
    userProfile.addEventListener("click", function () {
        const settings = getSection("settings") || {};
        const name = prompt("اكتب اسمك:", settings.name || "");

        if (name === null) return;

        if (!updateSection("settings", { ...settings, name: name.trim().slice(0, 30) })) {
            alert("حدث خطأ أثناء حفظ الاسم.");
            return;
        }

        renderUserName();
    });
}

// تحديث الشارة بعد كل تغيير في البيانات
const baseRenderDashboardStatsForNotifications = renderDashboardStats;

renderDashboardStats = function () {
    baseRenderDashboardStatsForNotifications();
    renderNotifications();
};

renderUserName();
renderNotifications();
