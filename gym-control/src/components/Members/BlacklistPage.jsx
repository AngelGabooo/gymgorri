// src/components/Members/BlacklistPage.jsx

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  Mail,
  Phone,
  RotateCcw,
  Search,
  ShieldAlert,
  UserRound,
  XCircle
} from 'lucide-react';

import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';

import {
  clearBlacklistRecord,
  getBlacklist,
  reactivateBlacklistRecord
} from '../../services/blacklistService';

import {
  getCurrentSession
} from '../../services/authService';

import AdminAuthorizationModal
  from '../common/AdminAuthorizationModal';

const formatDateTime = value => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const BlacklistPage = () => {
  const navigate = useNavigate();
  const session = getCurrentSession();

  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('active');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const [
    adminAction,
    setAdminAction
  ] = useState(null);

  const loadRecords = () => {
    setRecords(getBlacklist());
  };

  useEffect(() => {
    loadRecords();

    const refresh = () => loadRecords();

    window.addEventListener('gym-storage-update', refresh);
    window.addEventListener('gym-blacklist-update', refresh);
    window.addEventListener('storage', refresh);

    return () => {
      window.removeEventListener('gym-storage-update', refresh);
      window.removeEventListener('gym-blacklist-update', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const isOwnerOrAdmin =
    session?.role === 'owner' ||
    session?.role === 'admin';

  const stats = useMemo(() => {
    const active = records.filter(item => item.status !== 'cleared').length;
    const cleared = records.filter(item => item.status === 'cleared').length;

    return {
      total: records.length,
      active,
      cleared
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return records
      .filter(record => {
        if (filter === 'active' && record.status === 'cleared') return false;
        if (filter === 'cleared' && record.status !== 'cleared') return false;
        return true;
      })
      .filter(record => {
        if (!term) return true;

        const haystack = [
          record.fullName,
          record.firstName,
          record.lastName,
          record.phone,
          record.email,
          record.previousMemberId,
          record.reason
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(term);
      });
  }, [records, searchTerm, filter]);

  const executeClear = () => {
    if (!selectedRecord) return;

    try {
      clearBlacklistRecord({
        blacklistId: selectedRecord.id,
        actor: session,
        note
      });

      setShowClearModal(false);
      setAdminAction(null);
      setSelectedRecord(null);
      setNote('');
      setError('');
      loadRecords();
    } catch (err) {
      setError(err?.message || 'No se pudo actualizar el registro.');
    }
  };


  const handleClear = () => {
    if (!selectedRecord) return;

    if (!isOwnerOrAdmin) {
      setError('Solo el dueño o un administrador puede retirar a una persona de la lista negra.');
      return;
    }

    setAdminAction({
      action:
        'blacklist_clear',

      title:
        'Quitar de lista negra',

      description:
        'La alerta dejará de estar activa. Esta acción requiere autorización administrativa.',

      confirmLabel:
        'Autorizar retiro',

      target: {
        id:
          selectedRecord.previousMemberId ||
          selectedRecord.id,

        label:
          selectedRecord.fullName ||
          `${selectedRecord.firstName || ''} ${selectedRecord.lastName || ''}`.trim() ||
          'Registro de lista negra'
      },

      onAuthorized:
        executeClear
    });
  };

  const executeReactivate = () => {
    if (!selectedRecord) return;

    try {
      reactivateBlacklistRecord({
        blacklistId: selectedRecord.id,
        actor: session,
        reason: note || selectedRecord.reason
      });

      setShowReactivateModal(false);
      setAdminAction(null);
      setSelectedRecord(null);
      setNote('');
      setError('');
      loadRecords();
    } catch (err) {
      setError(err?.message || 'No se pudo reactivar el registro.');
    }
  };


  const handleReactivate = () => {
    if (!selectedRecord) return;

    if (!isOwnerOrAdmin) {
      setError('Solo el dueño o un administrador puede reactivar una alerta de lista negra.');
      return;
    }

    setAdminAction({
      action:
        'blacklist_reactivate',

      title:
        'Reactivar alerta de lista negra',

      description:
        'El antecedente volverá a marcarse como alerta activa. Se requiere autorización administrativa.',

      confirmLabel:
        'Autorizar reactivación',

      target: {
        id:
          selectedRecord.previousMemberId ||
          selectedRecord.id,

        label:
          selectedRecord.fullName ||
          `${selectedRecord.firstName || ''} ${selectedRecord.lastName || ''}`.trim() ||
          'Registro de lista negra'
      },

      onAuthorized:
        executeReactivate
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar activePage="Lista negra" />

      <div className="flex-1 lg:ml-0 min-w-0">
        <Header />

        <main className="p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <button
                type="button"
                onClick={() => navigate('/members')}
                className="text-gray-400 hover:text-white text-sm flex items-center gap-2 mb-3"
              >
                <ArrowLeft size={16} />
                Volver a miembros
              </button>

              <h1 className="text-2xl font-black text-white flex items-center gap-3">
                <ShieldAlert className="text-red-400" />
                Lista negra
              </h1>

              <p className="text-gray-400 mt-1">
                Historial de personas eliminadas o marcadas con antecedentes administrativos.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/members/register')}
              className="px-5 py-2.5 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] transition-colors"
            >
              Registrar miembro
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-5">
              <p className="text-gray-500 text-xs uppercase tracking-wider">Registros</p>
              <p className="text-3xl font-black text-white mt-1">{stats.total}</p>
            </div>

            <div className="bg-[#111111] border border-red-500/20 rounded-xl p-5">
              <p className="text-gray-500 text-xs uppercase tracking-wider">Alertas activas</p>
              <p className="text-3xl font-black text-red-400 mt-1">{stats.active}</p>
            </div>

            <div className="bg-[#111111] border border-[#00ff88]/20 rounded-xl p-5">
              <p className="text-gray-500 text-xs uppercase tracking-wider">Retirados de alerta</p>
              <p className="text-3xl font-black text-[#00ff88] mt-1">{stats.cleared}</p>
            </div>
          </div>

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  placeholder="Buscar por nombre, teléfono, correo, ID anterior o motivo..."
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                {[
                  ['active', 'Activos'],
                  ['cleared', 'Retirados'],
                  ['all', 'Todos']
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFilter(id)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                      filter === id
                        ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/30'
                        : 'bg-[#1a1a1a] text-gray-400 border-[#2a2a2a] hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-[#1a1a1a] mx-auto flex items-center justify-center mb-4">
                <CheckCircle2 size={30} className="text-gray-600" />
              </div>
              <h3 className="text-white font-bold text-lg">No hay registros para mostrar</h3>
              <p className="text-gray-500 text-sm mt-1">La lista negra se actualizará automáticamente al eliminar miembros con motivo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredRecords.map(record => {
                const active = record.status !== 'cleared';

                return (
                  <div
                    key={record.id}
                    className={`bg-[#111111] rounded-xl border p-5 ${
                      active ? 'border-red-500/20' : 'border-[#00ff88]/15'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`relative w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border ${
                        active
                          ? 'bg-red-500/10 border-red-500/20'
                          : 'bg-[#00ff88]/10 border-[#00ff88]/20'
                      }`}>

                        {
                          record.profilePhoto ||
                          record.lastMemberSnapshot?.profilePhoto
                            ? (

                              <img
                                src={
                                  record.profilePhoto ||
                                  record.lastMemberSnapshot?.profilePhoto
                                }
                                alt={
                                  record.fullName ||
                                  'Persona en lista negra'
                                }
                                className="w-full h-full object-cover"
                              />

                            )
                            : (
                              active
                                ? (
                                  <Ban size={24} className="text-red-400" />
                                )
                                : (
                                  <CheckCircle2 size={24} className="text-[#00ff88]" />
                                )
                            )
                        }


                        <div className={`absolute right-1 bottom-1 w-5 h-5 rounded-full flex items-center justify-center border border-black ${
                          active
                            ? 'bg-red-500'
                            : 'bg-[#00ff88]'
                        }`}>
                          {
                            active
                              ? <Ban size={11} className="text-white" />
                              : <CheckCircle2 size={11} className="text-black" />
                          }
                        </div>

                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-white font-bold text-lg">
                            {record.fullName || 'Sin nombre'}
                          </h3>

                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            active
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-[#00ff88]/10 text-[#00ff88]'
                          }`}>
                            {active ? 'ALERTA ACTIVA' : 'RETIRADO'}
                          </span>
                        </div>

                        <p className="text-gray-500 font-mono text-xs mt-1">
                          ID anterior: {record.previousMemberId || '—'}
                        </p>

                        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-sm">
                          {record.phone && (
                            <span className="text-gray-400 flex items-center gap-2">
                              <Phone size={14} /> {record.phone}
                            </span>
                          )}

                          {record.email && (
                            <span className="text-gray-400 flex items-center gap-2 min-w-0">
                              <Mail size={14} />
                              <span className="truncate">{record.email}</span>
                            </span>
                          )}
                        </div>

                        <div className="mt-4 rounded-xl bg-[#0d0d0d] border border-[#1f1f1f] p-4">
                          <p className="text-gray-500 text-[11px] uppercase tracking-wider">Motivo</p>
                          <p className="text-white text-sm mt-1">{record.reason || 'Sin motivo registrado'}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs">

                          <div>
                            <p className="text-gray-600">Registrado en lista</p>
                            <p className="text-gray-300 mt-0.5">{formatDateTime(record.addedAt)}</p>
                          </div>

                          <div>
                            <p className="text-gray-600">Registrado por</p>
                            <p className="text-gray-300 mt-0.5">
                              {record.addedBy?.name || 'Sistema'}
                              {record.addedBy?.role ? ` · ${record.addedBy.role}` : ''}
                            </p>
                          </div>

                          <div>
                            <p className="text-gray-600">Origen</p>
                            <p className="text-gray-300 mt-0.5 capitalize">
                              {
                                record.source === 'deleted'
                                  ? 'Miembro eliminado'
                                  : record.source === 'blocked'
                                    ? 'Bloqueo administrativo'
                                    : record.source || 'Administrativo'
                              }
                            </p>
                          </div>

                          <div>
                            <p className="text-gray-600">Última actualización</p>
                            <p className="text-gray-300 mt-0.5">{formatDateTime(record.updatedAt || record.addedAt)}</p>
                          </div>

                        </div>


                        {
                          record.notes &&
                          (

                            <div className="mt-4 rounded-xl bg-[#0d0d0d] border border-[#1f1f1f] p-4">
                              <p className="text-gray-500 text-[11px] uppercase tracking-wider">
                                Notas administrativas
                              </p>
                              <p className="text-gray-300 text-sm mt-1">
                                {record.notes}
                              </p>
                            </div>

                          )
                        }

                        {record.clearedAt && (
                          <div className="mt-4 text-xs text-[#00ff88]">
                            Retirado de alerta: {formatDateTime(record.clearedAt)}
                            {record.clearedBy?.name ? ` · ${record.clearedBy.name}` : ''}
                          </div>
                        )}

                        {isOwnerOrAdmin && (
                          <div className="mt-5 flex flex-wrap gap-2">
                            {active ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRecord(record);
                                  setNote('');
                                  setError('');
                                  setShowClearModal(true);
                                }}
                                className="px-4 py-2 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] text-sm font-semibold hover:bg-[#00ff88]/15"
                              >
                                Retirar de lista negra
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRecord(record);
                                  setNote(record.reason || '');
                                  setError('');
                                  setShowReactivateModal(true);
                                }}
                                className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/15 flex items-center gap-2"
                              >
                                <RotateCcw size={15} />
                                Reactivar alerta
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {showClearModal && selectedRecord && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111111] border border-[#00ff88]/20 rounded-2xl p-6">
            <div className="w-12 h-12 rounded-xl bg-[#00ff88]/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="text-[#00ff88]" />
            </div>

            <h2 className="text-white text-xl font-black">Retirar de lista negra</h2>
            <p className="text-gray-400 text-sm mt-2">
              La persona conservará su historial, pero dejará de generar una advertencia bloqueante al registrarla nuevamente.
            </p>

            <textarea
              value={note}
              onChange={event => setNote(event.target.value)}
              rows="3"
              placeholder="Motivo de autorización (opcional)..."
              className="w-full mt-5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none resize-none"
            />

            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowClearModal(false);
                  setSelectedRecord(null);
                  setError('');
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-white"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#00ff88] text-black font-bold"
              >
                Autorizar
              </button>
            </div>
          </div>
        </div>
      )}

      {showReactivateModal && selectedRecord && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111111] border border-red-500/20 rounded-2xl p-6">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
              <AlertTriangle className="text-red-400" />
            </div>

            <h2 className="text-white text-xl font-black">Reactivar alerta</h2>
            <p className="text-gray-400 text-sm mt-2">
              Esta persona volverá a generar advertencias durante un nuevo registro.
            </p>

            <textarea
              value={note}
              onChange={event => setNote(event.target.value)}
              rows="3"
              placeholder="Motivo de la alerta..."
              className="w-full mt-5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-red-400 focus:outline-none resize-none"
            />

            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowReactivateModal(false);
                  setSelectedRecord(null);
                  setError('');
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-white"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleReactivate}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 font-bold"
              >
                Reactivar
              </button>
            </div>
          </div>
        </div>
      )}
      <AdminAuthorizationModal
        open={
          Boolean(
            adminAction
          )
        }
        action={
          adminAction?.action
        }
        title={
          adminAction?.title
        }
        description={
          adminAction?.description
        }
        confirmLabel={
          adminAction?.confirmLabel
        }
        target={
          adminAction?.target
        }
        onAuthorized={
          adminAction?.onAuthorized
        }
        onClose={() =>
          setAdminAction(
            null
          )
        }
      />

    </div>
  );
};

export default BlacklistPage;
