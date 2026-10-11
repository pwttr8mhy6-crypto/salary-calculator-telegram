// Инициализация Telegram Web App
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

// Текущий рабочий контекст (Октябрь 2026)
const YEAR = 2026;
const MONTH = 9; // Октябрь (индекс с 0)
const TOTAL_DAYS = 31;
const FIRST_DAY_WEEKDAY = 3; // 1 Октября 2026 — Четверг (0 = ПН, 3 = ЧТ)

// Полностью изменяемый конфигуратор параметров (дефолтные значения из ТЗ)
let settings = {
    // Параметры кастомного графика
    workDays: 3,
    offDays: 2,
    anchorDateStr: "2026-10-11", // Произвольная изменяемая дата отсчета
    hoursPerShift: 11,           // Длительность рабочей смены (чистых часов)

    // Финансовое ядро
    baseSalary: 28000,
    normHours: 160,
    gsmRate: 74,
    rent: 15000,
    yearBonus: 5000,
    taxPercent: 87,             // Процент выплаты "на руки"
    bonusMonthPercent: 10,       // % надбавки за лучший месяц
    hasBestMonthBonus: false,
    
    // Подключения
    connBase: 650,
    connSingle: 0,
    connPair: 0,
    coefSingle: 1.0,
    coefPair: 0.5,
    
    // Пороги и доплаты
    threshold1: 24,
    bonus1: 100,
    threshold2: 34,
    bonus2: 150
};

// Загрузка личного профиля пользователя из кэша Telegram-сессии
if (localStorage.getItem('user_calc_profile')) {
    settings = JSON.parse(localStorage.getItem('user_calc_profile'));
}

function switchTab(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(screenId).classList.add('active');
    event.currentTarget.classList.add('active');
    
    if (screenId === 'screen-calc') {
        calculateSalary();
    }
}

// Универсальный генератор любого типа циклического графика
function generateCalendar() {
    const tbody = document.getElementById('calendar-body');
    tbody.innerHTML = '';
    
    const anchorDate = new Date(settings.anchorDateStr + "T00:00:00");
    const cycleLength = settings.workDays + settings.offDays;
    
    let row = document.createElement('tr');
    
    // Сдвиг сетки под дни недели
    for (let i = 0; i < FIRST_DAY_WEEKDAY; i++) {
        row.appendChild(document.createElement('td'));
    }
    
    let currentWeekday = FIRST_DAY_WEEKDAY;
    let workShifts = 0;
    
    for (let day = 1; day <= TOTAL_DAYS; day++) {
        if (currentWeekday === 7) {
            tbody.appendChild(row);
            row = document.createElement('tr');
            currentWeekday = 0;
        }
        
        const td = document.createElement('td');
        td.innerText = day;
        
        const currentDate = new Date(YEAR, MONTH, day);
        const diffTime = currentDate - anchorDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        // Расчет позиции дня внутри произвольного кастомного цикла
        let cycleIndex = diffDays % cycleLength;
        if (cycleIndex < 0) cycleIndex += cycleLength;
        
        // Если индекс меньше количества рабочих дней подряд — день рабочий
        if (cycleIndex < settings.workDays) {
            td.classList.add('day-work');
            workShifts++;
        } else {
            td.classList.add('day-off');
        }
        
        row.appendChild(td);
        currentWeekday++;
    }
    
    if (currentWeekday > 0) {
        for (let i = currentWeekday; i < 7; i++) {
            row.appendChild(document.createElement('td'));
        }
        tbody.appendChild(row);
    }
    
    // Пересчет KPI на основе динамически выбранных параметров
    const totalHours = workShifts * settings.hoursPerShift;
    document.getElementById('kpi-shifts').innerText = workShifts;
    document.getElementById('kpi-hours').innerText = totalHours;
    document.getElementById('kpi-offs').innerText = (TOTAL_DAYS - workShifts);
    document.getElementById('calendar-title').innerText = `Октябрь 2026 (График ${settings.workDays}/${settings.offDays})`;
    
    window.currentWorkHours = totalHours;
}

// Пересчет зарплаты на основе динамических полей ввода
function calculateSalary() {
    const hoursFact = window.currentWorkHours || 0;
    
    const calculatedBase = (settings.baseSalary / settings.normHours) * hoursFact;
    const calculatedGsm = hoursFact * settings.gsmRate;
    
    // Подключения с учетом весовых коэффициентов (Одиночные = 1.0, Вдвоем = 0.5)
    const totalUnits = (settings.connSingle * settings.coefSingle) + (settings.connPair * settings.coefPair);
    
    // Прогрессивные доплаты к базовой ставке
    let currentRate = settings.connBase;
    if (totalUnits >= settings.threshold2) {
        currentRate += settings.bonus2;
    } else if (totalUnits >= settings.threshold1) {
        currentRate += settings.bonus1;
    }
    const connectEarnings = totalUnits * currentRate;
    
    let staticBonuses = Number(settings.rent) + Number(settings.yearBonus);
    if (settings.hasBestMonthBonus) {
        staticBonuses += calculatedBase * (settings.bonusMonthPercent / 100);
    }
    
    const totalDirty = calculatedBase + calculatedGsm + connectEarnings + staticBonuses;
    const totalClean = totalDirty * (settings.taxPercent / 100);
    
    document.getElementById('calc-hours-fact').innerText = `${hoursFact} / ${settings.normHours} ч.`;
    document.getElementById('calc-base-salary').innerText = `${Math.round(calculatedBase).toLocaleString()} ₽`;
    document.getElementById('calc-gsm').innerText = `${Math.round(calculatedGsm).toLocaleString()} ₽`;
    document.getElementById('calc-connects').innerText = `${Math.round(connectEarnings).toLocaleString()} ₽ (Ед: ${totalUnits})`;
    document.getElementById('calc-bonus').innerText = `${Math.round(staticBonuses).toLocaleString()} ₽`;
    document.getElementById('calc-total-cash').innerText = `${Math.round(totalClean).toLocaleString()} ₽`;
}

function saveSettings() {
    // Считывание параметров настраиваемого графика
    settings.workDays = Number(document.getElementById('set-work-days').value);
    settings.offDays = Number(document.getElementById('set-off-days').value);
    settings.anchorDateStr = document.getElementById('set-anchor').value;
    settings.hoursPerShift = Number(document.getElementById('set-shift-hours').value);

    // Считывание финансовых переменных
    settings.baseSalary = Number(document.getElementById('set-base').value);
    settings.normHours = Number(document.getElementById('set-norm').value);
    settings.gsmRate = Number(document.getElementById('set-gsm-rate').value);
    settings.rent = Number(document.getElementById('set-rent').value);
    settings.yearBonus = Number(document.getElementById('set-year-bonus').value);
    settings.connBase = Number(document.getElementById('set-conn-base').value);
    settings.connSingle = Number(document.getElementById('set-conn-single').value);
    settings.connPair = Number(document.getElementById('set-conn-pair').value);
    settings.hasBestMonthBonus = document.getElementById('set-best-month').value === "true";
    
    // Считывание порогов доплат за подключения
    settings.threshold1 = Number(document.getElementById('set-th1').value);
    settings.bonus1 = Number(document.getElementById('set-b1').value);
    settings.threshold2 = Number(document.getElementById('set-th2').value);
    settings.bonus2 = Number(document.getElementById('set-b2').value);
    
    localStorage.setItem('user_calc_profile', JSON.stringify(settings));
    alert('Профиль обновлен! Календарь и формулы пересчитаны под ваш личный график.');
    generateCalendar();
}

function syncSettingsToUI() {
    document.getElementById('set-work-days').value = settings.workDays;
    document.getElementById('set-off-days').value = settings.offDays;
    document.getElementById('set-anchor').value = settings.anchorDateStr;
    document.getElementById('set-shift-hours').value = settings.hoursPerShift;

    document.getElementById('set-base').value = settings.baseSalary;
    document.getElementById('set-norm').value = settings.normHours;
    document.getElementById('set-gsm-rate').value = settings.gsmRate;
    document.getElementById('set-rent').value = settings.rent;
    document.getElementById('set-year-bonus').value = settings.yearBonus;
    document.getElementById('set-conn-base').value = settings.connBase;
    document.getElementById('set-conn-single').value = settings.connSingle;
    document.getElementById('set-conn-pair').value = settings.connPair;
    document.getElementById('set-best-month').value = settings.hasBestMonthBonus ? "true" : "false";
    
    document.getElementById('set-th1').value = settings.threshold1;
    document.getElementById('set-b1').value = settings.bonus1;
    document.getElementById('set-th2').value = settings.threshold2;
    document.getElementById('set-b2').value = settings.bonus2;
}

generateCalendar();
syncSettingsToUI();
