// =====================================
// Weekly Schedule
// الجلسة: { id, day (0=الأحد ... 6=السبت), time: "HH:MM", duration, subjectId, title }
// =====================================

const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5];

const DAY_NAMES = {
    6: "السبت",
    0: "الأحد",
    1: "الاثنين",
    2: "الثلاثاء",
    3: "الأربعاء",
    4: "الخميس",
    5: "الجمعة"
};

function renderSchedulePage(container) {
    const target = container || pagesContainer;
    const items = readList("schedule");
    const todayIndex = new Date().getDay();

    target.innerHTML = `
        <div class="page-stack">

            <div class="subjects-toolbar">
                <div>
                    <h2>الجدول الأسبوعي</h2>
                    <p>${items.length} جلسة مذاكرة في الأسبوع</p>
                </div>
            </div>

            <form class="content-card inline-form" id="schedule-form">
                <select name="day" class="field">
                    ${WEEK_ORDER.map(d => `
                        <option value="${d}" ${d === todayIndex ? "selected" : ""}>${DAY_NAMES[d]}</option>
                    `).join("")}
                </select>

                <input type="time" name="time" required value="16:00">

                <input type="number" name="duration" min="10" max="480" step="5"
                    placeholder="المدة (دقيقة)" style="width:130px">

                <select name="subject">${subjectOptions("")}</select>

                <input type="text" name="title" class="grow" maxlength="60"
                    placeholder="عنوان الجلسة (اختياري)">

                <button type="submit" class="primary-btn">
                    <i class="fa-solid fa-plus"></i> إضافة
                </button>
            </form>

            <div class="schedule-grid">
                ${WEEK_ORDER.map(day => {
                    const sessions = items
                        .filter(item => Number(item.day) === day)
                        .sort((a, b) => String(a.time).localeCompare(String(b.time)));

                    return `
                        <div class="day-column ${day === todayIndex ? "today" : ""}">
                            <h4>${DAY_NAMES[day]}</h4>
                            ${sessions.length === 0
                                ? `<p class="day-empty">لا جلسات</p>`
                                : sessions.map(s => {
                                    const name = s.title || subjectNameById(s.subjectId) || "جلسة مذاكرة";
                                    const subject = s.title ? subjectNameById(s.subjectId) : "";
                                    return `
                                        <div class="session-chip">
                                            <button title="حذف" data-sc="delete" data-id="${s.id}">
                                                <i class="fa-solid fa-xmark"></i>
                                            </button>
                                            <strong>${escapeHTML(name)}</strong>
                                            <span>${escapeHTML(s.time)}${s.duration ? ` · ${s.duration} د` : ""}</span>
                                            ${subject ? `<br><span>${escapeHTML(subject)}</span>` : ""}
                                        </div>`;
                                }).join("")}
                        </div>`;
                }).join("")}
            </div>

        </div>
    `;
}

pageRenderers.schedule = renderSchedulePage;

pagesContainer.addEventListener("submit", function (event) {
    if (event.target.id !== "schedule-form") return;

    event.preventDefault();

    const form = event.target;
    const items = readList("schedule");

    items.push({
        id: createId(),
        day: Number(form.day.value),
        time: form.time.value,
        duration: Number(form.duration.value) || 0,
        subjectId: form.subject.value,
        title: form.title.value.trim()
    });

    if (saveList("schedule", items)) renderSchedulePage(pagesContainer);
});

document.addEventListener("click", function (event) {
    const button = event.target.closest("[data-sc]");

    if (!button) return;

    if (button.dataset.sc === "delete") {
        if (!confirm("حذف هذه الجلسة من الجدول؟")) return;

        const items = readList("schedule").filter(item => item.id !== button.dataset.id);

        if (saveList("schedule", items)) renderSchedulePage(pagesContainer);
    }
});
