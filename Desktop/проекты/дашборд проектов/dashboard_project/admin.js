// Ключ для localStorage
const STORAGE_KEY = 'dashboard_projects';

// Загрузка данных из localStorage или создание пустого массива
function loadProjects() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// Сохранение данных в localStorage
function saveProjects(projects) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    if (projects.length > 0) {
        localStorage.removeItem('dashboard_cleared');
    }
    showNotification('Данные успешно сохранены!', 'success');
}

// Отображение списка проектов
function renderProjectsList() {
    const container = document.getElementById('projects-list');
    const projects = loadProjects();
    
    if (projects.length === 0) {
        container.innerHTML = '<p class="no-projects">Нет проектов. Нажмите "Добавить проект" чтобы начать.</p>';
        return;
    }
    
    container.innerHTML = projects.map(project => `
        <div class="project-card">
            <div class="project-card-content" data-id="${project.id}">
                <h3>${project.title || 'Без названия'}</h3>
                <div class="meta">
                    <span><i class="fas fa-folder"></i> ${getSectionText(project.section)}</span>
                </div>
                <div class="description">${project.description || 'Описание отсутствует'}</div>
                <div class="timeline-preview">
                    <strong>Контрольные точки (${project.checkpoints?.length || 0}):</strong>
                    ${project.checkpoints?.slice(0, 2).map(cp => 
                        `<div class="timeline-item-preview">${cp.startDate || '—'} - ${cp.endDate || '—'}: ${cp.description || 'Без описания'}</div>`
                    ).join('') || '<em>Нет контрольных точек</em>'}
                    ${project.checkpoints?.length > 2 ? `<div class="timeline-more">+${project.checkpoints.length - 2} еще</div>` : ''}
                </div>
            </div>
            <div class="project-card-actions">
                <button class="btn outline small edit-btn" data-id="${project.id}">
                    <i class="fas fa-edit"></i> Редактировать
                </button>
                <button class="btn danger small delete-btn" data-id="${project.id}">
                    <i class="fas fa-trash"></i> Удалить
                </button>
            </div>
        </div>
    `).join('');
    
    // Обработчики кнопок
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const projectId = parseInt(button.dataset.id);
            editProject(projectId);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const projectId = parseInt(button.dataset.id);
            if (confirm('Вы уверены, что хотите удалить этот проект?')) {
                deleteProject(projectId);
            }
        });
    });
    
    document.querySelectorAll('.project-card-content').forEach(card => {
        card.addEventListener('click', () => {
            const projectId = parseInt(card.dataset.id);
            editProject(projectId);
        });
    });
}

// Получение текста раздела
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

// Открытие модального окна
function openModal(project = null) {
    const modal = document.getElementById('edit-modal');
    const title = document.getElementById('modal-title');
    const deleteBtn = document.getElementById('delete-project-btn');
    
    document.getElementById('project-form').reset();
    document.getElementById('timeline-items').innerHTML = '';
    
    if (project) {
        title.textContent = 'Редактировать проект';
        deleteBtn.style.display = 'block';
        deleteBtn.onclick = () => deleteProject(project.id);
        
        document.getElementById('project-id').value = project.id;
        document.getElementById('project-title').value = project.title || '';
        document.getElementById('project-description').value = project.description || '';
        document.getElementById('project-section').value = project.section || 'other';
        
        if (project.checkpoints && project.checkpoints.length > 0) {
            project.checkpoints.forEach(cp => addTimelineItem(cp));
        } else {
            addTimelineItem();
        }
    } else {
        title.textContent = 'Добавить новый проект';
        deleteBtn.style.display = 'none';
        document.getElementById('project-id').value = '';
        addTimelineItem();
    }
    
    modal.style.display = 'block';
}

// Добавление контрольной точки
function addTimelineItem(checkpoint = null) {
    const container = document.getElementById('timeline-items');
    const timelineId = Date.now() + Math.random();
    
    const timelineHtml = `
        <div class="timeline-item" data-id="${timelineId}">
            <button type="button" class="remove-timeline">×</button>
            <div class="form-row">
                <div class="form-group">
                    <label>Начало КТ</label>
                    <input type="text" placeholder="02.02.2026" value="${checkpoint?.startDate || ''}">
                </div>
                <div class="form-group">
                    <label>Окончание КТ</label>
                    <input type="text" placeholder="09.02.2026" value="${checkpoint?.endDate || ''}">
                </div>
            </div>
            <div class="form-group">
                <label>Описание КТ</label>
                <textarea placeholder="Описание контрольной точки" rows="2">${checkpoint?.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Цель результата</label>
                <textarea placeholder="На что направлена контрольная точка" rows="2">${checkpoint?.goal || ''}</textarea>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', timelineHtml);
    
    const removeBtn = container.querySelector(`[data-id="${timelineId}"] .remove-timeline`);
    removeBtn.addEventListener('click', () => {
        container.querySelector(`[data-id="${timelineId}"]`).remove();
    });
}

// Функция редактирования проекта
function editProject(projectId) {
    const projects = loadProjects();
    const project = projects.find(p => p.id === projectId);
    if (project) {
        openModal(project);
    }
}

// Удаление проекта
function deleteProject(projectId) {
    if (!confirm('Вы уверены, что хотите удалить этот проект?')) return;
    
    const projects = loadProjects().filter(p => p.id !== projectId);
    saveProjects(projects);
    renderProjectsList();
    closeModal();
    showNotification('Проект удален', 'success');
}

// Полная очистка данных
function clearAllData() {
    if (!confirm('Вы уверены, что хотите удалить ВСЕ проекты? Это действие нельзя отменить.')) return;
    
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem('dashboard_cleared', 'true');
    renderProjectsList();
    showNotification('Все данные удалены', 'success');
}

// Экспорт данных
function exportData() {
    const projects = loadProjects();
    const dataStr = JSON.stringify(projects, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dashboard-projects.json';
    link.click();
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
    showNotification('Данные экспортированы', 'success');
}

// Импорт данных
function importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (Array.isArray(data)) {
                saveProjects(data);
                renderProjectsList();
                showNotification('Данные успешно импортированы!', 'success');
            } else {
                throw new Error('Неверный формат данных');
            }
        } catch (error) {
            showNotification('Ошибка при импорте данных: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

// Закрытие модального окна
function closeModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

// Показ уведомления
function showNotification(message, type = 'success') {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
        ${message}
    `;
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Инициализация анимации снега
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

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    initSnowflakes();
    
    // Обработка отправки формы (без валидации - все опционально)
    document.getElementById('project-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const projects = loadProjects();
        const projectIdInput = document.getElementById('project-id').value;
        const projectId = projectIdInput ? parseInt(projectIdInput) : Date.now();
        
        // Сбор контрольных точек
        const checkpoints = [];
        document.querySelectorAll('.timeline-item').forEach(item => {
            const startDate = item.querySelector('.form-row .form-group:nth-child(1) input')?.value.trim() || '';
            const endDate = item.querySelector('.form-row .form-group:nth-child(2) input')?.value.trim() || '';
            const description = item.querySelector('textarea:nth-of-type(1)')?.value.trim() || '';
            const goal = item.querySelector('textarea:nth-of-type(2)')?.value.trim() || '';
            
            // Добавляем контрольную точку даже если некоторые поля пустые
            checkpoints.push({ startDate, endDate, description, goal });
        });
        
        const project = {
            id: projectId,
            title: document.getElementById('project-title').value.trim(),
            description: document.getElementById('project-description').value.trim(),
            section: document.getElementById('project-section').value,
            checkpoints: checkpoints
        };
        
        if (projectIdInput) {
            const index = projects.findIndex(p => p.id == projectId);
            if (index !== -1) {
                projects[index] = project;
            } else {
                projects.push(project);
            }
        } else {
            projects.push(project);
        }
        
        saveProjects(projects);
        renderProjectsList();
        closeModal();
    });
    
    // Кнопки действий
    document.getElementById('add-project-btn').addEventListener('click', () => openModal());
    document.getElementById('clear-all-btn').addEventListener('click', clearAllData);
    document.getElementById('export-btn').addEventListener('click', exportData);
    
    const fileInput = document.getElementById('file-input');
    document.getElementById('import-btn').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            importData(e.target.files[0]);
            e.target.value = '';
        }
    });
    
    // Модальное окно
    document.querySelector('.close').addEventListener('click', closeModal);
    document.getElementById('edit-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('edit-modal')) closeModal();
    });
    
    document.getElementById('add-timeline-item').addEventListener('click', addTimelineItem);
    
    renderProjectsList();
});