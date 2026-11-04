// =====================================
// Exams
// الامتحان: { id, title, subjectId, date, time, score, total }
// =====================================

function examPercent(exam) {
    if (exam.score === null || exam.score === undefined || !exam.total) return null;

    return Math.round(exam.score / exam.total * 100);
}

function renderExamRow(exam) {
    const subject = subjectNameById(exam.subjectId);
    const days = daysUntil(exam.date);
    const percent = examPercent(exam);
    const isPast = days < 0;

    let badge = "";

    if (percent !== null) {
        badge = `<span class="badge ${percent < 50 ? "danger" : ""}">${exam.score} / ${exam.total} · ${percent}%</span>`;
    } else if (!isPast) {
        badge = `<span class="badge ${days <= 3 ? "warn" : ""}">${countdownText(exam.date)}</span>`;
    }

    return `
        <div class="row-item">
            <i class="fa-solid fa-file-circle-check" style="color:#e49a52"></i>

            <div class="row-main">
                <strong>${escapeHTML(exam.title)}</strong>
                <span>
                    ${subject ? escapeHTML(subject) + " · " : ""}${formatLongDate(exam.date)}${exam.time ? " · " + escapeHTML(exam.time) : ""}
                </span>
            </div>

            ${badge}

            <div class="row-actions">
                ${isPast || percent !== null
                    ? `<button class="small-btn" data-ex="score" data-id="${exam.id}">
                           ${percent === null ? "تسجيل الدرجة" : "تعديل الدرجة"}
                       </button>`
                    : ""}
                <button class="icon-action" title="تعديل" data-ex="edit" data-id="${exam.id}">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="icon-action" title="حذف" data-ex="delete" data-id="${exam.id}">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>`;
}

function renderExamsPage(container) {
    const target = container || pagesContainer;
    const exams = readList("exams");

    const upcoming = exams
        .filter(e => daysUntil(e.date) >= 0)
        .sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));

    const past = exams
        .filter(e => daysUntil(e.date) < 0)
        .sort((a, b) => b.date.localeCompare(a.date));

    const graded = exams.map(examPercent).filter(p => p !== null);
    const average = graded.length
        ? Math.round(graded.reduce((a, b) => a + b, 0) / graded.length)
        : null;

    target.innerHTML = `
        <div class="page-stack">

            <div class="subjects-toolbar">
                <div>
                    <h2>الامتحانات</h2>
                    <p>
                        ${upcoming.length} قادمة · ${past.length} سابقة
                        ${average !== null ? ` · متوسط الدرجات ${average}%` : ""}
                    </p>
                </div>
            </div>

            <form class="content-card inline-form" id="exam-form">
                <input type="text" name="title" class="grow" maxlength="80" required
                    placeholder="اسم الامتحان">
                <select name="subject">${subjectOptions("")}</select>
                <input type="date" name="date" required value="${todayKey()}">
                <input type="time" name="time">
                <button type="submit" class="primary-btn">
                    <i class="fa-solid fa-plus"></i> إضافة
                </button>
            </form>

            <div class="content-card">
                <h3 class="section-title">الامتحانات القادمة</h3>
                ${upcoming.length === 0
                    ? `<p class="empty-message">لا توجد امتحانات قادمة.</p>`
                    : upcoming.map(renderExamRow).join("")}
            </div>

            <div class="content-card">
                <h3 class="section-title">الامتحانات السابقة</h3>
                ${past.length === 0
                    ? `<p class="empty-message">لا توجد امتحانات سابقة.</p>`
                    : past.map(renderExamRow).join("")}
            </div>

        </div>
    `;
}

pageRenderers.exams = renderExamsPage;

pagesContainer.addEventListener("submit", function (event) {
    if (event.target.id !== "exam-form") return;

    event.preventDefault();

    const form = event.target;
    const title = form.title.value.trim();

    if (!title || !form.date.value) return;

    const exams = readList("exams");

    exams.push({
        id: createId(),
        title,
        subjectId: form.subject.value,
        date: form.date.value,
        time: form.time.value,
        score: null,
        total: null
    });

    if (saveList("exams", exams)) renderExamsPage(pagesContainer);
});

document.addEventListener("click", function (event) {
    const button = event.target.closest("[data-ex]");

    if (!button) return;

    const exams = readList("exams");
    const exam = exams.find(e => e.id === button.dataset.id);

    if (!exam) return;

    switch (button.dataset.ex) {
        case "delete":
            if (!confirm(`حذف الامتحان "${exam.title}"؟`)) return;

            if (saveList("exams", exams.filter(e => e.id !== exam.id))) {
                renderExamsPage(pagesContainer);
            }
            break;

        case "edit": {
            const title = prompt("اسم الامتحان:", exam.title);

            if (title === null) return;

            if (!title.trim()) {
                alert("اسم الامتحان مطلوب.");
                return;
            }

            const date = prompt("التاريخ (YYYY-MM-DD):", exam.date);

            if (date === null) return;

            if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim()) || isNaN(new Date(date.trim() + "T00:00:00"))) {
                alert("صيغة التاريخ غير صحيحة، مثال: 2026-12-20");
                return;
            }

            exam.title = title.trim();
            exam.date = date.trim();

            if (saveList("exams", exams)) renderExamsPage(pagesContainer);
            break;
        }

        case "score": {
            const score = prompt("الدرجة التي حصلت عليها:", exam.score ?? "");

            if (score === null) return;

            const total = prompt("الدرجة النهائية للامتحان:", exam.total ?? "100");

            if (total === null) return;

            const scoreNumber = Number(score);
            const totalNumber = Number(total);

            if (score.trim() === "" || isNaN(scoreNumber) || isNaN(totalNumber) ||
                totalNumber <= 0 || scoreNumber < 0 || scoreNumber > totalNumber) {
                alert("أدخل أرقاماً صحيحة (الدرجة لا تزيد عن النهائية).");
                return;
            }

            exam.score = scoreNumber;
            exam.total = totalNumber;

            if (saveList("exams", exams)) renderExamsPage(pagesContainer);
            break;
        }
    }
});
