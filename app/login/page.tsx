"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from "@/components/ui/button"; // Le fameux bouton premium

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) {
      toast.error(error.message); 
    } else {
      toast.success(isLogin ? "Connexion réussie !" : "Compte créé avec succès !"); 
      router.push('/'); 
      router.refresh(); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-slate-200">
        <h1 className="text-2xl font-bold text-center mb-6 text-slate-800">
          {isLogin ? 'Connexion' : 'Créer un compte'}
        </h1>
        
        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-slate-300 p-2 rounded-md focus:ring-2 focus:ring-slate-900 outline-none"
            required
          />
          <input
            type="password"
            placeholder="Mot de passe (6 carac. min)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-slate-300 p-2 rounded-md focus:ring-2 focus:ring-slate-900 outline-none"
            required
          />
          
          {/* NOUVEAU BOUTON SHADCN */}
          <Button type="submit" className="w-full">
            {isLogin ? 'Se connecter' : "S'inscrire"}
          </Button>
        </form>

        {/* NOUVEAU BOUTON SHADCN (Variante "lien") */}
        <Button 
          variant="link" 
          onClick={() => setIsLogin(!isLogin)} 
          className="w-full mt-4 text-slate-600"
        >
          {isLogin ? "Pas de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
        </Button>
      </div>
    </div>
  );
}