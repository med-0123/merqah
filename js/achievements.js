// =====================================
// Achievements
// المحفوظ: { id, unlockedAt }  — الشروط تُحسب من بيانات الموقع
// =====================================

function achievementMetrics() {
    const lessons = lessonTotals();
    const exams = readList("exams");
    const revisions = readList("revisions");

    return {
        subjects: getSubjects().length,
        lessons: lessons.done,
        tasks: readList("tasks").filter(t => t.completed).length,
        sessions: getStudySessions().length,
        hours: getTotalStudySeconds() / 3600,
        streak: studyStreak(),
        exams: exams.length,
        bestScore: Math.max(0, ...exams.map(e => examPercent(e) || 0)),
        notes: readList("notes").length,
        reviews: revisions.reduce((sum, r) => sum + (r.history ? r.history.length : 0), 0)
    };
}

const ACHIEVEMENTS = [
    { id: "subject-1", icon: "fa-book", title: "البداية", desc: "أضف أول مادة دراسية", metric: "subjects", target: 1 },
    { id: "lessons-1", icon: "fa-circle-check", title: "أول درس", desc: "أكمل درساً واحداً", metric: "lessons", target: 1 },
    { id: "lessons-10", icon: "fa-layer-group", title: "عشرة دروس", desc: "أكمل 10 دروس", metric: "lessons", target: 10 },
    { id: "lessons-50", icon: "fa-graduation-cap", title: "طالب نابغ", desc: "أكمل 50 درساً", metric: "lessons", target: 50 },
    { id: "tasks-1", icon: "fa-list-check", title: "منجز", desc: "أنجز أول مهمة", metric: "tasks", target: 1 },
    { id: "tasks-10", icon: "fa-bolt", title: "منظّم", desc: "أنجز 10 مهام", metric: "tasks", target: 10 },
    { id: "session-1", icon: "fa-stopwatch", title: "ركّز", desc: "سجّل أول جلسة مذاكرة", metric: "sessions", target: 1 },
    { id: "hours-10", icon: "fa-clock", title: "10 ساعات", desc: "ذاكر 10 ساعات إجمالاً", metric: "hours", target: 10 },
    { id: "hours-50", icon: "fa-hourglass-half", title: "50 ساعة", desc: "ذاكر 50 ساعة إجمالاً", metric: "hours", target: 50 },
    { id: "streak-3", icon: "fa-fire", title: "ثلاثة أيام", desc: "ذاكر 3 أيام متتالية", metric: "streak", target: 3 },
    { id: "streak-7", icon: "fa-fire-flame-curved", title: "أسبوع كامل", desc: "ذاكر 7 أيام متتالية", metric: "streak", target: 7 },
    { id: "exam-1", icon: "fa-file-circle-check", title: "مستعد", desc: "أضف أول امتحان", metric: "exams", target: 1 },
    { id: "score-90", icon: "fa-star", title: "متفوق", desc: "احصل على 90% أو أكثر في امتحان", metric: "bestScore", target: 90 },
    { id: "notes-5", icon: "fa-note-sticky", title: "كاتب ملاحظات", desc: "اكتب 5 ملاحظات", metric: "notes", target: 5 },
    { id: "reviews-10", icon: "fa-rotate", title: "مراجع مثابر", desc: "أتمم 10 مراجعات", metric: "reviews", target: 10 }
];

// يفتح الإنجازات الجديدة ويحفظها ويعرض إشعاراً
function checkAchievements() {
    const metrics = achievementMetrics();
    const saved = readList("achievements");
    const unlockedIds = new Set(saved.map(a => a.id));
    const fresh = ACHIEVEMENTS.filter(a => !unlockedIds.has(a.id) && metrics[a.metric] >= a.target);

    if (fresh.length === 0) return [];

    const now = new Date().toISOString();

    fresh.forEach(a => saved.push({ id: a.id, unlockedAt: now }));

    if (updateSection("achievements", saved)) {
        fresh.forEach(a => showToast(`🏆 إنجاز جديد: ${a.title}`));
    }

    return fresh;
}

function renderAchievementsPage(container) {
    const target = container || pagesContainer;

    checkAchievements();

    const metrics = achievementMetrics();
    const saved = readList("achievements");
    const doneCount = ACHIEVEMENTS.filter(a => saved.some(s => s.id === a.id)).length;

    target.innerHTML = `
        <div class="page-stack">

            <div class="subjects-toolbar">
                <div>
                    <h2>الإنجازات</h2>
                    <p>${doneCount} من ${ACHIEVEMENTS.length} إنجازاً مكتملاً</p>
                </div>
            </div>

            <div class="content-card">
                <div class="progress-track">
                    <div class="progress-fill" style="width:${Math.round(doneCount / ACHIEVEMENTS.length * 100)}%"></div>
                </div>
            </div>

            <div class="ach-grid">
                ${ACHIEVEMENTS.map(a => {
                    const record = saved.find(s => s.id === a.id);
                    const current = Math.min(metrics[a.metric], a.target);
                    const percent = Math.round(current / a.target * 100);
                    const shown = Number.isInteger(current) ? current : Math.round(current * 10) / 10;

                    return `
                        <div class="content-card ach-card ${record ? "done" : "locked"}">
                            <div class="ach-icon"><i class="fa-solid ${record ? a.icon : "fa-lock"}"></i></div>
                            <h4>${a.title}</h4>
                            <p>${a.desc}</p>
                            <div class="progress-track" style="max-width:160px">
                                <div class="progress-fill" style="width:${percent}%"></div>
                            </div>
                            <small>${record
                                ? "تم في " + new Date(record.unlockedAt).toLocaleDateString("ar-EG", { day: "numeric", month: "long" })
                                : `${shown} / ${a.target}`}</small>
                        </div>`;
                }).join("")}
            </div>

        </div>
    `;
}

pageRenderers.achievements = renderAchievementsPage;

// فحص الإنجازات بعد كل تحديث للبيانات
const baseRenderDashboardStatsForAchievements = renderDashboardStats;

renderDashboardStats = function () {
    baseRenderDashboardStatsForAchievements();
    checkAchievements();
};

checkAchievements();
