// Couche données — annonces plateforme (super-admin E-KLASS). Service role.

import { serviceClient } from "@/lib/supabase/service";
import { isLiveMode } from "@/lib/env";

export type PlatformAnnouncement = {
  id: string;
  title: string;
  body: string;
  audience: string;
  createdAt: string;
};

function map(d: any): PlatformAnnouncement {
  return { id: d.id, title: d.title, body: d.body, audience: d.audience, createdAt: d.created_at };
}

// Toutes les annonces (console super-admin).
export async function listPlatformAnnouncements(): Promise<PlatformAnnouncement[]> {
  if (!isLiveMode()) return [];
  try {
    const svc = serviceClient();
    const { data } = await svc
      .from("platform_announcements")
      .select("id, title, body, audience, created_at")
      .order("created_at", { ascending: false });
    return (data ?? []).map(map);
  } catch {
    return [];
  }
}

export type PlatformVideo = {
  id: string;
  title: string;
  url: string;
  subject: string | null;
  description: string | null;
  createdAt: string;
};

// Vidéos plateforme (console super-admin).
export async function listPlatformVideos(): Promise<PlatformVideo[]> {
  if (!isLiveMode()) return [];
  try {
    const svc = serviceClient();
    const { data } = await svc
      .from("platform_videos")
      .select("id, title, url, subject, description, created_at")
      .order("created_at", { ascending: false });
    return (data ?? []).map((v: any) => ({
      id: v.id,
      title: v.title,
      url: v.url,
      subject: v.subject ?? null,
      description: v.description ?? null,
      createdAt: v.created_at,
    }));
  } catch {
    return [];
  }
}

// Tous les parents de la plateforme (pour cibler une vidéo à des parents précis).
export type PlatformParent = { id: string; name: string; email: string };
export async function listAllParents(): Promise<PlatformParent[]> {
  if (!isLiveMode()) return [];
  try {
    const { data } = await serviceClient()
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "parent")
      .order("full_name");
    return (data ?? []).map((p: any) => ({ id: p.id, name: p.full_name || "Parent", email: p.email || "" }));
  } catch {
    return [];
  }
}

// Annonces destinées aux écoles (bannière console direction).
export async function getPlatformForSchools(): Promise<PlatformAnnouncement[]> {
  if (!isLiveMode()) return [];
  try {
    const svc = serviceClient();
    const { data } = await svc
      .from("platform_announcements")
      .select("id, title, body, audience, created_at")
      .in("audience", ["all", "schools"])
      .order("created_at", { ascending: false })
      .limit(3);
    return (data ?? []).map(map);
  } catch {
    return [];
  }
}
