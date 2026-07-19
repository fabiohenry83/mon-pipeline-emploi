"use client"; // Indique à Next.js que ce composant interagit avec l'utilisateur (clics, saisie)

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AddJobModal() {
  // Gestion de l'affichage de la fenêtre (ouverte ou fermée)
  const [isOpen, setIsOpen] = useState(false);
  
  // Mémorisation de ce que l'utilisateur tape dans le formulaire
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [status, setStatus] = useState('a_postuler');
  
  // État de chargement pendant l'envoi à Supabase
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();

  // Fonction déclenchée quand on clique sur "Enregistrer"
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Empêche la page de recharger brutalement
    setIsLoading(true);

    // Envoi des données vers ta table 'jobs'
    const { error } = await supabase
      .from('jobs')
      .insert([
        { 
          job_title: jobTitle, 
          company_name: companyName, 
          status: status 
        }
      ]);

    if (!error) {
      // Succès : On ferme, on vide les cases, on affiche un toast et on demande à Next.js d'actualiser les données
      setIsOpen(false);
      setJobTitle('');
      setCompanyName('');
      setStatus('a_postuler');
      toast.success("Candidature ajoutée avec succès !"); // <-- NOUVEAU TOAST ICI
      router.refresh(); 
    } else {
      console.error(error);
      toast.error("Une erreur est survenue lors de l'enregistrement."); // <-- TOAST REMPLACE L'ALERT()
    }
    
    setIsLoading(false);
  };

  return (
    <>
      {/* Le bouton qui déclenche l'ouverture de la modale */}
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition font-medium shadow-sm"
      >
        + Nouvelle candidature
      </button>

      {/* La fenêtre modale (ne s'affiche que si isOpen est vrai) */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Ajouter une candidature</h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Poste visé</label>
                <input 
                  type="text" 
                  required
                  placeholder="ex: Développeur React"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Entreprise</label>
                <input 
                  type="text" 
                  required
                  placeholder="ex: TechCorp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dans quelle colonne ?</label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="a_postuler">À postuler</option>
                  <option value="envoye">Candidature envoyée</option>
                  <option value="entretien">Entretien prévu</option>
                  <option value="refus">Refus</option>
                  <option value="accepte">Accepté !</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
                >
                  {isLoading ? 'Ajout...' : 'Enregistrer'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}