// Инициализация Telegram Web App
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

// Константные настройки для Октября 2026
const YEAR = 2026;
const MONTH = 9; // Октябрь (индекс с 0)
const TOTAL_DAYS = 31;
const FIRST_DAY_WEEKDAY = 3; // 1 Октября 2026 — Четверг (индекс 3, где ПН=0)

// Дефолтные настройки
let settings = {
    baseSalary: 28000,
    normHours: 160,
    gsmRate: 74,
    rent: 15000,
    yearBonus: 5000,
    connBase: 650,
    connCount: 25,
    threshold1: 24,
    bonus1: 100,
    threshold2: 34,
    bonus2: 150
};

// Загрузка настроек из localStorage
if (localStorage.getItem('cal_settings')) {
    settings = JSON.parse(localStorage.getItem('cal_settings'));
}

// Функция переключения вкладок
function switchTab(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(screenId).classList.add('active');
    event.currentTarget.classList.add('active');
    
    if (screenId === 'screen-calc') {
        calculateSalary();
    }
}

// Генерация сетки календаря 3/2 для Октября 2026
function generateCalendar() {
    const tbody = document.getElementById('calendar-body');
    tbody.innerHTML = '';
    
    // Базовый цикл: отсчет от 11 октября 2026 (как в ТЗ)
    // Массив дней: 1 - рабочий, 0 - выходной
    // Распишем вручную соответствие графику 3/2 с учетом старта цикла 11 числа
    const schedule = [
        1, 1, 1, 0, 0, // 1-5
        1, 1, 1, 0, 0, // 6-10
        1, 1, 1, 0, 0, // 11-15
        1, 1, 1, 0, 0, // 16-20
        1, 1, 1, 0, 0, // 21-25
        1, 1, 1, 0, 0, // 26-30
        1              // 31
    ];

    let row = document.createElement('tr');
    
    // Пустые ячейки для сдвига до Четверга
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
        
        const isWork = schedule[day - 1];
        if (isWork === 1) {
            td.classList.add('day-work');
            workShifts++;
        } else {
            td.classList.add('day-off');
        }
        
        row.appendChild(td);
        currentWeekday++;
    }
    
    // Дописываем последнюю неделю
    if (currentWeekday > 0) {
        for (let i = currentWeekday; i < 7; i++) {
            row.appendChild(document.createElement('td'));
        }
        tbody.appendChild(row);
    }
    
    // Обновление метрик на главном экране
    const totalHours = workShifts * 11;
    document.getElementById('kpi-shifts').innerText = workShifts;
    document.getElementById('kpi-hours').innerText = totalHours;
    document.getElementById('kpi-offs').innerText = (TOTAL_DAYS - workShifts);
    
    // Сохраняем выработку в глобальную область для калькулятора
    window.currentWorkHours = totalHours;
}

// Алгоритм расчета заработной платы
function calculateSalary() {
    const hoursFact = window.currentWorkHours || 209;
    
    // 1. Пропорциональный оклад за часы
    const calculatedBase = (settings.baseSalary / settings.normHours) * hoursFact;
    
    // 2. ГСМ компенсация
    const calculatedGsm = hoursFact * settings.gsmRate;
    
    // 3. Подключения с прогрессивными порогами
    let connectEarnings = settings.connCount * settings.connBase;
    if (settings.connCount >= settings.threshold2) {
        connectEarnings += settings.connCount * settings.bonus2;
    } else if (settings.connCount >= settings.threshold1) {
        connectEarnings += settings.connCount * settings.bonus1;
    }
    
    // 4. Фиксированные бонусы и аренда
    const staticBonuses = Number(settings.rent) + Number(settings.yearBonus);
    
    // Итого "Грязными" и "На руки" (87%)
    const totalDirty = calculatedBase + calculatedGsm + connectEarnings + staticBonuses;
    const totalClean = totalDirty * 0.87;
    
    // Вывод на экран
    document.getElementById('calc-hours-fact').innerText = `${hoursFact} / ${settings.normHours} ч.`;
    document.getElementById('calc-base-salary').innerText = `${Math.round(calculatedBase).toLocaleString()} ₽`;
    document.getElementById('calc-gsm').innerText = `${Math.round(calculatedGsm).toLocaleString()} ₽`;
    document.getElementById('calc-connects').innerText = `${Math.round(connectEarnings).toLocaleString()} ₽`;
    document.getElementById('calc-bonus').innerText = `${Math.round(staticBonuses).toLocaleString()} ₽`;
    document.getElementById('calc-total-cash').innerText = `${Math.round(totalClean).toLocaleString()} ₽`;
}

// Сохранение кастомных настроек
function saveSettings() {
    settings.baseSalary = Number(document.getElementById('set-base').value);
    settings.gsmRate = Number(document.getElementById('set-gsm-rate').value);
    settings.rent = Number(document.getElementById('set-rent').value);
    settings.yearBonus = Number(document.getElementById('set-year-bonus').value);
    settings.connBase = Number(document.getElementById('set-conn-base').value);
    settings.connCount = Number(document.getElementById('set-conn-count').value);
    
    localStorage.setItem('cal_settings', JSON.stringify(settings));
    alert('Настройки успешно применены!');
    generateCalendar();
}

// Стартовый запуск
generateCalendar();
