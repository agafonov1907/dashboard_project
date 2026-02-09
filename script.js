document.addEventListener('DOMContentLoaded', function() {
    // Инициализация снега
    initSnowflakes();
    
    // Загрузка проектов
    loadProjects();
    
    // Настройка фильтров
    setupFilters();
    
    // Кнопка добавления проекта
    setupAddProject();
    
    // Обновление даты
    updateDateTime();
    setInterval(updateDateTime, 60000); // Каждую минуту
    
    // Анимация появления карточек
    animateCards();
});

// Инициализация анимации снега
function initSnowflakes() {
    const snowflakes = document.querySelectorAll('.snowflake');
    
    snowflakes.forEach((flake, index) => {
        // Случайные параметры для каждого снежинки
        const size = Math.random() * 1.5 + 0.5;
        const posX = Math.random() * 100;
        const duration = Math.random() * 15 + 10;
        const delay = Math.random() * 10;
        const xOffset = (Math.random() - 0.5) * 100;
        
        flake.style.fontSize = `${size}em`;
        flake.style.left = `${posX}%`;
        flake.style.animationDuration = `${duration}s`;
        flake.style.animationDelay = `${delay}s`;
        flake.style.setProperty('--x-offset', `${xOffset}px`);
        flake.style.opacity = `${Math.random() * 0.7 + 0.3}`;
    });
}

// Данные проектов (можно вынести в отдельный JSON файл)
function getProjectsData() {
    const data = localStorage.getItem('dashboard_projects');
    return data ? JSON.parse(data) : [
        {
            id: 1,
            title: "Чат-бот департамента",
            description: "Автоматизация взаимодействия с гражданами через мессенджеры",
            status: "active",
            department: "bots",
            timeline: [
                {
                    date: "09.02.2026",
                    title: "Направлен проект ТЗ",
                    description: "Подготовлено техническое задание для разработки чат-бота с интеграцией в мессенджеры"
                },
                {
                    date: "05.02.2026",
                    title: "Сбор требований",
                    description: "Проведены встречи с отделами для определения функциональных требований"
                },
                {
                    date: "01.02.2026",
                    title: "Инициация проекта",
                    description: "Утверждено создание чат-бота для автоматизации ответов на часто задаваемые вопросы"
                }
            ],
            nextStep: "Согласование ТЗ с юридическим отделом до 15.02.2026"
        },
        {
            id: 2,
            title: "Внедрение национального мессенджера MAX",
            description: "Интеграция государственного мессенджера в работу департамента",
            status: "active",
            department: "web",
            timeline: [
                {
                    date: "08.02.2026",
                    title: "Тестирование функционала",
                    description: "Проведено тестирование основных функций мессенджера в рабочей группе"
                },
                {
                    date: "03.02.2026",
                    title: "Подключение к системе",
                    description: "Настроено подключение к национальному мессенджеру для пилотной группы"
                },
                {
                    date: "28.01.2026",
                    title: "Подготовка инфраструктуры",
                    description: "Подготовлена техническая документация для внедрения"
                }
            ],
            nextStep: "Массовое внедрение для всех сотрудников до 20.02.2026"
        },
        {
            id: 3,
            title: "Цифровизация архивных услуг",
            description: "Повышение доступности и безопасности государственных услуг в архивном секторе",
            status: "planning",
            department: "web",
            timeline: [
                {
                    date: "07.02.2026",
                    title: "Анализ текущего состояния",
                    description: "Проведен анализ существующих процессов предоставления архивных услуг"
                },
                {
                    date: "02.02.2026",
                    title: "Формирование команды",
                    description: "Сформирована рабочая группа для реализации проекта"
                }
            ],
            nextStep: "Разработка концепции цифровизации до 18.02.2026"
        },
        {
            id: 4,
            title: "Ресурс по детской кибербезопасности",
            description: "Создание образовательного портала для защиты детей в интернете",
            status: "active",
            department: "web",
            timeline: [
                {
                    date: "06.02.2026",
                    title: "Разработка контента",
                    description: "Начата работа над образовательными материалами и интерактивными модулями"
                },
                {
                    date: "30.01.2026",
                    title: "Проектирование структуры",
                    description: "Создана карта сайта и определена структура образовательного портала"
                },
                {
                    date: "25.01.2026",
                    title: "Исследование потребностей",
                    description: "Проведен анализ существующих решений и потребностей целевой аудитории"
                }
            ],
            nextStep: "Создание прототипа сайта до 14.02.2026"
        },
        {
            id: 5,
            title: "Интеграция платежей ЖКХ",
            description: "Подключение системы оплаты коммунальных услуг в мобильное приложение",
            status: "planning",
            department: "mobile",
            timeline: [
                {
                    date: "04.02.2026",
                    title: "Переговоры с поставщиками",
                    description: "Начаты переговоры с платежными системами для интеграции"
                },
                {
                    date: "28.01.2026",
                    title: "Технический анализ",
                    description: "Проведен анализ технических требований для интеграции платежных систем"
                }
            ],
            nextStep: "Заключение договоров с платежными системами до 25.02.2026"
        },
        {
            id: 6,
            title: "Сервис геокодирования",
            description: "Интеграция API Яндекс для геолокационных сервисов",
            status: "completed",
            department: "web",
            timeline: [
                {
                    date: "01.02.2026",
                    title: "Завершение интеграции",
                    description: "Успешно завершена интеграция геокодирования в основные сервисы"
                },
                {
                    date: "20.01.2026",
                    title: "Тестирование API",
                    description: "Проведено полное тестирование интеграции с Яндекс API"
                },
                {
                    date: "10.01.2026",
                    title: "Подключение сервиса",
                    description: "Начата интеграция геокодирования в веб-приложения"
                }
            ],
            nextStep: "Сервис успешно запущен и работает в штатном режиме"
        }
    ];
}

// Загрузка проектов в DOM
function loadProjects(projects = null) {
    const container = document.getElementById('projects-container');
    const projectsData = projects || getProjectsData();
    
    container.innerHTML = '';
    
    projectsData.forEach(project => {
        const card = document.createElement('div');
        card.className = `project-card status-${project.status}`;
        card.innerHTML = `
            <div class="project-header">
                <div class="project-title">
                    <h2>${project.title}</h2>
                    <p>${project.description}</p>
                </div>
                <span class="status-badge status-${project.status}">
                    ${getStatusText(project.status)}
                </span>
            </div>
            <div class="timeline">
                ${project.timeline.map(item => `
                    <div class="timeline-item">
                        <div class="timeline-date">${item.date}</div>
                        <div class="timeline-content">
                            <h4>${item.title}</h4>
                            <p>${item.description}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="next-step">
                <h4><i class="fas fa-arrow-right"></i> ${project.status === 'completed' ? 'Результат' : 'Следующий шаг'}</h4>
                <p>${project.nextStep}</p>
            </div>
        `;
        container.appendChild(card);
    });
}

// Получение текста статуса
function getStatusText(status) {
    const texts = {
        'active': 'В работе',
        'planning': 'Планируется',
        'completed': 'Завершено',
        'paused': 'Приостановлен'
    };
    return texts[status] || 'Неизвестно';
}

// Настройка фильтров
function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Активируем кнопку в своей группе
            const group = this.parentElement;
            group.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            
            // Применяем фильтрацию
            applyFilters();
            
            // Показываем уведомление
            showNotification(`Фильтр применен: ${this.textContent}`, 'success');
        });
    });
}

// Применение фильтров
function applyFilters() {
    const statusFilter = document.querySelector('.filter-btn[data-filter="all"]')?.classList.contains('active') ? 'all' : 
                         document.querySelector('.filter-btn[data-filter="active"]')?.classList.contains('active') ? 'active' :
                         document.querySelector('.filter-btn[data-filter="planning"]')?.classList.contains('active') ? 'planning' :
                         document.querySelector('.filter-btn[data-filter="completed"]')?.classList.contains('active') ? 'completed' : 'all';
    
    const deptFilter = document.querySelector('.filter-btn[data-filter="all-dept"]')?.classList.contains('active') ? 'all' : 
                       document.querySelector('.filter-btn[data-filter="bots"]')?.classList.contains('active') ? 'bots' :
                       document.querySelector('.filter-btn[data-filter="web"]')?.classList.contains('active') ? 'web' :
                       document.querySelector('.filter-btn[data-filter="mobile"]')?.classList.contains('active') ? 'mobile' : 'all';
    
    const allProjects = getProjectsData();
    let filtered = allProjects;
    
    if (statusFilter !== 'all') {
        filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    if (deptFilter !== 'all') {
        filtered = filtered.filter(p => p.department === deptFilter);
    }
    
    loadProjects(filtered);
    
    // Обновляем статистику
    updateStats(filtered.length, 
                filtered.filter(p => p.status === 'active').length,
                filtered.filter(p => p.status === 'planning').length,
                filtered.filter(p => p.status === 'completed').length);
}

// Обновление статистики
function updateStats(total, active, planning, completed) {
    document.querySelector('.stats-bar .stat-info p:nth-child(2)').textContent = total;
    document.querySelectorAll('.stats-bar .stat-info p')[1].textContent = active;
    document.querySelectorAll('.stats-bar .stat-info p')[2].textContent = planning;
    document.querySelectorAll('.stats-bar .stat-info p')[3].textContent = completed;
}

// Настройка кнопки добавления проекта
function setupAddProject() {
    const btn = document.getElementById('add-project-btn');
    btn.addEventListener('click', function() {
        showNotification('Функция добавления проектов будет реализована в следующей версии дашборда', 'warning');
    });
}

// Обновление даты и времени
function updateDateTime() {
    const now = new Date();
    const dateOptions = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit'
    };
    const timeOptions = { 
        hour: '2-digit', 
        minute: '2-digit'
    };
    
    const formattedDate = now.toLocaleDateString('ru-RU', dateOptions).replace(/\./g, '.');
    const formattedTime = now.toLocaleTimeString('ru-RU', timeOptions);
    
    document.getElementById('current-date').textContent = formattedDate;
    document.getElementById('last-update').textContent = `Последнее обновление: ${formattedTime}`;
}

// Анимация появления карточек
function animateCards() {
    const cards = document.querySelectorAll('.project-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 300 + index * 100);
    });
}

// Показ уведомления
function showNotification(message, type = 'info') {
    // Удаляем старые уведомления
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}