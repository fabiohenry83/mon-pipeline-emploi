"use client"; 

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link'; 

import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// 🌟 NOUVEAU : On ajoute userEmail dans la liste des choses acceptées
interface AddJobModalProps {
  isPro: boolean;
  currentJobs: number;
  userEmail: string; 
}

// 🌟 NOUVEAU : On récupère userEmail ici
export default function AddJobModal({ isPro, currentJobs, userEmail }: AddJobModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [status, setStatus] = useState('a_postuler');
  const [jobDescription, setJobDescription] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();

  // DÉFINITION DE LA LIMITE (Toujours à 2 pour tes tests)
  const MAX_JOBS = 2; 
  const isBlocked = !isPro && currentJobs >= MAX_JOBS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsLoading(true);

    const { error } = await supabase
      .from('jobs')
      .insert([
        { 
          job_title: jobTitle, 
          company_name: companyName, 
          status: status,
          job_description: jobDescription
        }
      ]);

    if (!error) {
      setIsOpen(false);
      setJobTitle('');
      setCompanyName('');
      setStatus('a_postuler');
      setJobDescription('');
      toast.success("Candidature ajoutée avec succès !"); 
      router.refresh(); 
    } else {
      console.error(error);
      toast.error("Une erreur est survenue lors de l'enregistrement."); 
    }
    
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-sm font-medium">
          + Nouvelle candidature
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        
        {isBlocked ? (
          <div className="flex flex-col items-center py-4">
            <div className="text-4xl mb-4">🚀</div>
            <DialogTitle className="text-center text-xl mb-2">Passez à la vitesse supérieure</DialogTitle>
            <DialogDescription className="text-center mb-6">
              Vous avez atteint la limite de {MAX_JOBS} candidatures de votre plan gratuit.
            </DialogDescription>
            
            <div className="bg-muted p-4 rounded-lg w-full text-sm mb-6 shadow-inner">
              <ul className="space-y-2">
                <li>✅ Candidatures illimitées à vie</li>
                <li>✅ Lettres de motivation par l'IA illimitées</li>
                <li>✅ Paiement unique, pas d'abonnement</li>
              </ul>
            </div>
            
            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold" size="lg">
              {/* 🌟 NOUVEAU : On injecte l'email dans l'URL Stripe */}
              <Link href={`https://buy.stripe.com/00w7sN77Z3aP9nS33cbZe00?prefilled_email=${encodeURIComponent(userEmail)}`} target="_blank">
                Débloquer l'accès Pro - 29€
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Ajouter une candidature</DialogTitle>
              <DialogDescription>
                Remplissez les détails ci-dessous pour ajouter une nouvelle opportunité à votre pipeline.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="title">Poste visé</Label>
                <Input 
                  id="title"
                  type="text" 
                  required
                  placeholder="ex: Développeur React"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="company">Entreprise</Label>
                <Input 
                  id="company"
                  type="text" 
                  required
                  placeholder="ex: TechCorp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Description de l'offre (Optionnel)</Label>
                <p className="text-[10px] text-muted-foreground leading-tight mb-1">
                  Copiez-collez l'annonce ici. L'IA s'en servira pour générer une lettre de motivation sur mesure.
                </p>
                <textarea 
                  id="description"
                  placeholder="Missions, compétences requises..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="status">Dans quelle colonne ?</Label>
                <select 
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900"
                >
                  <option value="a_postuler">À postuler</option>
                  <option value="envoye">Candidature envoyée</option>
                  <option value="entretien">Entretien prévu</option>
                  <option value="refus_cv">Refus (sur CV)</option>
                  <option value="refus_entretien">Refus (suite entretien)</option>
                  <option value="accepte">Accepté !</option>
                </select>
              </div>

              <DialogFooter className="mt-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsOpen(false)}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Ajout...' : 'Enregistrer'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}