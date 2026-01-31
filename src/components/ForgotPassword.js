import React from 'react';

function ForgotPassword({ onCancel }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full md:max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
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

        <div className="card p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-4">
            Esqueci minha senha
          </h2>

          <p className="text-gray-800 text-center mb-6 leading-relaxed">
            Para resetar a senha, entre em contato com o{' '}
            <span className="text-primary-600 font-semibold">Medeiros</span>
            {' '}ou{' '}
            <span className="text-primary-600 font-semibold">Vitorino</span>
            {' '}para que a senha seja alterada.
          </p>

          <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-5 mb-6">
            <p className="text-sm font-semibold text-gray-900 mb-3">
              Como funciona
            </p>
            <ol className="text-sm text-gray-800 space-y-2.5 list-none pl-0">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 font-semibold flex items-center justify-center text-xs">
                  1
                </span>
                <span>Entre em contato com Medeiros ou Vitorino.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 font-semibold flex items-center justify-center text-xs">
                  2
                </span>
                <span>Eles vão alterar sua senha no sistema.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 font-semibold flex items-center justify-center text-xs">
                  3
                </span>
                <span>Você receberá a nova senha e poderá entrar na sua conta.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 font-semibold flex items-center justify-center text-xs">
                  4
                </span>
                <span>Depois de entrar, acesse seu <strong className="text-gray-900">Perfil</strong> e altere a senha para uma de sua preferência.</span>
              </li>
            </ol>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="btn-primary w-full py-3 touch-manipulation"
          >
            Voltar para Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
