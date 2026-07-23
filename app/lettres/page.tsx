import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const revalidate = 0;

export default async function LettresPage() {
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getUser();

  if (authError || !data?.user) {
    redirect('/login');
  }

  const { data: jobsAvecLettre } = await supabase
    .from('jobs')
    .select('*')
    .not('cover_letter', 'is', null)
    .order('added_at', { ascending: false });

  return (
    <main className="min-h-screen bg-background p-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mes Lettres de Motivation</h1>
            <p className="text-muted-foreground mt-1">Retrouve toutes les lettres générées par l'IA ici.</p>
          </div>
          {/* Correction du bouton avec asChild pour Next.js */}
          <Button asChild variant="outline">
            <Link href="/">Retour au Kanban</Link>
          </Button>
        </header>

        {(!jobsAvecLettre || jobsAvecLettre.length === 0) ? (
          <div className="text-center p-12 border border-dashed border-border rounded-xl">
            <p className="text-muted-foreground mb-4">Tu n'as encore généré aucune lettre de motivation.</p>
            {/* Correction du bouton avec asChild pour Next.js */}
            <Button asChild>
              <Link href="/">Aller sur mon Pipeline</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {jobsAvecLettre.map((job) => (
              <Card key={job.id} className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>{job.job_title}</CardTitle>
                  <CardDescription>{job.company_name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-md text-sm whitespace-pre-wrap border border-border h-48 overflow-y-auto mb-4 shadow-inner">
                    {job.cover_letter}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}