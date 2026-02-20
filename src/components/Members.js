import React, { useState, useEffect, useMemo } from 'react';
import MemberForm from './MemberForm';
import { formatDate } from '../utils/dateUtils';

const Members = ({ db, members, onRefresh, isAdmin, supabase, currentUser }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' ou 'desc'

  const sourceList = members || [];

  // Memoizar filtros e ordenação para evitar recálculos desnecessários
  const sortedAndFilteredMembers = useMemo(() => {
    if (!sourceList || sourceList.length === 0) return [];
    
    const filtered = sourceList.filter(member =>
      member && member.full_name && (
    member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.phone && member.phone.includes(searchTerm))
      )
    );

    return filtered
      .filter(member => member && member.id) // Proteção adicional
      .sort((a, b) => {
        const nameA = a.full_name?.toLowerCase() || '';
        const nameB = b.full_name?.toLowerCase() || '';
    if (sortOrder === 'asc') {
      return nameA.localeCompare(nameB);
    } else {
      return nameB.localeCompare(nameA);
    }
  });
  }, [sourceList, searchTerm, sortOrder]);

  // Removido: criação manual pelo admin (cadastro vem pelo fluxo de registro)

  const handleEditMember = (member) => {
    if (!isAdmin) {
      alert('Modo visualização: você não pode editar atletas.');
      return;
    }
    setEditingMember(member);
    setShowForm(true);
  };

  const handleDeleteMember = async (id) => {
    if (!isAdmin) {
      alert('Modo visualização: você não pode excluir atletas.');
      return;
    }
    if (window.confirm('Tem certeza que deseja excluir este atleta? Esta ação não pode ser desfeita.')) {
      const success = await db.deleteMember(id);
      if (success) {
        onRefresh();
      } else {
        alert('Erro ao excluir atleta');
      }
    }
  };

  const handleFormSubmit = async (memberData) => {
    let success = false;
    
    if (editingMember) {
      success = await db.updateMember(editingMember.id, memberData);
    } else {
      const result = await db.addMember(memberData);
      success = !!result;
    }

    if (success) {
      setShowForm(false);
      setEditingMember(null);
      onRefresh();
    } else {
      alert('Erro ao salvar atleta');
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingMember(null);
  };

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Atletas</h2>
          <div className="flex items-center space-x-3">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="asc">A-Z ↑</option>
              <option value="desc">Z-A ↓</option>
            </select>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar atleta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      <div className="card">
        {sortedAndFilteredMembers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Função</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Observação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Cadastro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedAndFilteredMembers.map((member) => {
                  // Proteção contra member undefined
                  if (!member) {
                    console.error('Member undefined encontrado na lista:', member);
                    return null;
                  }
                  
                  if (!member.id) {
                    console.error('Member sem ID encontrado:', member);
                    return null;
                  }

                  return (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.full_name}
                              className="h-10 w-10 rounded-full object-cover border"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center"
                            style={{ display: member.avatar_url ? 'none' : 'flex' }}
                          >
                            <span className="text-primary-600 font-medium text-sm">
                              {member.full_name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {member.full_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        member.status === 'approved' ? 'bg-green-100 text-green-800' :
                        member.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {member.status === 'approved' ? 'Aprovado' : member.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        member.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {member.role === 'admin' ? 'Administrador' : 'Jogador'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {member.observation || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(member.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {isAdmin && (
                          <button
                            onClick={async () => {
                              try {
                                if (!supabase) {
                                  alert('Erro: Supabase não inicializado');
                                  return;
                                }

                                // VERIFICAÇÃO CRÍTICA - garantir que member existe
                                if (!member) {
                                  console.error('Member é undefined:', member);
                                  alert('Erro: Atleta não selecionado corretamente');
                                  return;
                                }

                                // VERIFICAÇÃO CRÍTICA - garantir que member.id existe
                                if (!member.id) {
                                  console.error('Member ID é undefined:', member);
                                  alert('Erro: ID do atleta não disponível');
                                  return;
                                }


                                if (!window.confirm(`Gerar nova senha para ${member.full_name}?`)) return;
                                
                                // Verificar se o usuário atual é admin
                                if (!isAdmin || !currentUser?.id) {
                                  alert('❌ Apenas administradores podem resetar senhas.');
                                  return;
                                }

                                // URL da API de reset de senha
                                // Pode ser configurada via variável de ambiente ou usar URL padrão
                                const apiUrl = process.env.REACT_APP_RESET_PASSWORD_API_URL || 
                                             process.env.REACT_APP_SUPABASE_URL?.replace('/rest/v1', '') + '/api/reset-password' ||
                                             'http://localhost:3001/api/reset-password';
                                
                                try {
                                  // Chamar API backend
                                  const resp = await fetch(apiUrl, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                      userId: member.id,
                                      adminUserId: currentUser.id // Verificação de segurança no backend
                                    })
                                  });

                                  const json = await resp.json();

                                  if (!resp.ok) {
                                    throw new Error(json.error || json.details || 'Falha ao resetar senha');
                                  }

                                  // Sucesso!
                                  const newPassword = json.password;
                                  await navigator.clipboard.writeText(newPassword).catch(() => {});
                                  
                                  alert(`✅ Senha resetada com sucesso!\n\nNova senha: ${newPassword}\n\n(Senha copiada para a área de transferência)\n\n⚠️ O usuário será obrigado a trocar a senha no próximo login.`);
                                  
                                } catch (apiError) {
                                  // Fallback: Tentar método antigo (RPC + Edge Function)
                                  
                                  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
                                  if (!supabaseUrl) {
                                    throw new Error('URL do Supabase não configurada');
                                  }

                                  // Tentar RPC Function
                                  try {
                                    const { data: rpcData, error: rpcError } = await supabase.rpc('reset_user_password', {
                                      target_user_id: member.id
                                    });

                                    if (!rpcError && rpcData) {
                                      const newPassword = rpcData;
                                      await navigator.clipboard.writeText(newPassword).catch(() => {});
                                      alert(`⚠️ Senha gerada, mas pode não estar atualizada no auth.users.\n\nNova senha: ${newPassword}\n\n(Senha copiada para a área de transferência)\n\n⚠️ ATENÇÃO: Verifique se a senha funciona. Se não funcionar, atualize manualmente no Supabase Dashboard.`);
                                      return;
                                    }
                                  } catch {
                                    // RPC não disponível
                                  }

                                  // Se chegou aqui, nenhum método funcionou
                                  throw new Error(apiError.message || 'Não foi possível resetar a senha. Verifique se a API está rodando.');
                                }
                              } catch (e) {
                                alert('Erro ao resetar senha: ' + (e.message || 'desconhecido'));
                              }
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Resetar senha"
                          >
                            🔑
                          </button>
                        )}
                        <button
                          onClick={() => handleEditMember(member)}
                          disabled={!isAdmin}
                          className={`${
                            isAdmin
                              ? 'text-primary-600 hover:text-primary-900'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          title={isAdmin ? 'Editar' : 'Modo visualização'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          disabled={!isAdmin}
                          className={`${
                            isAdmin
                              ? 'text-danger-600 hover:text-danger-900'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          title={isAdmin ? 'Excluir' : 'Modo visualização'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum atleta encontrado.</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Tente ajustar sua busca.' : 'Comece adicionando um novo atleta.'}
            </p>
            {/* Botão de novo atleta removido a pedido */}
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Atletas</p>
              <p className="text-2xl font-bold text-gray-900">{members.filter(m => m && m.status === 'approved').length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Com Telefone</p>
              <p className="text-2xl font-bold text-gray-900">
                {(members || []).filter(m => m && m.phone).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-warning-100 rounded-lg">
              <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Com Observações</p>
              <p className="text-2xl font-bold text-gray-900">
                {(members || []).filter(m => m && m.observation).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <MemberForm
              title={editingMember ? 'Editar Atleta' : 'Novo Atleta'}
              member={editingMember}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
