import React from 'react';
import { createClient } from '@/lib/supabase-server'; 
import { redirect } from 'next/navigation';
import AddJobModal from '@/components/AddJobModal';
import KanbanBoard from '@/components/KanbanBoard';
import { ModeToggle } from '@/components/ModeToggle';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import ProModal from '@/components/ProModal';

export const revalidate = 0; 

export default async function Home() {
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getUser();

  if (authError || !data?.user) {
    redirect('/login');
  }

  // 1. Récupérer les candidatures
  const { data: candidatures } = await supabase.from('jobs').select('*');
  
  // Calcul des limites
  const currentJobs = candidatures?.length || 0;
  // 🌟 N'oublie pas de remettre 30 si tu avais laissé 2 pour tes tests !
  const MAX_JOBS = 30;

  // 2. Récupérer le profil pour savoir s'il a payé
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro')
    .eq('id', data.user.id)
    .single();
  
  const isPro = profile?.is_pro || false;
  
  // Calcul de la taille de la barre (bloquée à 100% max)
  const progressPercentage = Math.min((currentJobs / MAX_JOBS) * 100, 100);

  return (
    <main className="min-h-screen bg-background p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mon Pipeline Emploi</h1>
            <p className="text-muted-foreground mt-1">Connecté en tant que : {data.user.email}</p>
            
            {/* AFFICHAGE DE LA JAUGE (Si mode gratuit) */}
            {!isPro && (
              <div className="mt-4 flex flex-col gap-1 w-64">
                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                  <span>Candidatures (Gratuit)</span>
                  <span>{currentJobs} / {MAX_JOBS}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${currentJobs >= MAX_JOBS ? 'bg-destructive' : 'bg-primary'}`} 
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* BADGE PRO (Si a payé) */}
            {isPro && (
              <div className="mt-4 inline-block bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
                🚀 Plan Pro (Illimité)
              </div>
            )}
            
          </div>
          
          <div className="flex gap-4 items-center">
            
            {/* 🌟 BOUTON PRO AVEC MODALE DE VENTE */}
            {!isPro && (
              <ProModal userEmail={data.user.email || ''} />
            )}

            <Button asChild variant="outline" className="shadow-sm">
              <Link href="/lettres">📄 Mes Lettres</Link>
            </Button>
            
            <ModeToggle />
            
            <AddJobModal isPro={isPro} currentJobs={currentJobs} userEmail={data.user.email || ''} />
            
          </div>
        </header>

<KanbanBoard initialJobs={candidatures || []} isPro={isPro} userEmail={data.user.email || ''} />
      </div>
    </main>
  );
}