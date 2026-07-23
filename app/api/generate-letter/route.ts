import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // On récupère la description en plus du reste
    const { jobTitle, company, jobDescription } = body;

    if (!jobTitle || !company) {
      return NextResponse.json({ error: "Le poste et l'entreprise sont requis" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    // Le prompt est maintenant ultra-personnalisé
    const prompt = `Tu es un expert en recrutement très persuasif. Rédige une lettre de motivation courte, moderne et percutante (environ 250 mots) pour le poste de "${jobTitle}" chez "${company}". 
    
    Voici la description de l'offre (si disponible) :
    "${jobDescription || "Aucune description fournie."}"

    Instructions strictes :
    1. Utilise la description de l'offre pour cibler exactement les compétences recherchées.
    2. La lettre doit éviter les clichés ennuyeux et être structurée en trois paragraphes : 
       - L'entreprise (Pourquoi eux et leurs enjeux)
       - Le candidat (Mes compétences en lien direct avec l'offre)
       - La projection (Ce que nous ferons ensemble).
    3. Ne mets pas d'en-tête (pas d'adresse ou d'objet), commence directement par "Madame, Monsieur,".`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ letter: text });

  } catch (error) {
    console.error("Erreur Gemini:", error);
    return NextResponse.json({ error: "Erreur lors de la génération de la lettre." }, { status: 500 });
  }
}