import React from 'react';
import { createClient } from '@/lib/supabase-server'; // On utilise notre nouveau pont serveur
import { redirect } from 'next/navigation';
import AddJobModal from '@/components/AddJobModal';
import KanbanBoard from '@/components/KanbanBoard';

export const revalidate = 0; 

export default async function Home() {
  const supabase = await createClient();

  // 1. On vérifie qui est connecté
  const { data, error: authError } = await supabase.auth.getUser();

  // 2. S'il n'y a personne (ou une erreur), on l'éjecte vers la page de login
  if (authError || !data?.user) {
    redirect('/login');
  }

  // 3. Grâce au RLS qu'on a fait à l'étape 1, cette ligne ne récupère QUE les candidatures de cet utilisateur !
  const { data: candidatures } = await supabase.from('jobs').select('*');

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Mon Pipeline Emploi</h1>
            {/* On affiche fièrement l'email de l'utilisateur connecté */}
            <p className="text-slate-500 mt-1">Connecté en tant que : {data.user.email}</p>
          </div>
          <div className="flex gap-4 items-center">
            <AddJobModal />
          </div>
        </header>

        <KanbanBoard initialJobs={candidatures || []} />

      </div>
    </main>
  );
}