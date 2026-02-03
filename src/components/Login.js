import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Register from './Register';
import ResetPassword from './ResetPassword';
import ForgotPassword from './ForgotPassword';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Detectar se é um link de reset de senha
  useEffect(() => {
    if (window.location.hostname === 'localhost' && window.location.hash.includes('type=recovery')) {
      const correctUrl = `http://192.168.15.60:3000/${window.location.hash}`;
      window.location.href = correctUrl;
      return;
    }

    const hashString = window.location.hash.replace(/^#+/, '');
    const paramsString = hashString.replace(/#/g, '&');
    const hashParams = new URLSearchParams(paramsString);
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    const refreshToken = hashParams.get('refresh_token');

    if (accessToken && type === 'recovery') {
      (async () => {
        try {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });
        } catch {
          // sessão será tratada na tela de reset
        }
      })();
      setShowResetPassword(true);
      return;
    }

    if (window.location.hash.includes('type=recovery') || window.location.hash.includes('reset-password')) {
      setShowResetPassword(true);
      return;
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        // Tratamento especial para o admin (desenvolvimento)
        if (email === 'admin@saoluiz.com' && error.message.includes('Email not confirmed')) {
          // Para o admin, tentar confirmar automaticamente ou permitir login direto
          setTimeout(async () => {
            try {
              // Tentar confirmar automaticamente
              const { error: confirmError } = await supabase.auth.verifyOtp({
                email: email,
                token: 'admin-development-token',
                type: 'email'
              });

              if (confirmError) {

                // Buscar o usuário diretamente e permitir login
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('status, role')
                  .eq('email', email)
                  .single();

                if (profile?.role === 'admin') {
                  setError('');
                  onLogin(true);
                  return;
                }
              } else {
                // Se conseguiu confirmar, tentar login novamente
                const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                  email: email,
                  password: password,
                });

                if (!retryError && retryData.user) {
                  setError('');
                  onLogin(true);
                  return;
                }
              }
            } catch {
              setError('Erro interno. Tente novamente em alguns instantes.');
            }
          }, 1500);

          setError('Confirmando automaticamente... Aguarde um momento.');
          return;
        }

        if (error.message.includes('Email not confirmed')) {
          try {
            await supabase.auth.resend({
              type: 'signup',
              email: email,
            });
            setError('Email de confirmação enviado. Verifique sua caixa de entrada.');
            return;
          } catch {
            // reenvio de confirmação falhou
          }
        }

        throw error;
      }

      if (data.user) {
        try {
          // Primeiro tentar buscar o perfil específico
          let { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          // Se não encontrar ou der erro de múltiplos registros, buscar todos os perfis do usuário
          if (profileError && (profileError.code === 'PGRST116' || profileError.code === '23505')) {
            const { data: profiles, error: profilesError } = await supabase
              .from('profiles')
              .select('*')
              .eq('email', data.user.email)
              .order('created_at', { ascending: false });

            if (!profilesError && profiles && profiles.length > 0) {
              profile = profiles.find(p => p.status === 'approved') || profiles[0];
              profileError = null;
            }
          }

          if (profileError && !profile) {
            if (profileError.code === 'PGRST116') {
              setError('Perfil não encontrado. Entre em contato com o administrador.');
            } else if (profileError.message?.includes('406')) {
              setError('Erro de conexão. Verifique sua internet e tente novamente.');
            } else if (profileError.code === '23505') {
              setError('Duplicata de email detectada. Entre em contato com o administrador.');
            } else {
              setError('Erro ao verificar status da conta. Tente novamente.');
            }
            return;
          }

          if (profile?.account_status === 'inactive') {
            setError('Sua conta foi desativada. Entre em contato com o administrador.');
            // Fazer logout do Supabase
            await supabase.auth.signOut();
            return;
          }

          if (profile?.status === 'approved' || profile?.role === 'admin') {
            onLogin(profile.role === 'admin', profile);
          } else {
            setError('Sua conta ainda não foi aprovada pelo administrador.');
          }
        } catch {
          setError('Erro de conexão. Verifique sua internet e tente novamente.');
        }
      }
    } catch (error) {
      setError(error.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSuccess = (email) => {
    setError(`Conta criada com sucesso! Um email foi enviado para ${email}. Aguarde a aprovação do administrador.`);
    setShowRegister(false);
  };

  if (showForgotPassword) {
    return (
      <ForgotPassword
        onSuccess={() => {
          setShowForgotPassword(false);
        }}
        onCancel={() => {
          setShowForgotPassword(false);
        }}
      />
    );
  }

  if (showResetPassword) {
    return (
      <ResetPassword
        onSuccess={() => {
          // Limpar URL e voltar para login
          window.location.hash = '';
          setShowResetPassword(false);
        }}
        onCancel={() => {
          // Limpar URL e voltar para login
          window.location.hash = '';
          setShowResetPassword(false);
        }}
      />
    );
  }

  if (showRegister) {
    return (
      <Register
        onRegisterSuccess={handleRegisterSuccess}
        onBackToLogin={() => setShowRegister(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full md:max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/logo.png" 
              alt="Logo São Luiz" 
              className="h-24 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            São Luiz Vôlei Cidadão
          </h1>
          <p className="text-gray-600">
            Sistema de Gestão Financeira
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu email"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Senha</label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Esqueci minha senha
                </button>
              </div>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
              />
            </div>

            {error && (
              <div className={`px-4 py-3 rounded-lg ${
                error.includes('sucesso')
                  ? 'bg-green-50 border border-green-200 text-green-600'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
              }`}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full py-3 touch-manipulation"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Entrando...
                </>
              ) : (
                '🔓 Entrar'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowRegister(true)}
              className="btn-outline w-full py-3 touch-manipulation"
            >
              📝 Criar Nova Conta
            </button>

            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-3">
              Não tem conta? Cadastre-se como atleta
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
