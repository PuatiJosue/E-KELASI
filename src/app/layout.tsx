import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "E-KLASS — Suivi scolaire",
  description: "E-KLASS — la plateforme de suivi scolaire qui relie écoles, professeurs et parents.",
};

export const viewport: Viewport = {
  themeColor: "#1E2F6D",
};

// Applique les préférences d'apparence (thème, couleur, police, style de cartes)
// avant le premier rendu pour éviter tout clignotement. Préférences stockées
// dans localStorage (ek-appearance, ek-color, ek-font, ek-cardstyle).
const THEME_SCRIPT = `(function(){try{var d=document.documentElement;
var p=localStorage.getItem('ek-appearance')||'auto';
var dark=p==='dark'||(p==='auto'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
d.setAttribute('data-theme',dark?'dark':'light');
var f=localStorage.getItem('ek-font');if(f)d.setAttribute('data-font',f);
var cs=localStorage.getItem('ek-cardstyle');if(cs)d.setAttribute('data-card-style',cs);
var c=localStorage.getItem('ek-color');
if(c&&/^#?[0-9a-fA-F]{6}$/.test(c)){c=c.charAt(0)==='#'?c:'#'+c;
var h2r=function(x){return[parseInt(x.slice(1,3),16),parseInt(x.slice(3,5),16),parseInt(x.slice(5,7),16)];};
var p2=function(v){v=Math.round(v).toString(16);return v.length<2?'0'+v:v;};
var mix=function(a,b,t){var x=h2r(a),y=h2r(b);return'#'+p2(x[0]*(1-t)+y[0]*t)+p2(x[1]*(1-t)+y[1]*t)+p2(x[2]*(1-t)+y[2]*t);};
var rgb=h2r(c);
d.style.setProperty('--brand',c);
d.style.setProperty('--brand-soft','rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+',0.10)');
d.style.setProperty('--brand-600',mix(c,'#000000',0.25));
d.style.setProperty('--brand-700',mix(c,'#000000',0.45));
d.style.setProperty('--brand-100',mix(c,'#ffffff',0.75));
d.style.setProperty('--brand-50',mix(c,'#ffffff',0.92));}
}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-theme="light" data-card-style="default" data-font="bricolage">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
