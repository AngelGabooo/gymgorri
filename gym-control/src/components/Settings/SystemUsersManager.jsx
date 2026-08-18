// src/components/Settings/SystemUsersManager.jsx

import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  AlertCircle,
  Check,
  CircleDot,
  Eye,
  EyeOff,
  LayoutDashboard,
  LockKeyhole,
  Plus,
  QrCode,
  RefreshCw,
  Save,
  Search,
  Shield,
  Trash2,
  UserCog,
  UserRound,
  Users,
  X
} from 'lucide-react';

import {
  createGymUserId,
  getGymUsersByGymId,
  isGymUserEmailTaken,
  saveGymUsersForGym
} from '../../utils/gymSettings';

import {
  hashValue
} from '../../utils/memberId';

import {
  ALL_PERMISSIONS,
  DEFAULT_RECEPTION_PERMISSIONS,
  PERMISSION_OPTIONS,
  getCurrentSession,
  getRoleLabel,
  normalizePermissions
} from '../../services/authService';


// ======================================================
// PASSWORD TEMPORAL
// ======================================================

const generateTemporaryPassword =
  () => {

    const chars =
      'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

    let password =
      'Gym!';


    for (
      let index = 0;
      index < 8;
      index += 1
    ) {

      password +=
        chars.charAt(
          Math.floor(
            Math.random() *
            chars.length
          )
        );

    }


    return password;

  };


// ======================================================
// ICONOS DE PERMISOS
// ======================================================

const getPermissionIcon = (
  permission
) => {

  if (
    permission ===
    'dashboard'
  ) {
    return LayoutDashboard;
  }


  if (
    permission ===
    'access'
  ) {
    return QrCode;
  }


  return Shield;

};


// ======================================================
// COMPONENTE
// ======================================================

const SystemUsersManager =
  () => {

    const session =
      getCurrentSession();


    const currentGymId =
      session?.gymId ||
      null;

    const currentGymCode =
      session?.gymCode ||
      null;

    const currentGymName =
      session?.gymName ||
      null;

    const currentGymStatus =
      session?.gymStatus ||
      'active';


    const loadCurrentGymUsers =
      () =>
        getGymUsersByGymId(
          currentGymId
        );


    const [
      users,
      setUsers
    ] = useState(
      () =>
        loadCurrentGymUsers()
    );


    const [
      search,
      setSearch
    ] = useState('');


    const [
      drawerOpen,
      setDrawerOpen
    ] = useState(
      false
    );


    const [
      editingUser,
      setEditingUser
    ] = useState(
      null
    );


    const [
      showPassword,
      setShowPassword
    ] = useState(
      true
    );


    const [
      errors,
      setErrors
    ] = useState({});


    const [
      deleteUser,
      setDeleteUser
    ] = useState(
      null
    );


    const [
      form,
      setForm
    ] = useState({

      name:
        '',

      email:
        '',

      password:
        generateTemporaryPassword(),

      role:
        'reception',

      permissions: [
        ...DEFAULT_RECEPTION_PERMISSIONS
      ]

    });


    // ====================================================
    // REFRESCAR
    // ====================================================

    const refreshUsers =
      () => {

        setUsers(
          loadCurrentGymUsers()
        );

      };


    useEffect(
      () => {

        const refresh =
          () =>
            refreshUsers();


        window.addEventListener(
          'gym-storage-update',
          refresh
        );


        window.addEventListener(
          'storage',
          refresh
        );


        return () => {

          window.removeEventListener(
            'gym-storage-update',
            refresh
          );


          window.removeEventListener(
            'storage',
            refresh
          );

        };

      },
      []
    );


    // ====================================================
    // FILTRO
    // ====================================================

    const filteredUsers =
      useMemo(
        () => {

          const term =
            search
              .trim()
              .toLowerCase();


          if (!term) {
            return users;
          }


          return users.filter(
            user =>
              String(
                user.name ||
                ''
              )
                .toLowerCase()
                .includes(
                  term
                ) ||
              String(
                user.email ||
                ''
              )
                .toLowerCase()
                .includes(
                  term
                )
          );

        },
        [
          users,
          search
        ]
      );


    // ====================================================
    // ABRIR NUEVO
    // ====================================================

    const openCreate =
      () => {

        setEditingUser(
          null
        );


        setForm({

          name:
            '',

          email:
            '',

          password:
            generateTemporaryPassword(),

          role:
            'reception',

          permissions: [
            ...DEFAULT_RECEPTION_PERMISSIONS
          ]

        });


        setErrors({});

        setShowPassword(
          true
        );

        setDrawerOpen(
          true
        );

      };


    // ====================================================
    // ABRIR EDICIÓN
    // ====================================================

    const openEdit =
      user => {

        setEditingUser(
          user
        );


        setForm({

          name:
            user.name ||
            '',

          email:
            user.email ||
            '',

          password:
            '',

          role:
            user.role ||
            'reception',

          permissions:
            normalizePermissions(
              user.role ||
              'reception',
              user.permissions
            )

        });


        setErrors({});

        setShowPassword(
          false
        );

        setDrawerOpen(
          true
        );

      };


  // ======================================================
// CAMBIAR ROL
// ======================================================

const handleUserRoleChange =
  (
    role
  ) => {

    setUserForm(
      previous => ({

        ...previous,

        role,

        permissions:
          role ===
          'admin'
            ? [
                ...ALL_PERMISSIONS
              ]
            : [
                ...DEFAULT_RECEPTION_PERMISSIONS
              ]

      })
    );

  };


// ======================================================
// CAMBIAR PERMISO
// ======================================================

const handleUserPermissionToggle =
  (
    permission
  ) => {

    if (
      userForm.role ===
      'admin'
    ) {

      return;

    }


    setUserForm(
      previous => {

        const exists =
          previous
            .permissions
            .includes(
              permission
            );


        return {

          ...previous,

          permissions:
            exists
              ? previous
                  .permissions
                  .filter(
                    item =>
                      item !==
                      permission
                  )
              : [
                  ...previous.permissions,
                  permission
                ]

        };

      }
    );

  };
  
    // ====================================================
    // TOGGLE PERMISO
    // ====================================================

    const togglePermission =
      permission => {

        if (
          form.role ===
            'owner' ||
          form.role ===
            'admin'
        ) {
          return;
        }


        setForm(
          previous => {

            const exists =
              previous.permissions.includes(
                permission
              );


            return {

              ...previous,

              permissions:
                exists
                  ? previous.permissions.filter(
                      item =>
                        item !==
                        permission
                    )
                  : [
                      ...previous.permissions,
                      permission
                    ]

            };

          }
        );

      };


    // ====================================================
    // GUARDAR
    // ====================================================

    const handleSaveUser =
      async () => {

        const nextErrors = {};


        if (
          !form.name.trim()
        ) {
          nextErrors.name =
            'Ingresa el nombre.';
        }


        if (
          !form.email.trim() ||
          !form.email.includes(
            '@'
          )
        ) {
          nextErrors.email =
            'Ingresa un correo válido.';
        }


        const duplicate =
          isGymUserEmailTaken(
            form.email,
            editingUser?.id ||
              null
          );


        if (
          duplicate
        ) {
          nextErrors.email =
            'Este correo ya está registrado.';
        }


        if (
          !editingUser &&
          form.password.length <
          6
        ) {
          nextErrors.password =
            'La contraseña debe tener al menos 6 caracteres.';
        }


        if (
          editingUser &&
          form.password &&
          form.password.length <
          6
        ) {
          nextErrors.password =
            'La contraseña debe tener al menos 6 caracteres.';
        }


        if (
          form.role ===
            'reception' &&
          form.permissions.length ===
            0
        ) {
          nextErrors.permissions =
            'Selecciona por lo menos un apartado.';
        }


        if (
          Object.keys(
            nextErrors
          ).length >
          0
        ) {

          setErrors(
            nextErrors
          );

          return;

        }


        try {

          const now =
            new Date()
              .toISOString();


          let passwordHash =
            editingUser?.passwordHash ||
            null;


          if (
            form.password
          ) {

            passwordHash =
              await hashValue(
                form.password
              );

          }


          const permissions =
            normalizePermissions(
              form.role,
              form.permissions
            );


          const userData = {

            ...(editingUser ||
              {}),

            id:
              editingUser?.id ||
              createGymUserId(),

            name:
              form.name.trim(),

            email:
              form.email
                .trim()
                .toLowerCase(),

            passwordHash,

            gymId:
              editingUser?.gymId ||
              currentGymId,

            gymCode:
              editingUser?.gymCode ||
              currentGymCode,

            gymName:
              editingUser?.gymName ||
              currentGymName,

            gymStatus:
              editingUser?.gymStatus ||
              currentGymStatus,

            role:
              form.role,

            permissions,

            status:
              editingUser?.status ||
              'active',

            createdAt:
              editingUser?.createdAt ||
              now,

            updatedAt:
              now,

            lastAccessAt:
              editingUser?.lastAccessAt ||
              null

          };


          const updatedUsers =
            editingUser
              ? users.map(
                  user =>
                    user.id ===
                    editingUser.id
                      ? userData
                      : user
                )
              : [
                  ...users,
                  userData
                ];


          saveGymUsersForGym(
            currentGymId,
            updatedUsers
          );


          setUsers(
            updatedUsers
          );


          setDrawerOpen(
            false
          );


          setEditingUser(
            null
          );


          window.dispatchEvent(
            new Event(
              'gym-storage-update'
            )
          );


          window.alert(
            editingUser
              ? 'Usuario y permisos actualizados correctamente.'
              : 'Usuario creado correctamente.'
          );

        } catch (error) {

          console.error(
            'Error guardando usuario:',
            error
          );


          window.alert(
            'No se pudo guardar el usuario.'
          );

        }

      };


    // ====================================================
    // ACTIVAR / DESACTIVAR
    // ====================================================

    const toggleStatus =
      user => {

        if (
          user.role ===
            'owner'
        ) {

          window.alert(
            'El usuario principal no puede ser desactivado.'
          );

          return;

        }


        const updated =
          users.map(
            item =>
              item.id ===
              user.id
                ? {
                    ...item,

                    status:
                      item.status ===
                        'active'
                        ? 'inactive'
                        : 'active',

                    updatedAt:
                      new Date()
                        .toISOString()
                  }
                : item
          );


        saveGymUsersForGym(
          currentGymId,
          updated
        );


        setUsers(
          updated
        );


        window.dispatchEvent(
          new Event(
            'gym-storage-update'
          )
        );

      };


    // ====================================================
    // ELIMINAR
    // ====================================================

    const confirmDelete =
      () => {

        if (!deleteUser) {
          return;
        }


        if (
          deleteUser.role ===
            'owner'
        ) {

          setDeleteUser(
            null
          );


          window.alert(
            'El usuario principal no puede eliminarse.'
          );

          return;

        }


        const updated =
          users.filter(
            user =>
              user.id !==
              deleteUser.id
          );


        saveGymUsersForGym(
          currentGymId,
          updated
        );


        setUsers(
          updated
        );


        setDeleteUser(
          null
        );


        window.dispatchEvent(
          new Event(
            'gym-storage-update'
          )
        );


        window.alert(
          'Usuario eliminado correctamente.'
        );

      };


    // ====================================================
    // RENDER
    // ====================================================

    return (

      <div className="space-y-6">

        {/* RESUMEN */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-5">

            <p className="text-gray-500 text-xs">
              Usuarios registrados
            </p>

            <p className="text-white text-2xl font-bold mt-1">
              {users.length}
            </p>

          </div>


          <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-5">

            <p className="text-gray-500 text-xs">
              Usuarios activos
            </p>

            <p className="text-[#00ff88] text-2xl font-bold mt-1">
              {
                users.filter(
                  user =>
                    user.status ===
                    'active'
                ).length
              }
            </p>

          </div>


          <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-5">

            <p className="text-gray-500 text-xs">
              Encargados
            </p>

            <p className="text-blue-400 text-2xl font-bold mt-1">
              {
                users.filter(
                  user =>
                    user.role ===
                    'reception'
                ).length
              }
            </p>

          </div>

        </div>


        {/* INFORMACIÓN */}

        <div className="bg-[#00ff88]/5 border border-[#00ff88]/15 rounded-2xl p-5 flex gap-4">

          <div className="w-10 h-10 rounded-xl bg-[#00ff88]/10 flex items-center justify-center shrink-0">

            <LockKeyhole
              size={19}
              className="text-[#00ff88]"
            />

          </div>


          <div>

            <p className="text-white font-semibold">
              Acceso por correo autorizado
            </p>

            <p className="text-gray-500 text-sm mt-1 leading-6">
              Solo los correos registrados aquí podrán iniciar sesión. Para un encargado puedes dejar únicamente Dashboard y Control de acceso.
            </p>

          </div>

        </div>


        {/* BARRA */}

        <div className="flex flex-col sm:flex-row gap-3">

          <div className="relative flex-1">

            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
            />

            <input
              type="text"
              value={
                search
              }
              onChange={
                event =>
                  setSearch(
                    event.target.value
                  )
              }
              placeholder="Buscar usuario por nombre o correo..."
              className="w-full bg-[#151515] border border-[#242424] rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff88]/40"
            />

          </div>


          <button
            type="button"
            onClick={
              openCreate
            }
            className="px-5 py-3 bg-[#00ff88] text-black rounded-xl font-bold flex items-center justify-center gap-2"
          >

            <Plus size={17} />

            Agregar usuario

          </button>

        </div>


        {/* TABLA */}

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl overflow-hidden">

          {
            filteredUsers.length ===
            0
              ? (

                <div className="py-16 text-center">

                  <Users
                    size={42}
                    className="text-gray-700 mx-auto"
                  />

                  <p className="text-white font-semibold mt-4">
                    No hay usuarios
                  </p>

                </div>

              )
              : (

                <div className="overflow-x-auto">

                  <table className="w-full">

                    <thead className="bg-[#0d0d0d] border-b border-[#1d1d1d]">

                      <tr>

                        <th className="text-left px-4 py-3 text-gray-600 text-[10px] uppercase tracking-wider">
                          Usuario
                        </th>

                        <th className="text-left px-4 py-3 text-gray-600 text-[10px] uppercase tracking-wider">
                          Rol
                        </th>

                        <th className="text-left px-4 py-3 text-gray-600 text-[10px] uppercase tracking-wider">
                          Permisos
                        </th>

                        <th className="text-left px-4 py-3 text-gray-600 text-[10px] uppercase tracking-wider">
                          Estado
                        </th>

                        <th className="text-right px-4 py-3 text-gray-600 text-[10px] uppercase tracking-wider">
                          Acciones
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {
                        filteredUsers.map(
                          user => {

                            const permissions =
                              normalizePermissions(
                                user.role,
                                user.permissions
                              );


                            return (

                              <tr
                                key={
                                  user.id
                                }
                                className="border-b border-[#181818] last:border-0"
                              >

                                <td className="px-4 py-4">

                                  <div className="flex items-center gap-3">

                                    <div className="w-10 h-10 rounded-xl bg-[#00ff88]/10 flex items-center justify-center">

                                      {
                                        user.role ===
                                          'reception'
                                          ? (
                                            <UserRound
                                              size={18}
                                              className="text-blue-400"
                                            />
                                          )
                                          : (
                                            <UserCog
                                              size={18}
                                              className="text-[#00ff88]"
                                            />
                                          )
                                      }

                                    </div>


                                    <div>

                                      <p className="text-white text-sm font-medium">
                                        {user.name}
                                      </p>

                                      <p className="text-gray-600 text-xs mt-0.5">
                                        {user.email}
                                      </p>

                                    </div>

                                  </div>

                                </td>


                                <td className="px-4 py-4">

                                  <span className="text-gray-300 text-xs">
                                    {
                                      getRoleLabel(
                                        user.role
                                      )
                                    }
                                  </span>

                                </td>


                                <td className="px-4 py-4">

                                  <div className="flex flex-wrap gap-1.5 max-w-[360px]">

                                    {
                                      permissions
                                        .slice(
                                          0,
                                          4
                                        )
                                        .map(
                                          permission => {

                                            const option =
                                              PERMISSION_OPTIONS.find(
                                                item =>
                                                  item.id ===
                                                  permission
                                              );


                                            return (

                                              <span
                                                key={
                                                  permission
                                                }
                                                className="px-2 py-1 rounded-md bg-[#1a1a1a] text-gray-400 text-[9px]"
                                              >
                                                {
                                                  option?.label ||
                                                  permission
                                                }
                                              </span>

                                            );

                                          }
                                        )
                                    }


                                    {
                                      permissions.length >
                                      4 &&
                                      (

                                        <span className="px-2 py-1 rounded-md bg-[#00ff88]/10 text-[#00ff88] text-[9px]">
                                          +{permissions.length - 4}
                                        </span>

                                      )
                                    }

                                  </div>

                                </td>


                                <td className="px-4 py-4">

                                  <span
                                    className={`
                                      inline-flex
                                      items-center
                                      gap-1.5
                                      px-2
                                      py-1
                                      rounded-full
                                      text-[10px]

                                      ${
                                        user.status ===
                                          'active'
                                          ? 'bg-[#00ff88]/10 text-[#00ff88]'
                                          : 'bg-red-500/10 text-red-400'
                                      }
                                    `}
                                  >

                                    <CircleDot size={10} />

                                    {
                                      user.status ===
                                        'active'
                                        ? 'Activo'
                                        : 'Inactivo'
                                    }

                                  </span>

                                </td>


                                <td className="px-4 py-4">

                                  <div className="flex justify-end gap-2">

                                    <button
                                      type="button"
                                      onClick={() =>
                                        openEdit(
                                          user
                                        )
                                      }
                                      className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#292929] text-gray-300 text-xs hover:border-[#00ff88]/40"
                                    >
                                      Permisos
                                    </button>


                                    {
                                      user.role !==
                                        'owner' &&
                                      (

                                        <button
                                          type="button"
                                          onClick={() =>
                                            toggleStatus(
                                              user
                                            )
                                          }
                                          className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#292929] text-gray-400 text-xs hover:text-white"
                                        >
                                          {
                                            user.status ===
                                              'active'
                                              ? 'Desactivar'
                                              : 'Activar'
                                          }
                                        </button>

                                      )
                                    }


                                    {
                                      user.role !==
                                        'owner' &&
                                      (

                                        <button
                                          type="button"
                                          onClick={() =>
                                            setDeleteUser(
                                              user
                                            )
                                          }
                                          className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/15 text-red-400 flex items-center justify-center"
                                        >
                                          <Trash2 size={15} />
                                        </button>

                                      )
                                    }

                                  </div>

                                </td>

                              </tr>

                            );

                          }
                        )
                      }

                    </tbody>

                  </table>

                </div>

              )
          }

        </div>


        {/* DRAWER */}

        {
          drawerOpen &&
          (

            <div className="fixed inset-0 z-[100] flex justify-end">

              <button
                type="button"
                className="absolute inset-0 bg-black/75"
                onClick={() =>
                  setDrawerOpen(
                    false
                  )
                }
              />


              <div className="relative w-full max-w-xl h-full overflow-y-auto bg-[#101010] border-l border-[#222222] shadow-2xl">

                <div className="p-6">

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <p className="text-[#00ff88] text-[10px] uppercase tracking-[0.16em] font-bold">
                        Usuarios y roles
                      </p>

                      <h2 className="text-white text-2xl font-bold mt-1">
                        {
                          editingUser
                            ? 'Editar usuario'
                            : 'Nuevo usuario'
                        }
                      </h2>

                      <p className="text-gray-500 text-sm mt-1">
                        Define quién puede ingresar y qué apartados puede utilizar.
                      </p>

                    </div>


                    <button
                      type="button"
                      onClick={() =>
                        setDrawerOpen(
                          false
                        )
                      }
                      className="w-10 h-10 rounded-xl bg-[#191919] border border-[#292929] text-gray-500 flex items-center justify-center"
                    >
                      <X size={18} />
                    </button>

                  </div>


                  <div className="space-y-5 mt-7">

                    <div>

                      <label className="text-white text-sm font-medium block mb-2">
                        Nombre
                      </label>

                      <input
                        value={
                          form.name
                        }
                        onChange={
                          event =>
                            setForm(
                              previous => ({
                                ...previous,
                                name:
                                  event.target.value
                              })
                            )
                        }
                        className={`w-full bg-[#191919] border ${errors.name ? 'border-red-500' : 'border-[#292929]'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00ff88]/40`}
                        placeholder="Ej. Carlos López"
                      />

                      {
                        errors.name &&
                        <p className="text-red-400 text-xs mt-1">{errors.name}</p>
                      }

                    </div>


                    <div>

                      <label className="text-white text-sm font-medium block mb-2">
                        Correo autorizado
                      </label>

                      <input
                        type="email"
                        value={
                          form.email
                        }
                        onChange={
                          event =>
                            setForm(
                              previous => ({
                                ...previous,
                                email:
                                  event.target.value
                              })
                            )
                        }
                        className={`w-full bg-[#191919] border ${errors.email ? 'border-red-500' : 'border-[#292929]'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00ff88]/40`}
                        placeholder="encargado@gimnasio.com"
                      />

                      <p className="text-gray-600 text-[10px] mt-1">
                        Solo este correo podrá utilizar estas credenciales.
                      </p>

                      {
                        errors.email &&
                        <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                      }

                    </div>


                    <div>

                      <label className="text-white text-sm font-medium block mb-2">
                        {
                          editingUser
                            ? 'Nueva contraseña (opcional)'
                            : 'Contraseña temporal'
                        }
                      </label>


                      <div className="flex gap-2">

                        <div className="relative flex-1">

                          <input
                            type={
                              showPassword
                                ? 'text'
                                : 'password'
                            }
                            value={
                              form.password
                            }
                            onChange={
                              event =>
                                setForm(
                                  previous => ({
                                    ...previous,
                                    password:
                                      event.target.value
                                  })
                                )
                            }
                            className={`w-full bg-[#191919] border ${errors.password ? 'border-red-500' : 'border-[#292929]'} rounded-xl px-4 pr-11 py-3 text-white focus:outline-none`}
                            placeholder={
                              editingUser
                                ? 'Dejar vacío para conservar'
                                : ''
                            }
                          />


                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword(
                                previous =>
                                  !previous
                              )
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
                          >
                            {
                              showPassword
                                ? <EyeOff size={17} />
                                : <Eye size={17} />
                            }
                          </button>

                        </div>


                        <button
                          type="button"
                          onClick={() =>
                            setForm(
                              previous => ({
                                ...previous,
                                password:
                                  generateTemporaryPassword()
                              })
                            )
                          }
                          className="w-12 rounded-xl bg-[#191919] border border-[#292929] text-gray-400 flex items-center justify-center"
                          title="Generar contraseña"
                        >
                          <RefreshCw size={17} />
                        </button>

                      </div>


                      {
                        errors.password &&
                        <p className="text-red-400 text-xs mt-1">{errors.password}</p>
                      }

                    </div>


                    {/* ROL */}

                    <div>

                      <label className="text-white text-sm font-medium block mb-3">
                        Rol
                      </label>


                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">

                        {
                          [
                            {
                              id:
                                'owner',
                              label:
                                'Dueño',
                              description:
                                'Acceso total'
                            },
                            {
                              id:
                                'admin',
                              label:
                                'Administrador',
                              description:
                                'Acceso total'
                            },
                            {
                              id:
                                'reception',
                              label:
                                'Encargado',
                              description:
                                'Permisos personalizados'
                            }
                          ].map(
                            role => (

                              <button
                                key={
                                  role.id
                                }
                                type="button"
                                disabled={
                                  editingUser?.role ===
                                    'owner' &&
                                  role.id !==
                                    'owner'
                                }
                                onClick={() =>
                                  changeRole(
                                    role.id
                                  )
                                }
                                className={`
                                  p-4
                                  rounded-xl
                                  border
                                  text-left
                                  transition-all

                                  ${
                                    form.role ===
                                      role.id
                                      ? 'bg-[#00ff88]/10 border-[#00ff88]/40'
                                      : 'bg-[#171717] border-[#292929]'
                                  }

                                  disabled:opacity-50
                                `}
                              >

                                <p className="text-white text-sm font-semibold">
                                  {role.label}
                                </p>

                                <p className="text-gray-600 text-[10px] mt-1">
                                  {role.description}
                                </p>

                              </button>

                            )
                          )
                        }

                      </div>

                    </div>


                    {/* PERMISOS */}

                    <div>

                      <div className="flex items-center justify-between gap-3 mb-3">

                        <div>

                          <label className="text-white text-sm font-medium">
                            Permisos de acceso
                          </label>

                          <p className="text-gray-600 text-[10px] mt-1">
                            Los apartados no seleccionados desaparecerán del menú y tampoco podrán abrirse por URL.
                          </p>

                        </div>


                        {
                          form.role ===
                            'reception' &&
                          (

                            <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[9px]">
                              Personalizable
                            </span>

                          )
                        }

                      </div>


                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

                        {
                          PERMISSION_OPTIONS.map(
                            permission => {

                              const checked =
                                form.role ===
                                  'owner' ||
                                form.role ===
                                  'admin' ||
                                form.permissions.includes(
                                  permission.id
                                );


                              const Icon =
                                getPermissionIcon(
                                  permission.id
                                );


                              return (

                                <button
                                  type="button"
                                  key={
                                    permission.id
                                  }
                                  disabled={
                                    form.role !==
                                    'reception'
                                  }
                                  onClick={() =>
                                    togglePermission(
                                      permission.id
                                    )
                                  }
                                  className={`
                                    p-3
                                    rounded-xl
                                    border
                                    text-left
                                    transition-all

                                    ${
                                      checked
                                        ? 'bg-[#00ff88]/5 border-[#00ff88]/25'
                                        : 'bg-[#171717] border-[#292929]'
                                    }

                                    disabled:cursor-default
                                  `}
                                >

                                  <div className="flex items-start gap-3">

                                    <div
                                      className={`
                                        w-8
                                        h-8
                                        rounded-lg
                                        flex
                                        items-center
                                        justify-center
                                        shrink-0

                                        ${
                                          checked
                                            ? 'bg-[#00ff88]/10'
                                            : 'bg-[#1d1d1d]'
                                        }
                                      `}
                                    >

                                      {
                                        checked
                                          ? (
                                            <Check
                                              size={15}
                                              className="text-[#00ff88]"
                                            />
                                          )
                                          : (
                                            <Icon
                                              size={15}
                                              className="text-gray-600"
                                            />
                                          )
                                      }

                                    </div>


                                    <div>

                                      <p
                                        className={`
                                          text-xs
                                          font-semibold

                                          ${
                                            checked
                                              ? 'text-white'
                                              : 'text-gray-500'
                                          }
                                        `}
                                      >
                                        {permission.label}
                                      </p>

                                      <p className="text-gray-600 text-[9px] mt-1 leading-4">
                                        {permission.description}
                                      </p>

                                    </div>

                                  </div>

                                </button>

                              );

                            }
                          )
                        }

                      </div>


                      {
                        errors.permissions &&
                        (

                          <div className="flex items-center gap-2 text-red-400 text-xs mt-2">

                            <AlertCircle size={14} />

                            {errors.permissions}

                          </div>

                        )
                      }

                    </div>


                    <div className="p-4 rounded-xl bg-[#171717] border border-[#242424]">

                      <div className="flex items-start gap-3">

                        <Shield
                          size={18}
                          className="text-[#00ff88] mt-0.5 shrink-0"
                        />

                        <p className="text-gray-500 text-xs leading-5">

                          {
                            form.role ===
                              'reception'
                              ? 'Para el encargado recomendamos dejar Dashboard y Control de acceso. Puedes agregar otros apartados cuando lo necesites.'
                              : 'Este rol tendrá acceso completo a todos los apartados del sistema.'
                          }

                        </p>

                      </div>

                    </div>


                    <button
                      type="button"
                      onClick={
                        handleSaveUser
                      }
                      className="w-full py-3 bg-[#00ff88] text-black rounded-xl font-bold flex items-center justify-center gap-2"
                    >

                      <Save size={17} />

                      {
                        editingUser
                          ? 'Guardar usuario y permisos'
                          : 'Crear usuario'
                      }

                    </button>

                  </div>

                </div>

              </div>

            </div>

          )
        }


        {/* ELIMINAR */}

        {
          deleteUser &&
          (

            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">

              <button
                type="button"
                onClick={() =>
                  setDeleteUser(
                    null
                  )
                }
                className="absolute inset-0 bg-black/80"
              />


              <div className="relative w-full max-w-md rounded-2xl bg-[#111111] border border-red-500/20 p-7">

                <Trash2
                  size={32}
                  className="text-red-400"
                />

                <h3 className="text-white text-xl font-bold mt-4">
                  Eliminar usuario
                </h3>

                <p className="text-gray-500 text-sm mt-2">
                  {deleteUser.name} ya no podrá iniciar sesión con {deleteUser.email}.
                </p>


                <div className="flex gap-3 mt-6">

                  <button
                    type="button"
                    onClick={() =>
                      setDeleteUser(
                        null
                      )
                    }
                    className="flex-1 py-2.5 rounded-xl bg-[#1a1a1a] text-white"
                  >
                    Cancelar
                  </button>


                  <button
                    type="button"
                    onClick={
                      confirmDelete
                    }
                    className="flex-1 py-2.5 rounded-xl bg-red-500/10 text-red-400"
                  >
                    Eliminar
                  </button>

                </div>

              </div>

            </div>

          )
        }

      </div>

    );

  };


export default SystemUsersManager;