// Page de retour après annulation d'un paiement Stripe (navigateur mobile).
export default function LibraryCanceled() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FDF6EE", fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 420, textAlign: "center", background: "white", borderRadius: 16, padding: 36, boxShadow: "0 10px 40px rgba(20,10,6,0.08)" }}>
        <div style={{ fontSize: 48 }}>🛒</div>
        <h1 style={{ fontSize: 22, margin: "16px 0 8px", color: "#1A1410" }}>Paiement annulé</h1>
        <p style={{ fontSize: 15, color: "#6B5E50", lineHeight: 1.5 }}>
          Aucun montant n'a été débité. Vous pouvez retourner dans l'application
          E-KELASI et réessayer quand vous voulez.
        </p>
      </div>
    </div>
  );
}
