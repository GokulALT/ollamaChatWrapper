
'use client';

// This file centralizes the management of connection settings stored in localStorage.

const OLLAMA_URL_KEY = 'ollama_base_url';
const MCP_URL_KEY = 'mcp_base_url';
const CHROMA_URL_KEY = 'chroma_url';
const TEMPERATURE_KEY = 'chat_temperature';
const RAG_RERANK_ENABLED_KEY = 'rag_rerank_enabled';

const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
const DEFAULT_MCP_URL = 'http://localhost:8008';
const DEFAULT_CHROMA_URL = 'http://localhost:8000';
const DEFAULT_TEMPERATURE = 0.8;
const DEFAULT_RERANK_ENABLED = true;

// Universal getter for string values
const getConfig = (key: string, defaultValue: string): string => {
    try {
        if (typeof window === 'undefined') return defaultValue;
        const storedValue = localStorage.getItem(key);
        // Return stored value if it's not null or an empty string, otherwise return default
        return storedValue || defaultValue;
    } catch (error) {
        // localStorage is not available (e.g., in SSR or private browsing)
        return defaultValue;
    }
};

// Universal setter
const setConfig = (key: string, value: string): void => {
    try {
         if (typeof window === 'undefined') return;
        localStorage.setItem(key, value.trim());
    } catch (error) {
        console.warn(`Could not save config to localStorage: ${key}`);
    }
};

// --- Ollama URL (for Direct & RAG Modes) ---
export const getOllamaUrl = () => getConfig(OLLAMA_URL_KEY, DEFAULT_OLLAMA_URL);
export const setOllamaUrl = (url: string) => setConfig(OLLAMA_URL_KEY, url);

// --- MCP Server URL ---
export const getMcpUrl = () => getConfig(MCP_URL_KEY, DEFAULT_MCP_URL);
export const setMcpUrl = (url: string) => setConfig(MCP_URL_KEY, url);

// --- ChromaDB URL (for RAG Mode) ---
export const getChromaUrl = () => getConfig(CHROMA_URL_KEY, DEFAULT_CHROMA_URL);
export const setChromaUrl = (url: string) => setConfig(CHROMA_URL_KEY, url);

// --- Chat Temperature ---
export const getTemperature = (): number => {
    try {
        if (typeof window === 'undefined') return DEFAULT_TEMPERATURE;
        const storedValue = localStorage.getItem(TEMPERATURE_KEY);
        return storedValue ? parseFloat(storedValue) : DEFAULT_TEMPERATURE;
    } catch (error) {
        return DEFAULT_TEMPERATURE;
    }
};
export const setTemperature = (temp: number) => setConfig(TEMPERATURE_KEY, temp.toString());


// --- RAG Re-ranking ---
export const getRerankEnabled = (): boolean => {
    try {
        if (typeof window === 'undefined') return DEFAULT_RERANK_ENABLED;
        const storedValue = localStorage.getItem(RAG_RERANK_ENABLED_KEY);
        return storedValue ? JSON.parse(storedValue) : DEFAULT_RERANK_ENABLED;
    } catch (error) {
        return DEFAULT_RERANK_ENABLED;
    }
}
export const setRerankEnabled = (enabled: boolean) => setConfig(RAG_RERANK_ENABLED_KEY, JSON.stringify(enabled));

    