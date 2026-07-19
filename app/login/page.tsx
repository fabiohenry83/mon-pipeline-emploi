"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast'; // <-- NOUVEL IMPORT

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    // On connecte ou on inscrit selon le mode choisi
    const { error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) {
      // Le toast remplace l'ancien texte rouge
      toast.error(error.message); 
    } else {
      // Toast de succès adapté à l'action
      toast.success(isLogin ? "Connexion réussie !" : "Compte créé avec succès !"); 
      router.push('/'); // On renvoie vers le tableau Kanban
      router.refresh(); // On actualise pour que Next.js lise les nouveaux cookies
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-slate-200">
        <h1 className="text-2xl font-bold text-center mb-6 text-slate-800">
          {isLogin ? 'Connexion' : 'Créer un compte'}
        </h1>
        
        {/* L'ancien bloc <p> d'erreur a été supprimé pour laisser faire le Toaster */}
        
        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-slate-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
          <input
            type="password"
            placeholder="Mot de passe (6 carac. min)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-slate-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
          <button type="submit" className="bg-blue-600 text-white font-medium p-2 rounded-md hover:bg-blue-700 transition">
            {isLogin ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>

        <button 
          onClick={() => setIsLogin(!isLogin)} 
          className="w-full mt-4 text-sm text-blue-600 hover:underline"
        >
          {isLogin ? "Pas de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
        </button>
      </div>
    </div>
  );
}