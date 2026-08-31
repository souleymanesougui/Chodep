-- ============================================================
-- CHODEP — Schéma Supabase (remplace Firestore)
-- À exécuter dans Dashboard Supabase → SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- FORMATIONS ----------
create table if not exists formations (
  id uuid primary key default gen_random_uuid(),
  titre text not null default '',
  titre_en text default '',
  description text default '',
  description_en text default '',
  objectifs text default '',
  programme text default '',
  formateur text default '',
  prix numeric,
  date date,
  duree text default '',
  lieu text default '',
  places integer not null default 0,
  inscrits integer not null default 0,
  statut text not null default 'ouvert', -- ouvert | complet | bientot
  publie boolean not null default true,
  image text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- EVENEMENTS ----------
create table if not exists evenements (
  id uuid primary key default gen_random_uuid(),
  titre text not null default '',
  description text default '',
  date date,
  heure text default '',
  lieu text default '',
  organisateur text default 'CHODEP',
  participants integer default 0,
  publie boolean not null default true,
  image text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- ARTICLES (actualités) ----------
create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  titre text not null default '',
  contenu text default '',
  categorie text default 'formation',
  auteur text default 'Équipe CHODEP',
  date date,
  publie boolean not null default true,
  image text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- EQUIPE ----------
create table if not exists equipe (
  id uuid primary key default gen_random_uuid(),
  nom text not null default '',
  fonction text default '',
  presentation text default '',
  ordre integer default 0,
  publie boolean not null default true,
  image text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- PARTENAIRES ----------
create table if not exists partenaires (
  id uuid primary key default gen_random_uuid(),
  nom text not null default '',
  description text default '',
  lien text default '',
  publie boolean not null default true,
  image text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- GALERIE ----------
create table if not exists galerie (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  storage_path text default '',
  categorie text default '',
  album text default '',
  created_at timestamptz not null default now()
);

-- ---------- MESSAGES (formulaire de contact) ----------
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  nom text default '',
  email text default '',
  telephone text default '',
  sujet text default '',
  message text default '',
  statut text not null default 'non-lu', -- non-lu | lu | traite
  date_envoi timestamptz not null default now()
);

-- ---------- INSCRIPTIONS ----------
create table if not exists inscriptions (
  id uuid primary key default gen_random_uuid(),
  nom text default '',
  prenom text default '',
  telephone text default '',
  email text default '',
  sexe text default '',
  ville text default '',
  message text default '',
  formation_id uuid references formations(id) on delete cascade,
  formation_titre text default '',
  statut text not null default 'nouvelle', -- nouvelle | confirmee | refusee | terminee
  date_inscription timestamptz not null default now(),
  -- anti-doublon : un seul email par formation
  unique (formation_id, email)
);

-- ---------- PARAMETRES (document unique "site") ----------
create table if not exists parametres (
  id text primary key default 'site',
  s_nom text default '',
  s_description text default '',
  s_telephone text default '',
  s_whatsapp text default '',
  s_email text default '',
  s_adresse text default '',
  s_horaires text default '',
  s_facebook text default '',
  s_whatsapp_lien text default '',
  s_instagram text default '',
  s_tiktok text default '',
  s_linkedin text default '',
  s_youtube text default '',
  stat_participants text default '',
  stat_formations text default '',
  stat_evenements text default '',
  stat_annees text default '',
  logo text default '',
  updated_at timestamptz not null default now()
);
insert into parametres (id) values ('site') on conflict (id) do nothing;

-- ---------- STATISTIQUES (compteur de visites, document unique "visites") ----------
create table if not exists statistiques (
  id text primary key default 'visites',
  total integer not null default 0,
  pages jsonb not null default '{}'::jsonb,
  derniere_visite timestamptz
);
insert into statistiques (id) values ('visites') on conflict (id) do nothing;

-- ============================================================
-- ROW LEVEL SECURITY
-- Public (rôle "anon") : lecture seule des éléments publiés.
-- Admin (utilisateur connecté via Supabase Auth, rôle "authenticated") :
-- accès complet en lecture/écriture sur tout, comme c'était le cas côté
-- Firebase (n'importe quel compte admin créé dans Auth = administrateur).
-- ============================================================

alter table formations enable row level security;
alter table evenements enable row level security;
alter table articles enable row level security;
alter table equipe enable row level security;
alter table partenaires enable row level security;
alter table galerie enable row level security;
alter table messages enable row level security;
alter table inscriptions enable row level security;
alter table parametres enable row level security;
alter table statistiques enable row level security;

-- Lecture publique des éléments publiés
create policy "public_read_formations" on formations for select using (publie = true or auth.role() = 'authenticated');
create policy "public_read_evenements" on evenements for select using (publie = true or auth.role() = 'authenticated');
create policy "public_read_articles" on articles for select using (publie = true or auth.role() = 'authenticated');
create policy "public_read_equipe" on equipe for select using (publie = true or auth.role() = 'authenticated');
create policy "public_read_partenaires" on partenaires for select using (publie = true or auth.role() = 'authenticated');
create policy "public_read_galerie" on galerie for select using (true);
create policy "public_read_parametres" on parametres for select using (true);

-- Écriture réservée aux admins connectés
create policy "admin_write_formations" on formations for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_write_evenements" on evenements for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_write_articles" on articles for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_write_equipe" on equipe for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_write_partenaires" on partenaires for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_write_galerie" on galerie for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_write_parametres" on parametres for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Messages : n'importe qui peut créer (formulaire public), seul l'admin lit/modifie
create policy "public_insert_messages" on messages for insert with check (true);
create policy "admin_read_messages" on messages for select using (auth.role() = 'authenticated');
create policy "admin_update_messages" on messages for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Inscriptions : création publique via la fonction RPC uniquement (sécurité),
-- lecture/modification réservée à l'admin
create policy "admin_read_inscriptions" on inscriptions for select using (auth.role() = 'authenticated');
create policy "admin_update_inscriptions" on inscriptions for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Statistiques : lecture admin, écriture via la fonction RPC track_visit (SECURITY DEFINER)
create policy "admin_read_statistiques" on statistiques for select using (auth.role() = 'authenticated');

-- ============================================================
-- FONCTIONS RPC (transactions atomiques, exécutées côté serveur)
-- ============================================================

-- Inscription à une formation : anti-doublon (email) + anti-surbooking
-- (places restantes), le tout de façon atomique. SECURITY DEFINER permet
-- à un visiteur anonyme de l'appeler sans avoir de droits directs sur
-- les tables formations/inscriptions.
create or replace function inscrire_formation(
  p_formation_id uuid,
  p_nom text, p_prenom text, p_telephone text, p_email text,
  p_sexe text, p_ville text, p_message text
) returns inscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  f formations%rowtype;
  new_row inscriptions%rowtype;
begin
  select * into f from formations where id = p_formation_id for update;
  if not found then
    raise exception 'FORMATION_INTROUVABLE';
  end if;
  if f.inscrits >= f.places then
    raise exception 'FORMATION_COMPLETE';
  end if;

  insert into inscriptions (nom, prenom, telephone, email, sexe, ville, message, formation_id, formation_titre, statut)
  values (p_nom, p_prenom, p_telephone, lower(p_email), p_sexe, p_ville, p_message, p_formation_id, f.titre, 'nouvelle')
  returning * into new_row;

  update formations set
    inscrits = inscrits + 1,
    statut = case when inscrits + 1 >= places then 'complet' else statut end,
    updated_at = now()
  where id = p_formation_id;

  return new_row;
exception
  when unique_violation then
    raise exception 'DUPLICATE';
end;
$$;

-- Compteur de visites (une ligne par site, incrément atomique + par page)
create or replace function track_visit(p_page text, p_count_total boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update statistiques
  set total = total + case when p_count_total then 1 else 0 end,
      pages = jsonb_set(pages, array[p_page], to_jsonb(coalesce((pages->>p_page)::int, 0) + 1)),
      derniere_visite = now()
  where id = 'visites';
end;
$$;

grant execute on function inscrire_formation to anon, authenticated;
grant execute on function track_visit to anon, authenticated;

-- ============================================================
-- STORAGE — Bucket public pour les images (à créer une fois) :
-- Dashboard → Storage → New bucket → nom: chodep-images → Public: ON
-- Puis dans SQL Editor (adapter si le bucket a déjà des policies) :
-- ============================================================
insert into storage.buckets (id, name, public)
values ('chodep-images', 'chodep-images', true)
on conflict (id) do nothing;

create policy "public_read_images" on storage.objects for select using (bucket_id = 'chodep-images');
create policy "admin_upload_images" on storage.objects for insert with check (bucket_id = 'chodep-images' and auth.role() = 'authenticated');
create policy "admin_delete_images" on storage.objects for delete using (bucket_id = 'chodep-images' and auth.role() = 'authenticated');
