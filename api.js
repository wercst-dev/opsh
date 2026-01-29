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
            const price = this.calculatePrice(count
