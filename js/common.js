// =====================================
// Common helpers (يُحمَّل بعد dashboard.js وقبل باقي الصفحات)
// =====================================

window.pageRenderers = window.pageRenderers || {};
window.currentPageName = "dashboard";

// تتبع الصفحة الحالية
const baseNavigateToPage = navigateToPage;

navigateToPage = function (pageName) {
    window.currentPageName = pageName;
    baseNavigateToPage(pageName);
};

function rerenderCurrentPage(name) {
    if (window.currentPageName !== name) return;
    if (pageRenderers[name]) pageRenderers[name](pagesContainer);
}

function readList(name) {
    return getSection(name) || [];
}

function saveList(name, list) {
    const ok = updateSection(name, list);

    if (!ok) {
        alert("حدث خطأ أثناء حفظ البيانات (قد تكون مساحة التخزين ممتلئة).");
        return false;
    }

    renderDashboardStats();
    return true;
}

function subjectOptions(selected, placeholder) {
    const subjects = getSubjects();
    const first = placeholder === undefined ? "بدون مادة" : placeholder;

    return `<option value="">${first}</option>` + subjects.map(s => `
        <option value="${s.id}" ${s.id === selected ? "selected" : ""}>${escapeHTML(s.name)}</option>
    `).join("");
}

function subjectNameById(id) {
    const subject = getSubjects().find(s => s.id === id);
    return subject ? subject.name : "";
}

function todayKey() {
    return localDateKey(new Date());
}

function daysUntil(dateStr) {
    const today = new Date(todayKey() + "T00:00:00");
    const target = new Date(dateStr + "T00:00:00");
    return Math.round((target - today) / 86400000);
}

function addDaysToKey(dateStr, n) {
    const d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() + n);
    return localDateKey(d);
}

function formatLongDate(dateStr) {
    const d = new Date(dateStr + "T00:00:00");

    if (isNaN(d)) return "";

    return d.toLocaleDateString("ar-EG", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function countdownText(dateStr) {
    const n = daysUntil(dateStr);

    if (n === 0) return "اليوم";
    if (n === 1) return "غداً";
    if (n === 2) return "بعد يومين";
    if (n > 2 && n <= 10) return `بعد ${n} أيام`;
    if (n > 10) return `بعد ${n} يوماً`;
    if (n === -1) return "أمس";
    return `منذ ${Math.abs(n)} يوماً`;
}

// عدد الأيام المتتالية التي تمت فيها المذاكرة
function studyStreak() {
    const days = new Set(getStudySessions().map(s => localDateKey(s.date)));
    let cursor = todayKey();

    if (!days.has(cursor)) cursor = addDaysToKey(cursor, -1);

    let streak = 0;

    while (days.has(cursor)) {
        streak++;
        cursor = addDaysToKey(cursor, -1);
    }

    return streak;
}

function showToast(message) {
    let box = document.getElementById("toast-box");

    if (!box) {
        box = document.createElement("div");
        box.id = "toast-box";
        document.body.appendChild(box);
    }

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    box.appendChild(toast);

    setTimeout(() => toast.classList.add("hide"), 3500);
    setTimeout(() => toast.remove(), 4000);
}

// هل الرابط آمن (http/https فقط)؟
function normalizeUrl(value) {
    const text = value.trim();

    if (!text) return "";

    const withProtocol = /^[a-z][a-z0-9+.-]*:/i.test(text) ? text : "https://" + text;

    try {
        const url = new URL(withProtocol);
        return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch (e) {
        return "";
    }
}

// الدالة تعيد رسم كل شيء عند تغيّر المظهر
document.getElementById("theme-toggle").addEventListener("click", function () {
    setTimeout(function () {
        if (typeof renderStatisticsCharts === "function" &&
            window.currentPageName === "statistics") {
            renderStatisticsCharts();
        }
    }, 0);
});
