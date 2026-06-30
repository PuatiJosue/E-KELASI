"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";

export function PasswordInput({
  name = "password",
  placeholder = "••••••••",
}: {
  name?: string;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", display: "flex" }}>
        <Icon name="lock" size={17} />
      </span>
      <input
        name={name}
        type={show ? "text" : "password"}
        required
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "13px 42px 13px 42px",
          borderRadius: 12,
          border: "1px solid var(--border-strong)",
          background: "var(--surface)",
          fontSize: 14,
          color: "var(--ink)",
          outline: "none",
        }}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", color: "var(--ink-3)", cursor: "pointer", display: "flex", padding: 2 }}
      >
        <Icon name={show ? "eyeOff" : "eye"} size={17} />
      </button>
    </div>
  );
}
