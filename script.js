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
                // Получаем сохраненный статус
                const statusKey = `timeline_status_${itemId}`;
                const savedStatus = localStorage.getItem(statusKey);
                
                // Определяем класс для окрашивания
                let statusClass = '';
                if (savedStatus === 'completed') {
                    statusClass = 'completed';
                } else if (savedStatus === 'not-completed') {
                    statusClass = 'not-completed';
                }
                
                return `
                    <div class="timeline-item ${statusClass}">
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
                <div style="display: flex; gap: 10px; align-items: flex-start;">
                    <span class="status-badge status-active">
                        ${getSectionText(project.section)}
                    </span>
                    <button class="btn secondary small export-btn" data-project-id="${project.id}" style="padding: 8px 16px; font-size: 14px; min-width: auto;">
                        <i class="fas fa-file-export"></i> Экспорт
                    </button>
                </div>
            </div>
            <div class="timeline">
                ${timelineHtml}
            </div>
        `;
        container.appendChild(card);
    });
    
    // Добавляем обработчики для кнопок экспорта
    document.querySelectorAll('.export-btn').forEach(button => {
        button.addEventListener('click', function() {
            const projectId = parseInt(this.dataset.projectId);
            exportProjectReport(projectId);
        });
    });
    
    addTimelineButtonHandlers();
    updateStats(
        projectsData.length,
        projectsData.length,
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
                         document.querySelector('.filter-btn[data-filter="bots"]')?.classList.contains('active') ? 'bots' :
                         document.querySelector('.filter-btn[data-filter="web"]')?.classList.contains('active') ? 'web' :
                         document.querySelector('.filter-btn[data-filter="mobile"]')?.classList.contains('active') ? 'mobile' :
                         document.querySelector('.filter-btn[data-filter="archive"]')?.classList.contains('active') ? 'archive' : 'all';
    
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

// Генерация HTML-отчета по проекту
function exportProjectReport(projectId) {
    const projects = getProjectsData();
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
        showNotification('Проект не найден', 'error');
        return;
    }
    
    // Собираем данные для отчета
    let reportContent = `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Отчет по проекту: ${project.title || 'Без названия'}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; background: #f8fafc; }
                .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
                h1 { color: #2c5282; margin-bottom: 20px; }
                .project-info { background: #f1f5f9; padding: 20px; border-radius: 10px; margin-bottom: 30px; }
                .checkpoint { margin-bottom: 25px; padding: 20px; border-radius: 10px; border-left: 4px solid #3b82f6; }
                .checkpoint.completed { background: #f0fdf4; border-left-color: #10b981; }
                .checkpoint.not-completed { background: #fef2f2; border-left-color: #ef4444; }
                .checkpoint-date { background: #3b82f6; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold; display: inline-block; margin-bottom: 10px; }
                .checkpoint-date.completed { background: #10b981; }
                .checkpoint-date.not-completed { background: #ef4444; }
                .checkpoint-title { font-size: 18px; font-weight: bold; color: #1e293b; margin: 10px 0; }
                .checkpoint-goal { background: #e2e8f0; padding: 15px; border-radius: 8px; margin-top: 10px; }
                .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; color: white; background: #2c5282; }
                .completed-badge { background: #10b981; }
                .not-completed-badge { background: #ef4444; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📋 Отчет по проекту</h1>
                
                <div class="project-info">
                    <h2>${project.title || 'Проект без названия'}</h2>
                    <p><strong>Раздел:</strong> <span class="status-badge">${getSectionText(project.section)}</span></p>
                    <p><strong>Описание:</strong> ${project.description || 'Описание отсутствует'}</p>
                    <p><strong>Дата формирования отчета:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
                </div>
                
                <h2>🎯 Контрольные точки (${project.checkpoints?.length || 0})</h2>
    `;
    
    if (project.checkpoints && project.checkpoints.length > 0) {
        project.checkpoints.forEach(cp => {
            // Создаем временный ID для поиска статуса
            const tempCheckpointId = `cp_${projectId}_`;
            let foundStatus = '';
            
            // Ищем соответствующий статус в localStorage
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('timeline_status_cp_') && key.includes(tempCheckpointId)) {
                    const storedStatus = localStorage.getItem(key);
                    if (storedStatus) {
                        foundStatus = storedStatus;
                        break;
                    }
                }
            }
            
            const statusClass = foundStatus === 'completed' ? 'completed' : 
                              foundStatus === 'not-completed' ? 'not-completed' : '';
            const statusBadgeClass = foundStatus === 'completed' ? 'completed-badge' : 
                                   foundStatus === 'not-completed' ? 'not-completed-badge' : '';
            const statusText = foundStatus === 'completed' ? 'Выполнено' : 
                             foundStatus === 'not-completed' ? 'Не выполнено' : 'Не указано';
            
            reportContent += `
                <div class="checkpoint ${statusClass}">
                    <div class="checkpoint-date ${statusClass}">${cp.startDate || '—'} - ${cp.endDate || '—'}</div>
                    <div class="checkpoint-title">${cp.description || 'Контрольная точка без описания'}</div>
                    <p>${cp.goal ? `<strong>Цель:</strong> ${cp.goal}` : 'Цель не указана'}</p>
                    <div class="checkpoint-goal">
                        <strong>Статус:</strong> <span class="status-badge ${statusBadgeClass}">${statusText}</span>
                    </div>
                </div>
            `;
        });
    } else {
        reportContent += '<p>Контрольные точки не заданы</p>';
    }
    
    reportContent += `
            </div>
        </body>
        </html>
    `;
    
    // Создаем и скачиваем файл
    const blob = new Blob([reportContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Отчет_по_проекту_${project.title || 'без_названия'}.html`;
    link.click();
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
    showNotification('HTML-отчет успешно сгенерирован и скачан!', 'success');
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