/**
 * i18n System - Auto-detect language without manual switcher
 * Priority: uk > ru > es > en (fallback: en)
 */

(function() {
    'use strict';

    // Supported languages
    const SUPPORTED_LANGS = ['uk', 'ru', 'es', 'en'];
    const FALLBACK_LANG = 'en';
    const TRANSLATION_FALLBACK = 'ru'; // If key missing, fallback to Russian

    // Translations cache
    let translations = {};
    let currentLang = FALLBACK_LANG;

    /**
     * Detect language from browser/system with priority rules
     * Priority: uk > ru > es > en
     */
    function resolveLanguage() {
        // Collect all language signals
        const signals = [];

        // 1. navigator.languages (array of preferred languages)
        if (navigator.languages && navigator.languages.length) {
            signals.push(...navigator.languages);
        }

        // 2. navigator.language
        if (navigator.language) {
            signals.push(navigator.language);
        }

        // 3. System locale hint via Intl
        try {
            const systemLocale = Intl.DateTimeFormat().resolvedOptions().locale;
            if (systemLocale) {
                signals.push(systemLocale);
            }
        } catch (e) {}

        // Normalize signals to lowercase
        const normalizedSignals = signals.map(s => s.toLowerCase());

        // Check presence of each language (extract primary language code)
        const hasLang = (code) => {
            return normalizedSignals.some(signal => {
                const primary = signal.split('-')[0];
                return primary === code;
            });
        };

        // Apply priority rules
        // 1. Ukrainian always wins if present anywhere
        if (hasLang('uk')) return 'uk';

        // 2. Russian wins over es/en
        if (hasLang('ru')) return 'ru';

        // 3. Spanish wins over English
        if (hasLang('es')) return 'es';

        // 4. English
        if (hasLang('en')) return 'en';

        // 5. Fallback
        return FALLBACK_LANG;
    }

    /**
     * Load translations for a language
     */
    async function loadTranslations(lang) {
        if (translations[lang]) {
            return translations[lang];
        }

        try {
            const response = await fetch(`locales/${lang}.json`);
            if (!response.ok) throw new Error(`Failed to load ${lang}`);
            translations[lang] = await response.json();
            return translations[lang];
        } catch (e) {
            console.warn(`i18n: Could not load ${lang}, falling back`);
            if (lang !== TRANSLATION_FALLBACK) {
                return loadTranslations(TRANSLATION_FALLBACK);
            }
            return {};
        }
    }

    /**
     * Get translation by key with dot notation support
     */
    function t(key, lang) {
        lang = lang || currentLang;
        const dict = translations[lang] || {};
        const fallbackDict = translations[TRANSLATION_FALLBACK] || {};

        // Support dot notation: "hero.title"
        const getValue = (obj, path) => {
            return path.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : undefined, obj);
        };

        let value = getValue(dict, key);
        if (value === undefined && lang !== TRANSLATION_FALLBACK) {
            value = getValue(fallbackDict, key);
        }

        return value !== undefined ? value : key;
    }

    /**
     * Apply translations to DOM
     */
    function applyTranslations() {
        // Elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translated = t(key);
            if (translated && translated !== key) {
                el.textContent = translated;
            }
        });

        // Elements with data-i18n-html (for HTML content)
        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const key = el.getAttribute('data-i18n-html');
            const translated = t(key);
            if (translated && translated !== key) {
                el.innerHTML = translated;
            }
        });

        // Placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const translated = t(key);
            if (translated && translated !== key) {
                el.placeholder = translated;
            }
        });

        // Title attribute
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            const translated = t(key);
            if (translated && translated !== key) {
                el.title = translated;
            }
        });

        // Alt attribute
        document.querySelectorAll('[data-i18n-alt]').forEach(el => {
            const key = el.getAttribute('data-i18n-alt');
            const translated = t(key);
            if (translated && translated !== key) {
                el.alt = translated;
            }
        });

        // Aria-label
        document.querySelectorAll('[data-i18n-aria]').forEach(el => {
            const key = el.getAttribute('data-i18n-aria');
            const translated = t(key);
            if (translated && translated !== key) {
                el.setAttribute('aria-label', translated);
            }
        });

        // Update document title
        const titleKey = document.querySelector('title')?.getAttribute('data-i18n');
        if (titleKey) {
            document.title = t(titleKey);
        }

        // Update meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        const descKey = metaDesc?.getAttribute('data-i18n');
        if (descKey) {
            metaDesc.content = t(descKey);
        }
    }

    /**
     * Initialize i18n system
     */
    async function init() {
        // Detect language
        currentLang = resolveLanguage();

        // Set html lang attribute immediately
        document.documentElement.lang = currentLang;

        // Load translations
        await loadTranslations(currentLang);

        // Also load fallback for missing keys
        if (currentLang !== TRANSLATION_FALLBACK) {
            await loadTranslations(TRANSLATION_FALLBACK);
        }

        // Apply translations when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', applyTranslations);
        } else {
            applyTranslations();
        }
    }

    // Expose for debugging (optional)
    window.i18n = {
        t: t,
        lang: () => currentLang,
        resolve: resolveLanguage
    };

    // Initialize
    init();

})();
