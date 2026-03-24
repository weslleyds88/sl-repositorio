// Exemplo completo de uso da função listMembers no React
// com tratamento de erros e async/await

import { useState, useEffect } from 'react';
import { supabaseAdapter } from '../adapters/supabaseAdapter';

function MembersList() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Chamada da função que agora usa RPC em vez de .in()
      const membersData = await supabaseAdapter.listMembers({
        forAdmin: false // ou true para admin ver todos os status
      });

      setMembers(membersData);

    } catch (err) {
      console.error('Erro ao carregar membros:', err);
      setError('Erro ao carregar lista de membros. Tente novamente.');

      // Tratamento específico de erros comuns
      if (err.message?.includes('JWT')) {
        setError('Sessão expirada. Faça login novamente.');
      } else if (err.message?.includes('network')) {
        setError('Erro de conexão. Verifique sua internet.');
      }

    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Carregando membros...</div>;
  }

  if (error) {
    return (
      <div style={{ color: 'red' }}>
        {error}
        <button onClick={loadMembers}>Tentar novamente</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Membros ({members.length})</h2>
      {members.map(member => (
        <div key={member.id}>
          <strong>{member.full_name}</strong>
          {member.group_name && (
            <span> - Grupo: {member.group_name}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default MembersList;