// =====================================
// Calendar
// الحدث: { id, title, date: "YYYY-MM-DD" }
// يعرض أيضاً الامتحانات (exams) والمهام ذات التاريخ (tasks)
// =====================================

const calState = {
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    selected: localDateKey(new Date())
};

const CAL_DOW = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

function pad2(n) {
    return String(n).padStart(2, "0");
}

function calKey(year, month, day) {
    return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

function calItemsFor(dateKey) {
    return {
        events: readList("events").filter(e => e.date === dateKey),
        exams: readList("exams").filter(e => e.date === dateKey),
        tasks: readList("tasks").filter(t => t.dueDate === dateKey)
    };
}

function renderCalendarPage(container) {
    const target = container || pagesContainer;
    const { year, month } = calState;

    const monthLabel = new Date(year, month, 1).toLocaleDateString("ar-EG", {
        month: "long",
        year: "numeric"
    });

    const monthNames = Array.from({ length: 12 }, (_, i) =>
        new Date(year, i, 1).toLocaleDateString("ar-EG", { month: "short" })
    );

    // السبت أول الأسبوع
    const offset = (new Date(year, month, 1).getDay() + 1) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = todayKey();

    const events = readList("events");
    const exams = readList("exams");
    const tasks = readList("tasks");

    let cells = "";

    for (let i = 0; i < offset; i++) {
        cells += `<div class="cal-cell blank"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const key = calKey(year, month, day);
        const hasEvent = events.some(e => e.date === key);
        const hasExam = exams.some(e => e.date === key);
        const hasTask = tasks.some(t => t.dueDate === key && !t.completed);

        cells += `
            <button class="cal-cell ${key === today ? "today" : ""} ${key === calState.selected ? "selected" : ""}"
                data-cal="select" data-date="${key}">
                <span>${day.toLocaleString("ar-EG")}</span>
                <span class="dots">
                    ${hasEvent ? `<i class="dot event"></i>` : ""}
                    ${hasExam ? `<i class="dot exam"></i>` : ""}
                    ${hasTask ? `<i class="dot task"></i>` : ""}
                </span>
            </button>`;
    }

    const selected = calItemsFor(calState.selected);
    const nothing = !selected.events.length && !selected.exams.length && !selected.tasks.length;

    target.innerHTML = `
        <div class="page-stack">

            <div class="subjects-toolbar">
                <div>
                    <h2>التقويم السنوي</h2>
                    <p>الأحداث والامتحانات ومواعيد المهام في مكان واحد</p>
                </div>
            </div>

            <div class="year-strip">
                ${monthNames.map((name, i) => `
                    <button class="${i === month ? "active" : ""}" data-cal="month" data-month="${i}">${name}</button>
                `).join("")}
            </div>

            <div class="content-card">

                <div class="cal-head">
                    <button class="small-btn" data-cal="prev"><i class="fa-solid fa-chevron-right"></i> السابق</button>
                    <h3>${monthLabel}</h3>
                    <div class="row-actions">
                        <button class="small-btn" data-cal="today">اليوم</button>
                        <button class="small-btn" data-cal="next">التالي <i class="fa-solid fa-chevron-left"></i></button>
                    </div>
                </div>

                <div class="cal-grid">
                    ${CAL_DOW.map(d => `<div class="cal-dow">${d}</div>`).join("")}
                    ${cells}
                </div>

                <div class="legend">
                    <span><i class="dot event"></i> حدث</span>
                    <span><i class="dot exam"></i> امتحان</span>
                    <span><i class="dot task"></i> مهمة</span>
                </div>

            </div>

            <div class="content-card">

                <h3 class="section-title">${formatLongDate(calState.selected)}</h3>

                <form class="inline-form" id="event-form" style="margin-bottom:12px">
                    <input type="text" name="title" class="grow" maxlength="80" required
                        placeholder="أضف حدثاً في هذا اليوم...">
                    <button type="submit" class="primary-btn">
                        <i class="fa-solid fa-plus"></i> إضافة حدث
                    </button>
                </form>

                ${nothing ? `<p class="empty-message">لا يوجد شيء في هذا اليوم.</p>` : ""}

                ${selected.events.map(e => `
                    <div class="row-item">
                        <i class="fa-solid fa-calendar-check" style="color:#668b72"></i>
                        <div class="row-main"><strong>${escapeHTML(e.title)}</strong><span>حدث</span></div>
                        <button class="icon-action" title="حذف" data-cal="delete-event" data-id="${e.id}">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>`).join("")}

                ${selected.exams.map(e => `
                    <div class="row-item">
                        <i class="fa-solid fa-file-circle-check" style="color:#e49a52"></i>
                        <div class="row-main">
                            <strong>${escapeHTML(e.title)}</strong>
                            <span>امتحان${e.time ? " · " + escapeHTML(e.time) : ""}</span>
                        </div>
                    </div>`).join("")}

                ${selected.tasks.map(t => `
                    <div class="row-item">
                        <i class="fa-solid fa-list-check" style="color:#5486c2"></i>
                        <div class="row-main">
                            <strong class="${t.completed ? "completed-lesson" : ""}">${escapeHTML(t.title)}</strong>
                            <span>مهمة${t.completed ? " · مكتملة" : ""}</span>
                        </div>
                    </div>`).join("")}

            </div>

        </div>
    `;
}

pageRenderers.calendar = renderCalendarPage;

pagesContainer.addEventListener("submit", function (event) {
    if (event.target.id !== "event-form") return;

    event.preventDefault();

    const title = event.target.title.value.trim();

    if (!title) return;

    const events = readList("events");

    events.push({ id: createId(), title, date: calState.selected });

    if (saveList("events", events)) renderCalendarPage(pagesContainer);
});

document.addEventListener("click", function (event) {
    const button = event.target.closest("[data-cal]");

    if (!button) return;

    switch (button.dataset.cal) {
        case "select":
            calState.selected = button.dataset.date;
            break;

        case "month":
            calState.month = Number(button.dataset.month);
            break;

        case "prev":
            calState.month--;
            if (calState.month < 0) { calState.month = 11; calState.year--; }
            break;

        case "next":
            calState.month++;
            if (calState.month > 11) { calState.month = 0; calState.year++; }
            break;

        case "today": {
            const now = new Date();
            calState.year = now.getFullYear();
            calState.month = now.getMonth();
            calState.selected = localDateKey(now);
            break;
        }

        case "delete-event": {
            if (!confirm("حذف هذا الحدث؟")) return;

            const events = readList("events").filter(e => e.id !== button.dataset.id);

            if (!saveList("events", events)) return;
            break;
        }

        default:
            return;
    }

    renderCalendarPage(pagesContainer);
});
