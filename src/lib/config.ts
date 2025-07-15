
'use client';

// This file centralizes the management of connection settings stored in localStorage.

const OLLAMA_URL_KEY = 'ollama_base_url';
const MCP_URL_KEY = 'mcp_base_url';
const CHROMA_URL_KEY = 'chroma_url';

const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
const DEFAULT_MCP_URL = 'http://localhost:8008';
const DEFAULT_CHROMA_URL = 'http://localhost:8000';

// Universal getter
const getConfig = (key: string, defaultValue: string): string => {
    try {
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
