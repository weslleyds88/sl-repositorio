import React, { useState, useEffect, useMemo } from 'react';
import MemberForm from './MemberForm';
import { formatDate } from '../utils/dateUtils';

const Members = ({ db, members, onRefresh, isAdmin, supabase }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState(null); // quando admin, carrega lista completa com avatar
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' ou 'desc'

  const sourceList = allUsers !== null && isAdmin ? allUsers : members;

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

  // Carregar lista completa de usuários (com avatar) quando admin
  useEffect(() => {
    const loadAll = async () => {
      if (!isAdmin || !supabase) return;
      setLoadingUsers(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, full_name, phone, position, role, status, account_status, avatar_url, created_at, observation, birth_date, rg, region, gender, responsible_name, responsible_phone')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setAllUsers(data || []);
      } catch (e) {
        console.error('Erro ao carregar usuários:', e);
        setAllUsers(null);
      } finally {
        setLoadingUsers(false);
      }
    };
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, supabase]);

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
        {loadingUsers ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando atletas...</p>
          </div>
        ) : sortedAndFilteredMembers.length > 0 ? (
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

                                console.log('Resetando senha para:', member.id, member.full_name);

                                if (!window.confirm(`Gerar nova senha para ${member.full_name}?`)) return;
                                
                                // Obter URL e Service Role Key do Supabase
                                const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
                                const serviceRoleKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;
                                
                                console.log('🔍 Debug - Service Role Key presente:', !!serviceRoleKey);
                                console.log('🔍 Debug - Service Role Key length:', serviceRoleKey?.length);
                                console.log('🔍 Debug - Service Role Key preview:', serviceRoleKey ? `${serviceRoleKey.substring(0, 20)}...` : 'N/A');
                                
                                if (!supabaseUrl) {
                                  throw new Error('URL do Supabase não configurada');
                                }

                                // Se tiver Service Role Key, fazer reset direto (self-hosted)
                                if (serviceRoleKey && serviceRoleKey.trim().length > 0) {
                                  console.log('🔧 Usando reset direto (self-hosted)...');
                                  
                                  const trimmedKey = serviceRoleKey.trim();
                                  
                                  // No Supabase self-hosted, as chaves podem ser strings simples (não JWT)
                                  // Aceitar tanto JWT quanto chaves simples
                                  const isJWT = trimmedKey.includes('.') && trimmedKey.split('.').length === 3;
                                  
                                  if (isJWT) {
                                    console.log('✅ Service Role Key no formato JWT detectado');
                                  } else {
                                    console.log('✅ Service Role Key no formato simples (self-hosted) detectado');
                                  }
                                  
                                  // Gerar senha aleatória
                                  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                                  const newPassword = Array.from({ length: 12 }, () => 
                                    chars[Math.floor(Math.random() * chars.length)]
                                  ).join('');

                                  // Atualizar senha usando Admin API
                                  const updateUrl = `${supabaseUrl}/auth/v1/admin/users/${member.id}`;
                                  console.log('Atualizando senha em:', updateUrl);
                                  console.log('🔑 Usando Service Role Key (primeiros 30 chars):', serviceRoleKey.substring(0, 30) + '...');
                                  
                                  const updateResp = await fetch(updateUrl, {
                                    method: 'PUT',
                                    headers: {
                                      'Authorization': `Bearer ${serviceRoleKey.trim()}`,
                                      'apikey': serviceRoleKey.trim(),
                                      'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                      password: newPassword,
                                      email_confirm: true
                                    })
                                  });

                                  if (!updateResp.ok) {
                                    const errorText = await updateResp.text().catch(() => 'Erro desconhecido');
                                    console.error('Erro ao atualizar senha:', errorText);
                                    throw new Error('Erro ao atualizar senha: ' + errorText);
                                  }

                                  // Marcar que o usuário deve trocar a senha no próximo login
                                  const { error: profileError } = await supabase
                                    .from('profiles')
                                    .update({ must_change_password: true })
                                    .eq('id', member.id);

                                  if (profileError) {
                                    console.error('Erro ao marcar must_change_password:', profileError);
                                    // Não falhar, apenas logar
                                  }

                                  await navigator.clipboard.writeText(newPassword).catch(() => {});
                                  alert(`✅ Senha resetada com sucesso!\n\nNova senha: ${newPassword}\n\n(Senha copiada para a área de transferência)\n\n⚠️ O usuário será obrigado a trocar a senha no próximo login.`);
                                  return;
                                }

                                // Fallback: Tentar usar Edge Function (Supabase Cloud)
                                console.log('🔧 Tentando usar Edge Function (Supabase Cloud)...');
                                
                                // Obter token de autenticação
                                let { data: session } = await supabase.auth.getSession();
                                console.log('Sessão inicial:', session);
                                
                                if (!session?.session) {
                                  console.log('Sessão não encontrada, tentando refresh...');
                                  await supabase.auth.refreshSession();
                                  const refreshed = await supabase.auth.getSession();
                                  session = refreshed.data;
                                  console.log('Sessão após refresh:', session);
                                }
                                
                                const token = session?.session?.access_token;
                                if (!token) {
                                  alert('Sessão inválida. Faça login novamente.');
                                  return;
                                }

                                // Chamar Supabase Edge Function
                                const functionUrl = `${supabaseUrl}/functions/v1/admin-reset-password`;
                                
                                const resp = await fetch(functionUrl, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`,
                                    'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY || ''
                                  },
                                  body: JSON.stringify({ 
                                    userId: member.id
                                  })
                                });

                                console.log('Resposta HTTP:', resp.status, resp.statusText);

                                const json = await resp.json();
                                console.log('Resposta JSON:', json);

                                if (!resp.ok) {
                                  const errorMsg = json.error || json.detail || 'Falha ao resetar senha';
                                  const errorDetail = json.detail ? `\n\nDetalhes: ${JSON.stringify(json.detail)}` : '';
                                  throw new Error(errorMsg + errorDetail);
                                }

                                const newPassword = json.password;
                                await navigator.clipboard.writeText(newPassword).catch(() => {});
                                alert(`✅ Senha resetada com sucesso!\n\nNova senha: ${newPassword}\n\n(Senha copiada para a área de transferência)\n\n⚠️ O usuário será obrigado a trocar a senha no próximo login.`);
                              } catch (e) {
                                console.error('Erro completo no reset de senha:', e);
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
              <p className="text-2xl font-bold text-gray-900">{members.length}</p>
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
                {members.filter(m => m.phone).length}
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
                {members.filter(m => m.observation).length}
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
