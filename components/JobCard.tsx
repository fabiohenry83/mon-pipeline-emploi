"use client";

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

type JobCardProps = {
  job: {
    id: string | number;
    company_name: string;
    job_title: string;
    status: string;
  }
};

export default function JobCard({ job }: JobCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 1. Nouveaux états pour gérer le mode "Édition"
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(job.job_title);
  const [editCompany, setEditCompany] = useState(job.company_name);
  const [editStatus, setEditStatus] = useState(job.status);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fonction de suppression
  const handleDelete = async () => {
    const confirmDelete = window.confirm(`Es-tu sûr de vouloir supprimer la candidature pour ${job.company_name} ?`);
    if (!confirmDelete) return;

    setIsDeleting(true);
    const { error } = await supabase.from('jobs').delete().eq('id', job.id);

    if (!error) {
      toast.success("Candidature supprimée."); // <-- NOUVEAU TOAST ICI
      router.refresh();
    } else {
      console.error(error);
      toast.error("Erreur lors de la suppression."); // <-- TOAST REMPLACE L'ALERT()
      setIsDeleting(false);
    }
  };

  // 2. Nouvelle fonction pour envoyer les modifications à Supabase
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    const { error } = await supabase
      .from('jobs')
      .update({
        job_title: editTitle,
        company_name: editCompany,
        status: editStatus
      })
      .eq('id', job.id); // On cible la bonne ligne

    if (!error) {
      setIsEditing(false); // On ferme le mode édition
      toast.success("Candidature modifiée !"); // <-- NOUVEAU TOAST ICI
      router.refresh();    // On actualise le tableau
    } else {
      console.error(error);
      toast.error("Erreur lors de la modification."); // <-- TOAST REMPLACE L'ALERT()
    }
    setIsUpdating(false);
  };

  // 3. VUE ÉDITION : Si on a cliqué sur le crayon, on affiche le formulaire
  if (isEditing) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md border border-blue-400">
        <form onSubmit={handleUpdate} className="flex flex-col gap-3">
          <input 
            type="text" 
            value={editTitle} 
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
          <input 
            type="text" 
            value={editCompany} 
            onChange={(e) => setEditCompany(e.target.value)}
            className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
          <select 
            value={editStatus} 
            onChange={(e) => setEditStatus(e.target.value)}
            className="w-full border border-slate-300 rounded-md p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="a_postuler">À postuler</option>
            <option value="envoye">Candidature envoyée</option>
            <option value="entretien">Entretien prévu</option>
            <option value="refus">Refus</option>
            <option value="accepte">Accepté !</option>
          </select>
          
          <div className="flex justify-end gap-2 mt-1">
            <button 
              type="button" 
              onClick={() => setIsEditing(false)}
              className="text-sm px-3 py-1 text-slate-500 hover:bg-slate-100 rounded-md transition"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={isUpdating}
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {isUpdating ? '⏳...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // 4. VUE NORMALE : La carte classique avec les deux icônes
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition group">
      <div className="flex justify-between items-start">
        
        <div>
          <h3 className="font-semibold text-slate-800">{job.job_title}</h3>
          <p className="text-sm text-slate-500">{job.company_name}</p>
        </div>

        {/* Le bloc avec les deux boutons (Crayon et Poubelle) */}
        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditing(true)}
            className="text-slate-400 hover:text-blue-500 ml-2 transition-colors"
            title="Modifier cette candidature"
          >
            ✏️
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-slate-400 hover:text-red-500 ml-2 transition-colors"
            title="Supprimer cette candidature"
          >
            {isDeleting ? '⏳' : '🗑️'}
          </button>
        </div>

      </div>
    </div>
  );
}