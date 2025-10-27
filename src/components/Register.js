import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function Register({ onRegisterSuccess, onBackToLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    birthDate: '',
    rg: '',
    region: '',
    gender: '',
    phone: '',
    position: '',
    responsibleName: '',
    responsiblePhone: ''
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione apenas arquivos de imagem');
        return;
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 5MB');
        return;
      }

      setProfilePhoto(file);
      
      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validações básicas
    if (!profilePhoto) {
      setError('A foto de perfil é obrigatória');
      setLoading(false);
      return;
    }

    if (!formData.birthDate) {
      setError('A data de nascimento é obrigatória');
      setLoading(false);
      return;
    }

    if (!formData.rg || formData.rg.trim() === '') {
      setError('O RG é obrigatório');
      setLoading(false);
      return;
    }

    if (!formData.region) {
      setError('A região de SP é obrigatória');
      setLoading(false);
      return;
    }

    if (!formData.phone || formData.phone.trim() === '') {
      setError('O telefone (WhatsApp) é obrigatório');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      // Criar usuário no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            position: formData.position
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        console.log('✅ Usuário criado no auth:', data.user.id);

        // Converter foto para base64 (igual fazemos com comprovantes!)
        let avatarBase64 = null;
        try {
          console.log('📸 Convertendo foto para base64...');
          
          avatarBase64 = photoPreview; // Já temos o base64 do preview!
          
          if (!avatarBase64 || !avatarBase64.startsWith('data:image')) {
            throw new Error('Foto inválida');
          }
          
          console.log('✅ Foto convertida para base64!');
          console.log('🔍 Tamanho do base64:', avatarBase64.length);
        } catch (photoError) {
          console.error('❌ Erro ao processar foto:', photoError);
          throw new Error('Erro ao processar foto de perfil');
        }

        // Criar perfil manualmente na tabela profiles
        try {
          console.log('💾 Salvando perfil no banco...');
          console.log('📸 Avatar base64 (primeiros 50 chars):', avatarBase64?.substring(0, 50));
          
          const profileToInsert = {
            id: data.user.id,
            email: formData.email,
            full_name: formData.fullName,
            birth_date: formData.birthDate,
            rg: formData.rg,
            region: formData.region,
            gender: formData.gender || null,
            phone: formData.phone,
            position: formData.position,
            responsible_name: formData.responsibleName || null,
            responsible_phone: formData.responsiblePhone || null,
            avatar_url: avatarBase64, // Salvando base64 ao invés de URL!
            role: 'athlete',
            status: 'pending'
          };
          
          console.log('📋 Dados completos a inserir (sem base64 completo):', {
            ...profileToInsert,
            avatar_url: avatarBase64 ? `[BASE64 - ${avatarBase64.length} chars]` : null
          });
          
          const { data: profileData, error: insertError } = await supabase
            .from('profiles')
            .insert(profileToInsert)
            .select()
            .single();

          if (insertError) {
            console.error('❌ Erro ao criar perfil:', insertError);

            // Tentar atualizar se já existe
            console.log('⚠️ Insert falhou, tentando UPDATE...');
            console.log('📸 Avatar base64 no UPDATE (primeiros 50 chars):', avatarBase64?.substring(0, 50));
            
            const updateData = {
              full_name: formData.fullName,
              birth_date: formData.birthDate,
              rg: formData.rg,
              region: formData.region,
              gender: formData.gender || null,
              phone: formData.phone,
              position: formData.position,
              responsible_name: formData.responsibleName || null,
              responsible_phone: formData.responsiblePhone || null,
              avatar_url: avatarBase64, // Salvando base64 ao invés de URL!
              status: 'pending'
            };
            
            console.log('📋 Dados do UPDATE (sem base64 completo):', {
              ...updateData,
              avatar_url: avatarBase64 ? `[BASE64 - ${avatarBase64.length} chars]` : null
            });
            
            const { error: updateError } = await supabase
              .from('profiles')
              .update(updateData)
              .eq('id', data.user.id);

            if (updateError) {
              console.error('❌ Erro ao atualizar perfil:', updateError);
              throw new Error('Não foi possível criar perfil do usuário');
            } else {
              console.log('✅ Perfil atualizado com sucesso');
            }
          } else {
            console.log('✅ Perfil criado com sucesso:', profileData);
          }
          
          // VERIFICAR o que foi salvo no banco
          const { data: savedProfile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', data.user.id)
            .single();
          
          console.log('🔍 VERIFICAÇÃO FINAL - Perfil salvo no banco:');
          console.log('   Nome:', savedProfile?.full_name);
          console.log('   Avatar (primeiros 50 chars):', savedProfile?.avatar_url?.substring(0, 50));
          console.log('   É base64?', savedProfile?.avatar_url?.startsWith('data:image'));
          console.log('   Tamanho do base64:', savedProfile?.avatar_url?.length);
          
        } catch (profileError) {
          console.error('❌ Erro geral ao criar perfil:', profileError);
          throw profileError;
        }

        onRegisterSuccess(formData.email);
      }
    } catch (error) {
      setError(error.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full md:max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏆 Despesas São Luiz
          </h1>
          <p className="text-gray-600">
            Cadastro de Novo Atleta
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Ficha Cadastral</h3>

            {/* Foto de Perfil */}
            <div>
              <label className="label">Foto de Perfil *</label>
              <div className="mt-2">
                {photoPreview ? (
                  <div className="flex items-center gap-4">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-24 h-24 rounded-full object-cover border-2 border-primary-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-2">Foto selecionada com sucesso! ✓</p>
                      <button
                        type="button"
                        onClick={() => {
                          setProfilePhoto(null);
                          setPhotoPreview(null);
                        }}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        ✕ Remover foto
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Clique para enviar</span> ou arraste
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG ou JPEG (MAX. 5MB)</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        required
                      />
                    </label>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                📸 A foto de perfil é obrigatória para aprovação do cadastro
              </p>
            </div>

            {/* Nome Completo */}
            <div>
              <label className="label">Nome Completo *</label>
              <input
                type="text"
                name="fullName"
                className="input"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Digite seu nome completo"
                required
              />
            </div>

            {/* Data de Nascimento */}
            <div>
              <label className="label">Data de Nascimento *</label>
              <input
                type="date"
                name="birthDate"
                className="input"
                value={formData.birthDate}
                onChange={handleChange}
                required
              />
            </div>

            {/* RG */}
            <div>
              <label className="label">RG *</label>
              <input
                type="text"
                name="rg"
                className="input"
                value={formData.rg}
                onChange={handleChange}
                placeholder="Apenas números (ex: 123456789)"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Digite apenas o número do RG</p>
            </div>

            {/* Região de SP */}
            <div>
              <label className="label">Residente de qual região de SP? *</label>
              <select
                name="region"
                className="input"
                value={formData.region}
                onChange={handleChange}
                required
              >
                <option value="">Selecione a região</option>
                <option value="Zona Leste">Zona Leste</option>
                <option value="Zona Oeste">Zona Oeste</option>
                <option value="Zona Sul">Zona Sul</option>
                <option value="Zona Norte">Zona Norte</option>
                <option value="Centro">Centro</option>
                <option value="ABC">ABC</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            {/* Gênero */}
            <div>
              <label className="label">Gênero</label>
              <select
                name="gender"
                className="input"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Selecione (opcional)</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            {/* Telefone (WhatsApp) */}
            <div>
              <label className="label">Telefone (WhatsApp) *</label>
              <input
                type="tel"
                name="phone"
                className="input"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(11) 99999-9999"
                required
              />
            </div>

            {/* Posição no Time */}
            <div>
              <label className="label">Posição no Time *</label>
              <select
                name="position"
                className="input"
                value={formData.position}
                onChange={handleChange}
                required
              >
                <option value="">Selecione sua posição</option>
                <option value="Levantador">Levantador</option>
                <option value="Oposto">Oposto</option>
                <option value="Central">Central</option>
                <option value="Ponteiro">Ponteiro</option>
                <option value="Líbero">Líbero</option>
                <option value="Técnico">Técnico</option>
                <option value="Preparador Físico">Preparador Físico</option>
                <option value="Massagista">Massagista</option>
                <option value="Torcedor">Torcedor</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            {/* Nome do Responsável */}
            <div>
              <label className="label">Nome do Responsável</label>
              <input
                type="text"
                name="responsibleName"
                className="input"
                value={formData.responsibleName}
                onChange={handleChange}
                placeholder="Nome completo (opcional)"
              />
              <p className="text-xs text-gray-500 mt-1">Apenas para menores de idade</p>
            </div>

            {/* Telefone do Responsável */}
            <div>
              <label className="label">Telefone (WhatsApp) do Responsável</label>
              <input
                type="tel"
                name="responsiblePhone"
                className="input"
                value={formData.responsiblePhone}
                onChange={handleChange}
                placeholder="(11) 99999-9999 (opcional)"
              />
            </div>

            {/* Divisor */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h4 className="text-md font-semibold text-gray-900 mb-3">🔐 Dados de Acesso</h4>
            </div>

            {/* Email */}
            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                name="email"
                className="input"
                value={formData.email}
                onChange={handleChange}
                placeholder="Digite seu email"
                required
              />
            </div>

            {/* Senha */}
            <div>
              <label className="label">Senha *</label>
              <input
                type="password"
                name="password"
                className="input"
                value={formData.password}
                onChange={handleChange}
                placeholder="Digite sua senha (mínimo 6 caracteres)"
                required
              />
            </div>

            <div>
              <label className="label">Confirmar Senha *</label>
              <input
                type="password"
                name="confirmPassword"
                className="input"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirme sua senha"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full py-3 touch-manipulation"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando conta...
                </>
              ) : (
                '📝 Criar Conta'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onBackToLogin}
              className="btn-secondary w-full py-3 touch-manipulation"
            >
              ← Voltar ao Login
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Após criar sua conta, aguarde a aprovação do administrador para acessar o sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;

