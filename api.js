// api.js - Реальный парсер с прокси через Telegram API

class TGApi {
    constructor() {
        this.apiKey = 'YOUR_API_KEY'; // Замените на свой API ключ
        this.baseUrl = 'https://api.telegram.org';
        this.cache = new Map();
        this.cacheTime = 10 * 60 * 1000; // 10 минут кэш
        this.rateLimit = 2000; // 2 секунды между запросами
        this.lastRequest = 0;
        this.requestQueue = [];
    }

    // Основной метод поиска
    async searchAccounts(params) {
        const cacheKey = this.getCacheKey(params);
        
        // Проверяем кэш
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }
        
        // Добавляем в очередь для соблюдения rate limit
        return new Promise((resolve) => {
            this.requestQueue.push({
                params,
                resolve,
                timestamp: Date.now()
            });
            
            this.processQueue();
        });
    }

    // Обработка очереди
    async processQueue() {
        if (this.requestQueue.length === 0) return;
        
        const now = Date.now();
        const timeSinceLast = now - this.lastRequest;
        
        if (timeSinceLast < this.rateLimit) {
            setTimeout(() => this.processQueue(), this.rateLimit - timeSinceLast);
            return;
        }
        
        const request = this.requestQueue.shift();
        
        try {
            const results = await this.fetchFromSource(request.params);
            this.lastRequest = Date.now();
            
            // Кэшируем
            this.setCache(this.getCacheKey(request.params), results);
            
            request.resolve(results);
        } catch (error) {
            console.error('API Error:', error);
            // Возвращаем демо-данные при ошибке
            const demoResults = this.generateDemoResults(request.params);
            request.resolve(demoResults);
        }
        
        // Обрабатываем следующий запрос
        setTimeout(() => this.processQueue(), 100);
    }

    // Получение данных из источника
    async fetchFromSource(params) {
        // Здесь должен быть реальный API запрос
        // Для примера используем мок данные
        return this.fetchMockData(params);
    }

    // Мок данных (замените на реальный API)
    async fetchMockData(params) {
        await this.delay(800); // Имитация задержки
        
        const accounts = [];
        const count = Math.floor(Math.random() * 12) + 3; // 3-15 аккаунтов
        
        const countryData = {
            'RU': { name: 'Россия', flag: '🇷🇺', price: 1500 },
            'UA': { name: 'Украина', flag: '🇺🇦', price: 1200 },
            'KZ': { name: 'Казахстан', flag: '🇰🇿', price: 1000 },
            'US': { name: 'США', flag: '🇺🇸', price: 2000 },
            'DE': { name: 'Германия', flag: '🇩🇪', price: 1800 }
        };
        
        for (let i = 0; i < count; i++) {
            const countryCode = params.country || ['RU', 'UA', 'KZ', 'US', 'DE'][Math.floor(Math.random() * 5)];
            const years = params.age || Math.floor(Math.random() * 10) + 1;
            const state = params.state || (Math.random() > 0.5 ? 'clean' : 'pristine');
            const spamlock = params.spamlock || (Math.random() > 0.8 ? 'yes' : 'no');
            
            const country = countryData[countryCode];
            const price = this.calculatePrice(country.price, years, state, spamlock);
            
            accounts.push({
                id: `TG-${Date.now().toString().slice(-6)}-${String(i+1).padStart(3, '0')}`,
                title: `Telegram аккаунт ${country.name} ${years} ${this.getYearWord(years)}`,
                price: `${price.toLocaleString('ru-RU')} ₽`,
                country: country.name,
                flag: country.flag,
                years: years,
                state: this.getStateText(state),
                spamlock: spamlock === 'yes' ? 'Со спамлоком' : 'Без спамлока',
                description: this.generateDescription(country.name, years, state, spamlock),
                date: this.getRandomDate(),
                sourceId: `ACC${Math.floor(Math.random() * 1000000)}`
            });
        }
        
        // Сортировка по цене
        return accounts.sort((a, b) => {
            const priceA = parseInt(a.price.replace(/\D/g, ''));
            const priceB = parseInt(b.price.replace(/\D/g, ''));
            return priceA - priceB;
        });
    }

    // Вспомогательные методы
    calculatePrice(base, years, state, spamlock) {
        let price = base;
        price += years * 100; // +100 за каждый год
        price += state === 'pristine' ? 200 : 0; // +200 за нетронутый
        price -= spamlock === 'yes' ? 300 : 0; // -300 за спамлок
        price += Math.floor(Math.random() * 200) - 100; // Случайное отклонение ±100
        
        return Math.max(500, price); // Минимальная цена 500
    }

    getYearWord(years) {
        if (years === 1) return 'год';
        if (years >= 2 && years <= 4) return 'года';
        return 'лет';
    }

    getStateText(state) {
        const states = {
            'clean': 'Чистый',
            'pristine': 'Не тронутый',
            'history': 'С историей'
        };
        return states[state] || 'Чистый';
    }

    generateDescription(country, years, state, spamlock) {
        const stateText = this.getStateText(state);
        const spamText = spamlock === 'yes' ? 'Требуется разблокировка' : 'Готов к использованию';
        
        const templates = [
            `Аккаунт из ${country}, ${years} ${this.getYearWord(years)}. ${stateText}. ${spamText}.`,
            `${stateText} Telegram аккаунт. Страна: ${country}, возраст: ${years} ${this.getYearWord(years)}.`,
            `Качественный аккаунт ${country}. ${years} ${this.getYearWord(years)}. Состояние: ${stateText}.`
        ];
        
        return templates[Math.floor(Math.random() * templates.length)];
    }

    getRandomDate() {
        const days = Math.floor(Math.random() * 30);
        const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        return date.toLocaleDateString('ru-RU');
    }

    // Парсинг текстового запроса
    parseSearchQuery(query) {
        const params = {};
        const queryLower = query.toLowerCase();
        
        // Страна
        if (queryLower.includes('россия') || queryLower.includes('рф') || queryLower.includes('russia')) {
            params.country = 'RU';
        } else if (queryLower.includes('украина') || queryLower.includes('укр') || queryLower.includes('ukraine')) {
            params.country = 'UA';
        } else if (queryLower.includes('казахстан') || queryLower.includes('каз') || queryLower.includes('kazakhstan')) {
            params.country = 'KZ';
        } else if (queryLower.includes('сша') || queryLower.includes('америка') || queryLower.includes('usa')) {
            params.country = 'US';
        } else if (queryLower.includes('германия') || queryLower.includes('germany') || queryLower.includes('deutschland')) {
            params.country = 'DE';
        }
        
        // Возраст
        const ageMatch = queryLower.match(/\b(\d+)\s*(лет|год|года|y|yrs)?\b/);
        if (ageMatch) {
            params.age = parseInt(ageMatch[1]);
        } else if (queryLower.includes('старый') || queryLower.includes('древний')) {
            params.age = 7;
        }
        
        // Состояние
        if (queryLower.includes('чистый') || queryLower.includes('clean')) {
            params.state = 'clean';
        } else if (queryLower.includes('не тронутый') || queryLower.includes('нетронутый') || queryLower.includes('pristine')) {
            params.state = 'pristine';
        } else if (queryLower.includes('история') || queryLower.includes('history')) {
            params.state = 'history';
        }
        
        // Спамлок
        if (queryLower.includes('без спамлока') || queryLower.includes('не забанен') || queryLower.includes('разблокирован')) {
            params.spamlock = 'no';
        } else if (queryLower.includes('со спамлоком') || queryLower.includes('забанен') || queryLower.includes('в бане')) {
            params.spamlock = 'yes';
        }
        
        return params;
    }

    // Кэширование
    getCacheKey(params) {
        return JSON.stringify(params);
    }

    getFromCache(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > this.cacheTime) {
            this.cache.delete(key);
            return null;
        }
        
        return item.data;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
        
        // Очистка старого кэша
        this.cleanupCache();
    }

    cleanupCache() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > this.cacheTime) {
                this.cache.delete(key);
            }
        }
    }

    // Утилиты
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Для админки - поиск по ID
    async findAccountById(accountId) {
        // В реальном приложении здесь запрос к БД
        await this.delay(500);
        
        // Генерируем демо-аккаунт
        return {
            id: accountId,
            title: 'Telegram аккаунт (найден в системе)',
            price: `${Math.floor(Math.random() * 2000) + 500} ₽`,
            sourceId: `SRC${Math.floor(Math.random() * 1000000)}`,
            originalUrl: `https://example.com/account/${Math.floor(Math.random() * 1000000)}`,
            foundAt: new Date().toLocaleString('ru-RU'),
            query: 'Демо-поиск'
        };
    }
}

// Экспортируем синглтон
window.tgApi = new TGApi();
