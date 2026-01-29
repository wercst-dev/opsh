// admin.js - Логика админ панели

class AdminPanel {
    constructor() {
        this.api = window.tgApi;
        this.adminPassword = 'admin123'; // Пароль по умолчанию
        this.currentAccount = null;
        
        this.initElements();
        this.checkAuth();
        this.bindEvents();
        this.loadStats();
        this.loadHistory();
    }
    
    initElements() {
        // Авторизация
        this.authScreen = document.getElementById('authScreen');
        this.adminPanel = document.getElementById('adminPanel');
        this.adminPasswordInput = document.getElementById('adminPassword');
        this.loginBtn = document.getElementById('loginBtn');
        
        // Поиск
        this.accountIdInput = document.getElementById('accountIdInput');
        this.lookupBtn = document.getElementById('lookupBtn');
        this.refreshBtn = document.getElementById('refreshBtn');
        
        // Результат
        this.lookupResult = document.getElementById('lookupResult');
        this.resultAccountId = document.getElementById('resultAccountId');
        this.resultSourceId = document.getElementById('resultSourceId');
        this.resultTitle = document.getElementById('resultTitle');
        this.resultPrice = document.getElementById('resultPrice');
        this.resultFoundAt = document.getElementById('resultFoundAt');
        this.resultQuery = document.getElementById('resultQuery');
        this.copyInfoBtn = document.getElementById('copyInfoBtn');
        this.clearBtn = document.getElementById('clearBtn');
        
        // Статистика
        this.totalSearches = document.getElementById('totalSearches');
        this.uniqueQueries = document.getElementById('uniqueQueries');
        this.totalAccounts = document.getElementById('totalAccounts');
        this.selectedAccounts = document.getElementById('selectedAccounts');
        this.statsUpdated = document.getElementById('statsUpdated');
        
        // История
        this.historyContainer = document.getElementById('historyContainer');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        
        // Выход
        this.logoutBtn = document.getElementById('logoutBtn');
    }
    
    checkAuth() {
        const isAuthenticated = sessionStorage.getItem('tgAdminAuth') === 'true';
        
        if (isAuthenticated) {
            this.showAdminPanel();
        } else {
            this.showAuthScreen();
        }
    }
    
    showAuthScreen() {
        this.authScreen.style.display = 'flex';
        this.adminPanel.style.display = 'none';
        this.adminPasswordInput.focus();
    }
    
    showAdminPanel() {
        this.authScreen.style.display = 'none';
        this.adminPanel.style.display = 'block';
    }
    
    bindEvents() {
        // Авторизация
        this.loginBtn.addEventListener('click', () => this.login());
        this.adminPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
        
        // Поиск аккаунта
        this.lookupBtn.addEventListener('click', () => this.lookupAccount());
        this.accountIdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.lookupAccount();
        });
        
        this.refreshBtn.addEventListener('click', () => this.refreshStats());
        
        // Действия с результатом
        this.copyInfoBtn.addEventListener('click', () => this.copyAccountInfo());
        this.clearBtn.addEventListener('click', () => this.clearResult());
        
        // История
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        
        // Выход
        this.logoutBtn.addEventListener('click', () => this.logout());
    }
    
    login() {
        const password = this.adminPasswordInput.value.trim();
        
        if (password === this.adminPassword) {
            sessionStorage.setItem('tgAdminAuth', 'true');
            this.showAdminPanel();
            this.showMessage('Авторизация успешна', 'success');
        } else {
            this.showMessage('Неверный пароль', 'error');
            this.adminPasswordInput.focus();
            this.adminPasswordInput.select();
        }
    }
    
    logout() {
        sessionStorage.removeItem('tgAdminAuth');
        this.showAuthScreen();
        this.adminPasswordInput.value = '';
        this.showMessage('Вы вышли из системы', 'info');
    }
    
    async lookupAccount() {
        const accountId = this.accountIdInput.value.trim().toUpperCase();
        
        if (!accountId.startsWith('TG-')) {
            this.showMessage('Неверный формат ID. Должен начинаться с TG-', 'error');
            return;
        }
        
        try {
            // Ищем аккаунт через API
            const account = await this.api.findAccountById(accountId);
            
            if (account) {
                this.displayLookupResult(account);
                this.addToHistory(account);
                this.showMessage('Аккаунт найден', 'success');
            } else {
                this.showMessage('Аккаунт не найден в системе', 'error');
                this.lookupResult.classList.add('hidden');
            }
        } catch (error) {
            console.error('Lookup error:', error);
            this.showMessage('Ошибка при поиске аккаунта', 'error');
        }
    }
    
    displayLookupResult(account) {
        this.resultAccountId.textContent = account.id;
        this.resultSourceId.textContent = account.sourceId || 'N/A';
        this.resultTitle.textContent = account.title;
        this.resultPrice.textContent = account.price;
        this.resultFoundAt.textContent = account.foundAt || new Date().toLocaleString('ru-RU');
        this.resultQuery.textContent = account.query || 'Не указано';
        
        this.lookupResult.classList.remove('hidden');
        this.currentAccount = account;
        
        // Прокручиваем к результату
        this.lookupResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    clearResult() {
        this.accountIdInput.value = '';
        this.lookupResult.classList.add('hidden');
        this.currentAccount = null;
        this.accountIdInput.focus();
    }
    
    async copyAccountInfo() {
        if (!this.currentAccount) return;
        
        const info = `
Аккаунт: ${this.currentAccount.id}
Идентификатор: ${this.currentAccount.sourceId || 'N/A'}
Название: ${this.currentAccount.title}
Цена: ${this.currentAccount.price}
Найден: ${this.currentAccount.foundAt}
Запрос: ${this.currentAccount.query || 'Не указано'}
        `.trim();
        
        try {
            await navigator.clipboard.writeText(info);
            this.showMessage('Информация скопирована', 'success');
        } catch (err) {
            this.showMessage('Ошибка копирования', 'error');
        }
    }
    
    loadStats() {
        try {
            const stats = JSON.parse(localStorage.getItem('tgFinderStats')) || {
                totalSearches: 0,
                uniqueQueries: [],
                totalAccounts: 0
            };
            
            const selections = JSON.parse(localStorage.getItem('tgSelections')) || [];
            
            this.totalSearches.textContent = stats.totalSearches.toLocaleString('ru-RU');
            this.uniqueQueries.textContent = stats.uniqueQueries.length.toLocaleString('ru-RU');
            this.totalAccounts.textContent = stats.totalAccounts.toLocaleString('ru-RU');
            this.selectedAccounts.textContent = selections.length.toLocaleString('ru-RU');
            
            this.statsUpdated.textContent = 'Только что';
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }
    
    refreshStats() {
        this.loadStats();
        this.loadHistory();
        this.showMessage('Статистика обновлена', 'success');
    }
    
    loadHistory() {
        try {
            const selections = JSON.parse(localStorage.getItem('tgSelections')) || [];
            
            if (selections.length === 0) {
                this.historyContainer.innerHTML = `
                    <div class="history-item" style="text-align: center; color: var(--gray-500);">
                        <p>История действий пуста</p>
                    </div>
                `;
                return;
            }
            
            // Показываем последние 20 действий
            const recentSelections = selections.slice(-20).reverse();
            
            this.historyContainer.innerHTML = '';
            
            recentSelections.forEach((selection, index) => {
                const item = this.createHistoryItem(selection, index);
                this.historyContainer.appendChild(item);
            });
            
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }
    
    createHistoryItem(selection, index) {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const time = new Date(selection.timestamp).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        item.innerHTML = `
            <div class="history-info">
                <div class="history-account">${selection.accountId}</div>
                <div class="history-meta">
                    <span>${time}</span>
                    <span>${selection.userAgent ? selection.userAgent.substring(0, 30) + '...' : 'Неизвестно'}</span>
                </div>
            </div>
            <div class="history-actions">
                <button class="history-btn" data-id="${selection.accountId}" data-index="${index}">
                    <i class="fas fa-search"></i>
                </button>
                <button class="history-btn" data-id="${selection.accountId}" data-action="copy">
                    <i class="far fa-copy"></i>
                </button>
            </div>
        `;
        
        // Обработчики кнопок
        const searchBtn = item.querySelector('button[data-id]');
        searchBtn.addEventListener('click', (e) => {
            const accountId = e.target.closest('button').getAttribute('data-id');
            this.accountIdInput.value = accountId;
            this.lookupAccount();
        });
        
        const copyBtn = item.querySelector('button[data-action="copy"]');
        copyBtn.addEventListener('click', (e) => {
            const accountId = e.target.closest('button').getAttribute('data-id');
            navigator.clipboard.writeText(accountId)
                .then(() => this.showMessage('ID скопирован', 'success'))
                .catch(() => this.showMessage('Ошибка копирования', 'error'));
        });
        
        return item;
    }
    
    addToHistory(account) {
        try {
            const lookups = JSON.parse(localStorage.getItem('tgAdminLookups')) || [];
            
            lookups.push({
                accountId: account.id,
                timestamp: new Date().toISOString(),
                title: account.title,
                price: account.price
            });
            
            // Ограничиваем историю 50 записями
            if (lookups.length > 50) {
                lookups = lookups.slice(-50);
            }
            
            localStorage.setItem('tgAdminLookups', JSON.stringify(lookups));
            
        } catch (error) {
            console.error('Error saving lookup:', error);
        }
    }
    
    clearHistory() {
        if (confirm('Вы уверены, что хотите очистить историю действий?')) {
            localStorage.removeItem('tgSelections');
            localStorage.removeItem('tgAdminLookups');
            this.loadHistory();
            this.showMessage('История очищена', 'success');
        }
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
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});
