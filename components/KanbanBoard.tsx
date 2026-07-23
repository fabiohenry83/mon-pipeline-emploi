"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import JobCard from "./JobCard";
import { supabase } from "@/lib/supabase";
import toast from 'react-hot-toast';
import Dashboard from "@/components/Dashboard";

const colonnes = [
  { id: 'a_postuler', titre: 'À postuler', style: 'bg-muted/40 border-border text-foreground' },
  { id: 'envoye', titre: 'Candidature envoyée', style: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400' },
  { id: 'entretien', titre: 'Entretien prévu', style: 'bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-400' },
  { id: 'refus_cv', titre: 'Refus (sur CV)', style: 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400' },
  { id: 'refus_entretien', titre: 'Refus (suite entretien)', style: 'bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-400' },
  { id: 'accepte', titre: 'Accepté !', style: 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400' },
];

// 🌟 NOUVEAU : On ajoute isPro et userEmail aux paramètres acceptés
export default function KanbanBoard({ 
  initialJobs, 
  isPro, 
  userEmail 
}: { 
  initialJobs: any[]; 
  isPro: boolean; 
  userEmail: string; 
}) {
  const [jobs, setJobs] = useState(initialJobs);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('realtime-jobs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs' }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setJobs((prevJobs) => [...prevJobs, payload.new]);
          } 
          else if (payload.eventType === 'DELETE') {
            setJobs((prevJobs) => prevJobs.filter(job => job.id !== payload.old.id));
          } 
          else if (payload.eventType === 'UPDATE') {
            setJobs((prevJobs) => prevJobs.map(job => job.id === payload.new.id ? payload.new : job));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;

    const updatedJobs = jobs.map((job) =>
      job.id.toString() === draggableId ? { ...job, status: newStatus } : job
    );
    setJobs(updatedJobs);

    const { error } = await supabase
      .from('jobs')
      .update({ status: newStatus })
      .eq('id', draggableId);

    if (error) {
      toast.error("Erreur lors de la sauvegarde du déplacement.");
      setJobs(initialJobs); 
    }
  };

  // 🌟 NOUVEAU : On compte combien de lettres ont déjà été générées
  const generatedLettersCount = jobs.filter((job) => job.cover_letter && job.cover_letter.trim() !== "").length;

  return (
    <>
      <Dashboard jobs={jobs} />

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
                    className={`flex-none w-80 rounded-xl p-4 border flex flex-col transition-colors ${colonne.style}`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="font-semibold">{colonne.titre}</h2>
                      <span className="text-muted-foreground text-sm font-medium bg-background/60 px-2 py-0.5 rounded-full shadow-sm">
                        {candidaturesDeLaColonne.length}
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col gap-3 min-h-[150px]">
                      {candidaturesDeLaColonne.map((candidature, index) => (
                        <Draggable key={candidature.id} draggableId={candidature.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{ ...provided.draggableProps.style }}
                              className={`focus:outline-none transition-shadow rounded-xl ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-primary/20 opacity-90' : ''}`}
                            >
                              {/* 🌟 NOUVEAU : On transmet les infos de limitation à la carte */}
                              <JobCard 
                                job={candidature} 
                                isPro={isPro} 
                                userEmail={userEmail} 
                                generatedLettersCount={generatedLettersCount} 
                              />
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
    </>
  );
}