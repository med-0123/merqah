// =====================================
// Mirqah Storage System
// =====================================

const defaultData = {
    subjects: [],
    schedule: [],
    tasks: [],
    exams: [],
    events: [],
    studySessions: [],
    notes: [],
    achievements: [],
    revisions: [],
    library: [],
    settings: {
        theme: "light"
    }
};

function cloneDefaultData() {
    // لا نعتمد على structuredClone وحده لضمان التوافق مع متصفحات أقدم.
    return JSON.parse(JSON.stringify(defaultData));
}

function getData() {
    let savedData;

    try {
        savedData = localStorage.getItem("mirqah-data");
    } catch (error) {
        console.error("تعذرت قراءة التخزين المحلي:", error);
        return cloneDefaultData();
    }

    if (!savedData) return cloneDefaultData();

    try {
        const parsedData = JSON.parse(savedData);
        if (!parsedData || typeof parsedData !== "object" || Array.isArray(parsedData)) {
            return cloneDefaultData();
        }

        const data = {
            ...cloneDefaultData(),
            ...parsedData,
            settings: {
                ...defaultData.settings,
                ...(parsedData.settings && typeof parsedData.settings === "object"
                    ? parsedData.settings
                    : {})
            }
        };

        // إصلاح الأقسام التالفة أو القديمة دون حذف البيانات السليمة.
        Object.keys(defaultData).forEach(key => {
            if (key !== "settings" && !Array.isArray(data[key])) data[key] = [];
        });

        return data;
    } catch (error) {
        console.error("Storage Error:", error);
        return cloneDefaultData();
    }
}

function saveData(data) {
    try {
        localStorage.setItem("mirqah-data", JSON.stringify(data));
        return true;
    } catch (error) {
        console.error("Save Error:", error);
        return false;
    }
}

function getSection(sectionName) {
    const data = getData();
    return data[sectionName] ?? null;
}

function updateSection(sectionName, newData) {
    const data = getData();

    if (!(sectionName in data)) {
        return false;
    }

    data[sectionName] = newData;

    return saveData(data);
}

function resetData() {
    try {
        localStorage.removeItem("mirqah-data");
        return true;
    } catch (error) {
        console.error("Reset Error:", error);
        return false;
    }
}
