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
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('account_status, role')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        console.error('Erro ao verificar status da conta:', error);
        return true; // Em caso de erro, permitir continuar
      }

      // 1. Verificar se a conta foi desativada
      if (profile?.account_status === 'inactive') {
        console.log('🚫 Conta desativada pelo administrador. Fazendo logout...');
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

      // 2. Verificar se o role mudou
      const newIsAdmin = profile?.role === 'admin';
      if (newIsAdmin !== isAdmin) {
        console.log('🔄 Role do usuário mudou:', { 
          antes: isAdmin ? 'admin' : 'user', 
          depois: newIsAdmin ? 'admin' : 'user' 
        });
        
        // Atualizar o estado do admin
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
    } catch (error) {
      console.error('Erro ao verificar status da conta:', error);
      return true;
    }
  };

  // Verificar status ao trocar de página ou fazer ações
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id) return;

    // Verificar em eventos de interação do usuário
    const handleUserAction = () => {
      checkAccountStatus();
    };

    // Ouvir eventos de clique e navegação
    window.addEventListener('click', handleUserAction, { once: true, capture: true });
    window.addEventListener('popstate', handleUserAction);
    
    // Verificar ao carregar a página
    checkAccountStatus();

    return () => {
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
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
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

      if (profileError) {
        console.error('Erro ao buscar perfil atualizado:', profileError);
        return;
      }

      if (profile) {
        setCurrentUser(profile);
        
        // Atualizar isAdmin se necessário
        const newIsAdmin = profile.role === 'admin';
        if (newIsAdmin !== isAdmin) {
          setIsAdmin(newIsAdmin);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
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
