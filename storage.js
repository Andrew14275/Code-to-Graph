// storage.js - Client-side persistence for Code-to-Graph
// No backend required - uses browser localStorage

class ProjectStorage {
    constructor(storageKey) {
        this.storageKey = storageKey;
        this.maxItems = 50; // Prevent localStorage overflow
    }
    
    // Save a project with metadata
    save(name, data) {
        const items = this.getAll();
        const id = Date.now();
        
        items[name] = {
            id: id,
            name: name,
            data: data,
            timestamp: new Date().toISOString(),
            dateCreated: new Date().toLocaleString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                dateStyle: 'medium',
                timeStyle: 'short'
            })
        };
        
        // Keep only most recent items if limit exceeded
        const itemsArray = Object.values(items);
        if (itemsArray.length > this.maxItems) {
            itemsArray.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            const kept = {};
            itemsArray.slice(0, this.maxItems).forEach(item => {
                kept[item.name] = item;
            });
            localStorage.setItem(this.storageKey, JSON.stringify(kept));
        } else {
            localStorage.setItem(this.storageKey, JSON.stringify(items));
        }
        
        return true;
    }
    
    // Get all saved items
    getAll() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.error('Storage read error:', e);
            return {};
        }
    }
    
    // Get a specific item
    get(name) {
        const items = this.getAll();
        return items[name] || null;
    }
    
    // Delete an item
    delete(name) {
        const items = this.getAll();
        delete items[name];
        localStorage.setItem(this.storageKey, JSON.stringify(items));
        return true;
    }
    
    // Clear all items
    clear() {
        localStorage.removeItem(this.storageKey);
        return true;
    }
    
    // Export all data as JSON
    export() {
        const data = this.getAll();
        return JSON.stringify(data, null, 2);
    }
    
    // Import data from JSON
    import(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }
    
    // Get storage statistics
    getStats() {
        const items = this.getAll();
        const count = Object.keys(items).length;
        const jsonString = JSON.stringify(items);
        const sizeKB = (new Blob([jsonString]).size / 1024).toFixed(2);
        
        return { count, sizeKB };
    }
}

// History tracker for user activity
class ActivityHistory {
    constructor(maxItems = 20) {
        this.storageKey = 'code-to-graph-history';
        this.maxItems = maxItems;
    }
    
    // Add activity to history
    add(type, description, data = {}) {
        const history = this.getAll();
        const entry = {
            id: Date.now(),
            type: type, // 'graph', 'hamming', 'export', etc.
            description: description,
            data: data,
            timestamp: new Date().toISOString(),
            dateFormatted: new Date().toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                dateStyle: 'medium',
                timeStyle: 'short'
            })
        };
        
        history.unshift(entry); // Add to beginning
        
        // Keep only recent items
        if (history.length > this.maxItems) {
            history.length = this.maxItems;
        }
        
        localStorage.setItem(this.storageKey, JSON.stringify(history));
    }
    
    // Get all history
    getAll() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }
    
    // Clear history
    clear() {
        localStorage.removeItem(this.storageKey);
    }
}

// User preferences manager
class UserPreferences {
    constructor() {
        this.storageKey = 'code-to-graph-preferences';
        this.defaults = {
            theme: 'light',
            autoSave: true,
            showHistory: true,
            animationsEnabled: true,
            defaultGraphLayout: 'circular',
            graphNodeColor: '#667eea',
            graphHubColor: '#f6ad55'
        };
    }
    
    // Get a preference
    get(key) {
        const prefs = this.getAll();
        return prefs[key] !== undefined ? prefs[key] : this.defaults[key];
    }
    
    // Set a preference
    set(key, value) {
        const prefs = this.getAll();
        prefs[key] = value;
        localStorage.setItem(this.storageKey, JSON.stringify(prefs));
    }
    
    // Get all preferences
    getAll() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? { ...this.defaults, ...JSON.parse(stored) } : this.defaults;
        } catch (e) {
            return this.defaults;
        }
    }
    
    // Reset to defaults
    reset() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.defaults));
    }
}

// Initialize global instances
const graphStorage = new ProjectStorage('code-to-graph-graphs');
const hammingStorage = new ProjectStorage('code-to-graph-hamming');
const activityHistory = new ActivityHistory();
const userPrefs = new UserPreferences();

// Example templates
const graphExamples = {
    'star-network': {
        name: 'Star Network Topology',
        description: '5G cell tower with connected devices',
        nodes: 'Tower, Device1, Device2, Device3, Device4, Device5',
        edges: 'Tower-Device1\nTower-Device2\nTower-Device3\nTower-Device4\nTower-Device5',
        category: 'Network Design'
    },
    'ring-topology': {
        name: 'Ring Network',
        description: 'Circular router network with redundancy',
        nodes: 'Router1, Router2, Router3, Router4',
        edges: 'Router1-Router2\nRouter2-Router3\nRouter3-Router4\nRouter4-Router1',
        category: 'Network Design'
    },
    'complete-graph': {
        name: 'Complete Graph K4',
        description: 'Fully connected mesh network',
        nodes: 'A, B, C, D',
        edges: 'A-B\nA-C\nA-D\nB-C\nB-D\nC-D',
        category: 'Graph Theory'
    },
    'binary-tree': {
        name: 'Binary Tree',
        description: 'Hierarchical data structure',
        nodes: 'Root, L1, R1, L2, R2, L3, R3',
        edges: 'Root-L1\nRoot-R1\nL1-L2\nL1-R2\nR1-L3\nR1-R3',
        category: 'Data Structures'
    },
    'social-network': {
        name: 'Social Network',
        description: 'Friend connections with influencer',
        nodes: 'Alice, Bob, Charlie, Diana, Eve, Frank',
        edges: 'Alice-Bob\nAlice-Charlie\nAlice-Diana\nBob-Charlie\nDiana-Eve\nDiana-Frank\nEve-Frank',
        category: 'Social Networks'
    },
    'supply-chain': {
        name: 'Supply Chain',
        description: 'Manufacturing and distribution network',
        nodes: 'Factory, Warehouse1, Warehouse2, Store1, Store2, Store3',
        edges: 'Factory-Warehouse1\nFactory-Warehouse2\nWarehouse1-Store1\nWarehouse1-Store2\nWarehouse2-Store2\nWarehouse2-Store3',
        category: 'Logistics'
    }
};
