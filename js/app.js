
// =====================================
// 1. Helpers
// =====================================

function createId() {
    return Date.now().toString() + Math.random().toString(16).slice(2);
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function getSubjects() {
    const subjects = getSection("subjects") || [];

    subjects.forEach(subject => {
        if (!Array.isArray(subject.units)) subject.units = [];

        subject.units.forEach(unit => {
            if (!Array.isArray(unit.lessons)) unit.lessons = [];
            unit.lessons.forEach(lesson => {
                lesson.completed = Boolean(lesson.completed);
            });
        });
    });

    return subjects;
}

function saveSubjects(subjects) {
    const saved = updateSection("subjects", subjects);

    if (!saved) {
        alert("حدث خطأ أثناء حفظ البيانات.");
        return false;
    }

    renderDashboardStats();
    return true;
}


// =====================================
// 2. Current Date
// =====================================

function updateDate() {
    const dateElement = document.getElementById("current-date");
    const today = new Date();

    if (dateElement) {
        dateElement.textContent = today.toLocaleDateString("ar-EG", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }
}

updateDate();


// =====================================
// 3. Dark Mode
// =====================================

const themeToggle = document.getElementById("theme-toggle");

function updateThemeIcon() {
    const icon = themeToggle.querySelector("i");
    const isDark = document.body.classList.contains("dark-mode");

    icon.className = isDark
        ? "fa-solid fa-sun"
        : "fa-solid fa-moon";
}

const savedTheme = localStorage.getItem("mirqah-theme");

if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
}

updateThemeIcon();

themeToggle.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");

    const isDark = document.body.classList.contains("dark-mode");

    localStorage.setItem(
        "mirqah-theme",
        isDark ? "dark" : "light"
    );

    updateThemeIcon();
});


// =====================================
// 4. Pages Navigation
// =====================================

const pageTitle = document.getElementById("page-title");
const dashboardPage = document.getElementById("dashboard-page");
const mainContent = document.querySelector(".main-content");

const pages = {
    dashboard: "الرئيسية",
    schedule: "الجدول الأسبوعي",
    subjects: "المواد الدراسية",
    calendar: "التقويم السنوي",
    tasks: "المهام اليومية",
    timer: "مؤقت المذاكرة",
    exams: "الامتحانات",
    statistics: "الإحصائيات",
    notes: "دفتر الملاحظات",
    achievements: "الإنجازات",
    revisions: "المراجعات",
    library: "مكتبة الملفات"
};

const pagesContainer = document.createElement("div");
pagesContainer.id = "pages-container";
pagesContainer.style.display = "none";

mainContent.appendChild(pagesContainer);


// =====================================
// 5. Dashboard Statistics
// =====================================

function renderDashboardStats() {
    const subjects = getSubjects();

    const completedLessons = subjects.reduce((total, subject) => {
        return total + subject.units.reduce((unitTotal, unit) => {
            return unitTotal + unit.lessons.filter(
                lesson => lesson.completed
            ).length;
        }, 0);
    }, 0);

    const tasks = getSection("tasks") || [];
    const remainingTasks = tasks.filter(task => !task.completed).length;

    document.getElementById("total-subjects").textContent =
        subjects.length;

    document.getElementById("completed-lessons").textContent =
        completedLessons;

    document.getElementById("remaining-tasks").textContent =
        remainingTasks;
}


// =====================================
// 6. Navigation Function
// =====================================

function navigateToPage(pageName) {
    if (!pages[pageName]) return;

    pageTitle.textContent = pages[pageName];

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle(
            "active",
            link.dataset.page === pageName
        );
    });

    if (pageName === "dashboard") {
        dashboardPage.style.display = "block";
        pagesContainer.style.display = "none";
        renderDashboardStats();
        return;
    }

    dashboardPage.style.display = "none";
    pagesContainer.style.display = "block";

    if (pageName === "subjects") {
        renderSubjectsPage();
    } else if (window.pageRenderers && pageRenderers[pageName]) {
        pageRenderers[pageName](pagesContainer);
    } else {
        pagesContainer.innerHTML = `
            <div class="content-card">
                <h2>${pages[pageName]}</h2>
                <p class="empty-message">
                    سيتم تطوير هذا القسم قريباً.
                </p>
            </div>
        `;
    }
}

document.addEventListener("click", function (event) {
    const link = event.target.closest("[data-page]");

    if (!link) return;

    event.preventDefault();
    navigateToPage(link.dataset.page);
});


// =====================================
// 7. Subject Progress
// =====================================

function getSubjectProgress(subject) {
    const lessons = subject.units.flatMap(unit => unit.lessons);

    const total = lessons.length;

    const completed = lessons.filter(
        lesson => lesson.completed
    ).length;

    return {
        total,
        completed,
        percentage: total ? Math.round(completed / total * 100) : 0
    };
}


// =====================================
// 8. Render Subjects Page
// =====================================

function renderSubjectsPage() {
    const subjects = getSubjects();

    pagesContainer.innerHTML = `
        <div class="subjects-page">

            <div class="subjects-toolbar">
                <div>
                    <h2>المواد الدراسية</h2>
                    <p>نظم موادك وتابع تقدمك الدراسي</p>
                </div>

                <button class="primary-btn" data-action="add-subject">
                    <i class="fa-solid fa-plus"></i>
                    إضافة مادة
                </button>
            </div>

            <div class="subjects-grid">

                ${subjects.length === 0 ? `
                    <div class="content-card empty-subjects">
                        <i class="fa-solid fa-book-open"></i>
                        <h3>لا توجد مواد دراسية بعد</h3>
                        <p>ابدأ بإضافة أول مادة دراسية لك.</p>
                    </div>
                ` : subjects.map(subject => {
                    const progress = getSubjectProgress(subject);

                    return `
                        <div class="content-card subject-card">

                            <div class="subject-card-header">
                                <div class="subject-icon">
                                    <i class="fa-solid fa-book"></i>
                                </div>

                                <div class="subject-actions">
                                    <button title="تعديل المادة"
                                        data-action="edit-subject"
                                        data-subject="${subject.id}">
                                        <i class="fa-solid fa-pen"></i>
                                    </button>

                                    <button title="حذف المادة"
                                        data-action="delete-subject"
                                        data-subject="${subject.id}">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </div>

                            <h3>${escapeHTML(subject.name)}</h3>

                            <div class="subject-info">
                                <span>${subject.units.length} وحدة</span>
                                <span>${progress.completed} / ${progress.total} درس</span>
                            </div>

                            <div class="progress-track">
                                <div class="progress-fill"
                                    style="width: ${progress.percentage}%">
                                </div>
                            </div>

                            <div class="progress-label">
                                <span>نسبة الإنجاز</span>
                                <strong>${progress.percentage}%</strong>
                            </div>

                            <button class="outline-btn"
                                data-action="open-subject"
                                data-subject="${subject.id}">
                                إدارة الوحدات والدروس
                                <i class="fa-solid fa-arrow-left"></i>
                            </button>

                        </div>
                    `;
                }).join("")}

            </div>
        </div>
    `;
}


// =====================================
// 9. Add Subject
// =====================================

function addSubject() {
    const name = prompt("اكتب اسم المادة:");

    if (name === null) return;

    const cleanName = name.trim();

    if (!cleanName) {
        alert("اكتب اسم المادة أولاً.");
        return;
    }

    const subjects = getSubjects();

    if (subjects.some(subject =>
        subject.name.trim().toLowerCase() === cleanName.toLowerCase()
    )) {
        alert("هذه المادة موجودة بالفعل.");
        return;
    }

    subjects.push({
        id: createId(),
        name: cleanName,
        units: [],
        createdAt: new Date().toISOString()
    });

    if (saveSubjects(subjects)) {
        renderSubjectsPage();
    }
}


// =====================================
// 10. Edit Subject
// =====================================

function editSubject(subjectId) {
    const subjects = getSubjects();

    const subject = subjects.find(
        item => item.id === subjectId
    );

    if (!subject) return;

    const name = prompt("تعديل اسم المادة:", subject.name);

    if (name === null) return;

    if (!name.trim()) {
        alert("اسم المادة لا يمكن أن يكون فارغاً.");
        return;
    }

    subject.name = name.trim();

    if (saveSubjects(subjects)) {
        renderSubjectsPage();
    }
}


// =====================================
// 11. Delete Subject
// =====================================

function deleteSubject(subjectId) {
    const subjects = getSubjects();

    const subject = subjects.find(
        item => item.id === subjectId
    );

    if (!subject) return;

    if (!confirm(`هل أنت متأكد من حذف مادة ${subject.name} وجميع وحداتها ودروسها؟`)) {
        return;
    }

    const updatedSubjects = subjects.filter(
        item => item.id !== subjectId
    );

    if (saveSubjects(updatedSubjects)) {
        renderSubjectsPage();
    }
}


// =====================================
// 12. Open Subject
// =====================================

function openSubject(subjectId) {
    const subjects = getSubjects();

    const subject = subjects.find(
        item => item.id === subjectId
    );

    if (!subject) return;

    renderSubjectDetails(subject);
}


// =====================================
// 13. Render Subject Details
// =====================================

function renderSubjectDetails(subject) {
    const progress = getSubjectProgress(subject);

    pagesContainer.innerHTML = `
        <div class="subject-details">

            <button class="back-btn" data-action="back-subjects">
                <i class="fa-solid fa-arrow-right"></i>
                العودة للمواد
            </button>

            <div class="content-card subject-overview">

                <div>
                    <span class="details-label">المادة الدراسية</span>
                    <h2>${escapeHTML(subject.name)}</h2>
                    <p>
                        ${subject.units.length} وحدة -
                        ${progress.total} درس -
                        ${progress.completed} مكتمل
                    </p>
                </div>

                <div class="overview-progress">
                    <strong>${progress.percentage}%</strong>
                    <span>نسبة الإنجاز</span>
                </div>

            </div>

            <div class="units-heading">
                <div>
                    <h3>الوحدات الدراسية</h3>
                    <p>نظم دروس المادة داخل وحدات</p>
                </div>

                <button class="primary-btn"
                    data-action="add-unit"
                    data-subject="${subject.id}">
                    <i class="fa-solid fa-plus"></i>
                    إضافة وحدة
                </button>
            </div>

            <div class="units-list">

                ${subject.units.length === 0 ? `
                    <div class="content-card empty-subjects">
                        <i class="fa-solid fa-folder-open"></i>
                        <p>لم تتم إضافة وحدات لهذه المادة بعد.</p>
                    </div>
                ` : subject.units.map(unit => `
                    <div class="content-card unit-card">

                        <div class="unit-header">

                            <div>
                                <h3>
                                    <i class="fa-solid fa-folder"></i>
                                    ${escapeHTML(unit.name)}
                                </h3>

                                <span>${unit.lessons.length} درس</span>
                            </div>

                            <div class="unit-actions">

                                <button title="تعديل الوحدة"
                                    data-action="edit-unit"
                                    data-subject="${subject.id}"
                                    data-unit="${unit.id}">
                                    <i class="fa-solid fa-pen"></i>
                                </button>

                                <button title="حذف الوحدة"
                                    data-action="delete-unit"
                                    data-subject="${subject.id}"
                                    data-unit="${unit.id}">
                                    <i class="fa-solid fa-trash"></i>
                                </button>

                            </div>

                        </div>

                        <div class="lessons-list">

                            ${unit.lessons.length === 0 ? `
                                <p class="empty-message">
                                    لا توجد دروس في هذه الوحدة.
                                </p>
                            ` : unit.lessons.map(lesson => `
                                <div class="lesson-item">

                                    <label class="lesson-label">
                                        <input type="checkbox"
                                            data-action="toggle-lesson"
                                            data-subject="${subject.id}"
                                            data-unit="${unit.id}"
                                            data-lesson="${lesson.id}"
                                            ${lesson.completed ? "checked" : ""}>

                                        <span class="${lesson.completed ? "completed-lesson" : ""}">
                                            ${escapeHTML(lesson.name)}
                                        </span>
                                    </label>

                                    <div class="lesson-actions">

                                        <button title="تعديل الدرس"
                                            data-action="edit-lesson"
                                            data-subject="${subject.id}"
                                            data-unit="${unit.id}"
                                            data-lesson="${lesson.id}">
                                            <i class="fa-solid fa-pen"></i>
                                        </button>

                                        <button title="حذف الدرس"
                                            data-action="delete-lesson"
                                            data-subject="${subject.id}"
                                            data-unit="${unit.id}"
                                            data-lesson="${lesson.id}">
                                            <i class="fa-solid fa-trash"></i>
                                        </button>

                                    </div>

                                </div>
                            `).join("")}

                        </div>

                        <button class="add-lesson-btn"
                            data-action="add-lesson"
                            data-subject="${subject.id}"
                            data-unit="${unit.id}">
                            <i class="fa-solid fa-plus"></i>
                            إضافة درس
                        </button>

                    </div>
                `).join("")}

            </div>

        </div>
    `;
}


// =====================================
// 14. Add Unit
// =====================================

function addUnit(subjectId) {
    const name = prompt("اكتب اسم الوحدة:");

    if (name === null) return;

    if (!name.trim()) {
        alert("اكتب اسم الوحدة.");
        return;
    }

    const subjects = getSubjects();
    const subject = subjects.find(item => item.id === subjectId);

    if (!subject) return;

    subject.units.push({
        id: createId(),
        name: name.trim(),
        lessons: []
    });

    if (saveSubjects(subjects)) {
        renderSubjectDetails(subject);
    }
}


// =====================================
// 15. Edit Unit
// =====================================

function editUnit(subjectId, unitId) {
    const subjects = getSubjects();
    const subject = subjects.find(item => item.id === subjectId);

    if (!subject) return;

    const unit = subject.units.find(item => item.id === unitId);
    if (!unit) return;

    const name = prompt("تعديل اسم الوحدة:", unit.name);

    if (name === null) return;

    if (!name.trim()) {
        alert("اسم الوحدة مطلوب.");
        return;
    }

    unit.name = name.trim();

    if (saveSubjects(subjects)) {
        renderSubjectDetails(subject);
    }
}


// =====================================
// 16. Delete Unit
// =====================================

function deleteUnit(subjectId, unitId) {
    const subjects = getSubjects();
    const subject = subjects.find(item => item.id === subjectId);

    if (!subject) return;

    const unit = subject.units.find(item => item.id === unitId);
    if (!unit) return;

    if (!confirm(`حذف الوحدة "${unit.name}" وجميع دروسها؟`)) return;

    subject.units = subject.units.filter(
        item => item.id !== unitId
    );

    if (saveSubjects(subjects)) {
        renderSubjectDetails(subject);
    }
}


// =====================================
// 17. Add Lesson
// =====================================

function addLesson(subjectId, unitId) {
    const name = prompt("اكتب اسم الدرس:");

    if (name === null) return;

    if (!name.trim()) {
        alert("اكتب اسم الدرس.");
        return;
    }

    const subjects = getSubjects();
    const subject = subjects.find(item => item.id === subjectId);

    if (!subject) return;

    const unit = subject.units.find(item => item.id === unitId);
    if (!unit) return;

    unit.lessons.push({
        id: createId(),
        name: name.trim(),
        completed: false
    });

    if (saveSubjects(subjects)) {
        renderSubjectDetails(subject);
    }
}


// =====================================
// 18. Edit Lesson
// =====================================

function editLesson(subjectId, unitId, lessonId) {
    const subjects = getSubjects();
    const subject = subjects.find(item => item.id === subjectId);

    if (!subject) return;

    const unit = subject.units.find(item => item.id === unitId);
    if (!unit) return;

    const lesson = unit.lessons.find(item => item.id === lessonId);
    if (!lesson) return;

    const name = prompt("تعديل اسم الدرس:", lesson.name);

    if (name === null) return;

    if (!name.trim()) {
        alert("اسم الدرس مطلوب.");
        return;
    }

    lesson.name = name.trim();

    if (saveSubjects(subjects)) {
        renderSubjectDetails(subject);
    }
}


// =====================================
// 19. Delete Lesson
// =====================================

function deleteLesson(subjectId, unitId, lessonId) {
    const subjects = getSubjects();
    const subject = subjects.find(item => item.id === subjectId);

    if (!subject) return;

    const unit = subject.units.find(item => item.id === unitId);
    if (!unit) return;

    const lesson = unit.lessons.find(item => item.id === lessonId);
    if (!lesson) return;

    if (!confirm(`هل تريد حذف الدرس "${lesson.name}"؟`)) return;

    unit.lessons = unit.lessons.filter(
        item => item.id !== lessonId
    );

    if (saveSubjects(subjects)) {
        renderSubjectDetails(subject);
    }
}


// =====================================
// 20. Toggle Lesson Completion
// =====================================

function toggleLesson(subjectId, unitId, lessonId, completed) {
    const subjects = getSubjects();
    const subject = subjects.find(item => item.id === subjectId);

    if (!subject) return;

    const unit = subject.units.find(item => item.id === unitId);
    if (!unit) return;

    const lesson = unit.lessons.find(item => item.id === lessonId);
    if (!lesson) return;

    lesson.completed = completed;

    if (saveSubjects(subjects)) {
        renderSubjectDetails(subject);
    }
}


// =====================================
// 21. Subjects Actions
// =====================================

pagesContainer.addEventListener("click", function(event) {
    const button = event.target.closest("[data-action]");

    if (!button) return;

    const action = button.dataset.action;
    const subjectId = button.dataset.subject;
    const unitId = button.dataset.unit;
    const lessonId = button.dataset.lesson;

    switch (action) {
        case "add-subject":
            addSubject();
            break;

        case "edit-subject":
            editSubject(subjectId);
            break;

        case "delete-subject":
            deleteSubject(subjectId);
            break;

        case "open-subject":
            openSubject(subjectId);
            break;

        case "back-subjects":
            renderSubjectsPage();
            break;

        case "add-unit":
            addUnit(subjectId);
            break;

        case "edit-unit":
            editUnit(subjectId, unitId);
            break;

        case "delete-unit":
            deleteUnit(subjectId, unitId);
            break;

        case "add-lesson":
            addLesson(subjectId, unitId);
            break;

        case "edit-lesson":
            editLesson(subjectId, unitId, lessonId);
            break;

        case "delete-lesson":
            deleteLesson(subjectId, unitId, lessonId);
            break;
    }
});

pagesContainer.addEventListener("change", function(event) {
    const input = event.target;

    if (input.dataset.action !== "toggle-lesson") return;

    toggleLesson(
        input.dataset.subject,
        input.dataset.unit,
        input.dataset.lesson,
        input.checked
    );
});


// =====================================
// 22. Initialize
// =====================================

renderDashboardStats();
