// Page de retour après un paiement Stripe réussi (ouverte dans le navigateur du
// mobile). L'accès au livre est débloqué par le webhook ; le parent revient
// dans l'app où le livre devient lisible.
export default function LibrarySuccess() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FDF6EE", fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 420, textAlign: "center", background: "white", borderRadius: 16, padding: 36, boxShadow: "0 10px 40px rgba(20,10,6,0.08)" }}>
        <div style={{ fontSize: 48 }}>📖</div>
        <h1 style={{ fontSize: 22, margin: "16px 0 8px", color: "#1A1410" }}>Paiement réussi !</h1>
        <p style={{ fontSize: 15, color: "#6B5E50", lineHeight: 1.5 }}>
          {"Votre livre est maintenant disponible. Revenez dans l'application E-KELASI, onglet "}
          <strong>Bibliothèque</strong>
          {" pour le lire ou le télécharger."}
        </p>
      </div>
    </div>
  );
}
