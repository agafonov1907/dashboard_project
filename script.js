document.addEventListener('DOMContentLoaded', function() {
    initSnowflakes();
    loadProjects();
    setupFilters();
    setupAddProject();
    updateDateTime();
    setInterval(updateDateTime, 60000);
    
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            loadProjects();
            updateDateTime();
        }
    });
});

function initSnowflakes() {
    const snowflakes = document.querySelectorAll('.snowflake');
    
    snowflakes.forEach((flake, index) => {
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

function getProjectsData() {
    const isCleared = localStorage.getItem('dashboard_cleared') === 'true';
    const data = localStorage.getItem('dashboard_projects');
    
    if (isCleared) {
        return [];
    }
    
    return data ? JSON.parse(data) : [];
}

function loadProjects(projects = null) {
    const container = document.getElementById('projects-container');
    const projectsData = projects || getProjectsData();
    
    container.innerHTML = '';
    
    if (projectsData.length === 0) {
        container.innerHTML = `
            <div class="no-projects-message">
                <div style="text-align: center; padding: 60px; color: var(--gray);">
                    <i class="fas fa-folder-open" style="font-size: 48px; margin-bottom: 20px; opacity: 0.7;"></i>
                    <h3>Нет проектов</h3>
                    <p style="margin-top: 10px; font-size: 16px;">Перейдите в <a href="admin.html" style="color: var(--primary-light); text-decoration: underline;">админку</a> для добавления проектов</p>
                </div>
            </div>
        `;
        updateStats(0, 0, 0, 0);
        return;
    }
    
    projectsData.forEach(project => {
        let timelineHtml = '';
        if (project.checkpoints && project.checkpoints.length > 0) {
            // Сортируем по дате начала (новые сверху)
            const sortedCheckpoints = [...project.checkpoints].sort((a, b) => {
                if (!a.startDate && !b.startDate) return 0;
                if (!a.startDate) return 1;
                if (!b.startDate) return -1;
                const dateA = a.startDate.split('.').reverse().join('-');
                const dateB = b.startDate.split('.').reverse().join('-');
                return new Date(dateB) - new Date(dateA);
            });
            
            timelineHtml = sortedCheckpoints.map(cp => {
                const itemId = `cp_${project.id}_${Date.now()}_${Math.random()}`;
                return `
                    <div class="timeline-item">
                        <div class="timeline-date">
                            ${cp.startDate || '—'} - ${cp.endDate || '—'}
                        </div>
                        <div class="timeline-content">
                            <h4>${cp.description || 'Контрольная точка без описания'}</h4>
                            <p><strong>Цель:</strong> ${cp.goal || 'Цель не указана'}</p>
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
            timelineHtml = '<div class="timeline-item"><div class="timeline-content"><p>Контрольные точки не заданы</p></div></div>';
        }
        
        const card = document.createElement('div');
        card.className = `project-card status-active`;
        card.innerHTML = `
            <div class="project-header">
                <div class="project-title">
                    <h2>${project.title || 'Проект без названия'}</h2>
                    <p>${project.description || 'Описание отсутствует'}</p>
                </div>
                <span class="status-badge status-active">
                    ${getSectionText(project.section)}
                </span>
            </div>
            <div class="timeline">
                ${timelineHtml}
            </div>
        `;
        container.appendChild(card);
    });
    
    addTimelineButtonHandlers();
    updateStats(
        projectsData.length,
        projectsData.length, // Все проекты считаются "в работе"
        0,
        0
    );
    animateCards();
}

function getSectionText(section) {
    const texts = {
        'bots': 'Боты',
        'web': 'Веб',
        'mobile': 'Мобильные',
        'archive': 'Архив',
        'education': 'Образование',
        'infrastructure': 'Инфраструктура',
        'other': 'Другое'
    };
    return texts[section] || section;
}

function addTimelineButtonHandlers() {
    document.querySelectorAll('.timeline-btn').forEach(button => {
        button.addEventListener('click', function() {
            const projectId = this.dataset.project;
            const itemId = this.dataset.id;
            const status = this.dataset.status;
            
            const statusKey = `timeline_status_${itemId}`;
            localStorage.setItem(statusKey, status);
            
            const itemContainer = this.closest('.timeline-item');
            const completedBtn = itemContainer.querySelector('.timeline-btn.completed');
            const notCompletedBtn = itemContainer.querySelector('.timeline-btn.not-completed');
            
            completedBtn.classList.remove('active');
            notCompletedBtn.classList.remove('active');
            
            if (status === 'completed') {
                completedBtn.classList.add('active');
            } else {
                notCompletedBtn.classList.add('active');
            }
            
            showNotification(status === 'completed' ? 'Контрольная точка отмечена как выполненная' : 'Контрольная точка отмечена как не выполненная', 'success');
        });
    });
    
    restoreTimelineStatuses();
}

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

function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const group = this.parentElement;
            group.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            
            applyFilters();
            showNotification(`Фильтр применен: ${this.textContent}`, 'success');
        });
    });
}

function applyFilters() {
    const sectionFilter = document.querySelector('.filter-btn[data-filter="all-dept"]')?.classList.contains('active') ? 'all' : 
                         document.querySelector('.filter-btn[data-filter="archive"]')?.classList.contains('active') ? 'archive' :
                   document.querySelector('.filter-btn[data-filter="education"]')?.classList.contains('active') ? 'education' :
                   document.querySelector('.filter-btn[data-filter="bots"]')?.classList.contains('active') ? 'bots' :
                   document.querySelector('.filter-btn[data-filter="yandex"]')?.classList.contains('active') ? 'yandex' :
                   document.querySelector('.filter-btn[data-filter="rgis"]')?.classList.contains('active') ? 'rgis' :
                   document.querySelector('.filter-btn[data-filter="tor"]')?.classList.contains('active') ? 'tor' : 'all';
    
    const allProjects = getProjectsData();
    let filtered = allProjects;
    
    if (sectionFilter !== 'all') {
        filtered = filtered.filter(p => p.section === sectionFilter);
    }
    
    loadProjects(filtered);
}

function updateStats(total, active, planning, completed) {
    const statCards = document.querySelectorAll('.stat-card .stat-info p');
    if (statCards.length >= 4) {
        statCards[0].textContent = total;
        statCards[1].textContent = active;
        statCards[2].textContent = planning;
        statCards[3].textContent = completed;
    }
}

function setupAddProject() {
    const btn = document.getElementById('add-project-btn');
    if (btn) {
        btn.addEventListener('click', function() {
            showNotification('Перейдите в админку для добавления проектов', 'warning');
        });
    }
}

function updateDateTime() {
    const now = new Date();
    const dateOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    
    const formattedDate = now.toLocaleDateString('ru-RU', dateOptions).replace(/\./g, '.');
    const formattedTime = now.toLocaleTimeString('ru-RU', timeOptions);
    
    const dateElement = document.getElementById('current-date');
    const timeElement = document.getElementById('last-update');
    
    if (dateElement) dateElement.textContent = formattedDate;
    if (timeElement) timeElement.textContent = `Последнее обновление: ${formattedTime}`;
}

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

function showNotification(message, type = 'info') {
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