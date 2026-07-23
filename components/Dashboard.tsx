"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// 🌟 Composant personnalisé pour corriger le mode sombre au survol du graphique
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-lg">
        {/* Le titre (ex: "À postuler") */}
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {/* Le texte du total */}
        <p className="text-sm text-muted-foreground">
          Total : <span className="font-bold text-foreground ml-1">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard({ jobs }: { jobs: any[] }) {
  // 1. Transformer les statuts
  const formatStatus = (status: string) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("postuler")) return "À postuler";
    if (s.includes("envoy")) return "Candidature envoyée";
    if (s.includes("entretien") && !s.includes("refus")) return "Entretien prévu";
    if (s.includes("refus_cv") || s === "refus (sur cv)") return "Refus (sur CV)";
    if (s.includes("refus_entretien") || s.includes("suite entretien")) return "Refus (après entretien)";
    if (s.includes("accept")) return "Accepté !";
    return status;
  };

 // 2. Les bons calculs
  // "Total envoyé" = toutes les cartes SAUF "À postuler"
  const totalEnvoye = jobs.filter((job) => formatStatus(job.status) !== "À postuler").length;
  
  // "Entretiens décrochés" = Entretien prévu + Accepté + Refus (après entretien)
  const entretiens = jobs.filter((job) => {
    const status = formatStatus(job.status);
    return status === "Entretien prévu" || status === "Accepté !" || status === "Refus (après entretien)";
  }).length;
  
  // "Taux d'entretiens"
  const tauxEntretien = totalEnvoye > 0 
    ? Math.round((entretiens / totalEnvoye) * 100) 
    : 0;

  // 3. Préparation des données pour le graphique
  const statsParStatut = jobs.reduce((acc, job) => {
    const statusClean = formatStatus(job.status || "Autre");
    if (!acc[statusClean]) acc[statusClean] = 0;
    acc[statusClean]++;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.keys(statsParStatut).map((key) => ({
    name: key,
    total: statsParStatut[key],
  }));

  return (
    <div className="flex flex-col gap-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total envoyé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalEnvoye}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Entretiens décrochés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{entretiens}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taux d'entretiens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{tauxEntretien}%</div>
          </CardContent>
        </Card>
      </div>

      <Card className="h-72">
        <CardHeader>
          <CardTitle className="text-base">Répartition des candidatures</CardTitle>
        </CardHeader>
        <CardContent className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              {/* Utilisation de notre infobulle personnalisée compatible mode sombre */}
              <Tooltip 
  cursor={{ fill: 'rgba(150, 150, 150, 0.1)' }}
  content={<CustomTooltip />}
/>
              <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}