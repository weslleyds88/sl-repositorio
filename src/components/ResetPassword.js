import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

function ResetPassword({ onSuccess, onCancel }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Aguardar o Supabase processar o token de reset e estabelecer a sessão
  useEffect(() => {
    console.log('🔐 =================================');
    console.log('🔐 RESET PASSWORD - Iniciando');
    console.log('🔐 =================================');
    console.log('📍 URL completa:', window.location.href);
    console.log('📍 Hash:', window.location.hash);
    console.log('📍 Pathname:', window.location.pathname);
    
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('📊 Verificação de sessão:');
        console.log('   - Sessão:', session ? 'PRESENTE ✅' : 'AUSENTE ❌');
        
        if (session) {
          console.log('   - User ID:', session.user?.id);
          console.log('   - Email:', session.user?.email);
          console.log('✅ Sessão estabelecida! Usuário pode resetar senha.');
          setSessionReady(true);
          setCheckingSession(false);
        } else {
          console.log('⏳ Aguardando Supabase processar token...');
        }
      } catch (err) {
        console.error('❌ Erro ao verificar sessão:', err);
        setError('Erro ao verificar sessão. Tente clicar no link do email novamente.');
        setCheckingSession(false);
      }
    };

    // Verificar sessão imediatamente
    checkSession();

    // Também escutar mudanças de estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔔 Evento de autenticação:', event);
      
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        console.log('✅ Sessão de recovery estabelecida!');
        setSessionReady(true);
        setCheckingSession(false);
      }
    });

    // Timeout de 60 segundos - se não estabelecer sessão, mostrar erro
    const timeout = setTimeout(() => {
      if (!sessionReady) {
        console.log('⏰ Timeout: Sessão não estabelecida após 60 segundos');
        setError('Link de reset expirado ou inválido. Solicite um novo reset de senha.');
        setCheckingSession(false);
      }
    }, 60000); // 60 segundos

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Verificar se a sessão está pronta
    if (!sessionReady) {
      setError('Aguarde a sessão ser estabelecida...');
      return;
    }

    // Validações
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      console.log('🔄 Atualizando senha...');
      
      // Atualizar senha usando a sessão atual (do token do email)
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      console.log('✅ Senha atualizada com sucesso!');
      alert('✅ Senha alterada com sucesso! Faça login com sua nova senha.');
      
      // Fazer logout para que o usuário faça login com a nova senha
      await supabase.auth.signOut();
      
      onSuccess();
    } catch (error) {
      console.error('❌ Erro ao resetar senha:', error);
      setError(error.message || 'Erro ao resetar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading enquanto verifica a sessão
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full md:max-w-md">
          <div className="card p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Verificando link de reset...</p>
            <p className="text-sm text-gray-500 mt-2">Aguarde até 60 segundos</p>
            <p className="text-xs text-gray-400 mt-4">
              💡 Se demorar muito, verifique o console (F12) para logs de debug
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full md:max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🔑</h1>
          <h2 className="text-2xl font-bold text-gray-900">Criar Nova Senha</h2>
          <p className="text-gray-600 mt-2">
            Digite sua nova senha para recuperar o acesso à sua conta
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            
            {!sessionReady && !error && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
                ⏳ Aguardando sessão ser estabelecida...
              </div>
            )}
            
            {sessionReady && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                ✅ Link validado! Você pode criar sua nova senha.
              </div>
            )}

            <div>
              <label htmlFor="password" className="label">
                Nova Senha *
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirmar Nova Senha *
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                placeholder="Digite a senha novamente"
                required
                minLength={6}
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading || !sessionReady}
                className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Alterando...' : '✓ Alterar Senha'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              💡 Dica: Use uma senha forte com letras, números e símbolos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;

