// =====================================
// Tasks Page (يُحمَّل بعد app.js و dashboard.js)
// المهمة: { id, title, subjectId, dueDate: "YYYY-MM-DD", completed, createdAt }
// =====================================

window.pageRenderers = window.pageRenderers || {};

let taskFilter = "all";

function getTasks() {
    return getSection("tasks") || [];
}

function saveTasks(tasks) {
    const saved = updateSection("tasks", tasks);

    if (!saved) {
        alert("حدث خطأ أثناء حفظ البيانات.");
        return false;
    }

    renderDashboardStats();
    return true;
}

function formatDueDate(dateString) {
    const date = new Date(dateString + "T00:00:00");

    if (isNaN(date)) return "";

    return date.toLocaleDateString("ar-EG", { day: "numeric", month: "long" });
}

function isOverdue(task) {
    return Boolean(task.dueDate) && !task.completed && task.dueDate < localDateKey(new Date());
}

function renderTasksPage(container) {
    const target = container || pagesContainer;
    const tasks = getTasks();
    const subjects = getSubjects();

    const visible = tasks
        .filter(task => {
            if (taskFilter === "pending") return !task.completed;
            if (taskFilter === "done") return task.completed;
            return true;
        })
        .sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return a.dueDate.localeCompare(b.dueDate);
        });

    const filters = [
        ["all", "الكل"],
        ["pending", "المتبقية"],
        ["done", "المكتملة"]
    ];

    target.innerHTML = `
        <div class="tasks-page">

            <div class="subjects-toolbar">
                <div>
                    <h2>المهام اليومية</h2>
                    <p>${tasks.filter(t => !t.completed).length} مهمة متبقية من ${tasks.length}</p>
                </div>
            </div>

            <form class="content-card task-form" id="task-form">
                <input type="text" name="title" placeholder="اكتب مهمة جديدة..." required maxlength="120">

                <select name="subject">
                    <option value="">بدون مادة</option>
                    ${subjects.map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join("")}
                </select>

                <input type="date" name="dueDate">

                <button type="submit" class="primary-btn">
                    <i class="fa-solid fa-plus"></i>
                    إضافة
                </button>
            </form>

            <div class="filter-tabs">
                ${filters.map(([key, label]) => `
                    <button class="${taskFilter === key ? "active" : ""}"
                        data-tk="filter" data-filter="${key}">${label}</button>
                `).join("")}
            </div>

            <div class="content-card">
                ${visible.length === 0 ? `
                    <p class="empty-message">لا توجد مهام في هذا العرض.</p>
                ` : visible.map(task => {
                    const subject = subjects.find(s => s.id === task.subjectId);

                    return `
                        <div class="task-item">
                            <label class="lesson-label">
                                <input type="checkbox" data-tk="toggle" data-task="${task.id}"
                                    ${task.completed ? "checked" : ""}>
                                <span class="${task.completed ? "completed-lesson" : ""}">
                                    ${escapeHTML(task.title)}
                                </span>
                            </label>

                            <div class="task-meta">
                                ${subject ? `<span class="tag">${escapeHTML(subject.name)}</span>` : ""}
                                ${task.dueDate ? `
                                    <span class="tag ${isOverdue(task) ? "tag-danger" : ""}">
                                        <i class="fa-regular fa-calendar"></i>
                                        ${formatDueDate(task.dueDate)}
                                    </span>` : ""}
                            </div>

                            <div class="lesson-actions">
                                <button title="تعديل" data-tk="edit" data-task="${task.id}">
                                    <i class="fa-solid fa-pen"></i>
                                </button>
                                <button title="حذف" data-tk="delete" data-task="${task.id}">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }).join("")}
            </div>

        </div>
    `;
}

window.pageRenderers.tasks = renderTasksPage;

function refreshTasksView() {
    if (document.querySelector(".tasks-page")) renderTasksPage(pagesContainer);
}


// ---------- الأحداث ----------

pagesContainer.addEventListener("submit", function (event) {
    if (event.target.id !== "task-form") return;

    event.preventDefault();

    const form = event.target;
    const title = form.title.value.trim();

    if (!title) return;

    const tasks = getTasks();

    tasks.push({
        id: createId(),
        title,
        subjectId: form.subject.value,
        dueDate: form.dueDate.value,
        completed: false,
        createdAt: new Date().toISOString()
    });

    if (saveTasks(tasks)) renderTasksPage(pagesContainer);
});

document.addEventListener("click", function (event) {
    const button = event.target.closest("[data-tk]");

    if (!button || button.tagName === "INPUT") return;

    const action = button.dataset.tk;
    const tasks = getTasks();
    const task = tasks.find(item => item.id === button.dataset.task);

    if (action === "filter") {
        taskFilter = button.dataset.filter;
        renderTasksPage(pagesContainer);
        return;
    }

    if (!task) return;

    if (action === "edit") {
        const title = prompt("تعديل المهمة:", task.title);

        if (title === null) return;

        if (!title.trim()) {
            alert("اسم المهمة مطلوب.");
            return;
        }

        task.title = title.trim();
        if (saveTasks(tasks)) renderTasksPage(pagesContainer);
    }

    if (action === "delete") {
        if (!confirm(`حذف المهمة "${task.title}"؟`)) return;

        if (saveTasks(tasks.filter(item => item.id !== task.id))) {
            renderTasksPage(pagesContainer);
        }
    }
});

document.addEventListener("change", function (event) {
    const input = event.target;

    if (input.dataset.tk !== "toggle") return;

    const tasks = getTasks();
    const task = tasks.find(item => item.id === input.dataset.task);

    if (!task) return;

    task.completed = input.checked;

    if (saveTasks(tasks)) refreshTasksView();
});
