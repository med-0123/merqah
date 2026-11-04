// =====================================
// Study Timer (يُحمَّل بعد app.js و dashboard.js)
// الجلسة: { id, subjectId, seconds, date }
// =====================================

window.pageRenderers = window.pageRenderers || {};

const timerState = {
    targetSeconds: 25 * 60,
    accumulated: 0,        // ثواني محسوبة قبل آخر تشغيل
    startedAt: null,       // وقت آخر تشغيل
    intervalId: null,
    subjectId: ""
};

function timerElapsed() {
    const running = timerState.startedAt
        ? Math.floor((Date.now() - timerState.startedAt) / 1000)
        : 0;

    return timerState.accumulated + running;
}

function timerRemaining() {
    return Math.max(timerState.targetSeconds - timerElapsed(), 0);
}

function formatClock(totalSeconds) {
    const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const s = String(totalSeconds % 60).padStart(2, "0");
    return `${m}:${s}`;
}

function updateTimerDisplay() {
    const display = document.getElementById("timer-display");
    const bar = document.getElementById("timer-bar");

    if (display) display.textContent = formatClock(timerRemaining());

    if (bar) {
        const percent = Math.min(timerElapsed() / timerState.targetSeconds * 100, 100);
        bar.style.width = percent + "%";
    }
}

function saveStudySession(seconds) {
    if (seconds < 60) {
        alert("الجلسة أقل من دقيقة ولم تُسجَّل.");
        return false;
    }

    const sessions = getStudySessions();

    sessions.push({
        id: createId(),
        subjectId: timerState.subjectId,
        seconds,
        date: new Date().toISOString()
    });

    if (!updateSection("studySessions", sessions)) {
        alert("حدث خطأ أثناء حفظ الجلسة.");
        return false;
    }

    renderDashboardStats();
    return true;
}

function stopTimerInterval() {
    clearInterval(timerState.intervalId);
    timerState.intervalId = null;
}

function startTimer() {
    if (timerState.startedAt) return;

    timerState.startedAt = Date.now();
    timerState.intervalId = setInterval(timerTick, 1000);
    renderTimerPage(pagesContainer);
}

function pauseTimer() {
    if (!timerState.startedAt) return;

    timerState.accumulated = timerElapsed();
    timerState.startedAt = null;
    stopTimerInterval();
    renderTimerPage(pagesContainer);
}

function resetTimer() {
    stopTimerInterval();
    timerState.accumulated = 0;
    timerState.startedAt = null;
    renderTimerPage(pagesContainer);
}

function finishTimer() {
    const seconds = Math.min(timerElapsed(), timerState.targetSeconds);

    if (saveStudySession(seconds)) resetTimer();
}

function timerTick() {
    if (timerRemaining() <= 0) {
        stopTimerInterval();
        timerState.accumulated = timerState.targetSeconds;
        timerState.startedAt = null;

        if (saveStudySession(timerState.targetSeconds)) {
            alert("أحسنت! انتهت جلسة المذاكرة وتم تسجيلها 🎉");
            timerState.accumulated = 0;
        }

        if (document.getElementById("timer-display")) renderTimerPage(pagesContainer);
        return;
    }

    updateTimerDisplay();
}

function renderTimerPage(container) {
    const target = container || pagesContainer;
    const subjects = getSubjects();
    const running = Boolean(timerState.startedAt);
    const started = running || timerElapsed() > 0;
    const presets = [15, 25, 45, 60, 90];

    const today = localDateKey(new Date());
    const todaySessions = getStudySessions()
        .filter(s => localDateKey(s.date) === today)
        .reverse();

    target.innerHTML = `
        <div class="timer-page">

            <div class="subjects-toolbar">
                <div>
                    <h2>مؤقت المذاكرة</h2>
                    <p>ركّز، وكل جلسة مكتملة تُسجَّل في ساعات مذاكرتك</p>
                </div>
            </div>

            <div class="content-card timer-card">

                <div class="timer-display" id="timer-display">${formatClock(timerRemaining())}</div>

                <div class="progress-track timer-track">
                    <div class="progress-fill" id="timer-bar"></div>
                </div>

                <div class="timer-presets">
                    ${presets.map(min => `
                        <button class="${timerState.targetSeconds === min * 60 ? "active" : ""}"
                            data-timer="preset" data-min="${min}"
                            ${started ? "disabled" : ""}>${min} د</button>
                    `).join("")}
                </div>

                <select id="timer-subject" ${started ? "disabled" : ""}>
                    <option value="">بدون مادة</option>
                    ${subjects.map(s => `
                        <option value="${s.id}" ${s.id === timerState.subjectId ? "selected" : ""}>
                            ${escapeHTML(s.name)}
                        </option>`).join("")}
                </select>

                <div class="timer-controls">
                    ${running
                        ? `<button class="primary-btn" data-timer="pause"><i class="fa-solid fa-pause"></i> إيقاف مؤقت</button>`
                        : `<button class="primary-btn" data-timer="start"><i class="fa-solid fa-play"></i> ${started ? "استئناف" : "ابدأ"}</button>`}

                    ${started ? `
                        <button class="outline-btn timer-btn" data-timer="finish">
                            <i class="fa-solid fa-flag-checkered"></i> إنهاء وحفظ
                        </button>
                        <button class="cancel-btn" data-timer="reset">إلغاء</button>
                    ` : ""}
                </div>

            </div>

            <div class="content-card">
                <div class="card-header">
                    <div>
                        <h3>جلسات اليوم</h3>
                        <p>${todaySessions.length} جلسة</p>
                    </div>
                </div>

                ${todaySessions.length === 0
                    ? `<p class="empty-message">لم تسجّل أي جلسة اليوم بعد.</p>`
                    : todaySessions.map(s => {
                        const subject = subjects.find(item => item.id === s.subjectId);
                        return `
                            <div class="mini-item">
                                <i class="fa-regular fa-circle-check"></i>
                                <div>
                                    <strong>${subject ? escapeHTML(subject.name) : "جلسة مذاكرة"}</strong>
                                    <span>${Math.round(s.seconds / 60)} دقيقة</span>
                                </div>
                            </div>`;
                    }).join("")}
            </div>

        </div>
    `;

    updateTimerDisplay();
}

window.pageRenderers.timer = renderTimerPage;


// ---------- الأحداث ----------

document.addEventListener("click", function (event) {
    const button = event.target.closest("[data-timer]");

    if (!button || button.disabled) return;

    switch (button.dataset.timer) {
        case "preset":
            timerState.targetSeconds = Number(button.dataset.min) * 60;
            renderTimerPage(pagesContainer);
            break;
        case "start":
            startTimer();
            break;
        case "pause":
            pauseTimer();
            break;
        case "finish":
            finishTimer();
            break;
        case "reset":
            if (confirm("إلغاء الجلسة الحالية دون حفظ؟")) resetTimer();
            break;
    }
});

document.addEventListener("change", function (event) {
    if (event.target.id === "timer-subject") {
        timerState.subjectId = event.target.value;
    }
});
