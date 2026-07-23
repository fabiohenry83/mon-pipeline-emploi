import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// 1. Initialisation de Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-06-24.dahlia', // 🌟 Mise à jour avec la version exigée par TypeScript
});

// 2. Initialisation de Supabase en mode "Admin"
// On utilise la SERVICE_ROLE_KEY pour avoir les droits de modification directs
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  // 3. Vérification de sécurité : Est-ce que ça vient bien de Stripe ?
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error(`❌ Erreur de signature Webhook: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // 4. Si le paiement est validé !
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // On récupère l'email que le client a renseigné lors du paiement
    const customerEmail = session.customer_details?.email;

    if (customerEmail) {
      console.log(`💰 Paiement réussi pour : ${customerEmail}`);

      try {
        // A. On cherche l'utilisateur dans Supabase via son email
        const { data: usersData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (authError) throw authError;

        const user = usersData.users.find((u) => u.email === customerEmail);

        if (user) {
          // B. On met à jour son profil pour débloquer l'accès à vie (is_pro = true)
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ is_pro: true })
            .eq('id', user.id);

          if (updateError) {
            console.error('❌ Erreur lors de la mise à jour du profil:', updateError);
          } else {
            console.log(`✅ L'utilisateur ${customerEmail} est maintenant PRO !`);
          }
        } else {
          console.error(`⚠️ Utilisateur introuvable dans la base avec l'email: ${customerEmail}`);
        }
      } catch (err) {
        console.error('❌ Erreur serveur lors du traitement:', err);
      }
    }
  }

  // On répond à Stripe que le message a bien été reçu (code 200)
  return NextResponse.json({ received: true });
}