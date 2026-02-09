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
    const data = localStorage.getItem('dashboard_projects');
    return data ? JSON.parse(data) : []; // Возвращаем пустой массив вместо демо-данных
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
    
    const deptFilter = document.querySelector('.filter-btn[data-filter="all-dept"]')?.classList.contains('active') ? 'all' : document.querySelector('.filter-btn[data-filter="bots"]')?.classList.contains('active') ? 'bots' :
                   document.querySelector('.filter-btn[data-filter="yandex"]')?.classList.contains('active') ? 'yandex' :
                   document.querySelector('.filter-btn[data-filter="rgis"]')?.classList.contains('active') ? 'rgis' :
                   document.querySelector('.filter-btn[data-filter="tor_school"]')?.classList.contains('active') ? 'tor_school' : 'all';
    
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