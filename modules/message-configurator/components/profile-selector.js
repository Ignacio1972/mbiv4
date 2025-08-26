/**
* Profile Selector Component
* Selector y gestor de perfiles de voz
* @module ProfileSelector
*/

export class ProfileSelector {
   constructor() {
       this.profiles = this.loadProfiles() || [];
       this.activeProfileId = localStorage.getItem('tts_active_profile') || 'default';
       this.onChange = null;
       this.onSave = null;
       this.onDelete = null;
       
       // Estado del perfil actual
       this.isModified = false;
   }
   
   /**
    * Renderiza el componente
    * @param {HTMLElement} container - Contenedor donde renderizar
    * @param {Object} options - Opciones de configuración
    */
   static async render(container, options = {}) {
       const instance = new ProfileSelector();
       Object.assign(instance, options);
       
       container.innerHTML = instance.getHTML();
       instance.attachEvents(container);
       
       return instance;
   }
   
   /**
    * Genera el HTML del componente
    */
   getHTML() {
       const activeProfile = this.getActiveProfile();
       
       return `
           <div class="profile-selector">
               <div class="profile-selector__header">
                   <label class="form-label">
                       <span class="form-label__icon">👤</span>
                       Perfil de Configuración
                   </label>
                   <button class="btn btn-secondary btn--small" id="manageProfilesBtn">
                       <span>⚙️</span> Gestionar
                   </button>
               </div>
               
               <div class="profile-selector__main">
                   <select class="form-select profile-selector__select" id="profileSelect">
                       ${this.profiles.map(profile => `
                           <option value="${profile.id}" ${profile.id === this.activeProfileId ? 'selected' : ''}>
                               ${profile.isDefault ? '⭐ ' : ''}${profile.name}
                               ${profile.id === this.activeProfileId && this.isModified ? ' (modificado)' : ''}
                           </option>
                       `).join('')}
                   </select>
                   
                   <button class="btn btn-primary" id="saveProfileBtn" title="Guardar configuración actual como perfil">
                       <span>💾</span> Guardar
                   </button>
               </div>
               
               <div class="profile-selector__status" id="profileStatus">
                   ${this.isModified ? 
                       '<span class="status-modified">⚠️ Configuración modificada (sin guardar)</span>' : 
                       `<span class="status-ok">✅ Usando: ${activeProfile?.name || 'Configuración Base'}</span>`
                   }
               </div>
               
               <!-- Modal de gestión -->
               <div class="profile-manager-modal" id="profileManagerModal" style="display: none;">
                   <div class="profile-manager-modal__overlay"></div>
                   <div class="profile-manager-modal__content">
                       <div class="profile-manager-modal__header">
                           <h3>Gestión de Perfiles de Voz</h3>
                           <button class="btn-icon" id="closeManagerBtn">×</button>
                       </div>
                       
                       <div class="profile-manager-modal__body">
                           <div class="profile-list">
                               ${this.profiles.map(profile => `
                                   <div class="profile-item ${profile.id === this.activeProfileId ? 'profile-item--active' : ''}" 
                                        data-profile-id="${profile.id}">
                                       <div class="profile-item__info">
                                           <div class="profile-item__name">
                                               ${profile.isDefault ? '⭐ ' : ''}${profile.name}
                                           </div>
                                           <div class="profile-item__details">
                                               Voz: ${profile.settings?.voice || 'fernanda'} | 
                                               Velocidad: ${profile.settings?.speed || 'normal'} | 
                                               Style: ${Math.round(((profile.settings?.basic?.style || profile.settings?.style) || 0.5) * 100)}%
                                           </div>
                                       </div>
                                       <div class="profile-item__actions">
                                           ${!profile.locked ? `
                                               <button class="btn-icon profile-rename" data-profile-id="${profile.id}" title="Renombrar">
                                                   ✏️
                                               </button>
                                               <button class="btn-icon profile-duplicate" data-profile-id="${profile.id}" title="Duplicar">
                                                   📋
                                               </button>
                                               <button class="btn-icon btn-icon--danger profile-delete" data-profile-id="${profile.id}" title="Eliminar">
                                                   🗑️
                                               </button>
                                           ` : '<span class="text-muted">Bloqueado</span>'}
                                       </div>
                                   </div>
                               `).join('')}
                           </div>
                           
                           <div class="profile-manager-modal__footer">
                               <button class="btn btn-secondary" id="exportProfilesBtn">
                                   <span>📥</span> Exportar
                               </button>
                               <button class="btn btn-secondary" id="importProfilesBtn">
                                   <span>📤</span> Importar
                               </button>
                           </div>
                       </div>
                   </div>
               </div>
               
               <!-- Input oculto para importar -->
               <input type="file" id="profileImportInput" accept=".json" style="display: none;">
           </div>
       `;
   }
   
   /**
    * Adjunta event listeners
    */
   attachEvents(container) {
       // Cambiar perfil
       const select = container.querySelector('#profileSelect');
       select?.addEventListener('change', (e) => {
           this.setActiveProfile(e.target.value);
       });
       
       // Guardar perfil
       const saveBtn = container.querySelector('#saveProfileBtn');
       saveBtn?.addEventListener('click', () => {
           this.saveCurrentProfile();
       });
       
       // Abrir gestor
       const manageBtn = container.querySelector('#manageProfilesBtn');
       manageBtn?.addEventListener('click', () => {
           this.openManager(container);
       });
       
       // Cerrar gestor
       const closeBtn = container.querySelector('#closeManagerBtn');
       const overlay = container.querySelector('.profile-manager-modal__overlay');
       
       closeBtn?.addEventListener('click', () => this.closeManager(container));
       overlay?.addEventListener('click', () => this.closeManager(container));
       
       // Exportar/Importar
       const exportBtn = container.querySelector('#exportProfilesBtn');
       const importBtn = container.querySelector('#importProfilesBtn');
       const importInput = container.querySelector('#profileImportInput');
       
       exportBtn?.addEventListener('click', () => this.exportProfiles());
       importBtn?.addEventListener('click', () => importInput.click());
       importInput?.addEventListener('change', (e) => this.importProfiles(e.target.files[0], container));
       
       // Acciones en perfiles (usando clases en lugar de onclick)
       container.querySelectorAll('.profile-rename').forEach(btn => {
           btn.addEventListener('click', () => {
               this.renameProfile(btn.dataset.profileId, container);
           });
       });
       
       container.querySelectorAll('.profile-duplicate').forEach(btn => {
           btn.addEventListener('click', () => {
               this.duplicateProfile(btn.dataset.profileId, container);
           });
       });
       
       container.querySelectorAll('.profile-delete').forEach(btn => {
           btn.addEventListener('click', () => {
               this.deleteProfile(btn.dataset.profileId, container);
           });
       });
   }
   
   /**
    * Carga perfiles desde localStorage - CORREGIDO para manejar múltiples formatos
    */
   loadProfiles() {
       const saved = localStorage.getItem('tts_voice_profiles');
       if (saved) {
           try {
               const parsed = JSON.parse(saved);
               
               // Manejar formato v2.0 (objeto con profiles dentro)
               if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                   if (parsed.profiles && Array.isArray(parsed.profiles)) {
                       return parsed.profiles;
                   }
               }
               
               // Manejar formato antiguo (array directo)
               if (Array.isArray(parsed)) {
                   return parsed;
               }
               
           } catch (e) {
               console.error('[ProfileSelector] Error parsing profiles:', e);
           }
       }
       
       // Perfiles por defecto
       return [
           {
               id: 'default',
               name: 'Configuración Base',
               locked: true,
               isDefault: true,
               settings: {
                   voice: 'fernanda',
                   speed: 'normal',
                   style: 0.5,
                   stability: 0.75,
                   similarity_boost: 0.8,
                   use_speaker_boost: true
               }
           }
       ];
   }
   
   /**
    * Guarda perfiles en localStorage
    */
   saveProfiles() {
       localStorage.setItem('tts_voice_profiles', JSON.stringify(this.profiles));
   }
   
   /**
    * Obtiene el perfil activo - CORREGIDO con fallback seguro
    */
   getActiveProfile() {
       if (!Array.isArray(this.profiles) || this.profiles.length === 0) {
           return {
               id: 'default',
               name: 'Configuración Base',
               settings: {
                   voice: 'fernanda',
                   speed: 'normal',
                   style: 0.5,
                   stability: 0.75,
                   similarity_boost: 0.8
               }
           };
       }
       
       return this.profiles.find(p => p.id === this.activeProfileId) || this.profiles[0];
   }
   
   /**
    * Cambia el perfil activo
    */
   setActiveProfile(profileId) {
       const profile = this.profiles.find(p => p.id === profileId);
       if (!profile) return;
       
       this.activeProfileId = profileId;
       localStorage.setItem('tts_active_profile', profileId);
       
       // Disparar evento
       if (this.onChange) {
           this.onChange(profile);
       }
       
       // Actualizar UI
       this.updateStatus();
   }
   
   /**
    * Guarda configuración actual como perfil
    */
   async saveCurrentProfile() {
       const name = prompt('Nombre del perfil (3-30 caracteres):');
       if (!name || name.length < 3 || name.length > 30) return;
       
       // Obtener configuración actual desde el parent
       if (!this.onSave) return;
       
       const currentSettings = await this.onSave();
       
       // Crear nuevo perfil
       const newProfile = {
           id: 'profile_' + Date.now(),
           name: name,
           locked: false,
           isDefault: false,
           settings: currentSettings,
           createdAt: new Date().toISOString()
       };
       
       this.profiles.push(newProfile);
       this.saveProfiles();
       
       // Activar el nuevo perfil
       this.activeProfileId = newProfile.id;
       localStorage.setItem('tts_active_profile', newProfile.id);
       
       // Actualizar UI
       this.isModified = false;
       this.refresh();
       
       // Notificar
       this.showNotification(`Perfil "${name}" guardado exitosamente`);
   }
   
   /**
    * Renombra un perfil
    */
   renameProfile(profileId, container) {
       const profile = this.profiles.find(p => p.id === profileId);
       if (!profile || profile.locked) return;
       
       const newName = prompt('Nuevo nombre:', profile.name);
       if (!newName || newName === profile.name) return;
       
       profile.name = newName;
       this.saveProfiles();
       this.refresh();
       this.showNotification('Perfil renombrado');
   }
   
   /**
    * Duplica un perfil
    */
   duplicateProfile(profileId, container) {
       const profile = this.profiles.find(p => p.id === profileId);
       if (!profile) return;
       
       const newProfile = {
           ...JSON.parse(JSON.stringify(profile)), // Deep clone
           id: 'profile_' + Date.now(),
           name: profile.name + ' (copia)',
           locked: false,
           isDefault: false
       };
       
       this.profiles.push(newProfile);
       this.saveProfiles();
       this.refresh();
       this.showNotification('Perfil duplicado');
   }
   
   /**
    * Elimina un perfil
    */
   deleteProfile(profileId, container) {
       const profile = this.profiles.find(p => p.id === profileId);
       if (!profile || profile.locked) return;
       
       if (!confirm(`¿Eliminar el perfil "${profile.name}"?`)) return;
       
       this.profiles = this.profiles.filter(p => p.id !== profileId);
       this.saveProfiles();
       
       // Si era el activo, cambiar a default
       if (this.activeProfileId === profileId) {
           this.setActiveProfile('default');
       }
       
       this.refresh();
       this.showNotification('Perfil eliminado');
   }
   
   /**
    * Exporta perfiles
    */
   exportProfiles() {
       const data = {
           version: '1.0',
           exportDate: new Date().toISOString(),
           profiles: this.profiles.filter(p => !p.isDefault)
       };
       
       const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
       const url = URL.createObjectURL(blob);
       
       const a = document.createElement('a');
       a.href = url;
       a.download = `perfiles_voz_${new Date().toISOString().split('T')[0]}.json`;
       a.click();
       
       URL.revokeObjectURL(url);
       this.showNotification('Perfiles exportados');
   }
   
   /**
    * Importa perfiles
    */
   async importProfiles(file, container) {
       if (!file) return;
       
       try {
           const text = await file.text();
           const data = JSON.parse(text);
           
           if (!data.profiles || !Array.isArray(data.profiles)) {
               throw new Error('Formato inválido');
           }
           
           // Agregar perfiles importados
           let imported = 0;
           data.profiles.forEach(profile => {
               if (!this.profiles.find(p => p.id === profile.id)) {
                   this.profiles.push(profile);
                   imported++;
               }
           });
           
           this.saveProfiles();
           this.refresh();
           this.showNotification(`${imported} perfiles importados`);
           
       } catch (error) {
           alert('Error al importar: ' + error.message);
       }
   }
   
   /**
    * Abre el gestor de perfiles
    */
   openManager(container) {
       const modal = container.querySelector('#profileManagerModal');
       modal.style.display = 'block';
       
       requestAnimationFrame(() => {
           modal.classList.add('profile-manager-modal--open');
       });
   }
   
   /**
    * Cierra el gestor
    */
   closeManager(container) {
       const modal = container.querySelector('#profileManagerModal');
       modal.classList.remove('profile-manager-modal--open');
       
       setTimeout(() => {
           modal.style.display = 'none';
       }, 300);
   }
   
   /**
    * Actualiza el estado
    */
   updateStatus() {
       const status = document.getElementById('profileStatus');
       if (!status) return;
       
       const activeProfile = this.getActiveProfile();
       
       if (this.isModified) {
           status.innerHTML = '<span class="status-modified">⚠️ Configuración modificada (sin guardar)</span>';
       } else {
           status.innerHTML = `<span class="status-ok">✅ Usando: ${activeProfile.name}</span>`;
       }
   }
   
   /**
    * Marca como modificado
    */
   markAsModified() {
       this.isModified = true;
       this.updateStatus();
   }
   
   /**
    * Refresca el componente
    */
   refresh() {
       const container = document.querySelector('.profile-selector');
       if (container) {
           const parent = container.parentElement;
           parent.innerHTML = '';
           parent.innerHTML = this.getHTML();
           this.attachEvents(parent);
       }
   }
   
   /**
    * Muestra notificación
    */
   showNotification(message) {
       // Emitir evento para notificación global
       const event = new CustomEvent('profile:notification', {
           detail: { message },
           bubbles: true
       });
       document.dispatchEvent(event);
   }
}

// Export default para import dinámico
export default ProfileSelector;