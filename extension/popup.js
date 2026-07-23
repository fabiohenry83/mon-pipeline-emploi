// ⚠️ REMPLACE PAR TES VRAIES CLÉS
const SUPABASE_URL = 'https://laogzhyepjvsbtwqhiia.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zrfauV0uzYGECjdsvRK8dA_PDpLJJI_';

document.addEventListener('DOMContentLoaded', () => {
  const authSection = document.getElementById('auth-section');
  const appSection = document.getElementById('app-section');
  
  // 1. Vérification si l'utilisateur est déjà connecté (Token stocké)
  chrome.storage.local.get(['supabase_token'], (result) => {
    if (!result.supabase_token) {
      authSection.classList.remove('hidden');
    } else {
      appSection.classList.remove('hidden');
      startScraping();
    }
  });

  // 2. Bouton de Connexion
  document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = document.getElementById('login-btn');
    
    btn.innerText = "Connexion en cours...";

    try {
      // On demande directement à l'API Supabase de nous connecter
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error_description || 'Erreur de connexion');

      // Succès ! On sauvegarde la "clé d'accès" dans le navigateur
      chrome.storage.local.set({ supabase_token: data.access_token }, () => {
        authSection.classList.add('hidden');
        appSection.classList.remove('hidden');
        startScraping();
      });
    } catch (error) {
      document.getElementById('auth-error').innerText = error.message;
      btn.innerText = "Se connecter";
    }
  });

  // 3. Bouton de Sauvegarde de l'offre
  document.getElementById('save-btn').addEventListener('click', () => {
    chrome.storage.local.get(['supabase_token'], async (result) => {
      const token = result.supabase_token;
      const title = document.getElementById('job-title').value;
      const company = document.getElementById('job-company').value;
      const saveBtn = document.getElementById('save-btn');

      saveBtn.innerText = 'Sauvegarde...';
      saveBtn.disabled = true;

      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/jobs`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal' // Bonne pratique recommandée par Supabase
          },
          body: JSON.stringify({ job_title: title, company_name: company, status: 'a_postuler' })
        });

        // Si Supabase renvoie une erreur, on lit le message exact
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || errData.hint || 'Erreur de base de données');
        }

        saveBtn.classList.add('hidden');
        document.getElementById('success-msg').classList.remove('hidden');
        setTimeout(() => window.close(), 1500);

      } catch (error) {
        // Si l'erreur est liée à l'expiration de la session
        if (error.message.includes("JWT expired")) {
          alert("Ta session a expiré. Redémarrage de l'extension pour reconnexion...");
          // On supprime le vieux badge périmé
          chrome.storage.local.remove('supabase_token', () => {
            // On rafraîchit la fenêtre pour réafficher le formulaire de connexion
            window.location.reload(); 
          });
        } else {
          // Pour toutes les autres erreurs
          alert("Erreur Supabase : " + error.message);
          saveBtn.innerText = "Sauvegarder l'offre";
          saveBtn.disabled = false;
        }
      }
    });
  });
});

// ---------------------------------------------------------
// FONCTIONS DE LECTURE DE LA PAGE
// ---------------------------------------------------------
async function startScraping() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: scrapeJobData,
  }, (results) => {
    if (results && results[0] && results[0].result) {
      const data = results[0].result;
      document.getElementById('job-info').innerHTML = `
        <div style="margin-bottom: 12px;">
          <label>Poste</label>
          <input type="text" id="job-title" value="${data.title}" />
        </div>
        <div>
          <label>Entreprise</label>
          <input type="text" id="job-company" value="${data.company}" />
        </div>
      `;
    }
  });
}

function scrapeJobData() {
  let rawTitle = document.querySelector('h1')?.innerText || document.title;
  let title = rawTitle.split('|')[0].trim();
  let company = "Entreprise à préciser";

  if (window.location.hostname.includes('linkedin.com')) {
    // 1. On essaie plusieurs classes CSS connues de LinkedIn
    const companyEl = document.querySelector(
      '.job-details-jobs-unified-top-card__company-name a, ' +
      '.job-details-jobs-unified-top-card__company-name, ' +
      '.artdeco-entity-lockup__subtitle, ' +
      '.topcard__org-name-link, ' +
      '.top-card-layout__first-subline'
    );

    if (companyEl) {
      // On récupère le texte et on le nettoie (LinkedIn met parfois des sauts de ligne invisibles)
      company = companyEl.innerText.split('\n')[0].trim();
    } else {
      // 2. Plan B : Si on ne trouve pas l'élément, on extrait depuis le titre de l'onglet
      // Sur LinkedIn, le titre est souvent sous la forme "Poste - Entreprise | LinkedIn"
      const titleParts = document.title.split('-');
      if (titleParts.length > 1) {
        company = titleParts[1].split('|')[0].trim();
      }
    }
    
    // On nettoie aussi le titre du poste (ex: on enlève le "- Entreprise" du titre de l'onglet)
    title = title.split('-')[0].trim();
  }

  return { title, company };
}