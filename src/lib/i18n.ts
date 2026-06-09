/**
 * Minimal typed i18n. French is the default and only shipped locale in v1, but
 * messages are centralized and key-addressed so additional locales can be added
 * later without touching call sites.
 */
export const fr = {
  'app.title': 'Productivité',
  'app.tagline': 'Notes liées et productivité',
  'app.loading': 'Chargement…',
  'app.initializing': "Application en cours d'initialisation…",

  'nav.notes': 'Notes',
  'nav.graph': 'Graphe',
  'nav.tasks': 'Tâches',
  'nav.calendar': 'Calendrier',
  'nav.toggleSidebar': 'Afficher/masquer la barre latérale',

  'theme.toggle': 'Changer de thème',
  'theme.light': 'Clair',
  'theme.dark': 'Sombre',
  'theme.system': 'Système',

  'auth.signInWithGoogle': 'Se connecter avec Google',
  'auth.signOut': 'Se déconnecter',
  'auth.signingIn': 'Connexion…',
  'auth.required': 'Veuillez vous connecter pour continuer.',
  'auth.error': "Échec de la connexion. Veuillez réessayer.",

  'sync.online': 'Synchronisé',
  'sync.pending': 'En attente',
  'sync.offline': 'Hors-ligne',
  'sync.conflict': 'Conflit',

  'notes.new': 'Nouvelle note',
  'notes.empty': 'Aucune note pour le moment.',
  'notes.selectPrompt': 'Sélectionnez une note ou créez-en une.',
  'notes.untitled': 'Sans titre',
  'notes.titleLabel': 'Titre de la note',
  'notes.titlePlaceholder': 'Titre…',
  'notes.edit': 'Éditer',
  'notes.preview': 'Aperçu',
  'notes.delete': 'Supprimer',
  'notes.deleteConfirm': 'Supprimer cette note ?',
  'notes.backlinks': 'Rétroliens',
  'notes.noBacklinks': 'Aucun rétrolien.',
  'notes.loadError': 'Impossible de charger les notes.',
  'notes.searchPlaceholder': 'Rechercher dans les notes…',
  'notes.daily': 'Note du jour',

  'palette.title': 'Palette de commandes',
  'palette.placeholder': 'Rechercher une note ou une commande…',
  'palette.open': 'Rechercher (Ctrl/Cmd-K)',
  'palette.noResults': 'Aucun résultat.',

  'graph.title': 'Graphe des notes',
  'graph.open': 'Graphe',
  'graph.close': 'Fermer',
  'graph.empty': 'Aucune note à afficher.',

  'setup.title': 'Configuration requise',
  'setup.supabaseMissing':
    "La connexion à Supabase n'est pas configurée. Renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY (voir SETUP.md).",
  'setup.googleMissing':
    "L'identifiant client Google n'est pas configuré. Renseignez VITE_GOOGLE_CLIENT_ID (voir SETUP.md).",

  'error.title': 'Une erreur est survenue',
  'error.retry': 'Réessayer',
  'notFound.title': 'Page introuvable',
  'notFound.back': "Retour à l'accueil",
} as const;

export type MessageKey = keyof typeof fr;

const dictionary: Record<MessageKey, string> = fr;

export function t(key: MessageKey): string {
  return dictionary[key];
}
