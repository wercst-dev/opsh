// parser.js - Парсер LZT.market с кэшированием и ограничением запросов

class LZTParser {
    constructor() {
        this.cache = new Map();
        this.cacheDuration = 5 * 60 * 1000; // 5 минут кэш
        this.requestQueue = [];
        this.isProcessing = false;
        this.lastRequestTime = 0;
        this.minRequestInterval = 2000; // 2 секунды между запросами
    }

    // Основной метод поиска
    async search(params) {
        const cacheKey = this.getCacheKey(params);
        
        // Проверяем кэш
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }
        
        // Добавляем в очередь и ждем своей очереди
        return new Promise((resolve) => {
            this.requestQueue.push({
                params,
                resolve,
                timestamp: Date.now()
            });
            
            if (!this.isProcessing) {
                this.processQueue();
            }
        });
    }

    // Обработка очереди запросов
    async processQueue() {
        if (this.requestQueue.length === 0) {
            this.isProcessing = false;
            return;
        }
        
        this.isProcessing = true;
        
        // Сортируем по времени добавления
        this.requestQueue.sort((a, b) => a.timestamp - b.timestamp);
        
        const request = this.requestQueue.shift();
        
        // Соблюдаем интервал между запросами
        const timeSinceLastRequest = Date.now() - this.lastRequestTime;
        if (timeSinceLastRequest < this.minRequestInterval) {
            await this.delay(this.minRequestInterval - timeSinceLastRequest);
        }
        
        try {
            const results = await this.executeSearch(request.params);
            this.lastRequestTime = Date.now();
            
            // Кэшируем результат
            this.addToCache(this.getCacheKey(request.params), results);
            
            request.resolve(results);
        } catch (error) {
            console.error('Search error:', error);
            request.resolve([]);
        }
        
        // Обрабатываем следующий запрос
        setTimeout(() => this.processQueue(), 100);
    }

    // Выполнение реального поиска
    async executeSearch(params) {
        // Генерируем URL для LZT.market
        const url = this.buildLZTUrl(params);
        
        try {
            // В реальном проекте здесь будет fetch запрос
            // Для демонстрации используем мок данные
            return await this.mockSearch(params);
        } catch (error) {
            console.error('LZT request failed:', error);
            return [];
        }
    }

    // Мок поиска (замените на реальный запрос)
    async mockSearch(params) {
        await this.delay(800); // Имитация задержки сети
        
        const mockAccounts = this.generateMockAccounts(params);
        return mockAccounts;
    }

    // Генерация демо-аккаунтов
    generateMockAccounts(params) {
        const accounts = [];
        const count = Math.floor(Math.random() * 8) + 3; // 3-10 аккаунтов
        
        const countryMap = {
            'ru': { name: 'Россия', flag: '🇷🇺', priceBase: 1500 },
            'ua': { name: 'Украина', flag: '🇺🇦', priceBase: 1200 },
            'kz': { name: 'Казахстан', flag: '🇰🇿', priceBase: 1000 },
            'us': { name: 'США', flag: '🇺🇸', priceBase: 2000 }
        };
        
        const stateMap = {
            'clean': 'чистый',
            'pristine': 'не тронутый'
        };
        
        const spamMap = {
            'no': 'без спамлока',
            'yes': 'со спамлоком'
        };
        
        for (let i = 0; i < count; i++) {
            const country = params.country || ['ru', 'ua', 'kz', 'us'][Math.floor(Math.random() * 4)];
            const years = params.age || Math.floor(Math.random() * 10) + 1;
            const state = params.state || (Math.random() > 0.5 ? 'clean' : 'pristine');
            const spamlock = params.spamlock || (Math.random() > 0.7 ? 'yes' : 'no');
            
            const countryInfo = countryMap[country];
            const price = countryInfo.priceBase + (years * 100) + (spamlock === 'yes' ? -300 : 0);
            
            accounts.push({
                id: `TG-${Date.now().toString().slice(-8)}-${String(i+1).padStart(3, '0')}`,
                title: `Telegram аккаунт ${countryInfo.name} ${years} ${this.getYearWord(years)}`,
                price: `${price.toLocaleString('ru-RU')} ₽`,
                country: countryInfo.name,
                flag: countryInfo.flag,
                years: years,
                state: stateMap[state] || 'чистый',
                spamlock: spamMap[spamlock] || 'без спамлока',
                description: this.generateDescription(countryInfo.name, years, stateMap[state], spamMap[spamlock]),
                date: this.getRandomDate(),
                url: `https://lzt.market/${Math.floor(Math.random() * 1000000) + 1000000}`
            });
        }
        
        return accounts;
    }

    // Вспомогательные методы
    getYearWord(years) {
        if (years === 1) return 'год';
        if (years >= 2 && years <= 4) return 'года';
        return 'лет';
    }

    generateDescription(country, years, state, spamlock) {
        const descriptions = [
            `Аккаунт ${country}, ${years} ${this.getYearWord(years)}. ${state}. ${spamlock}.`,
            `${state} аккаунт ${country}. Возраст: ${years} ${this.getYearWord(years)}. ${spamlock}.`,
            `Telegram аккаунт из ${country}. ${years} ${this.getYearWord(years)}. Состояние: ${state}. ${spamlock}.`
        ];
        return descriptions[Math.floor(Math.random() * descriptions.length)];
    }

    getRandomDate() {
        const days = Math.floor(Math.random() * 7);
        const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        return date.toLocaleDateString('ru-RU');
    }

    buildLZTUrl(params) {
        const baseUrl = 'https://lzt.market/telegram/accounts';
        const queryParams = [];
        
        if (params.country) {
            queryParams.push(`country[]=${params.country.toUpperCase()}`);
        }
        
        if (params.age) {
            queryParams.push(`years_from[]=${params.age}`);
            queryParams.push(`years_to[]=${params.age}`);
        }
        
        if (params.state === 'clean') {
            queryParams.push('type[]=Чистые');
        } else if (params.state === 'pristine') {
            queryParams.push('type[]=Нетронутые');
        }
        
        if (params.spamlock === 'no') {
            queryParams.push('spam_block[]=0');
        } else if (params.spamlock === 'yes') {
            queryParams.push('spam_block[]=1');
        }
        
        queryParams.push('ordering=create_date_desc');
        queryParams.push('online[]=1');
        
        return `${baseUrl}?${queryParams.join('&')}`;
    }

    // Кэширование
    getCacheKey(params) {
        return JSON.stringify(params);
    }

    getFromCache(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > this.cacheDuration) {
            this.cache.delete(key);
            return null;
        }
        
        return item.data;
    }

    addToCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
        
        // Очищаем старый кэш
        this.cleanupCache();
    }

    cleanupCache() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > this.cacheDuration) {
                this.cache.delete(key);
            }
        }
    }

    // Утилиты
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Парсинг текстового запроса
    parseTextQuery(query) {
        const params = {};
        const queryLower = query.toLowerCase();
        
        // Страна
        if (queryLower.includes('россия') || queryLower.includes('рф') || queryLower.includes('russia')) {
            params.country = 'ru';
        } else if (queryLower.includes('украина') || queryLower.includes('укр') || queryLower.includes('ukraine')) {
            params.country = 'ua';
        } else if (queryLower.includes('казахстан') || queryLower.includes('каз') || queryLower.includes('kazakhstan')) {
            params.country = 'kz';
        } else if (queryLower.includes('сша') || queryLower.includes('америка') || queryLower.includes('usa')) {
            params.country = 'us';
        }
        
        // Возраст (ищем цифры)
        const ageMatch = queryLower.match(/\b(\d+)\s*(лет|год|года|y|yrs)?\b/);
        if (ageMatch) {
            params.age = parseInt(ageMatch[1]);
        }
        
        // Состояние
        if (queryLower.includes('чистый') || queryLower.includes('clean')) {
            params.state = 'clean';
        } else if (queryLower.includes('не тронутый') || queryLower.includes('нетронутый') || queryLower.includes('pristine')) {
            params.state = 'pristine';
        }
        
        // Спамлок
        if (queryLower.includes('без спамлока') || queryLower.includes('не забанен') || queryLower.includes('разблокирован')) {
            params.spamlock = 'no';
        } else if (queryLower.includes('со спамлоком') || queryLower.includes('забанен') || queryLower.includes('в бане')) {
            params.spamlock = 'yes';
        }
        
        return params;
    }

    // Комбинирование параметров
    combineParams(textParams, filterParams) {
        return {
            ...textParams,
            ...filterParams
        };
    }
}

// Экспортируем синглтон
window.lztParser = new LZTParser();
