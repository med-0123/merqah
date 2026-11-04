// =====================================
// Notes
// الملاحظة: { id, title, content, subjectId, updatedAt }
// =====================================

const notesState = {
    editing: null   // null | "new" | note id
};

function renderNotesPage(container) {
    const target = container || pagesContainer;
    const notes = readList("notes").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const editingNote = notesState.editing && notesState.editing !== "new"
        ? notes.find(n => n.id === notesState.editing)
        : null;

    const editor = notesState.editing ? `
        <form class="content-card note-editor" id="note-form">
            <h3 class="section-title">${editingNote ? "تعديل الملاحظة" : "ملاحظة جديدة"}</h3>

            <input type="text" name="title" maxlength="80" required placeholder="العنوان"
                value="${editingNote ? escapeHTML(editingNote.title) : ""}">

            <select name="subject">${subjectOptions(editingNote ? editingNote.subjectId : "")}</select>

            <textarea name="content" placeholder="اكتب ملاحظتك هنا...">${editingNote ? escapeHTML(editingNote.content) : ""}</textarea>

            <div class="row-actions">
                <button type="submit" class="primary-btn">حفظ</button>
                <button type="button" class="cancel-btn" data-nt="cancel">إلغاء</button>
            </div>
        </form>
    ` : "";

    target.innerHTML = `
        <div class="page-stack">

            <div class="subjects-toolbar">
                <div>
                    <h2>دفتر الملاحظات</h2>
                    <p>${notes.length} ملاحظة</p>
                </div>

                <button class="primary-btn" data-nt="new">
                    <i class="fa-solid fa-plus"></i> ملاحظة جديدة
                </button>
            </div>

            ${editor}

            ${notes.length > 0 ? `
                <div class="inline-form">
                    <input type="search" id="notes-search" class="grow" placeholder="ابحث في الملاحظات...">
                </div>
            ` : ""}

            ${notes.length === 0 && !notesState.editing ? `
                <div class="content-card empty-subjects">
                    <i class="fa-solid fa-note-sticky"></i>
                    <h3>لا توجد ملاحظات بعد</h3>
                    <p>دوّن أفكارك وملخصاتك هنا.</p>
                </div>
            ` : `
                <div class="notes-grid" id="notes-grid">
                    ${notes.map(note => {
                        const subject = subjectNameById(note.subjectId);
                        const searchText = (note.title + " " + note.content + " " + subject).toLowerCase();

                        return `
                            <div class="content-card note-card" data-search="${escapeHTML(searchText)}">
                                <h4>${escapeHTML(note.title)}</h4>
                                ${subject ? `<span class="badge" style="width:fit-content">${escapeHTML(subject)}</span>` : ""}
                                <p>${escapeHTML(note.content)}</p>
                                <div class="note-foot">
                                    <small>${new Date(note.updatedAt).toLocaleDateString("ar-EG", { day: "numeric", month: "long" })}</small>
                                    <div class="row-actions">
                                        <button class="icon-action" title="تعديل" data-nt="edit" data-id="${note.id}">
                                            <i class="fa-solid fa-pen"></i>
                                        </button>
                                        <button class="icon-action" title="حذف" data-nt="delete" data-id="${note.id}">
                                            <i class="fa-solid fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>`;
                    }).join("")}
                </div>
            `}

        </div>
    `;
}

pageRenderers.notes = renderNotesPage;

pagesContainer.addEventListener("submit", function (event) {
    if (event.target.id !== "note-form") return;

    event.preventDefault();

    const form = event.target;
    const title = form.title.value.trim();

    if (!title) return;

    const notes = readList("notes");
    const now = new Date().toISOString();
    const existing = notesState.editing !== "new"
        ? notes.find(n => n.id === notesState.editing)
        : null;

    if (existing) {
        existing.title = title;
        existing.content = form.content.value;
        existing.subjectId = form.subject.value;
        existing.updatedAt = now;
    } else {
        notes.push({
            id: createId(),
            title,
            content: form.content.value,
            subjectId: form.subject.value,
            updatedAt: now
        });
    }

    if (saveList("notes", notes)) {
        notesState.editing = null;
        renderNotesPage(pagesContainer);
    }
});

pagesContainer.addEventListener("input", function (event) {
    if (event.target.id !== "notes-search") return;

    const query = event.target.value.trim().toLowerCase();

    document.querySelectorAll("#notes-grid .note-card").forEach(card => {
        card.style.display = card.dataset.search.includes(query) ? "" : "none";
    });
});

document.addEventListener("click", function (event) {
    const button = event.target.closest("[data-nt]");

    if (!button) return;

    switch (button.dataset.nt) {
        case "new":
            notesState.editing = "new";
            break;

        case "edit":
            notesState.editing = button.dataset.id;
            break;

        case "cancel":
            notesState.editing = null;
            break;

        case "delete": {
            if (!confirm("حذف هذه الملاحظة؟")) return;

            const notes = readList("notes").filter(n => n.id !== button.dataset.id);

            if (!saveList("notes", notes)) return;
            break;
        }

        default:
            return;
    }

    renderNotesPage(pagesContainer);
});
