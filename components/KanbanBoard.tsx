"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import JobCard from "./JobCard";
import { supabase } from "@/lib/supabase";
import toast from 'react-hot-toast';

// On définit les colonnes ici maintenant
const colonnes = [
  { id: 'a_postuler', titre: 'À postuler', couleur: 'bg-slate-100' },
  { id: 'envoye', titre: 'Candidature envoyée', couleur: 'bg-blue-50' },
  { id: 'entretien', titre: 'Entretien prévu', couleur: 'bg-purple-50' },
  { id: 'refus', titre: 'Refus', couleur: 'bg-red-50' },
  { id: 'accepte', titre: 'Accepté !', couleur: 'bg-green-50' },
];

export default function KanbanBoard({ initialJobs }: { initialJobs: any[] }) {
  // 1. État local pour gérer les cartes en temps réel
  const [jobs, setJobs] = useState(initialJobs);
  const [isMounted, setIsMounted] = useState(false);

  // Synchronisation si on ajoute/supprime une carte via les autres boutons
  useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  // Évite un bug visuel de Next.js au chargement
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ---------------------------------------------------------
  // Écoute en temps réel des ajouts via l'extension
  // ---------------------------------------------------------
  useEffect(() => {
    const channel = supabase
      .channel('realtime-jobs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'jobs' },
        (payload) => {
          const newJob = payload.new;
          console.log("Nouvelle offre ajoutée via l'extension !", newJob);
          
          // On ajoute la nouvelle carte à la liste existante
          setJobs((prevJobs) => [...prevJobs, newJob]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  // ---------------------------------------------------------

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        {/* Un joli cercle de chargement qui tourne */}
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // 2. La fonction magique qui se déclenche quand on lâche une carte
  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    // Si lâchée en dehors du tableau, on annule
    if (!destination) return;

    // Si lâchée au même endroit, on annule
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const newStatus = destination.droppableId;

    // Mise à jour visuelle immédiate (Optimistic UI) pour une fluidité parfaite
    const updatedJobs = jobs.map((job) =>
      job.id.toString() === draggableId ? { ...job, status: newStatus } : job
    );
    setJobs(updatedJobs);

    // Envoi de la mise à jour à Supabase en arrière-plan
    const { error } = await supabase
      .from('jobs')
      .update({ status: newStatus })
      .eq('id', draggableId);

    if (error) {
      // J'AI EFFACÉ LE console.error(error) ICI POUR NE PLUS AFFICHER LE GROS PANNEAU NOIR DE NEXT.JS
      
      // NOUVEAU : Toast d'erreur à la place du alert()
      toast.error("Erreur lors de la sauvegarde du déplacement.");
      setJobs(initialJobs); // On annule visuellement en cas d'erreur
    } else {
      // NOUVEAU : Optionnel, un petit message de succès
      // toast.success("Statut mis à jour !"); 
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-4">
        {colonnes.map((colonne) => {
          const candidaturesDeLaColonne = jobs.filter((job) => job.status === colonne.id);

          return (
            <Droppable key={colonne.id} droppableId={colonne.id}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-none w-80 rounded-xl p-4 ${colonne.couleur} border border-slate-200/60 flex flex-col`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-slate-700">{colonne.titre}</h2>
                    <span className="text-slate-400 text-sm font-medium bg-white/50 px-2 py-0.5 rounded-full">
                      {candidaturesDeLaColonne.length}
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col gap-3 min-h-[150px]">
                    {candidaturesDeLaColonne.map((candidature, index) => (
                      <Draggable key={candidature.id} draggableId={candidature.id.toString()} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            // Un petit effet d'ombre quand on attrape la carte
                            style={{ ...provided.draggableProps.style }}
                            className="focus:outline-none"
                          >
                            <JobCard job={candidature} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}