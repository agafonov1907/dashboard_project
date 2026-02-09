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
    
    // Автоматическое обновление при возврате на вкладку
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            loadProjects();
            updateDateTime();
        }
    });
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

// Загрузка данных из localStorage (основной дашборд)
function getProjectsData() {
    const isCleared = localStorage.getItem('dashboard_cleared') === 'true';
    const data = localStorage.getItem('dashboard_projects');
    
    if (isCleared) {
        return [];
    }
    
    return data ? JSON.parse(data) : [];
}

// Загрузка проектов в DOM
function loadProjects(projects = null) {
    const container = document.getElementById('projects-container');
    const projectsData = projects || getProjectsData();
    
    container.innerHTML = '';
    
    if (projectsData.length === 0) {
        // Показываем сообщение, что проектов нет
        container.innerHTML = `
            <div class="no-projects-message">
                <div style="text-align: center; padding: 60px; color: var(--gray);">
                    <i class="fas fa-folder-open" style="font-size: 48px; margin-bottom: 20px; opacity: 0.7;"></i>
                    <h3>Нет проектов</h3>
                    <p style="margin-top: 10px; font-size: 16px;">Перейдите в <a href="admin.html" style="color: var(--primary-light); text-decoration: underline;">админку</a> для добавления проектов</p>
                </div>
            </div>
        `;
        // Обновляем статистику
        updateStats(0, 0, 0, 0);
        return;
    }
    
    projectsData.forEach(project => {
        // Формируем этапы с кнопками выполнено/не выполнено
        let timelineHtml = '';
        if (project.timeline && project.timeline.length > 0) {
            // Сортируем этапы по дате (новые сверху)
            const sortedTimeline = [...project.timeline].sort((a, b) => {
                // Преобразуем даты ДД.ММ.ГГГГ в сравнимый формат
                const dateA = a.date.split('.').reverse().join('-');
                const dateB = b.date.split('.').reverse().join('-');
                return new Date(dateB) - new Date(dateA); // Обратный порядок: новые сверху
            });
            
            timelineHtml = sortedTimeline.map(item => {
                // Генерируем уникальный ID для кнопок
                const itemId = `item_${project.id}_${item.date.replace(/\./g, '_')}_${item.title.replace(/\s+/g, '_')}`;
                
                return `
                    <div class="timeline-item">
                        <div class="timeline-date">${item.date}</div>
                        <div class="timeline-content">
                            <h4>${item.title}</h4>
                            <p>${item.description}</p>
                            <div class="timeline-actions">
                                <button class="timeline-btn completed" data-id="${itemId}" data-project="${project.id}" data-status="completed">
                                    <i class="fas fa-check"></i> Выполнено
                                </button>
                                <button class="timeline-btn not-completed" data-id="${itemId}" data-project="${project.id}" data-status="not-completed">
                                    <i class="fas fa-times"></i> Не выполнено
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            timelineHtml = '<div class="timeline-item"><div class="timeline-content"><p>Этапы не заданы</p></div></div>';
        }
        
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
                ${timelineHtml}
            </div>
            <div class="next-step">
                <h4><i class="fas fa-arrow-right"></i> ${project.status === 'completed' ? 'Результат' : 'Следующий шаг'}</h4>
                <p>${project.nextStep}</p>
            </div>
        `;
        container.appendChild(card);
    });
    
    // Добавляем обработчики для кнопок выполнено/не выполнено
    addTimelineButtonHandlers();
    
    // Обновляем статистику
    updateStats(
        projectsData.length,
        projectsData.filter(p => p.status === 'active').length,
        projectsData.filter(p => p.status === 'planning').length,
        projectsData.filter(p => p.status === 'completed').length
    );
    
    // Анимация появления карточек
    animateCards();
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

// Добавление обработчиков для кнопок этапов
function addTimelineButtonHandlers() {
    document.querySelectorAll('.timeline-btn').forEach(button => {
        button.addEventListener('click', function() {
            const projectId = this.dataset.project;
            const itemId = this.dataset.id;
            const status = this.dataset.status;
            
            // Загружаем текущие данные
            const projects = getProjectsData();
            const project = projects.find(p => p.id == projectId);
            
            if (project && project.timeline) {
                // Находим соответствующий этап и сохраняем его статус
                // Для простоты сохраним статус в localStorage отдельно
                const statusKey = `timeline_status_${itemId}`;
                localStorage.setItem(statusKey, status);
                
                // Обновляем визуальное состояние кнопок
                const itemContainer = this.closest('.timeline-item');
                const completedBtn = itemContainer.querySelector('.timeline-btn.completed');
                const notCompletedBtn = itemContainer.querySelector('.timeline-btn.not-completed');
                
                // Сбрасываем все состояния
                completedBtn.classList.remove('active');
                notCompletedBtn.classList.remove('active');
                
                // Устанавливаем активное состояние
                if (status === 'completed') {
                    completedBtn.classList.add('active');
                } else {
                    notCompletedBtn.classList.add('active');
                }
                
                showNotification(status === 'completed' ? 'Этап отмечен как выполненный' : 'Этап отмечен как не выполненный', 'success');
            }
        });
    });
    
    // Восстанавливаем сохранённые состояния при загрузке
    restoreTimelineStatuses();
}

// Восстановление состояний кнопок из localStorage
function restoreTimelineStatuses() {
    document.querySelectorAll('.timeline-item').forEach(item => {
        const completedBtn = item.querySelector('.timeline-btn.completed');
        const notCompletedBtn = item.querySelector('.timeline-btn.not-completed');
        
        if (completedBtn && notCompletedBtn) {
            const itemId = completedBtn.dataset.id;
            const statusKey = `timeline_status_${itemId}`;
            const savedStatus = localStorage.getItem(statusKey);
            
            if (savedStatus === 'completed') {
                completedBtn.classList.add('active');
            } else if (savedStatus === 'not-completed') {
                notCompletedBtn.classList.add('active');
            }
        }
    });
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
                       document.querySelector('.filter-btn[data-filter="mobile"]')?.classList.contains('active') ? 'mobile' :
                       document.querySelector('.filter-btn[data-filter="archive"]')?.classList.contains('active') ? 'archive' : 'all';
    
    const allProjects = getProjectsData();
    let filtered = allProjects;
    
    if (statusFilter !== 'all') {
        filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    if (deptFilter !== 'all') {
        filtered = filtered.filter(p => p.department === deptFilter);
    }
    
    loadProjects(filtered);
}

// Обновление статистики
function updateStats(total, active, planning, completed) {
    const statCards = document.querySelectorAll('.stat-card .stat-info p');
    if (statCards.length >= 4) {
        statCards[0].textContent = total;
        statCards[1].textContent = active;
        statCards[2].textContent = planning;
        statCards[3].textContent = completed;
    }
}

// Настройка кнопки добавления проекта
function setupAddProject() {
    const btn = document.getElementById('add-project-btn');
    if (btn) {
        btn.addEventListener('click', function() {
            showNotification('Перейдите в админку для добавления проектов', 'warning');
            // Можно также перенаправлять в админку:
            // window.location.href = 'admin.html';
        });
    }
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
    
    const dateElement = document.getElementById('current-date');
    const timeElement = document.getElementById('last-update');
    
    if (dateElement) dateElement.textContent = formattedDate;
    if (timeElement) timeElement.textContent = `Последнее обновление: ${formattedTime}`;
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
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}