import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function ForgotPassword({ onSuccess, onCancel }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      console.log('📧 Solicitando reset de senha para:', email);
      
      // Solicitar reset de senha via Supabase
      // Usar a URL atual do site (funciona tanto em produção quanto self-hosted)
      const redirectUrl = `${window.location.origin}${window.location.pathname}#type=recovery`;
      
      console.log('🔗 URL de redirecionamento:', redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      console.log('✅ Email de reset enviado com sucesso!');
      setSuccess(true);
    } catch (error) {
      console.error('❌ Erro ao solicitar reset de senha:', error);
      setError(error.message || 'Erro ao solicitar reset de senha. Verifique se o email está correto.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full md:max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Email Enviado!</h2>
            <p className="text-gray-600 mt-2">
              Enviamos um link de recuperação de senha para:
            </p>
            <p className="text-gray-900 font-semibold mt-1">{email}</p>
          </div>

          <div className="card p-8">
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4">
              <p className="text-sm">
                📧 Verifique sua caixa de entrada e spam. O link expira em 1 hora.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={onSuccess}
                className="btn btn-primary w-full"
              >
                Voltar para Login
              </button>
              <button
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                }}
                className="btn btn-outline w-full"
              >
                Enviar Novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full md:max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Esqueci minha senha</h2>
          <p className="text-gray-600 mt-2">
            Digite seu email e enviaremos um link para redefinir sua senha
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">
                Email *
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="Digite seu email cadastrado"
                required
                autoFocus
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  '📧 Enviar Link de Recuperação'
                )}
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
              💡 Não recebeu o email? Verifique sua caixa de spam ou entre em contato com o administrador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
