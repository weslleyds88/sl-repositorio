import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import GroupMembers from './GroupMembers';

function AdminPanel() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupFormData, setGroupFormData] = useState({
    name: '',
    description: '',
    type: 'team'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔍 Carregando dados do painel administrativo...');

      const { data: pending, error: pendingError } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (pendingError) {
        console.error('❌ Erro ao buscar pendentes:', pendingError);
        throw pendingError;
      }

      console.log('📋 Usuários pendentes encontrados:', pending?.length || 0);
      setPendingUsers(pending || []);

      const { data: all, error: allError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (allError) {
        console.error('❌ Erro ao buscar todos usuários:', allError);
        throw allError;
      }

      console.log('👥 Total de usuários:', all?.length || 0);
      setAllUsers(all || []);

      const { data: groupsData, error: groupsError } = await supabase
        .from('user_groups')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (groupsError) {
        console.error('❌ Erro ao buscar grupos:', groupsError);
        throw groupsError;
      }

      console.log('🏗️ Grupos encontrados:', groupsData?.length || 0);
      setGroups(groupsData || []);

    } catch (error) {
      console.error('❌ Erro geral ao carregar dados:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const syncAuthUsers = async () => {
    try {
      console.log('🔄 Verificando usuários sem perfil...');

      const { data: recentUsers, error: recentError } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentError) {
        console.error('Erro ao buscar usuários recentes:', recentError);
      } else {
        console.log('Usuários pendentes recentes:', recentUsers?.length || 0);
      }

      if (!recentUsers || recentUsers.length === 0) {
        alert('Nenhum usuário pendente encontrado. Tente recarregar a página ou verifique se o cadastro foi concluído.');
        return;
      }

      loadData();

    } catch (error) {
      console.error('Erro na sincronização:', error);
      alert('Erro na sincronização: ' + error.message);
    }
  };

  const handleCreateGroup = () => {
    setEditingGroup(null);
    setGroupFormData({
      name: '',
      description: '',
      type: 'team'
    });
    setShowGroupForm(true);
  };

  const handleEditGroup = (group) => {
    setEditingGroup(group);
    setGroupFormData({
      name: group.name,
      description: group.description,
      type: group.type
    });
    setShowGroupForm(true);
  };

  const handleGroupFormSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingGroup) {
        const { error } = await supabase
          .from('user_groups')
          .update({
            name: groupFormData.name,
            description: groupFormData.description,
            type: groupFormData.type
          })
          .eq('id', editingGroup.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_groups')
          .insert({
            name: groupFormData.name,
            description: groupFormData.description,
            type: groupFormData.type
          });

        if (error) throw error;
      }

      setShowGroupForm(false);
      loadData();

    } catch (error) {
      console.error('Erro ao salvar grupo:', error);
      alert('Erro ao salvar grupo: ' + error.message);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Tem certeza que deseja excluir este grupo? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
      loadData();

    } catch (error) {
      console.error('Erro ao excluir grupo:', error);
      alert('Erro ao excluir grupo: ' + error.message);
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'approved' })
        .eq('id', userId);

      if (error) throw error;
      loadData();

    } catch (error) {
      console.error('Erro ao aprovar usuário:', error.message);
    }
  };

  const handleRejectUser = async (userId) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'rejected' })
        .eq('id', userId);

      if (error) throw error;
      loadData();

    } catch (error) {
      console.error('Erro ao rejeitar usuário:', error.message);
    }
  };

  const handleChangeUserRole = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      loadData();

    } catch (error) {
      console.error('Erro ao alterar função:', error.message);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
        <p className="text-gray-600 mt-2">Gerencie usuários, grupos e aprovações</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Aprovações Pendentes ({pendingUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Todos os Usuários ({allUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'groups'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Grupos ({groups.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'pending' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Cadastros Pendentes de Aprovação</h2>
            <div className="flex space-x-2">
              <button
                onClick={loadData}
                className="btn btn-secondary"
              >
                🔄 Atualizar
              </button>
              <button
                onClick={syncAuthUsers}
                className="btn btn-warning"
              >
                🔄 Sync Auth
              </button>
            </div>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum cadastro pendente</h3>
              <p className="mt-1 text-sm text-gray-500">Todos os cadastros estão aprovados!</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {pendingUsers.map((user) => (
                <div key={user.id} className="card p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-medium">
                              {user.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{user.full_name}</h3>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <p className="text-sm text-gray-500">{user.phone}</p>
                          {user.position && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                              {user.position}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                        Pendente
                      </span>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveUser(user.id)}
                          className="btn btn-success btn-sm"
                        >
                          ✓ Aprovar
                        </button>
                        <button
                          onClick={() => handleRejectUser(user.id)}
                          className="btn btn-danger btn-sm"
                        >
                          ✗ Rejeitar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Todos os Usuários</h2>

          <div className="grid gap-4">
            {allUsers.map((user) => (
              <div key={user.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        user.role === 'admin' ? 'bg-red-100' : 'bg-green-100'
                      }`}>
                        <span className={`font-medium ${
                          user.role === 'admin' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {user.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{user.full_name}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.status === 'approved' ? 'bg-green-100 text-green-800' :
                          user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {user.status === 'approved' ? 'Aprovado' :
                           user.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'admin' ? 'Administrador' : 'Jogador'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <select
                      value={user.role}
                      onChange={(e) => handleChangeUserRole(user.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="athlete">Jogador</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'groups' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Grupos</h2>
            <button
              onClick={handleCreateGroup}
              className="btn btn-primary"
            >
              + Novo Grupo
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <div key={group.id} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{group.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      group.type === 'monthly' ? 'bg-green-100 text-green-800' :
                      group.type === 'tournament' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {group.type === 'monthly' ? 'Mensalidade' :
                       group.type === 'tournament' ? 'Torneio' :
                       group.type === 'team' ? 'Equipe' : group.type}
                    </span>
                    <button
                      onClick={() => handleEditGroup(group)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Editar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setSelectedGroup(group)}
                      className="text-green-600 hover:text-green-900"
                      title="Gerenciar Membros"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{group.description}</p>
                <p className="text-xs text-gray-500">
                  Criado em: {new Date(group.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal do Formulário de Grupo */}
      {showGroupForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingGroup ? 'Editar Grupo' : 'Novo Grupo'}
              </h3>
              <button
                onClick={() => setShowGroupForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleGroupFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Grupo
                </label>
                <input
                  type="text"
                  value={groupFormData.name}
                  onChange={(e) => setGroupFormData({...groupFormData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Equipe Principal"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={groupFormData.description}
                  onChange={(e) => setGroupFormData({...groupFormData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descrição do grupo"
                  rows="3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={groupFormData.type}
                  onChange={(e) => setGroupFormData({...groupFormData, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="team">Equipe</option>
                  <option value="monthly">Mensalidade</option>
                  <option value="tournament">Torneio/Campeonato</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowGroupForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  {editingGroup ? 'Atualizar' : 'Criar Grupo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Membros do Grupo */}
      {selectedGroup && (
        <GroupMembers
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
        />
      )}
    </div>
  );
}

export default AdminPanel;
