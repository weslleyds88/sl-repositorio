import React from 'react';

const MaintenanceMode = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        {/* Ícone de Manutenção */}
        <div className="mb-6">
          <div className="mx-auto w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg 
              className="w-12 h-12 text-yellow-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Site em Manutenção
        </h1>

        {/* Mensagem */}
        <p className="text-lg text-gray-600 mb-6">
          O sistema está temporariamente indisponível para manutenção no banco de dados.
        </p>

        <p className="text-base text-gray-500 mb-8">
          Estamos trabalhando para melhorar nossos serviços. Por favor, tente novamente em alguns instantes.
        </p>

        {/* Animação de Loading */}
        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>

        {/* Informações Adicionais */}
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <p className="font-semibold mb-2">⏰ Tempo estimado:</p>
          <p>Alguns minutos</p>
        </div>

        {/* Rodapé */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            São Luiz Financeiro - Sistema de Gestão
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceMode;

