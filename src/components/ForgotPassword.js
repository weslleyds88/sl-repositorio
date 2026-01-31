import React from 'react';

function ForgotPassword({ onCancel }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full md:max-w-md">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <img
              src="/logo.png"
              alt="Logo São Luiz"
              className="h-24 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            São Luiz Vôlei Cidadão
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Sistema de Gestão Financeira
          </p>
        </div>

        <div className="card p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-4">
            Esqueci minha senha
          </h2>

          <p className="text-gray-700 dark:text-gray-300 text-center mb-6 leading-relaxed">
            Para resetar a senha, por favor entre em contato com o <strong>Medeiros</strong> ou <strong>Vitorino</strong> para que a senha seja alterada.
          </p>

          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 mb-6">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Como funciona:
            </p>
            <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-2 list-decimal list-inside">
              <li>Entre em contato com Medeiros ou Vitorino.</li>
              <li>Eles vão alterar sua senha no sistema.</li>
              <li>Você receberá a nova senha e poderá entrar na sua conta.</li>
              <li>Depois de entrar, acesse seu <strong>Perfil</strong> e altere a senha para uma de sua preferência.</li>
            </ol>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="btn-primary w-full py-3"
          >
            Voltar para Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
