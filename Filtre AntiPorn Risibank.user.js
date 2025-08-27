// ==UserScript==
// @name         Filtre AntiPorn Risibank
// @namespace    https://github.com/moyaona
// @version      1.0
// @description  Filtre les stickers indésirables par mots-clés.
// @author       moyaona
// @match        https://www.jeuxvideo.com/forums/*
// @match        https://risibank.fr/embed*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @icon         https://image.noelshack.com/fichiers/2025/35/3/1756253585-logo.png
// ==/UserScript==

(function() {
    'use strict';

    // Clé unique utilisée pour sauvegarder et récupérer les mots-clés dans le navigateur.
    const STORAGE_KEY = 'risibank_filter_keywords';


    // =================================================================================
    // === PARTIE 1 : S'EXÉCUTE SUR JEUXVIDEO.COM
    // === Rôle : Créer et gérer le menu de configuration.
    // =================================================================================
    if (window.location.hostname === 'www.jeuxvideo.com') {

        console.log('Filtre Risibank AntiPorn : activé');

        // --- 1. Définition des styles CSS pour le menu ---
        // Injecte le style nécessaire pour la fenêtre modale et l'icône du bouton.
        GM_addStyle(`
            #risifilter-menu-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 9999;
                display: none;
            }
            #risifilter-menu-modal {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #2f3136;
                color: #dcddde;
                border-radius: 8px;
                width: 90%;
                max-width: 400px;
                padding: 20px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.5);
            }
            #risifilter-menu-modal h3 {
                margin-top: 0;
                border-bottom: 1px solid #444;
                padding-bottom: 10px;
            }
            #risifilter-menu-modal .risifilter-input-group {
                display: flex;
                margin-bottom: 15px;
            }
            #risifilter-menu-modal input {
                flex-grow: 1;
                background: #40444b;
                border: 1px solid #222;
                color: white;
                padding: 8px;
                border-radius: 3px 0 0 3px;
            }
            #risifilter-menu-modal button {
                background: #5865f2;
                border: none;
                color: white;
                padding: 8px 12px;
                cursor: pointer;
                transition: background 0.2s;
            }
            #risifilter-menu-modal #risifilter-add-btn {
                border-radius: 0 3px 3px 0;
            }
            #risifilter-menu-modal #risifilter-save-btn {
                width: 100%;
                border-radius: 3px;
                margin-top: 10px;
            }
            #risifilter-menu-modal button:hover {
                background: #4752c4;
            }
            #risifilter-keywords-list {
                list-style: none;
                padding: 0;
                margin: 0;
                max-height: 150px;
                overflow-y: auto;
                background: #40444b;
                border-radius: 3px;
                padding: 5px;
            }
            #risifilter-keywords-list li {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px;
                border-bottom: 1px solid #33363b;
            }
            #risifilter-keywords-list li:last-child {
                border-bottom: none;
            }
            #risifilter-keywords-list .risifilter-remove-word {
                cursor: pointer;
                color: #f04747;
                font-weight: bold;
            }
            #risifilter-open-menu-btn svg {
                color: #8e9297;
                transition: color 0.2s;
            }
            #risifilter-open-menu-btn:hover svg {
                color: #FFA500;
            }
        `);

        // --- 2. Création du HTML de la fenêtre modale ---
        // Le menu est ajouté au corps de la page mais reste caché par défaut.
        const menuHtml = `
            <div id="risifilter-menu-overlay">
                <div id="risifilter-menu-modal">
                    <h3>Filtre de Mots-Clés Risibank</h3>
                    <div class="risifilter-input-group">
                        <input type="text" id="risifilter-keyword-input" placeholder="Ajouter un mot-clé...">
                        <button id="risifilter-add-btn">Ajouter</button>
                    </div>
                    <ul id="risifilter-keywords-list"></ul>
                    <button id="risifilter-save-btn">Sauvegarder et Fermer</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', menuHtml);

        // --- 3. Logique et gestion des événements du menu ---
        const overlay = document.getElementById('risifilter-menu-overlay');
        const keywordInput = document.getElementById('risifilter-keyword-input');
        const addBtn = document.getElementById('risifilter-add-btn');
        const saveBtn = document.getElementById('risifilter-save-btn');
        const keywordList = document.getElementById('risifilter-keywords-list');

        // Ouvre le menu et charge les mots-clés depuis le stockage.
        function openMenu() {
            keywordList.innerHTML = '';
            const savedKeywords = GM_getValue(STORAGE_KEY, []);
            savedKeywords.forEach(createKeywordLi);
            overlay.style.display = 'block';
        }

        // Ferme le menu.
        function closeMenu() {
            overlay.style.display = 'none';
        }

        // Crée et ajoute un élément `<li>` à la liste visuelle des mots-clés.
        function createKeywordLi(keyword) {
            const li = document.createElement('li');
            li.textContent = keyword;

            const removeSpan = document.createElement('span');
            removeSpan.className = 'risifilter-remove-word';
            removeSpan.textContent = '✕';
            removeSpan.onclick = () => li.remove();

            li.appendChild(removeSpan);
            keywordList.appendChild(li);
        }

        // Gère l'ajout d'un nouveau mot-clé depuis le champ de saisie.
        function addKeyword() {
            const keyword = keywordInput.value.trim();
            if (keyword) {
                createKeywordLi(keyword);
                keywordInput.value = '';
            }
        }

        // Sauvegarde la liste actuelle dans le stockage permanent et ferme le menu.
        function saveAndClose() {
            const keywordsToSave = Array.from(keywordList.querySelectorAll('li')).map(li => li.firstChild.textContent);
            GM_setValue(STORAGE_KEY, keywordsToSave);
            alert('Mots-clés sauvegardés !\n\nUn rechargement de la page peut être nécessaire.');
            closeMenu();
        }

        // Association des fonctions aux événements des boutons.
        addBtn.onclick = addKeyword;
        keywordInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                addKeyword();
            }
        };
        saveBtn.onclick = saveAndClose;
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                closeMenu();
            }
        };

        // --- 4. Insertion du bouton de configuration dans la barre d'outils de JVC ---
        // Utilise un MutationObserver pour attendre que la barre d'outils soit chargée.
        const observer = new MutationObserver(() => {
            const risibankOptionsBtn = document.querySelector('.risibank-open-options');

            // Si le bouton d'options de Risibank existe et que notre bouton n'est pas encore là...
            if (risibankOptionsBtn && !document.getElementById('risifilter-open-menu-btn')) {
                const settingsBtn = document.createElement('button');
                settingsBtn.id = 'risifilter-open-menu-btn';
                settingsBtn.type = 'button';
                settingsBtn.title = 'Configurer le filtre AntiPorn';
                settingsBtn.className = 'buttonsEditor__button';

                // Icône SVG personnalisée, plus grande et barrée.
                const iconSVG = `
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="4" cy="8" r="3.5" stroke="currentColor" stroke-width="1.2"/>
                        <circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="1.2"/>
                        <circle cx="4" cy="8" r="0.8" fill="currentColor"/>
                        <circle cx="12" cy="8" r="0.8" fill="currentColor"/>
                        <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                `;
                settingsBtn.innerHTML = iconSVG;
                settingsBtn.onclick = openMenu;

                // Insère notre bouton juste après celui des options de Risibank.
                risibankOptionsBtn.parentNode.appendChild(settingsBtn);

                // Le bouton est en place, l'observateur n'est plus nécessaire.
                observer.disconnect();
            }
        });

        // Lance l'observation sur l'ensemble de la page.
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }


    // =================================================================================
    // === PARTIE 2 : S'EXÉCUTE DANS L'IFRAME RISIBANK
    // === Rôle : Filtrer les stickers affichés.
    // =================================================================================
    if (window.location.hostname === 'risibank.fr' && window.location.pathname.startsWith('/embed')) {

        // Récupère les mots-clés sauvegardés par l'utilisateur.
        const BLACKLISTED_KEYWORDS = GM_getValue(STORAGE_KEY, []);

        // Si la liste est vide, le script n'a rien à faire.
        if (BLACKLISTED_KEYWORDS.length === 0) {
            return;
        }

        // Met les mots-clés en minuscules une seule fois pour optimiser les comparaisons.
        const lowerCaseKeywords = BLACKLISTED_KEYWORDS.map(k => k.toLowerCase());
        let debounceTimeout;

        // Fonction principale qui scanne et masque les stickers.
        function scanAndProcessStickers() {
            const blockSummary = {}; // Pour le résumé en console.
            const images = document.querySelectorAll('.media-previews img');

            images.forEach(img => {
                // Ignore les images déjà traitées.
                if (img.dataset.filterState) {
                    return;
                }
                img.dataset.filterState = 'checked';

                const altText = img.alt.toLowerCase();
                const foundKeyword = lowerCaseKeywords.find(keyword => altText.includes(keyword));

                if (foundKeyword) {
                    // Incrémente le compteur pour le résumé.
                    blockSummary[foundKeyword] = (blockSummary[foundKeyword] || 0) + 1;

                    // Masque le conteneur parent du sticker.
                    const stickerContainer = img.closest('.shaking-element');
                    if (stickerContainer) {
                        stickerContainer.style.display = 'none';
                    }
                }
            });

            // Affiche le résumé dans la console si des stickers ont été filtrés.
            if (Object.keys(blockSummary).length > 0) {
                console.log('%c[Filtre Risibank] Résumé du filtrage :', 'color: orange; font-weight: bold;');
                for (const keyword in blockSummary) {
                    console.log(`- Mot-clé "${keyword}" : ${blockSummary[keyword]} sticker(s) masqué(s).`);
                }
            }
        }

        // Utilise un MutationObserver avec une temporisation (debounce) pour ne pas
        // surcharger le navigateur lors des changements d'onglets.
        const observer = new MutationObserver(() => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(scanAndProcessStickers, 200);
        });

        // Lance l'observation sur le corps de l'iframe.
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Effectue un premier scan au chargement initial.
        setTimeout(scanAndProcessStickers, 200);
    }

})();