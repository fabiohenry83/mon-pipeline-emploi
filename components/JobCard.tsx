"use client";

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link'; // 🌟 Ajout de Link pour Stripe

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type JobCardProps = {
  job: {
    id: string | number;
    company_name: string;
    job_title: string;
    status: string;
    job_description?: string;
    cover_letter?: string;
  };
  // 🌟 NOUVELLES PROPS
  isPro: boolean;
  userEmail: string;
  generatedLettersCount: number;
};

export default function JobCard({ job, isPro, userEmail, generatedLettersCount }: JobCardProps) {
  const router = useRouter();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(job.job_title);
  const [editCompany, setEditCompany] = useState(job.company_name);
  const [editStatus, setEditStatus] = useState(job.status);
  const [isUpdating, setIsUpdating] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState(job.cover_letter || "");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 🌟 NOUVEAU : État pour la modale de blocage payant
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const MAX_LETTERS = 5;

  const handleDelete = async () => {
    const confirmDelete = window.confirm(`Es-tu sûr de vouloir supprimer la candidature pour ${job.company_name} ?`);
    if (!confirmDelete) return;

    setIsDeleting(true);
    const { error } = await supabase.from('jobs').delete().eq('id', job.id);

    if (!error) {
      toast.success("Candidature supprimée.");
      router.refresh();
    } else {
      console.error(error);
      toast.error("Erreur lors de la suppression.");
      setIsDeleting(false);
    }
  };

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
      .eq('id', job.id);

    if (!error) {
      setIsEditing(false);
      toast.success("Candidature modifiée !");
      router.refresh();
    } else {
      console.error(error);
      toast.error("Erreur lors de la modification.");
    }
    setIsUpdating(false);
  };

  const handleGenerateLetter = async () => {
    if (generatedLetter) {
      setIsModalOpen(true);
      return;
    }

    // 🌟 NOUVEAU : On bloque si limite atteinte et non-Pro
    if (!isPro && generatedLettersCount >= MAX_LETTERS) {
      setIsLimitModalOpen(true);
      return;
    }

    setIsGenerating(true);
    const loadingToast = toast.loading("L'IA rédige ta lettre...");

    try {
      const response = await fetch('/api/generate-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobTitle: job.job_title, 
          company: job.company_name,
          jobDescription: job.job_description
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur inconnue");
      }

      setGeneratedLetter(data.letter);
      
      const { error } = await supabase
        .from('jobs')
        .update({ cover_letter: data.letter })
        .eq('id', job.id);

      if (error) {
        console.error("Erreur de sauvegarde:", error);
        toast.error("La lettre est générée mais n'a pas pu être sauvegardée.", { id: loadingToast });
      } else {
        toast.success("Lettre générée et sauvegardée !", { id: loadingToast });
        router.refresh(); 
      }

      setIsModalOpen(true);

    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la génération.", { id: loadingToast });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLetter);
    toast.success("Lettre copiée dans le presse-papiers !");
  };

  if (isEditing) {
    return (
      <Card className="border-border shadow-sm">
        <CardContent className="p-4">
          <form onSubmit={handleUpdate} className="flex flex-col gap-3">
            <input 
              type="text" 
              value={editTitle} 
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full border border-border bg-background text-foreground rounded-md p-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              required
            />
            <input 
              type="text" 
              value={editCompany} 
              onChange={(e) => setEditCompany(e.target.value)}
              className="w-full border border-border bg-background text-foreground rounded-md p-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              required
            />
            <select 
              value={editStatus} 
              onChange={(e) => setEditStatus(e.target.value)}
              className="w-full border border-border bg-background text-foreground rounded-md p-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
            >
              <option value="a_postuler">À postuler</option>
              <option value="envoye">Candidature envoyée</option>
              <option value="entretien">Entretien prévu</option>
              <option value="refus_cv">Refus (sur CV)</option>
              <option value="refus_entretien">Refus (suite entretien)</option>
              <option value="accepte">Accepté !</option>
            </select>
            
            <div className="flex justify-end gap-2 mt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                Annuler
              </Button>
              <Button type="submit" size="sm" disabled={isUpdating}>
                {isUpdating ? '⏳...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="group hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing bg-card text-card-foreground border-border">
        <CardHeader className="p-4 flex flex-row items-start gap-2 space-y-0">
          
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <CardTitle className="text-base leading-tight break-words">
              {job.job_title}
            </CardTitle>
            <CardDescription className="break-words">
              {job.company_name}
            </CardDescription>
          </div>

          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1 shrink-0 -mt-1 -mr-1">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${generatedLetter ? 'text-purple-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30' : 'text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'}`}
              onClick={handleGenerateLetter}
              disabled={isGenerating}
              title={generatedLetter ? "Voir la lettre" : "Générer une lettre avec l'IA"}
            >
              {isGenerating ? '⏳' : (generatedLetter ? '📄' : '✨')}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setIsEditing(true)}
              title="Modifier"
            >
              ✏️
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Supprimer"
            >
              {isDeleting ? '⏳' : '🗑️'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* MODALE D'AFFICHAGE DE LA LETTRE */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto bg-background/100 text-foreground border-border shadow-2xl z-50">
          <DialogHeader>
            <DialogTitle>Lettre de motivation 🪄</DialogTitle>
            <DialogDescription>
              Pour le poste de {job.job_title} chez {job.company_name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 text-sm whitespace-pre-wrap bg-muted p-5 rounded-md border border-slate-300 dark:border-slate-700 shadow-inner">
            {generatedLetter}
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Fermer
            </Button>
            <Button onClick={handleCopy}>
              📋 Copier le texte
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 🌟 NOUVEAU : MODALE DE BLOCAGE (Paiement) */}
      <Dialog open={isLimitModalOpen} onOpenChange={setIsLimitModalOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-4">
            <div className="text-4xl mb-4">🚀</div>
            <DialogTitle className="text-center text-xl mb-2">Passez à la vitesse supérieure</DialogTitle>
            <DialogDescription className="text-center mb-6">
              Vous avez atteint la limite de {MAX_LETTERS} lettres de motivation générées avec l'IA du plan gratuit.
            </DialogDescription>
            
            <div className="bg-muted p-4 rounded-lg w-full text-sm mb-6 shadow-inner">
              <ul className="space-y-2">
                <li>✅ Candidatures illimitées à vie</li>
                <li>✅ Lettres de motivation par l'IA illimitées</li>
                <li>✅ Paiement unique, pas d'abonnement</li>
              </ul>
            </div>
            
            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold" size="lg">
              {/* 🛑 Remets bien TON lien Stripe avant le point d'interrogation */}
              <Link href={`https://buy.stripe.com/00w7sN77Z3aP9nS33cbZe00?prefilled_email=${encodeURIComponent(userEmail)}`} target="_blank">
                Débloquer l'accès Pro - 29€
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}