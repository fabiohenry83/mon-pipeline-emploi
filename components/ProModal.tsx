"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ProModal({ userEmail }: { userEmail: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md cursor-pointer">
          ⭐ Passer en Pro
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center py-2">
          <div className="text-5xl mb-4">🚀</div>
          <DialogTitle className="text-center text-2xl mb-2 font-bold">
            Passez à la vitesse supérieure
          </DialogTitle>
          <DialogDescription className="text-center text-base mb-6">
            Débloquez tout le potentiel de votre Pipeline Emploi et trouvez le job de vos rêves plus rapidement.
          </DialogDescription>
          
          <div className="bg-muted/50 p-5 rounded-xl w-full text-sm mb-6 border border-border">
            <h3 className="font-semibold text-foreground mb-3 uppercase tracking-wider text-xs">Ce qui est inclus :</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <span className="text-green-500 text-lg">✅</span> 
                <span className="font-medium text-foreground">Candidatures illimitées à vie</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500 text-lg">✅</span> 
                <span className="font-medium text-foreground">Lettres de motivation IA 100% illimitées</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500 text-lg">✅</span> 
                <span className="font-medium text-foreground">Paiement unique, aucun abonnement caché</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500 text-lg">✅</span> 
                <span className="font-medium text-foreground">Toutes les futures mises à jour incluses</span>
              </li>
            </ul>
          </div>
          
          <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-6 shadow-lg transition-transform hover:scale-[1.02]" size="lg">
            {/* 🛑 N'oublie pas de remettre ton lien Stripe ici */}
            <Link href={`https://buy.stripe.com/test_5kQ00l64t7ln1hj3Wd8Zq00?prefilled_email=${encodeURIComponent(userEmail)}`} target="_blank">
              Débloquer l'accès Pro - 29€
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Paiement 100% sécurisé via Stripe
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}