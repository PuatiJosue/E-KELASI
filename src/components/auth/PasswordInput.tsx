"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Icon } from "@/components/Icon";

/**
 * Champ mot de passe avec icône cadenas + bascule afficher/masquer (œil).
 * Accepte n'importe quel attribut d'input (name, value, onChange, minLength…),
 * ce qui permet de l'utiliser aussi bien en contrôlé qu'en non-contrôlé.
 */
export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "style">) {
  const [show, setShow] = useState(false);
  const { placeholder = "••••••••", name = "password", required = true, ...rest } = props;
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#b0acc4", display: "flex", pointerEvents: "none" }}>
        <Icon name="lock" size={18} />
      </span>
      <input
        {...rest}
        name={name}
        required={required}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        className="ek-auth-input"
        style={{ paddingLeft: 46, paddingRight: 48 }}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", width: 34, height: 34, borderRadius: 9, border: "none", background: "transparent", color: "#aaa6c0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Icon name={show ? "eyeOff" : "eye"} size={18} />
      </button>
    </div>
  );
}
