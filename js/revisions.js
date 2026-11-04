// =====================================
// Revisions (spaced repetition)
// العنصر: { id, title, subjectId, createdAt, stage, nextDate, done, history: [dates] }
// =====================================

const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 60];   // بالأيام

function renderRevisionRow(item, due) {
    const subject = subjectNameById(item.subjectId);
    const days = daysUntil(item.nextDate);

    return `
        <div class="row-item">
            <i class="fa-solid fa-rotate" style="color:#9676c8"></i>

            <div class="row-main">
                <strong>${escapeHTML(item.title)}</strong>
                <span>
                    ${subject ? escapeHTML(subject) + " · " : ""}المرحلة ${item.stage + 1} من ${REVIEW_INTERVALS.length}
                    ${due ? "" : " · " + countdownText(item.nextDate)}
                </span>
            </div>

            ${due
                ? `<span class="badge ${days < 0 ? "danger" : "warn"}">${days < 0 ? "متأخرة" : "اليوم"}</span>`
                : ""}

            <div class="row-actions">
                ${due ? `
                    <button class="small-btn" data-rv="done" data-id="${item.id}">تمت المراجعة</button>
                    <button class="small-btn danger" data-rv="forgot" data-id="${item.id}">نسيت</button>
                ` : ""}
                <button class="icon-action" title="حذف" data-rv="delete" data-id="${item.id}">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>`;
}

function renderRevisionsPage(container) {
    const target = container || pagesContainer;
    const items = readList("revisions");
    const today = todayKey();

    const active = items.filter(i => !i.done);
    const due = active.filter(i => i.nextDate <= today).sort((a, b) => a.nextDate.localeCompare(b.nextDate));
    const later = active.filter(i => i.nextDate > today).sort((a, b) => a.nextDate.localeCompare(b.nextDate));
    const mastered = items.filter(i => i.done);

    // اقتراح: الدروس المكتملة التي لم تُضف للمراجعة بعد
    const known = new Set(items.map(i => i.lessonId).filter(Boolean));
    const suggestions = [];

    getSubjects().forEach(subject => {
        subject.units.forEach(unit => {
            unit.lessons.forEach(lesson => {
                if (lesson.completed && !known.has(lesson.id)) {
                    suggestions.push({ lesson, subject });
                }
            });
        });
    });

    target.innerHTML = `
        <div class="page-stack">

            <div class="subjects-toolbar">
                <div>
                    <h2>المراجعات</h2>
                    <p>مراجعة متباعدة (1، 3، 7، 14، 30، 60 يوماً) لتثبيت المعلومات</p>
                </div>
            </div>

            <form class="content-card inline-form" id="revision-form">
                <input type="text" name="title" class="grow" maxlength="80" required
                    placeholder="ما الذي تريد مراجعته؟">
                <select name="subject">${subjectOptions("")}</select>
                <button type="submit" class="primary-btn">
                    <i class="fa-solid fa-plus"></i> إضافة
                </button>
            </form>

            ${suggestions.length > 0 ? `
                <div class="content-card">
                    <div class="card-header">
                        <div>
                            <h3>دروس مكتملة يمكن مراجعتها</h3>
                            <p>${suggestions.length} درس لم يُضف إلى المراجعات</p>
                        </div>
                        <button class="small-btn" data-rv="add-all">إضافة الكل</button>
                    </div>
                    ${suggestions.slice(0, 5).map(({ lesson, subject }) => `
                        <div class="row-item">
                            <div class="row-main">
                                <strong>${escapeHTML(lesson.name)}</strong>
                                <span>${escapeHTML(subject.name)}</span>
                            </div>
                            <button class="small-btn" data-rv="add-lesson" data-id="${lesson.id}">
                                أضف للمراجعة
                            </button>
                        </div>`).join("")}
                </div>
            ` : ""}

            <div class="content-card">
                <h3 class="section-title">مستحقة اليوم (${due.length})</h3>
                ${due.length === 0
                    ? `<p class="empty-message">لا توجد مراجعات مستحقة الآن 🎉</p>`
                    : due.map(i => renderRevisionRow(i, true)).join("")}
            </div>

            <div class="content-card">
                <h3 class="section-title">قادمة (${later.length})</h3>
                ${later.length === 0
                    ? `<p class="empty-message">لا توجد مراجعات قادمة.</p>`
                    : later.map(i => renderRevisionRow(i, false)).join("")}
            </div>

            ${mastered.length > 0 ? `
                <div class="content-card">
                    <h3 class="section-title">مُتقَنة (${mastered.length})</h3>
                    ${mastered.map(i => `
                        <div class="row-item">
                            <i class="fa-solid fa-circle-check" style="color:#668b72"></i>
                            <div class="row-main">
                                <strong>${escapeHTML(i.title)}</strong>
                                <span>${escapeHTML(subjectNameById(i.subjectId))}</span>
                            </div>
                            <button class="icon-action" title="حذف" data-rv="delete" data-id="${i.id}">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>`).join("")}
                </div>
            ` : ""}

        </div>
    `;
}

pageRenderers.revisions = renderRevisionsPage;

function newRevision(title, subjectId, lessonId) {
    return {
        id: createId(),
        title,
        subjectId: subjectId || "",
        lessonId: lessonId || "",
        createdAt: new Date().toISOString(),
        stage: 0,
        nextDate: addDaysToKey(todayKey(), REVIEW_INTERVALS[0]),
        done: false,
        history: []
    };
}

pagesContainer.addEventListener("submit", function (event) {
    if (event.target.id !== "revision-form") return;

    event.preventDefault();

    const form = event.target;
    const title = form.title.value.trim();

    if (!title) return;

    const items = readList("revisions");

    items.push(newRevision(title, form.subject.value));

    if (saveList("revisions", items)) renderRevisionsPage(pagesContainer);
});

document.addEventListener("click", function (event) {
    const button = event.target.closest("[data-rv]");

    if (!button) return;

    const items = readList("revisions");
    const action = button.dataset.rv;

    if (action === "add-lesson" || action === "add-all") {
        const known = new Set(items.map(i => i.lessonId).filter(Boolean));

        getSubjects().forEach(subject => {
            subject.units.forEach(unit => {
                unit.lessons.forEach(lesson => {
                    const wanted = action === "add-all" || lesson.id === button.dataset.id;

                    if (wanted && lesson.completed && !known.has(lesson.id)) {
                        items.push(newRevision(lesson.name, subject.id, lesson.id));
                        known.add(lesson.id);
                    }
                });
            });
        });

        if (saveList("revisions", items)) renderRevisionsPage(pagesContainer);
        return;
    }

    const item = items.find(i => i.id === button.dataset.id);

    if (!item) return;

    if (action === "delete") {
        if (!confirm(`حذف "${item.title}" من المراجعات؟`)) return;

        if (saveList("revisions", items.filter(i => i.id !== item.id))) {
            renderRevisionsPage(pagesContainer);
        }
        return;
    }

    if (action === "done") {
        item.history.push(todayKey());
        item.stage++;

        if (item.stage >= REVIEW_INTERVALS.length) {
            item.stage = REVIEW_INTERVALS.length - 1;
            item.done = true;
        } else {
            item.nextDate = addDaysToKey(todayKey(), REVIEW_INTERVALS[item.stage]);
        }
    }

    if (action === "forgot") {
        item.stage = 0;
        item.nextDate = addDaysToKey(todayKey(), REVIEW_INTERVALS[0]);
    }

    if (saveList("revisions", items)) renderRevisionsPage(pagesContainer);
});
