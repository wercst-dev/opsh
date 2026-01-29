// script.js - Логика главной страницы

class TGFinder {
    constructor() {
        this.api = window.tgApi;
        this.selectedAccount = null;
        this.isSearching = false;
        
        this.initElements();
        this.bindEvents();
        this.setupExamples();
    }
    
    initElements() {
        // Поиск
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        
        // Фильтры
        this.countryFilter = document.getElementById('countryFilter');
        this.ageFilter = document.getElementById('ageFilter');
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
        this.modalAccountIdCode = document.getElementById('modalAccountIdCode');
        this.copyAgainBtn = document.getElementById('copyAgainBtn');
        
        // Быстрый переход
        this.telegramLinks = document.querySelectorAll('a[href*="t.me"]');
    }
    
    bindEvents() {
        // Поиск
        this.searchBtn.addEventListener('click', () => this.performSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
        
        // Фильтры (применяются автоматически при изменении)
        [this.countryFilter, this.ageFilter, this.stateFilter, this.spamFilter].forEach(filter => {
            filter.addEventListener('change', () => {
                if (this.searchInput.value.trim()) {
                    this.performSearch();
                }
            });
        });
        
        // Модальное окно
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.hideModal());
        });
        
        this.copyAgainBtn.addEventListener('click', () => this.copyAccountId());
        
        // Закрытие по клику вне
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });
        
        // Открытие Telegram в новом окне
        this.telegramLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const url = link.getAttribute('href');
                window.open(url, '_blank', 'noopener,noreferrer');
                
                // Если это ссылка из модалки после выбора аккаунта
                if (this.selectedAccount && link.closest('.modal-actions')) {
                    this.trackTelegramClick();
                }
            });
        });
    }
    
    setupExamples() {
        document.querySelectorAll('.example').forEach(example => {
            example.addEventListener('click', (e) => {
                const query = e.target.getAttribute('data-query');
                this.searchInput.value = query;
                this.searchInput.focus();
                this.performSearch();
            });
        });
    }
    
    async performSearch() {
        if (this.isSearching) {
            this.showMessage('Подождите, идет поиск...', 'warning');
            return;
        }
        
        const query = this.searchInput.value.trim();
        if (!query) {
            this.showMessage('Введите поисковый запрос', 'warning');
            this.searchInput.focus();
            return;
        }
        
        this.isSearching = true;
        this.showLoading(true);
        
        try {
            // Парсим текстовый запрос
            const textParams = this.api.parseSearchQuery(query);
            
            // Получаем параметры фильтров
            const filterParams = this.getFilterParams();
            
            // Объединяем параметры
            const searchParams = { ...textParams, ...filterParams };
            
            // Выполняем поиск
            const accounts = await this.api.searchAccounts(searchParams);
            
            // Отображаем результаты
            this.displayResults(accounts, query);
            
            // Сохраняем статистику
            this.saveSearchStats(query, accounts.length);
            
        } catch (error) {
            console.error('Search error:', error);
            this.showMessage('Ошибка при поиске. Попробуйте еще раз.', 'error');
            this.displayResults([], query);
        } finally {
            this.isSearching = false;
            this.showLoading(false);
        }
    }
    
    getFilterParams() {
        const params = {};
        
        if (this.countryFilter.value) {
            params.country = this.countryFilter.value;
        }
        
        if (this.ageFilter.value) {
            params.age = parseInt(this.ageFilter.value);
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
        this.resultsTitle.textContent = `Результаты: "${query}"`;
        this.resultsCount.textContent = accounts.length;
        
        // Очищаем контейнер
        this.resultsContainer.innerHTML = '';
        
        if (accounts.length === 0) {
            this.resultsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>Аккаунты не найдены</h3>
                    <p>Попробуйте изменить параметры поиска</p>
                    <p>Или свяжитесь с оператором для помощи</p>
                </div>
            `;
            return;
        }
        
        // Создаем карточки
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
                <div class="account-avatar">
                    <span style="font-size: 28px;">${account.flag}</span>
                </div>
                <div class="account-info">
                    <div class="account-title">${account.title}</div>
                    <div class="account-price">${account.price}</div>
                </div>
            </div>
            
            <div class="account-details">
                <div class="detail-item">
                    <span class="detail-label">Страна</span>
                    <span class="detail-value">${account.country}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Возраст</span>
                    <span class="detail-value">${account.years} ${this.getYearWord(account.years)}</span>
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
            
            <button class="select-btn" data-id="${account.id}" data-title="${account.title}">
                Выбрать этот аккаунт
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
                this.trackSelection(accountId);
            })
            .catch(() => {
                this.showMessage('Не удалось скопировать номер', 'error');
            });
    }
    
    showModal(accountId) {
        this.modalAccountId.textContent = accountId;
        this.modalAccountIdCode.textContent = accountId;
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
            this.showMessage('Номер скопирован!', 'success');
        } catch (err) {
            this.showMessage('Ошибка копирования', 'error');
        }
    }
    
    showLoading(show) {
        this.loading.style.display = show ? 'block' : 'none';
        this.resultsContainer.style.display = show ? 'none' : 'grid';
    }
    
    showMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = 'message';
        messageEl.textContent = message;
        
        const colors = {
            error: '#ef4444',
            warning: '#f59e0b',
            success: '#10b981',
            info: '#6b7280'
        };
        
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 14px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 400px;
        `;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => messageEl.remove(), 300);
        }, 3000);
        
        // Анимации
        if (!document.querySelector('#messageStyles')) {
            const style = document.createElement('style');
            style.id = 'messageStyles';
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
    
    saveSearchStats(query, count) {
        try {
            const stats = JSON.parse(localStorage.getItem('tgFinderStats')) || {
                totalSearches: 0,
                uniqueQueries: [],
                totalAccounts: 0
            };
            
            stats.totalSearches++;
            stats.totalAccounts += count;
            
            if (!stats.uniqueQueries.includes(query)) {
                stats.uniqueQueries.push(query);
            }
            
            localStorage.setItem('tgFinderStats', JSON.stringify(stats));
            
        } catch (error) {
            console.error('Error saving stats:', error);
        }
    }
    
    trackSelection(accountId) {
        // Отправляем статистику о выборе аккаунта
        const selection = {
            accountId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };
        
        try {
            const selections = JSON.parse(localStorage.getItem('tgSelections')) || [];
            selections.push(selection);
            localStorage.setItem('tgSelections', JSON.stringify(selections));
        } catch (error) {
            console.error('Error tracking selection:', error);
        }
    }
    
    trackTelegramClick() {
        // Отслеживаем переход в Telegram
        const clickData = {
            accountId: this.selectedAccount?.id,
            timestamp: new Date().toISOString(),
            action: 'telegram_redirect'
        };
        
        try {
            const clicks = JSON.parse(localStorage.getItem('tgClicks')) || [];
            clicks.push(clickData);
            localStorage.setItem('tgClicks', JSON.stringify(clicks));
        } catch (error) {
            console.error('Error tracking click:', error);
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
    window.tgFinder = new TGFinder();
    console.log('TG Finder initialized');
});
