import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carregar estado de autenticação do localStorage
  useEffect(() => {
    const authData = localStorage.getItem('auth');
    if (authData) {
      const { isAuth, isAdm, user } = JSON.parse(authData);
      setIsAuthenticated(isAuth);
      setIsAdmin(isAdm);
      setCurrentUser(user);
    }
    setLoading(false);
  }, []);

  // Função para verificar se a conta ainda está ativa E se o role mudou (chamada sob demanda)
  const checkAccountStatus = async () => {
    if (!currentUser?.id) return true;

    try {
      // Primeiro tentar buscar o perfil pelo ID do auth user
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('account_status, role, status')
        .eq('id', currentUser.id)
        .single();

      // Se não encontrar ou der erro (múltiplos perfis), buscar por email
      if (profileError && (profileError.code === 'PGRST116' || profileError.code === '23505')) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('account_status, role, status')
          .eq('email', currentUser.email)
          .order('created_at', { ascending: false });

        if (!profilesError && profiles && profiles.length > 0) {
          // Usar o perfil mais recente ou o aprovado
          profile = profiles.find(p => p.status === 'approved') || profiles[0];
          profileError = null;
        }
      }

      if (profileError || !profile) {
        return true; // Em caso de erro, permitir continuar
      }

      if (profile?.account_status === 'inactive') {
        alert('Sua conta foi desativada pelo administrador. Você será desconectado.');
        
        // Fazer logout do Supabase
        await supabase.auth.signOut();
        
        // Limpar estado local
        setIsAuthenticated(false);
        setIsAdmin(false);
        setCurrentUser(null);
        localStorage.removeItem('auth');
        
        // Recarregar a página para voltar ao login
        window.location.reload();
        return false;
      }

      const newIsAdmin = profile?.role === 'admin';
      if (newIsAdmin !== isAdmin) {
        setIsAdmin(newIsAdmin);
        
        // Atualizar o currentUser com o novo role
        setCurrentUser({ ...currentUser, role: profile.role });
        
        // Mostrar mensagem ao usuário
        if (newIsAdmin) {
          alert('🎉 Você foi promovido a administrador! A interface será atualizada.');
        } else {
          alert('ℹ️ Suas permissões de administrador foram removidas. A interface será atualizada.');
        }
        
        // Recarregar a página para aplicar as mudanças na interface
        window.location.reload();
        return false;
      }

      return true;
    } catch {
      return true;
    }
  };

  // Verificar status ao trocar de página ou fazer ações
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id) return;

    let isMounted = true;

    // Verificar em eventos de interação do usuário
    const handleUserAction = () => {
      if (isMounted) {
        checkAccountStatus().catch(() => {});
      }
    };

    // Ouvir eventos de clique e navegação
    window.addEventListener('click', handleUserAction, { once: true, capture: true });
    window.addEventListener('popstate', handleUserAction);
    
    // Verificar ao carregar a página (com delay para não bloquear o carregamento inicial)
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        checkAccountStatus().catch(() => {});
      }
    }, 1000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      window.removeEventListener('click', handleUserAction);
      window.removeEventListener('popstate', handleUserAction);
    };
  }, [isAuthenticated, currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // Salvar estado no localStorage quando mudar (APENAS dados essenciais)
  useEffect(() => {
    if (!loading) {
      // Extrair apenas dados essenciais (sem avatar_url para evitar localStorage cheio)
      const essentialUserData = currentUser ? {
        id: currentUser.id,
        email: currentUser.email,
        full_name: currentUser.full_name,
        role: currentUser.role,
        account_status: currentUser.account_status,
        // NÃO incluir: avatar_url, created_at, updated_at (podem ser grandes)
      } : null;

      localStorage.setItem('auth', JSON.stringify({
        isAuth: isAuthenticated,
        isAdm: isAdmin,
        user: essentialUserData
      }));
    }
  }, [isAuthenticated, isAdmin, currentUser, loading]);

  const login = async (adminMode, userData = null) => {
    setIsAuthenticated(true);
    setIsAdmin(adminMode);
    
    if (userData) {
      setCurrentUser(userData);
    } else {
      // Se não passou dados do usuário, buscar do Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (profile) {
            setCurrentUser(profile);
          }
        }
      } catch {
        // falha ao buscar dados do usuário
      }
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setCurrentUser(null);
    localStorage.removeItem('auth');
  };

  const refreshUser = async () => {
    if (!currentUser?.id && !currentUser?.email) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Primeiro tentar buscar o perfil pelo ID do auth user
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Se não encontrar ou der erro, buscar por email (mesma lógica do Login.js)
      if (profileError && (profileError.code === 'PGRST116' || profileError.code === '23505')) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', user.email)
          .order('created_at', { ascending: false });

        if (!profilesError && profiles && profiles.length > 0) {
          // Usar o perfil mais recente ou o aprovado
          profile = profiles.find(p => p.status === 'approved') || profiles[0];
          profileError = null;
        }
      }

      if (profileError) return;

      if (profile) {
        setCurrentUser(profile);
        
        // Atualizar isAdmin se necessário
        const newIsAdmin = profile.role === 'admin';
        if (newIsAdmin !== isAdmin) {
          setIsAdmin(newIsAdmin);
        }
      }
    } catch {
      // falha ao atualizar dados do usuário
    }
  };

  const value = {
    isAuthenticated,
    isAdmin,
    currentUser,
    login,
    logout,
    loading,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
