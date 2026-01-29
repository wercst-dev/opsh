// app.js - основной скрипт приложения

class TelegramAccountsParser {
    constructor() {
        this.initElements();
        this.bindEvents();
        this.setupDemoData();
    }
    
    initElements() {
        // Поиск
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        
        // Фильтры
        this.countryFilter = document.getElementById('countryFilter');
        this.ageFilter = document.getElementById('ageFilter');
        this.stateFilter = document.getElementById('stateFilter');
        this.spamlockFilter = document.getElementById('spamlockFilter');
        this.applyFiltersBtn = document.getElementById('applyFiltersBtn');
        
        // Результаты
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsTitle = document.getElementById('resultsTitle');
        this.resultsCount = document.getElementById('resultsCount');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.loading = document.getElementById('loading');
        
        // Модальное окно
        this.resultModal = document.getElementById('resultModal');
        this.modalAccountId = document.getElementById('modalAccountId');
        this.modalAccountIdCode = document.getElementById('modalAccountIdCode');
        this.modalAccountTitle = document.getElementById('modalAccountTitle');
        this.copyAccountIdBtn = document.getElementById('copyAccountIdBtn');
        
        // Примеры запросов
        this.tipTags = document.querySelectorAll('.tip-tag');
    }
    
    bindEvents() {
        // Поиск
        this.searchBtn.addEventListener('click', () => this.performSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
        
        // Примеры запросов
        this.tipTags.forEach(tag => {
            tag.addEventListener('click', () => {
                this.searchInput.value = tag.getAttribute('data-query');
                this.searchInput.focus();
            });
        });
        
        // Применение фильтров
        this.applyFiltersBtn.addEventListener('click', () => this.applyFilters());
        
        // Модальное окно
        document.querySelectorAll('.modal-close, .close-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => this.hideModal());
        });
        
        // Копирование ID
        this.copyAccountIdBtn.addEventListener('click', () => this.copyAccountId());
        
        // Закрытие модалки по клику вне
        window.addEventListener('click', (e) => {
            if (e.target === this.resultModal) {
                this.hideModal();
            }
        });
    }
    
    setupDemoData() {
        // Демо-аккаунты для показа
        this.demoAccounts = [
            {
                id: 'TG-202412251430-001',
                title: 'Telegram аккаунт Россия 5 лет',
                price: '1 500 ₽',
                country: 'Россия',
                years: 5,
                state: 'чистый',
                spamlock: 'без спамлока',
                description: 'Чистый аккаунт, 5 лет, Россия. Без подписок, без постов. Идеально для регистраций.',
                date: '25.12.2024',
                avatar: '🇷🇺'
            },
            {
                id: 'TG-202412251430-002',
                title: 'Аккаунт Украина 3 года',
                price: '1 200 ₽',
                country: 'Украина',
                years: 3,
                state: 'не тронутый',
                spamlock: 'без спамлока',
                description: 'Не тронутый аккаунт, 3 года, Украина. Полностью чистый, никогда не использовался.',
                date: '25.12.2024',
                avatar: '🇺🇦'
            },
            {
                id: 'TG-202412251430-003',
                title: 'Казахстан 7+ лет',
                price: '2 000 ₽',
                country: 'Казахстан',
                years: '7+',
                state: 'с историей',
                spamlock: 'со спамлоком',
                description: 'Старый аккаунт, 7+ лет, Казахстан. Есть история, требует разблокировки.',
                date: '25.12.2024',
                avatar: '🇰🇿'
            },
            {
                id: 'TG-202412251430-004',
                title: 'США 1 год чистый',
                price: '1 800 ₽',
                country: 'США',
                years: 1,
                state: 'чистый',
                spamlock: 'без спамлока',
                description: 'Чистый аккаунт, 1 год, США. Свежий, без истории.',
                date: '24.12.2024',
                avatar: '🇺🇸'
            },
            {
                id: 'TG-202412251430-005',
                title: 'Германия 2 года не тронутый',
                price: '1 600 ₽',
                country: 'Германия',
                years: 2,
                state: 'не тронутый',
                spamlock: 'без спамлока',
                description: 'Не тронутый аккаунт, 2 года, Германия. Премиум качество.',
                date: '24.12.2024',
                avatar: '🇩🇪'
            },
            {
                id: 'TG-202412251430-006',
                title: 'Польша 4 года с историей',
                price: '1 300 ₽',
                country: 'Польша',
                years: 4,
                state: 'с историей',
                spamlock: 'без спамлока',
                description: 'Аккаунт с историей, 4 года, Польша. Теплый, готов к использованию.',
                date: '23.12.2024',
                avatar: '🇵🇱'
            }
        ];
    }
    
    performSearch() {
        const query = this.searchInput.value.trim();
        
        if (!query) {
            this.showNotification('Введите поисковый запрос', 'warning');
            this.searchInput.focus();
            return;
        }
        
        // Показываем загрузку
        this.showLoading(true);
        
        // Имитация поиска (в реальности здесь будет запрос к API)
        setTimeout(() => {
            const results = this.searchAccounts(query);
            this.displayResults(results, query);
            this.showLoading(false);
        }, 1500); // Имитация задержки поиска
    }
    
    applyFilters() {
        const filters = {
            country: this.countryFilter.value,
            age: this.ageFilter.value,
            state: this.stateFilter.value,
            spamlock: this.spamlockFilter.value
        };
        
        // Строим запрос из фильтров
        const queryParts = [];
        if (filters.country) queryParts.push(filters.country);
        if (filters.age) queryParts.push(filters.age + (filters.age === '7+' ? ' лет' : ' лет'));
        if (filters.state) queryParts.push(filters.state);
        if (filters.spamlock) queryParts.push(filters.spamlock);
        
        const query = queryParts.join(' ');
        
        if (query) {
            this.searchInput.value = query;
            this.performSearch();
        } else {
            this.showNotification('Выберите хотя бы один фильтр', 'info');
        }
    }
    
    searchAccounts(query) {
        // Простая логика поиска по демо-данным
        const queryLower = query.toLowerCase();
        
        return this.demoAccounts.filter(account => {
            const accountText = [
                account.country,
                account.years + ' лет',
                account.state,
                account.spamlock,
                account.description
            ].join(' ').toLowerCase();
            
            // Проверяем совпадение слов из запроса
            const queryWords = queryLower.split(' ').filter(word => word.length > 2);
            
            if (queryWords.length === 0) return true;
            
            // Хотя бы одно слово должно совпадать
            return queryWords.some(word => accountText.includes(word));
        });
    }
    
    displayResults(accounts, query) {
        // Обновляем заголовок
        this.resultsTitle.textContent = `Результаты поиска: "${query}"`;
        this.resultsCount.textContent = accounts.length;
        
        // Очищаем контейнер
        this.resultsContainer.innerHTML = '';
        
        if (accounts.length === 0) {
            this.resultsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>Аккаунты не найдены</h3>
                    <p>Попробуйте изменить параметры поиска</p>
                    <p>Или используйте примеры запросов выше</p>
                </div>
            `;
            return;
        }
        
        // Создаем сетку для результатов
        const grid = document.createElement('div');
        grid.className = 'account-grid';
        
        // Добавляем карточки аккаунтов
        accounts.forEach(account => {
            const card = this.createAccountCard(account);
            grid.appendChild(card);
        });
        
        this.resultsContainer.appendChild(grid);
        
        // Прокручиваем к результатам
        this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    createAccountCard(account) {
        const card = document.createElement('div');
        card.className = 'account-card';
        
        card.innerHTML = `
            <div class="account-id">${account.id}</div>
            
            <div class="account-header">
                <div class="account-avatar">
                    <span style="font-size: 2rem;">${account.avatar}</span>
                </div>
                <div class="account-info">
                    <div class="account-title">${account.title}</div>
                    <div class="account-price">${account.price}</div>
                </div>
            </div>
            
            <div class="account-details-grid">
                <div class="detail-item">
                    <span class="detail-label">Страна</span>
                    <span class="detail-value">${account.country}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Возраст</span>
                    <span class="detail-value">${account.years} лет</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Состояние</span>
                    <span class="detail-value">${account.state}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Спамлок</span>
                    <span class="detail-value">${account.spamlock}</span>
                </div>
            </div>
            
            <div class="account-description">
                ${account.description}
            </div>
            
            <div class="account-actions">
                <button class="select-account-btn" data-id="${account.id}" data-title="${account.title}">
                    <i class="fas fa-check-circle"></i> Выбрать этот аккаунт
                </button>
            </div>
        `;
        
        // Обработчик выбора аккаунта
        const selectBtn = card.querySelector('.select-account-btn');
        selectBtn.addEventListener('click', (e) => {
            const accountId = e.target.getAttribute('data-id');
            const accountTitle = e.target.getAttribute('data-title');
            this.showSelectedAccount(accountId, accountTitle);
        });
        
        return card;
    }
    
    showSelectedAccount(accountId, accountTitle) {
        // Показываем модальное окно с выбранным аккаунтом
        this.modalAccountId.textContent = accountId;
        this.modalAccountIdCode.textContent = accountId;
        this.modalAccountTitle.textContent = accountTitle;
        
        this.resultModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Сохраняем текущий выбранный аккаунт
        this.selectedAccountId = accountId;
    }
    
    hideModal() {
        this.resultModal.classList.remove('show');
        document.body.style.overflow = '';
    }
    
    async copyAccountId() {
        try {
            await navigator.clipboard.writeText(this.selectedAccountId);
            this.showNotification('Номер аккаунта скопирован!', 'success');
            
            // Меняем текст кнопки временно
            const originalText = this.copyAccountIdBtn.innerHTML;
            this.copyAccountIdBtn.innerHTML = '<i class="fas fa-check"></i> Скопировано!';
            
            setTimeout(() => {
                this.copyAccountIdBtn.innerHTML = originalText;
            }, 2000);
            
        } catch (err) {
            this.showNotification('Не удалось скопировать', 'error');
        }
    }
    
    showLoading(show) {
        this.loading.style.display = show ? 'block' : 'none';
        this.resultsContainer.style.display = show ? 'none' : 'block';
    }
    
    showNotification(message, type = 'info') {
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#e74c3c' : 
                        type === 'warning' ? '#f39c12' : 
                        type === 'success' ? '#2ecc71' : '#3498db'};
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            display: flex;
            align-items: center;
            gap: 12px;
            max-width: 400px;
        `;
        
        const icon = type === 'error' ? 'fas fa-times-circle' :
                    type === 'warning' ? 'fas fa-exclamation-triangle' :
                    type === 'success' ? 'fas fa-check-circle' : 'fas fa-info-circle';
        
        notification.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Автоматическое закрытие
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease forwards';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
        
        // Добавляем анимации если их нет
        if (!document.querySelector('#notificationStyles')) {
            const style = document.createElement('style');
            style.id = 'notificationStyles';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TelegramAccountsParser();
    console.log('Telegram Accounts Parser загружен!');
});
