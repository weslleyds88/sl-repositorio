import React, { useState } from 'react';

const NotificationCleanup = ({ supabase }) => {
  const [isCleaning, setIsCleaning] = useState(false);
  const [stats, setStats] = useState(null);
  const [lastCleanup, setLastCleanup] = useState(null);

  const getNotificationStats = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*');

      if (error) throw error;

      const total = data.length;
      const unread = data.filter(n => !n.read).length;
      const read = data.filter(n => n.read).length;
      const oldRead = data.filter(n => n.read && new Date(n.created_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;

      setStats({
        total,
        unread,
        read,
        oldRead
      });
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
    }
  };

  const performCleanup = async () => {
    setIsCleaning(true);
    try {
      // Executar limpeza básica
      const { error } = await supabase.rpc('cleanup_old_notifications');
      
      if (error) throw error;

      setLastCleanup(new Date().toLocaleString('pt-BR'));
      await getNotificationStats();
      
      alert('Limpeza executada com sucesso!');
    } catch (error) {
      console.error('Erro na limpeza:', error);
      alert('Erro ao executar limpeza: ' + error.message);
    } finally {
      setIsCleaning(false);
    }
  };

  const performAggressiveCleanup = async () => {
    if (!window.confirm('⚠️ ATENÇÃO: Esta operação irá remover TODAS as notificações lidas há mais de 30 dias. Continuar?')) {
      return;
    }

    setIsCleaning(true);
    try {
      // Executar limpeza agressiva
      const { error } = await supabase.rpc('cleanup_very_old_notifications');
      
      if (error) throw error;

      setLastCleanup(new Date().toLocaleString('pt-BR'));
      await getNotificationStats();
      
      alert('Limpeza agressiva executada com sucesso!');
    } catch (error) {
      console.error('Erro na limpeza agressiva:', error);
      alert('Erro ao executar limpeza agressiva: ' + error.message);
    } finally {
      setIsCleaning(false);
    }
  };

  const getHealthStatus = () => {
    if (!stats) return { status: 'loading', color: 'gray', message: 'Carregando...' };
    
    if (stats.total < 1000) {
      return { status: 'healthy', color: 'green', message: 'Sistema saudável' };
    } else if (stats.total < 5000) {
      return { status: 'warning', color: 'yellow', message: 'Atenção - execute limpeza' };
    } else if (stats.total < 10000) {
      return { status: 'critical', color: 'orange', message: 'Crítico - limpeza necessária' };
    } else {
      return { status: 'emergency', color: 'red', message: 'Emergência - limpeza urgente' };
    }
  };

  const health = getHealthStatus();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          🧹 Limpeza de Notificações
        </h3>
        <button
          onClick={getNotificationStats}
          className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded"
        >
          🔄 Atualizar
        </button>
      </div>

      {stats && (
        <div className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-lg font-semibold">{stats.total}</div>
            </div>
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-sm text-gray-600">Não Lidas</div>
              <div className="text-lg font-semibold text-blue-600">{stats.unread}</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="text-sm text-gray-600">Lidas</div>
              <div className="text-lg font-semibold text-green-600">{stats.read}</div>
            </div>
            <div className="bg-orange-50 p-3 rounded">
              <div className="text-sm text-gray-600">Antigas (7+ dias)</div>
              <div className="text-lg font-semibold text-orange-600">{stats.oldRead}</div>
            </div>
          </div>

          <div className={`p-3 rounded border-l-4 border-${health.color}-400 bg-${health.color}-50`}>
            <div className="flex items-center">
              <span className="text-lg mr-2">
                {health.status === 'healthy' && '🟢'}
                {health.status === 'warning' && '🟡'}
                {health.status === 'critical' && '🟠'}
                {health.status === 'emergency' && '🔴'}
              </span>
              <span className="font-medium">{health.message}</span>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={performCleanup}
          disabled={isCleaning}
          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isCleaning ? '🧹 Limpando...' : '🧹 Limpeza Básica (7+ dias)'}
        </button>

        <button
          onClick={performAggressiveCleanup}
          disabled={isCleaning}
          className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isCleaning ? '🧹 Limpando...' : '🧹 Limpeza Agressiva (30+ dias)'}
        </button>
      </div>

      {lastCleanup && (
        <div className="mt-4 text-sm text-gray-600">
          Última limpeza: {lastCleanup}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p><strong>Limpeza Básica:</strong> Remove notificações lidas há mais de 7 dias</p>
        <p><strong>Limpeza Agressiva:</strong> Remove notificações lidas há mais de 30 dias</p>
        <p><strong>Recomendação:</strong> Execute limpeza básica semanalmente</p>
      </div>
    </div>
  );
};

export default NotificationCleanup;
