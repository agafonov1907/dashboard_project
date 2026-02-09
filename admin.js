// Ключ для localStorage
const STORAGE_KEY = 'dashboard_projects';

// Загрузка данных из localStorage или создание пустого массива
function loadProjects() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// Сохранение проекта
function saveProject() {
    if (!validateForm()) {
        return;
    }
    
    const projects = loadProjects();
    const projectIdInput = document.getElementById('project-id').value;
    const projectId = projectIdInput ? parseInt(projectIdInput) : Date.now();
    
    // Сбор данных этапов
    const timelineItems = [];
    document.querySelectorAll('.timeline-item').forEach(item => {
        const dateInput = item.querySelector('input[type="text"]:nth-of-type(1)');
        const titleInput = item.querySelector('input[type="text"]:nth-of-type(2)');
        const descriptionTextarea = item.querySelector('textarea');
        
        const date = dateInput?.value.trim() || '';
        const title = titleInput?.value.trim() || '';
        const description = descriptionTextarea?.value.trim() || '';
        
        if (date && title) {
            timelineItems.push({ date, title, description });
        }
    });
    
    const project = {
        id: projectId,
        title: document.getElementById('project-title').value.trim(),
        description: document.getElementById('project-description').value.trim(),
        status: document.getElementById('project-status').value,
        department: document.getElementById('project-department').value,
        nextStep: document.getElementById('project-next-step').value.trim(),
        timeline: timelineItems
    };
    
    if (projectIdInput) {
        // Обновление существующего проекта
        const index = projects.findIndex(p => p.id == projectId); // Используем == вместо ===
        if (index !== -1) {
            projects[index] = project;
        } else {
            // Если проект не найден, добавляем как новый
            projects.push(project);
        }
    } else {
        // Добавление нового проекта
        projects.push(project);
    }
    
    saveProjects(projects);
    renderProjectsList();
    closeModal();
}

// Отображение списка проектов с явной кнопкой редактирования
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
                <h3>${project.title}</h3>
                <div class="meta">
                    <span><i class="fas fa-${getStatusIcon(project.status)}"></i> ${getStatusText(project.status)}</span>
                    <span><i class="fas fa-building"></i> ${getDepartmentText(project.department)}</span>
                </div>
                <div class="description">${project.description || ''}</div>
                <div class="next-step"><strong>Следующий шаг:</strong> ${project.nextStep}</div>
                <div class="timeline-preview">
                    <strong>Этапы (${project.timeline?.length || 0}):</strong>
                    ${project.timeline?.slice(0, 2).map(item => 
                        `<div class="timeline-item-preview">${item.date} - ${item.title}</div>`
                    ).join('') || '<em>Нет этапов</em>'}
                    ${project.timeline?.length > 2 ? `<div class="timeline-more">+${project.timeline.length - 2} еще</div>` : ''}
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
    
    // Добавляем обработчики для кнопок редактирования
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const projectId = parseInt(button.dataset.id);
            editProject(projectId);
        });
    });
    
    // Добавляем обработчики для кнопок удаления
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const projectId = parseInt(button.dataset.id);
            if (confirm('Вы уверены, что хотите удалить этот проект?')) {
                deleteProject(projectId);
            }
        });
    });
    
    // Также сохраняем возможность клика по всей карточке
    document.querySelectorAll('.project-card-content').forEach(card => {
        card.addEventListener('click', () => {
            const projectId = parseInt(card.dataset.id);
            editProject(projectId);
        });
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
    return texts[status] || status;
}

// Получение иконки статуса
function getStatusIcon(status) {
    const icons = {
        'active': 'play-circle',
        'planning': 'clock',
        'completed': 'check-circle',
        'paused': 'pause-circle'
    };
    return icons[status] || 'question-circle';
}

// Получение текста отдела
function getDepartmentText(dept) {
    const texts = {
        'bots': 'Боты',
        'web': 'Веб',
        'mobile': 'Мобильные',
        'archive': 'Архив',
        'education': 'Образование',
        'infrastructure': 'Инфраструктура',
        'other': 'Другое'
    };
    return texts[dept] || dept;
}

// Открытие модального окна для добавления/редактирования
function openModal(project = null) {
    const modal = document.getElementById('edit-modal');
    const form = document.getElementById('project-form');
    const title = document.getElementById('modal-title');
    const deleteBtn = document.getElementById('delete-project-btn');
    
    // Сброс формы
    form.reset();
    document.getElementById('timeline-items').innerHTML = '';
    
    if (project) {
        // Режим редактирования
        title.textContent = 'Редактировать проект';
        deleteBtn.style.display = 'block';
        deleteBtn.onclick = () => deleteProject(project.id);
        
        // Заполнение полей
        document.getElementById('project-id').value = project.id;
        document.getElementById('project-title').value = project.title;
        document.getElementById('project-description').value = project.description || '';
        document.getElementById('project-status').value = project.status;
        document.getElementById('project-department').value = project.department;
        document.getElementById('project-next-step').value = project.nextStep;
        
        // Заполнение этапов
        if (project.timeline && project.timeline.length > 0) {
            project.timeline.forEach(item => addTimelineItem(item));
        } else {
            addTimelineItem(); // Добавляем пустой этап если нет данных
        }
    } else {
        // Режим добавления
        title.textContent = 'Добавить новый проект';
        deleteBtn.style.display = 'none';
        document.getElementById('project-id').value = '';
        addTimelineItem(); // Добавляем пустой этап по умолчанию
    }
    
    modal.style.display = 'block';
}

// Добавление элемента этапа
function addTimelineItem(item = null) {
    const container = document.getElementById('timeline-items');
    const timelineId = Date.now() + Math.random();
    
    const timelineHtml = `
        <div class="timeline-item" data-id="${timelineId}">
            <button type="button" class="remove-timeline">×</button>
            <div class="form-group">
                <label>Дата *</label>
                <input type="text" placeholder="09.02.2026" value="${item?.date || ''}" required>
            </div>
            <div class="form-group">
                <label>Название этапа *</label>
                <input type="text" placeholder="Название этапа" value="${item?.title || ''}" required>
            </div>
            <div class="form-group">
                <label>Описание</label>
                <textarea placeholder="Описание этапа" rows="2">${item?.description || ''}</textarea>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', timelineHtml);
    
    // Добавляем обработчик удаления
    const removeBtn = container.querySelector(`[data-id="${timelineId}"] .remove-timeline`);
    removeBtn.addEventListener('click', () => {
        container.querySelector(`[data-id="${timelineId}"]`).remove();
    });
}

// Валидация формы
function validateForm() {
    const title = document.getElementById('project-title').value.trim();
    const nextStep = document.getElementById('project-next-step').value.trim();
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    if (!title) {
        showNotification('Поле "Название проекта" обязательно для заполнения', 'error');
        return false;
    }
    
    if (!nextStep) {
        showNotification('Поле "Следующий шаг / Результат" обязательно для заполнения', 'error');
        return false;
    }
    
    // Проверяем хотя бы один этап
    let hasValidTimeline = false;
    for (let item of timelineItems) {
        const date = item.querySelector('input[type="text"]:nth-of-type(1)').value.trim();
        const titleInput = item.querySelector('input[type="text"]:nth-of-type(2)').value.trim();
        if (date && titleInput) {
            hasValidTimeline = true;
            break;
        }
    }
    
    if (!hasValidTimeline) {
        showNotification('Добавьте хотя бы один этап проекта', 'error');
        return false;
    }
    
    return true;
}

// Сохранение проекта
function saveProject() {
    if (!validateForm()) {
        return;
    }
    
    const projects = loadProjects();
    const projectId = document.getElementById('project-id').value ? 
        parseInt(document.getElementById('project-id').value) : Date.now();
    
    // Сбор данных этапов
    const timelineItems = [];
    document.querySelectorAll('.timeline-item').forEach(item => {
        const dateInput = item.querySelector('input[type="text"]:nth-of-type(1)');
        const titleInput = item.querySelector('input[type="text"]:nth-of-type(2)');
        const descriptionTextarea = item.querySelector('textarea');
        
        const date = dateInput?.value.trim() || '';
        const title = titleInput?.value.trim() || '';
        const description = descriptionTextarea?.value.trim() || '';
        
        if (date && title) {
            timelineItems.push({ date, title, description });
        }
    });
    
    const project = {
        id: projectId,
        title: document.getElementById('project-title').value.trim(),
        description: document.getElementById('project-description').value.trim(),
        status: document.getElementById('project-status').value,
        department: document.getElementById('project-department').value,
        nextStep: document.getElementById('project-next-step').value.trim(),
        timeline: timelineItems
    };
    
    if (document.getElementById('project-id').value) {
        // Обновление существующего проекта
        const index = projects.findIndex(p => p.id === parseInt(document.getElementById('project-id').value));
        if (index !== -1) {
            projects[index] = project;
        }
    } else {
        // Добавление нового проекта
        projects.push(project);
    }
    
    saveProjects(projects);
    renderProjectsList();
    closeModal();
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

// Функция редактирования проекта (вызывается из обработчиков)
function editProject(projectId) {
    const projects = loadProjects();
    const project = projects.find(p => p.id === projectId);
    if (project) {
        openModal(project);
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация снега
    initSnowflakes();
    
    // Кнопки действий
    document.getElementById('add-project-btn').addEventListener('click', () => openModal());
    document.getElementById('clear-all-btn').addEventListener('click', clearAllData);
    document.getElementById('export-btn').addEventListener('click', exportData);
    
    const fileInput = document.getElementById('file-input');
    document.getElementById('import-btn').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            importData(e.target.files[0]);
            e.target.value = ''; // Сброс для повторного выбора
        }
    });
    
    // Модальное окно
    document.querySelector('.close').addEventListener('click', closeModal);
    document.getElementById('edit-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('edit-modal')) closeModal();
    });
    
    document.getElementById('add-timeline-item').addEventListener('click', addTimelineItem);
    
    // Обработка отправки формы
    document.getElementById('project-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveProject();
    });
    
    // Загрузка начальных данных
    renderProjectsList();
});