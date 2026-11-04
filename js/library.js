// =====================================
// Library (روابط وملفات صغيرة)
// العنصر: { id, title, type: "link" | "file", url, fileName, size, subjectId, createdAt }
// الملفات تُحفظ داخل المتصفح، لذلك الحد الأقصى 700 كيلوبايت للملف.
// =====================================

const MAX_FILE_SIZE = 700 * 1024;

const libraryState = {
    filter: ""
};

function formatSize(bytes) {
    if (bytes < 1024) return bytes + " ب";
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " ك.ب";
    return (bytes / 1024 / 1024).toFixed(1) + " م.ب";
}

function renderLibraryPage(container) {
    const target = container || pagesContainer;
    const all = readList("library");
    const items = all
        .filter(i => !libraryState.filter || i.subjectId === libraryState.filter)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    target.innerHTML = `
        <div class="page-stack">

            <div class="subjects-toolbar">
                <div>
                    <h2>مكتبة الملفات</h2>
                    <p>${all.length} عنصر · احفظ روابطك ومراجعك وملفاتك الصغيرة</p>
                </div>
            </div>

            <form class="content-card inline-form" id="library-form">
                <input type="text" name="title" class="grow" maxlength="80" placeholder="العنوان (اختياري)">
                <select name="subject">${subjectOptions("")}</select>
                <input type="text" name="url" class="grow" dir="ltr" placeholder="رابط (https://...)">
                <input type="file" name="file" class="field">
                <button type="submit" class="primary-btn">
                    <i class="fa-solid fa-plus"></i> إضافة
                </button>
            </form>

            <div class="inline-form">
                <select id="library-filter" class="field">
                    ${subjectOptions(libraryState.filter, "كل المواد")}
                </select>
            </div>

            <div class="content-card">
                ${items.length === 0
                    ? `<p class="empty-message">لا توجد عناصر في المكتبة.</p>`
                    : items.map(item => {
                        const subject = subjectNameById(item.subjectId);
                        const isFile = item.type === "file";

                        return `
                            <div class="row-item">
                                <div class="file-icon ${isFile ? "" : "link"}">
                                    <i class="fa-solid ${isFile ? "fa-file" : "fa-link"}"></i>
                                </div>

                                <div class="row-main">
                                    <strong>${escapeHTML(item.title)}</strong>
                                    <span>
                                        ${subject ? escapeHTML(subject) + " · " : ""}${isFile ? escapeHTML(item.fileName) + " · " + formatSize(item.size) : "رابط"}
                                    </span>
                                </div>

                                <div class="row-actions">
                                    ${isFile
                                        ? `<a class="small-btn link-btn" href="${escapeHTML(item.url)}" download="${escapeHTML(item.fileName)}">تنزيل</a>`
                                        : `<a class="small-btn link-btn" href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer">فتح</a>`}
                                    <button class="icon-action" title="حذف" data-lb="delete" data-id="${item.id}">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </div>`;
                    }).join("")}
            </div>

        </div>
    `;
}

pageRenderers.library = renderLibraryPage;

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

pagesContainer.addEventListener("submit", async function (event) {
    if (event.target.id !== "library-form") return;

    event.preventDefault();

    const form = event.target;
    const file = form.file.files[0];
    const rawUrl = form.url.value.trim();
    const title = form.title.value.trim();

    if (!file && !rawUrl) {
        alert("أضف رابطاً أو اختر ملفاً.");
        return;
    }

    const items = readList("library");

    if (file) {
        if (file.size > MAX_FILE_SIZE) {
            alert("حجم الملف كبير. الحد الأقصى 700 كيلوبايت، ويمكنك حفظ رابط الملف بدلاً منه.");
            return;
        }

        let dataUrl;

        try {
            dataUrl = await readFileAsDataUrl(file);
        } catch (error) {
            alert("تعذّرت قراءة الملف.");
            return;
        }

        items.push({
            id: createId(),
            title: title || file.name,
            type: "file",
            url: dataUrl,
            fileName: file.name,
            size: file.size,
            subjectId: form.subject.value,
            createdAt: new Date().toISOString()
        });
    } else {
        const url = normalizeUrl(rawUrl);

        if (!url) {
            alert("الرابط غير صحيح.");
            return;
        }

        items.push({
            id: createId(),
            title: title || url,
            type: "link",
            url,
            fileName: "",
            size: 0,
            subjectId: form.subject.value,
            createdAt: new Date().toISOString()
        });
    }

    if (saveList("library", items)) renderLibraryPage(pagesContainer);
});

pagesContainer.addEventListener("change", function (event) {
    if (event.target.id !== "library-filter") return;

    libraryState.filter = event.target.value;
    renderLibraryPage(pagesContainer);
});

document.addEventListener("click", function (event) {
    const button = event.target.closest("[data-lb]");

    if (!button || button.dataset.lb !== "delete") return;

    if (!confirm("حذف هذا العنصر من المكتبة؟")) return;

    const items = readList("library").filter(i => i.id !== button.dataset.id);

    if (saveList("library", items)) renderLibraryPage(pagesContainer);
});
