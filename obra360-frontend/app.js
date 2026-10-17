// Obra 360 - PWA Client Logic & IndexedDB Offline Storage

class Obra360OfflineStorage {
  constructor() {
    this.dbName = 'Obra360_Offline_DB';
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        // Create object stores if not existing
        if (!db.objectStoreNames.contains('diario_obra')) {
          db.createObjectStore('diario_obra', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('ordens_servico')) {
          db.createObjectStore('ordens_servico', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('estoque_cm2')) {
          db.createObjectStore('estoque_cm2', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('ocorrencias_nr18')) {
          db.createObjectStore('ocorrencias_nr18', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('[IndexedDB] Banco de dados offline inicializado com sucesso.');
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('[IndexedDB] Erro ao abrir banco offline:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async saveItem(storeName, item) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName, 'sync_queue'], 'readwrite');
      const store = tx.objectStore(storeName);
      const syncStore = tx.objectStore('sync_queue');

      item.createdAt = new Date().toISOString();
      item.synced = false;

      const req = store.add(item);
      req.onsuccess = (e) => {
        const generatedId = e.target.result;
        // Add to sync queue
        syncStore.add({
          storeName: storeName,
          recordId: generatedId,
          payload: item,
          action: 'CREATE',
          timestamp: new Date().toISOString()
        });
        resolve(generatedId);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async getAll(storeName) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async getSyncQueueCount() {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('sync_queue', 'readonly');
      const store = tx.objectStore('sync_queue');
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async clearSyncQueue() {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('sync_queue', 'readwrite');
      const store = tx.objectStore('sync_queue');
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
    });
  }
}

// Global PWA Manager Application
class Obra360App {
  constructor() {
    this.storage = new Obra360OfflineStorage();
    this.deferredInstallPrompt = null;
    this.isOnline = navigator.onLine;
  }

  async init() {
    await this.storage.init();
    this.registerServiceWorker();
    this.setupNetworkListeners();
    this.setupNavigation();
    this.setupForms();
    this.setupPWAInstall();
    this.renderInitialData();
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then((reg) => console.log('[SW] Service Worker registrado no escopo:', reg.scope))
          .catch((err) => console.error('[SW] Erro ao registrar Service Worker:', err));
      });

      // Listen for background sync messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'PROCESS_SYNC_QUEUE') {
          this.syncOfflineDataWithBackend();
        }
      });
    }
  }

  setupNetworkListeners() {
    const banner = document.getElementById('offline-banner');
    const updateStatus = () => {
      this.isOnline = navigator.onLine;
      if (this.isOnline) {
        banner.className = 'online';
        banner.innerHTML = '<span>🟢 Conexão restabelecida! Sincronizando dados com o servidor...</span>';
        setTimeout(() => banner.className = 'hidden', 4000);
        this.syncOfflineDataWithBackend();
      } else {
        banner.className = '';
        banner.innerHTML = '<span>⚡ Modo Offline Ativo. As alterações serão salvas localmente e sincronizadas quando voltar a internet.</span>';
      }
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    if (!this.isOnline) updateStatus();
  }

  setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.page-section');

    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = item.getAttribute('data-section');
        
        navItems.forEach(nav => nav.classList.remove('active'));
        sections.forEach(sec => sec.classList.remove('active'));

        item.classList.add('active');
        const targetSection = document.getElementById(targetId);
        if (targetSection) targetSection.classList.add('active');
      });
    });

    // Theme toggle
    const themeBtn = document.getElementById('theme-toggle');
    themeBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      themeBtn.innerHTML = newTheme === 'dark' ? '🌙 Escuro' : '☀️ Claro';
    });
  }

  setupPWAInstall() {
    const installBtn = document.getElementById('install-pwa-btn');
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;
      installBtn.style.display = 'flex';
    });

    installBtn.addEventListener('click', async () => {
      if (this.deferredInstallPrompt) {
        this.deferredInstallPrompt.prompt();
        const choiceResult = await this.deferredInstallPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          console.log('[PWA] Usuário aceitou a instalação do Obra 360 PWA!');
        }
        this.deferredInstallPrompt = null;
        installBtn.style.display = 'none';
      }
    });
  }

  setupForms() {
    // Form Diário de Obra
    const diarioForm = document.getElementById('form-diario');
    if (diarioForm) {
      diarioForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const item = {
          etapa: document.getElementById('diario-etapa').value,
          percentual: document.getElementById('diario-percentual').value,
          clima: document.getElementById('diario-clima').value,
          observacoes: document.getElementById('diario-obs').value
        };
        await this.storage.saveItem('diario_obra', item);
        alert('✅ Registro do Diário de Obra salvo localmente! (Pronto para sincronização)');
        diarioForm.reset();
        this.renderDiarioList();
        this.updateSyncBadge();
      });
    }

    // Form Ordens de Serviço
    const osForm = document.getElementById('form-os');
    if (osForm) {
      osForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const item = {
          titulo: document.getElementById('os-titulo').value,
          equipe: document.getElementById('os-equipe').value,
          prioridade: document.getElementById('os-prioridade').value,
          status: 'EM_ANDAMENTO'
        };
        await this.storage.saveItem('ordens_servico', item);
        alert('✅ Ordem de Serviço cadastrada com sucesso!');
        osForm.reset();
        this.renderOSList();
        this.updateSyncBadge();
      });
    }

    // Form Conciliação NFe
    const nfeForm = document.getElementById('form-nfe');
    if (nfeForm) {
      nfeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const chave = document.getElementById('nfe-chave').value.trim();
        if (chave.length !== 44 || isNaN(chave)) {
          alert('❌ Erro: A Chave de Acesso da NF-e deve possuir exatamente 44 dígitos numéricos.');
          return;
        }
        alert(`✅ NF-e (${chave.substring(0,6)}...) concilidada com sucesso! Materiais inseridos no almoxarifado.`);
        nfeForm.reset();
      });
    }
  }

  async renderInitialData() {
    this.renderDiarioList();
    this.renderOSList();
    this.updateSyncBadge();
  }

  async renderDiarioList() {
    const listContainer = document.getElementById('diario-list');
    if (!listContainer) return;
    const items = await this.storage.getAll('diario_obra');
    if (items.length === 0) {
      listContainer.innerHTML = '<p style="color:var(--text-secondary);">Nenhum registro offline adicionado ainda.</p>';
      return;
    }
    listContainer.innerHTML = items.map(item => `
      <div class="card spell-card" style="margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <strong>Etapa: ${item.etapa}</strong>
          <span class="badge badge-success">${item.percentual}% Concluído</span>
        </div>
        <p class="card-desc"><strong>Clima:</strong> ${item.clima} | <strong>Data:</strong> ${new Date(item.createdAt).toLocaleString('pt-BR')}</p>
        <p class="card-desc" style="margin-top:4px;">${item.observacoes}</p>
      </div>
    `).join('');
  }

  async renderOSList() {
    const listContainer = document.getElementById('os-list');
    if (!listContainer) return;
    const items = await this.storage.getAll('ordens_servico');
    if (items.length === 0) {
      listContainer.innerHTML = '<p style="color:var(--text-secondary);">Nenhuma Ordem de Serviço offline adicionada ainda.</p>';
      return;
    }
    listContainer.innerHTML = items.map(item => `
      <div class="card spell-card" style="margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <strong>${item.titulo}</strong>
          <span class="badge badge-warning">${item.prioridade}</span>
        </div>
        <p class="card-desc"><strong>Equipe:</strong> ${item.equipe} | <strong>Status:</strong> ${item.status}</p>
      </div>
    `).join('');
  }

  async updateSyncBadge() {
    const count = await this.storage.getSyncQueueCount();
    const badge = document.getElementById('sync-count-badge');
    if (badge) badge.innerText = count.toString();
  }

  async syncOfflineDataWithBackend() {
    const count = await this.storage.getSyncQueueCount();
    if (count === 0) return;

    console.log(`[PWA Sync] Enviando ${count} registro(s) pendente(s) para a API REST...`);
    // Simulate API REST POST sync
    try {
      await new Promise(res => setTimeout(res, 1500));
      await this.storage.clearSyncQueue();
      this.updateSyncBadge();
      console.log('[PWA Sync] Todos os dados offline foram sincronizados com sucesso!');
    } catch (err) {
      console.error('[PWA Sync] Falha ao sincronizar com backend:', err);
    }
  }
}

// Initialize Application when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.obra360App = new Obra360App();
  window.obra360App.init();
});
