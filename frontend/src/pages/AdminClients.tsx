import React, { useEffect, useMemo, useState } from 'react';
import { KeyRound, RefreshCw, Search, Shield, UserPlus, Users } from 'lucide-react';

import { adminClientService } from '../api/services';
import { Layout } from '../components/Layout';
import type { PortalAdminClient, PortalAdminUser, TramiteListItem } from '../types';
import { getDisplayActName } from '../utils/tramites';

const emptyForm = {
  document_type: 'DNI',
  document_number: '',
  full_name: '',
  email: '',
  phone: '',
  address: '',
};

const emptyEditForm = {
  email: '',
  phone: '',
  address: '',
};

const normalizeClients = (value: unknown): PortalAdminClient[] => {
  if (Array.isArray(value)) {
    return value;
  }
  return [];
};

const AdminClients: React.FC = () => {
  const [clients, setClients] = useState<PortalAdminClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [signoTramites, setSignoTramites] = useState<Record<number, TramiteListItem[]>>({});
  const [temporaryPasswords, setTemporaryPasswords] = useState<Record<number, string>>({});
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [savingClientId, setSavingClientId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await adminClientService.listClients();
      setClients(normalizeClients(data));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.detail || 'No se pudieron cargar los clientes del portal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const filteredClients = useMemo(() => {
    const safeClients = normalizeClients(clients);
    const term = search.trim().toLowerCase();
    if (!term) return safeClients;
    return safeClients.filter((client) =>
      [client.document_number, client.full_name, client.email || '', client.phone || '']
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [clients, search]);

  const safeClients = normalizeClients(clients);

  const handleCreateClient = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await adminClientService.createClient(form);
      setForm(emptyForm);
      setMessage('Cliente creado correctamente.');
      await loadClients();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.document_number?.[0] || requestError?.response?.data?.detail || 'No se pudo crear el cliente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateUser = async (client: PortalAdminClient) => {
    setError('');
    setMessage('');
    if (!client.email?.trim()) {
      setEditingClientId(client.id);
      setEditForm({
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
      });
      setError('Primero complete el correo del cliente para poder crear el usuario.');
      return;
    }
    try {
      const response = await adminClientService.createUser(client.id, {
        email: client.email || '',
      });
      setTemporaryPasswords((current) => ({ ...current, [client.id]: response.data.temporary_password }));
      setMessage(`Usuario creado para ${client.full_name}.`);
      await loadClients();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.email?.[0] || requestError?.response?.data?.non_field_errors?.[0] || 'No se pudo crear el usuario.');
    }
  };

  const handleStartEditClient = (client: PortalAdminClient) => {
    setEditingClientId(client.id);
    setEditForm({
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
    });
    setError('');
    setMessage('');
  };

  const handleCancelEditClient = () => {
    setEditingClientId(null);
    setEditForm(emptyEditForm);
  };

  const handleSaveClient = async (client: PortalAdminClient) => {
    setSavingClientId(client.id);
    setError('');
    setMessage('');
    try {
      await adminClientService.updateClient(client.id, {
        email: editForm.email.trim() || null,
        phone: editForm.phone.trim() || null,
        address: editForm.address.trim() || null,
      });
      setMessage(`Datos actualizados para ${client.full_name}.`);
      handleCancelEditClient();
      await loadClients();
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.email?.[0] ||
        requestError?.response?.data?.detail ||
        'No se pudieron actualizar los datos del cliente.'
      );
    } finally {
      setSavingClientId(null);
    }
  };

  const handleResetPassword = async (user: PortalAdminUser, clientId: number) => {
    setError('');
    setMessage('');
    try {
      const response = await adminClientService.resetPassword(user.id);
      setTemporaryPasswords((current) => ({ ...current, [clientId]: response.data.temporary_password }));
      setMessage(`Contraseña restablecida para ${user.username}.`);
      await loadClients();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.detail || 'No se pudo restablecer la contraseña.');
    }
  };

  const handleToggleUser = async (user: PortalAdminUser, nextStatus: boolean) => {
    setError('');
    setMessage('');
    try {
      await adminClientService.disableUser(user.id, nextStatus);
      setMessage(nextStatus ? 'Usuario activado correctamente.' : 'Usuario desactivado correctamente.');
      await loadClients();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.detail || 'No se pudo actualizar el estado del usuario.');
    }
  };

  const handleLoadTramites = async (clientId: number) => {
    setSelectedClientId(clientId);
    setError('');
    setMessage('');
    try {
      const response = await adminClientService.getClientTramites(clientId);
      setSignoTramites((current) => ({ ...current, [clientId]: response.data.tramites }));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.detail || 'No se pudieron consultar los trámites en SIGNO.');
    } finally {
      setSelectedClientId(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-notary-900 via-notary-800 to-notary-700 rounded-2xl p-8 text-white shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-extrabold mb-2">Administración de Clientes</h1>
              <p className="text-notary-100 opacity-90">
                Crea cuentas del portal, entrega contraseñas temporales y consulta los trámites reales por DNI/RUC.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/20 bg-white/10 px-5 py-4">
                <p className="text-3xl font-extrabold">{safeClients.length}</p>
                <p className="text-sm text-notary-100">Clientes registrados</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 px-5 py-4">
                <p className="text-3xl font-extrabold">
                  {safeClients.reduce((total, client) => total + (client.users?.length || 0), 0)}
                </p>
                <p className="text-sm text-notary-100">Usuarios del portal</p>
              </div>
            </div>
          </div>
        </div>

        {message && <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-green-700">{message}</div>}
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">{error}</div>}

        <div className="grid grid-cols-1 xl:grid-cols-[380px,1fr] gap-8">
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-notary-100 text-notary-700 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-neutral-900">Nuevo cliente</h2>
                <p className="text-sm text-neutral-500">Registro base del titular del portal</p>
              </div>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Tipo de documento</label>
                <select
                  value={form.document_type}
                  onChange={(event) => setForm((current) => ({ ...current, document_type: event.target.value }))}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3"
                >
                  <option value="DNI">DNI</option>
                  <option value="RUC">RUC</option>
                  <option value="CE">CE</option>
                  <option value="PAS">Pasaporte</option>
                </select>
              </div>

              {[
                ['document_number', 'Número de documento'],
                ['full_name', 'Nombre / razón social'],
                ['email', 'Correo'],
                ['phone', 'Celular'],
                ['address', 'Dirección'],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>
                  <input
                    value={(form as Record<string, string>)[key]}
                    onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3"
                    required={key === 'document_number' || key === 'full_name'}
                  />
                </div>
              ))}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-notary-700 text-white font-semibold py-3.5 hover:bg-notary-800 transition-colors disabled:opacity-60"
              >
                {submitting ? 'Guardando...' : 'Crear cliente'}
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por documento, nombre, correo o celular"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-12 pr-4 py-3.5"
                />
              </div>
            </div>

            <div className="space-y-5">
              {loading ? (
                <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center">
                  <div className="w-10 h-10 border-4 border-notary-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-neutral-600">Cargando clientes...</p>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-neutral-500">
                  No hay clientes que coincidan con la búsqueda.
                </div>
              ) : (
                filteredClients.map((client) => (
                  <div key={client.id} className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
                    {(() => {
                      const primaryUser = client.users?.[0];
                      return (
                        <>
                    <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-notary-100 text-notary-700 text-xs font-semibold">
                            {client.document_type} {client.document_number}
                          </span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${client.is_active ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'}`}>
                            {client.is_active ? 'Cliente activo' : 'Cliente inactivo'}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-neutral-900">{client.full_name}</h3>
                          <p className="text-sm text-neutral-500">{client.email || 'Sin correo'} • {client.phone || 'Sin celular'}</p>
                          <p className="text-sm text-neutral-500">{client.address || 'Sin dirección'}</p>
                        </div>
                        <div className="text-sm text-neutral-600">
                          Último acceso:{' '}
                          <span className="font-medium text-neutral-900">
                            {primaryUser?.last_login_at ? new Date(primaryUser.last_login_at).toLocaleString('es-PE') : 'Sin acceso todavía'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => handleStartEditClient(client)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                        >
                          Editar datos
                        </button>
                        {primaryUser ? (
                          <>
                            <button
                              onClick={() => handleResetPassword(primaryUser, client.id)}
                              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                            >
                              <KeyRound className="w-4 h-4" />
                              Resetear contraseña
                            </button>
                            <button
                              onClick={() => handleToggleUser(primaryUser, !primaryUser.is_active)}
                              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                            >
                              <Shield className="w-4 h-4" />
                              {primaryUser.is_active ? 'Desactivar usuario' : 'Activar usuario'}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleCreateUser(client)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-notary-700 text-white hover:bg-notary-800"
                          >
                            <Users className="w-4 h-4" />
                            Crear usuario
                          </button>
                        )}

                        <button
                          onClick={() => handleLoadTramites(client.id)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-500 text-notary-950 font-semibold hover:bg-gold-400"
                        >
                          <RefreshCw className={`w-4 h-4 ${selectedClientId === client.id ? 'animate-spin' : ''}`} />
                          Buscar trámites en SIGNO
                        </button>
                      </div>
                    </div>

                    {temporaryPasswords[client.id] && (
                      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        Contraseña temporal actual: <span className="font-bold">{temporaryPasswords[client.id]}</span>
                      </div>
                    )}

                    {editingClientId === client.id && (
                      <div className="mt-5 rounded-2xl border border-notary-200 bg-notary-50 px-5 py-5">
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-neutral-900">Editar datos del cliente</p>
                          <p className="text-xs text-neutral-500">El correo es obligatorio para crear el usuario del portal.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Correo</label>
                            <input
                              type="email"
                              value={editForm.email}
                              onChange={(event) => setEditForm((current) => ({ ...current, email: event.target.value }))}
                              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3"
                              placeholder="cliente@correo.com"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Celular</label>
                            <input
                              value={editForm.phone}
                              onChange={(event) => setEditForm((current) => ({ ...current, phone: event.target.value }))}
                              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3"
                              placeholder="987654321"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Dirección</label>
                            <input
                              value={editForm.address}
                              onChange={(event) => setEditForm((current) => ({ ...current, address: event.target.value }))}
                              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3"
                              placeholder="Dirección del cliente"
                            />
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => handleSaveClient(client)}
                            disabled={savingClientId === client.id}
                            className="inline-flex items-center gap-2 rounded-xl bg-notary-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-notary-800 disabled:opacity-60"
                          >
                            {savingClientId === client.id ? 'Guardando...' : 'Guardar cambios'}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEditClient}
                            disabled={savingClientId === client.id}
                            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    {primaryUser && (
                      <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-4">
                        <p className="text-sm font-semibold text-neutral-900 mb-2">Usuario del portal</p>
                        <p className="text-sm text-neutral-600">
                          {primaryUser.username} • {primaryUser.email} • {primaryUser.must_change_password ? 'Debe cambiar contraseña' : 'Contraseña vigente'}
                        </p>
                      </div>
                    )}

                    {signoTramites[client.id] && (
                      <div className="mt-5 rounded-2xl border border-neutral-200 overflow-hidden">
                        <div className="px-5 py-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-neutral-900">Trámites detectados en SIGNO</p>
                            <p className="text-xs text-neutral-500">{signoTramites[client.id].length} encontrados para este documento</p>
                          </div>
                        </div>
                        <div className="divide-y divide-neutral-200">
                          {signoTramites[client.id].length === 0 ? (
                            <div className="px-5 py-4 text-sm text-neutral-500">No se encontraron trámites asociados a este DNI/RUC.</div>
                          ) : (
                            signoTramites[client.id].map((tramite) => (
                              <div key={tramite.kardex} className="px-5 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-neutral-900">{tramite.kardex} • {getDisplayActName(tramite)}</p>
                                  <p className="text-sm text-neutral-500">
                                    {tramite.cliente_nombre || tramite.contratantes?.[0]?.full_name || 'Titular no informado'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm text-neutral-500">{tramite.fechaingreso}</span>
                                  <span className="inline-flex px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs font-semibold">
                                    {tramite.estado_general}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                        </>
                      );
                    })()}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminClients;
