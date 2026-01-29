// script.js - Логика главной страницы

class TelegramParserApp {
    constructor() {
        this.parser = window.lztParser;
        this.selectedAccount = null;
        this.lastSearchTime = 0;
        this.searchCooldown = 2000; // 2 секунды между поисками
        
        this.initElements();
        this.bindEvents();
        this.setupAuth();
    }
    
    initElements() {
        // Поиск
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        
        // Фильтры
        this.countryFilter = document.getElementById('countryFilter');
        this.stateFilter = document.getElementById('stateFilter');
        this.spamFilter = document.getElementById('spamFilter');
        
        // Результаты
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsTitle = document.getElementById('resultsTitle');
        this.resultsCount = document.getElementById('resultsCount');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.loading = document.getElementById('loading');
        
        // Модальное окно
        this.modal = document.getElementById('modal');
        this.modalAccountId = document.getElementById('modalAccountId');
        this.copyBtn = document.getElementById('copyBtn');
    }
    
    bindEvents() {
        // Поиск
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        
        // Модальное окно
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.hideModal());
        });
        
        this.copyBtn.addEventListener('click', () => this.copyAccountId());
        
        // Закрытие по клику вне
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });
        
        // Ограничение частоты поиска
        this.searchBtn.addEventListener('click', (e) => {
            const now = Date.now();
            if (now - this.lastSearchTime < this.searchCooldown) {
                e.preventDefault();
                this.showMessage('подождите перед следующим поиском', 'warning');
                return;
            }
        });
    }
    
    setupAuth() {
        // Проверяем авторизацию для админки
        const isAdminPage = window.location.pathname.includes('admin.html');
        if (isAdminPage && !sessionStorage.getItem('adminAuthenticated')) {
            this.redirectToAuth();
        }
    }
    
    redirectToAuth() {
        const password = prompt('Введите пароль администратора:');
        if (password === 'admin123') { // Пароль по умолчанию
            sessionStorage.setItem('adminAuthenticated', 'true');
            location.reload();
        } else {
            window.location.href = 'index.html';
        }
    }
    
    async handleSearch() {
        const now = Date.now();
        if (now - this.lastSearchTime < this.searchCooldown) {
            this.showMessage('подождите 2 секунды', 'warning');
            return;
        }
        
        this.lastSearchTime = now;
        
        const query = this.searchInput.value.trim();
        if (!query) {
            this.showMessage('введите запрос', 'warning');
            this.searchInput.focus();
            return;
        }
        
        // Парсим текстовый запрос
        const textParams = this.parser.parseTextQuery(query);
        
        // Получаем параметры фильтров
        const filterParams = this.getFilterParams();
        
        // Комбинируем параметры
        const params = this.parser.combineParams(textParams, filterParams);
        
        // Показываем загрузку
        this.showLoading(true);
        
        try {
            // Выполняем поиск через парсер
            const accounts = await this.parser.search(params);
            
            // Отображаем результаты
            this.displayResults(accounts, query);
            
        } catch (error) {
            console.error('Search failed:', error);
            this.showMessage('ошибка поиска', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    getFilterParams() {
        const params = {};
        
        if (this.countryFilter.value) {
            params.country = this.countryFilter.value;
        }
        
        if (this.stateFilter.value) {
            params.state = this.stateFilter.value;
        }
        
        if (this.spamFilter.value) {
            params.spamlock = this.spamFilter.value;
        }
        
        return params;
    }
    
    displayResults(accounts, query) {
        // Обновляем заголовок
        this.resultsTitle.textContent = `поиск: "${query}"`;
        this.resultsCount.textContent = accounts.length;
        
        // Очищаем контейнер
        this.resultsContainer.innerHTML = '';
        
        if (accounts.length === 0) {
            this.resultsContainer.innerHTML = `
                <div class="account-card" style="text-align: center; padding: 40px;">
                    <p style="color: var(--gray-500); margin-bottom: 16px;">аккаунты не найдены</p>
                    <p style="font-size: 14px; color: var(--gray-400);">измените параметры поиска</p>
                </div>
            `;
            return;
        }
        
        // Создаем карточки аккаунтов
        accounts.forEach(account => {
            const card = this.createAccountCard(account);
            this.resultsContainer.appendChild(card);
        });
        
        // Прокручиваем к результатам
        this.resultsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
    
    createAccountCard(account) {
        const card = document.createElement('div');
        card.className = 'account-card';
        
        card.innerHTML = `
            <div class="account-id">${account.id}</div>
            
            <div class="account-header">
                <div class="account-flag">${account.flag}</div>
                <div class="account-info">
                    <div class="account-title">${account.title}</div>
                    <div class="account-price">${account.price}</div>
                </div>
            </div>
            
            <div class="account-details">
                <div class="detail-item">
                    <span class="detail-label">страна</span>
                    <span class="detail-value">${account.country}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">возраст</span>
                    <span class="detail-value">${account.years} ${this.getYearWord(account.years)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">состояние</span>
                    <span class="detail-value">${account.state}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">спамлок</span>
                    <span class="detail-value">${account.spamlock}</span>
                </div>
            </div>
            
            <div class="account-description">
                ${account.description}
            </div>
            
            <button class="select-btn" data-id="${account.id}" data-title="${account.title}">
                выбрать этот аккаунт
            </button>
        `;
        
        // Обработчик выбора
        const selectBtn = card.querySelector('.select-btn');
        selectBtn.addEventListener('click', (e) => {
            const accountId = e.target.getAttribute('data-id');
            const accountTitle = e.target.getAttribute('data-title');
            this.selectAccount(accountId, accountTitle);
        });
        
        return card;
    }
    
    selectAccount(accountId, accountTitle) {
        this.selectedAccount = { id: accountId, title: accountTitle };
        
        // Копируем в буфер
        navigator.clipboard.writeText(accountId)
            .then(() => {
                this.showModal(accountId);
            })
            .catch(() => {
                this.showMessage('не удалось скопировать', 'error');
            });
    }
    
    showModal(accountId) {
        this.modalAccountId.textContent = accountId;
        this.modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    
    hideModal() {
        this.modal.classList.remove('show');
        document.body.style.overflow = '';
    }
    
    async copyAccountId() {
        if (!this.selectedAccount) return;
        
        try {
            await navigator.clipboard.writeText(this.selectedAccount.id);
            this.showMessage('скопировано', 'success');
        } catch (err) {
            this.showMessage('ошибка', 'error');
        }
    }
    
    showLoading(show) {
        this.loading.style.display = show ? 'block' : 'none';
        this.resultsContainer.style.display = show ? 'none' : 'grid';
    }
    
    showMessage(message, type = 'info') {
        // Создаем сообщение
        const messageEl = document.createElement('div');
        messageEl.className = 'message';
        messageEl.textContent = message;
        
        // Стили
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : 
                        type === 'warning' ? '#f59e0b' : 
                        type === 'success' ? '#10b981' : '#6b7280'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(messageEl);
        
        // Автоматическое скрытие
        setTimeout(() => {
            messageEl.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => messageEl.remove(), 300);
        }, 3000);
        
        // Анимации
        if (!document.querySelector('#messageAnimations')) {
            const style = document.createElement('style');
            style.id = 'messageAnimations';
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
    
    getYearWord(years) {
        if (years === 1) return 'год';
        if (years >= 2 && years <= 4) return 'года';
        return 'лет';
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TelegramParserApp();
});
