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

function getData() {
    const savedData = localStorage.getItem("mirqah-data");

    if (!savedData) {
        return structuredClone(defaultData);
    }

    try {
        const parsedData = JSON.parse(savedData);

        return {
            ...structuredClone(defaultData),
            ...parsedData,
            settings: {
                ...defaultData.settings,
                ...parsedData.settings
            }
        };
    } catch (error) {
        console.error("Storage Error:", error);
        return structuredClone(defaultData);
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
    localStorage.removeItem("mirqah-data");
    return true;
}
