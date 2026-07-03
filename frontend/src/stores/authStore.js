import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isProfileComplete: false,
  isLoading: true,
  _authSubscription: null,

  // Auto-check session on app load
  initAuth: async () => {
    set({ isLoading: true });
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      set({
        session,
        user: profile ? {
          id: profile.id,
          name: profile.full_name,
          email: session.user.email,
          username: profile.username || '',
          position: profile.position || '',
          avatar: profile.avatar_url || '',
        } : null,
        isAuthenticated: true,
        isProfileComplete: !!(profile?.full_name && profile?.position),
        isLoading: false,
      });
    } else {
      set({ user: null, session: null, isAuthenticated: false, isLoading: false });
    }

    // Unsubscribe previous listener before creating a new one
    const prevSub = get()._authSubscription;
    if (prevSub) prevSub.unsubscribe();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        supabase.from('users').select('*').eq('id', session.user.id).single()
          .then(({ data: profile }) => {
            set({
              session,
              user: profile ? { id: profile.id, name: profile.full_name, email: session.user.email, username: profile.username || '', position: profile.position || '', avatar: profile.avatar_url || '' } : null,
              isAuthenticated: true,
              isProfileComplete: !!(profile?.full_name && profile?.position),
            });
          });
      } else {
        set({ user: null, session: null, isAuthenticated: false, isProfileComplete: false });
      }
    });

    set({ _authSubscription: subscription });
  },

  cleanupAuth: () => {
    const sub = get()._authSubscription;
    if (sub) {
      sub.unsubscribe();
      set({ _authSubscription: null });
    }
  },

  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single();

    set({
      session: data.session,
      user: profile ? { id: profile.id, name: profile.full_name, email, username: profile.username || '', position: profile.position || '', avatar: profile.avatar_url || '' } : null,
      isAuthenticated: true,
      isProfileComplete: !!(profile?.full_name && profile?.position),
    });
  },

  loginWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' },
    });
    if (error) throw error;
  },

  register: async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) throw error;

    if (data.user) {
      set({
        session: data.session,
        user: { id: data.user.id, name, email, username: '', position: '', avatar: '' },
        isAuthenticated: true,
        isProfileComplete: false,
      });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, isAuthenticated: false, isProfileComplete: false });
  },

  updateProfile: async (profileData) => {
    const { user } = get();
    if (!user) return;

    const { error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: profileData.name,
        username: profileData.username,
        position: profileData.position,
        avatar_url: profileData.avatar,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (error) throw error;

    set((state) => ({
      user: { ...state.user, name: profileData.name, username: profileData.username, position: profileData.position, avatar: profileData.avatar || state.user.avatar },
      isProfileComplete: true,
    }));
  },
}));

export default useAuthStore;
