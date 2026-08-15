// src/components/Settings/SettingsPage.jsx

import React, {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  useNavigate
} from 'react-router-dom';

import {
  ALL_PERMISSIONS,
  PERMISSION_OPTIONS,
  DEFAULT_RECEPTION_PERMISSIONS,
  getRoleLabel,
  normalizePermissions,
  refreshCurrentSession,
  getCurrentSession
} from '../../services/authService';

import {
  Building,
  Users,
  CreditCard,
  Mail,
  Phone,
  Upload,
  X,
  Check,
  AlertCircle,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Save,
  Camera,
  DollarSign,
  UserCog,
  UserCheck,
  UserMinus,
  Activity,
  CircleDot,
  Eye,
  EyeOff,
  Shield,
  Clock,
  Image as ImageIcon
} from 'lucide-react';

import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';
import SettingsStatCard from './Cards/SettingsStatCard';
import PaymentReceipt from '../Payments/PaymentReceipt';
import WhatsAppSettingsPanel from '../WhatsApp/WhatsAppSettingsPanel';

import {
  useGymSettings
} from '../../context/GymSettingsContext';

import {
  createGymUserId,
  getGymUsers,
  saveGymUsers
} from '../../utils/gymSettings';

import {
  hashValue
} from '../../utils/memberId';

import {
  ADMIN_SECURITY_ACTIONS,
  getAdminSecurityAudit,
  getAdminSecurityConfig,
  setAdminAuthorizationPassword,
  updateAdminProtectionSettings
} from '../../services/adminSecurityService';


// ======================================================
// STORAGE
// ======================================================

const ATTENDANCE_KEY =
  'gym_control_attendance';


// ======================================================
// LEER ARRAY LOCAL
// ======================================================

const readLocalArray = (
  key
) => {

  try {

    const raw =
      localStorage.getItem(
        key
      );


    if (!raw) {
      return [];
    }


    const parsed =
      JSON.parse(
        raw
      );


    return Array.isArray(parsed)
      ? parsed
      : [];

  } catch (error) {

    console.error(
      `Error leyendo ${key}:`,
      error
    );


    return [];

  }

};


// ======================================================
// COPIA PROFUNDA
// ======================================================

const cloneData = (
  value
) => {

  return JSON.parse(
    JSON.stringify(
      value
    )
  );

};


// ======================================================
// CONTRASEÑA TEMPORAL
// ======================================================

const generateTemporaryPassword =
  () => {

    const chars =
      'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

    let password =
      'Gym!';


    for (
      let i = 0;
      i < 8;
      i += 1
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
// DÍAS
// ======================================================

const DAYS = [

  {
    key:
      'monday',

    label:
      'Lunes'
  },

  {
    key:
      'tuesday',

    label:
      'Martes'
  },

  {
    key:
      'wednesday',

    label:
      'Miércoles'
  },

  {
    key:
      'thursday',

    label:
      'Jueves'
  },

  {
    key:
      'friday',

    label:
      'Viernes'
  },

  {
    key:
      'saturday',

    label:
      'Sábado'
  },

  {
    key:
      'sunday',

    label:
      'Domingo'
  }

];


// ======================================================
// FECHAS PARA VISTA PREVIA DEL RECIBO
// ======================================================

const formatDateForReceiptPreview = (
  value
) => {

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'es-MX',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }
  ).format(date);
};


const addCalendarMonth = (
  value
) => {

  const date =
    new Date(value);

  date.setHours(
    12,
    0,
    0,
    0
  );

  const originalDay =
    date.getDate();

  date.setDate(1);
  date.setMonth(
    date.getMonth() +
    1
  );

  const lastDay =
    new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    ).getDate();

  date.setDate(
    Math.min(
      originalDay,
      lastDay
    )
  );

  return date;
};


// ======================================================
// COMPONENTE
// ======================================================

const SettingsPage = () => {

  const navigate =
    useNavigate();

  const currentSession =
    getCurrentSession();


  const {
    settings:
      globalSettings,

    updateSettings
  } = useGymSettings();


  const logoInputRef =
    useRef(null);


  // ======================================================
  // TABS
  // ======================================================

  const [
    activeTab,
    setActiveTab
  ] = useState(
    'general'
  );


  // ======================================================
  // SEGURIDAD ADMINISTRATIVA
  // ======================================================

  const [
    adminSecurity,
    setAdminSecurity
  ] = useState(
    () =>
      getAdminSecurityConfig()
  );


  const [
    adminPassword,
    setAdminPassword
  ] = useState('');


  const [
    adminPasswordConfirm,
    setAdminPasswordConfirm
  ] = useState('');


  const [
    showAdminPassword,
    setShowAdminPassword
  ] = useState(false);


  const [
    securitySaving,
    setSecuritySaving
  ] = useState(false);


  const [
    securityMessage,
    setSecurityMessage
  ] = useState({
    type: '',
    text: ''
  });


  const [
    securityAudit,
    setSecurityAudit
  ] = useState(
    () =>
      getAdminSecurityAudit()
  );


  useEffect(
    () => {

      const refreshSecurity =
        () => {

          setAdminSecurity(
            getAdminSecurityConfig()
          );

          setSecurityAudit(
            getAdminSecurityAudit()
          );

        };


      window.addEventListener(
        'gym-admin-security-update',
        refreshSecurity
      );

      window.addEventListener(
        'gym-admin-security-audit-update',
        refreshSecurity
      );


      return () => {

        window.removeEventListener(
          'gym-admin-security-update',
          refreshSecurity
        );

        window.removeEventListener(
          'gym-admin-security-audit-update',
          refreshSecurity
        );

      };

    },
    []
  );


  // ======================================================
  // CONFIGURACIÓN EN EDICIÓN
  // ======================================================

  const [
    settings,
    setSettings
  ] = useState(
    () =>
      cloneData(
        globalSettings
      )
  );


  const [
    originalSettings,
    setOriginalSettings
  ] = useState(
    () =>
      cloneData(
        globalSettings
      )
  );


  const [
    showSaveBar,
    setShowSaveBar
  ] = useState(
    false
  );


  const [
    showConfirmModal,
    setShowConfirmModal
  ] = useState(
    false
  );


  const [
    showSuccessToast,
    setShowSuccessToast
  ] = useState(
    false
  );


  // ======================================================
  // USUARIOS
  // ======================================================

  const [
    users,
    setUsers
  ] = useState(
    () =>
      getGymUsers()
  );


  const [
    searchTerm,
    setSearchTerm
  ] = useState('');


  const [
    userFilter,
    setUserFilter
  ] = useState(
    'Todos'
  );


  const [
    showUserDrawer,
    setShowUserDrawer
  ] = useState(
    false
  );


  const [
    showDeleteUserModal,
    setShowDeleteUserModal
  ] = useState(
    false
  );


  const [
    selectedUser,
    setSelectedUser
  ] = useState(
    null
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
    userErrors,
    setUserErrors
  ] = useState({});


const [
  userForm,
  setUserForm
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


  // ======================================================
  // CÁMARA
  // ======================================================

  const [
    cameraStatus,
    setCameraStatus
  ] = useState(
    'unknown'
  );


  // ======================================================
  // ASISTENCIA / CAPACIDAD
  // ======================================================

  const [
    attendance,
    setAttendance
  ] = useState(
    () =>
      readLocalArray(
        ATTENDANCE_KEY
      )
  );


  // ======================================================
  // SINCRONIZAR CONFIGURACIÓN GLOBAL
  // ======================================================

  useEffect(
    () => {

      if (
        !showSaveBar
      ) {

        setSettings(
          cloneData(
            globalSettings
          )
        );


        setOriginalSettings(
          cloneData(
            globalSettings
          )
        );

      }

    },
    [
      globalSettings,
      showSaveBar
    ]
  );


  // ======================================================
  // ESCUCHAR STORAGE
  // ======================================================

  useEffect(
    () => {

      const refresh =
        () => {

          setUsers(
            getGymUsers()
          );


          setAttendance(
            readLocalArray(
              ATTENDANCE_KEY
            )
          );

        };


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


  // ======================================================
  // TABS
  // ======================================================

  const tabs = [

    {
      id:
        'general',

      label:
        'General'
    },

    {
      id:
        'suscripciones',

      label:
        'Suscripciones'
    },

    {
      id:
        'promociones',

      label:
        'Promociones'
    },

    {
      id:
        'retencion',

      label:
        'Retención'
    },

    {
      id:
        'acceso',

      label:
        'Control de acceso'
    },

    {
      id:
        'horarios',

      label:
        'Horarios y capacidad'
    },

    {
      id:
        'recibos',

      label:
        'Recibos y pagos'
    },

    {
      id:
        'whatsapp',

      label:
        'WhatsApp'
    },

    {
      id:
        'usuarios',

      label:
        'Usuarios del sistema'
    },

    {
      id:
        'seguridad',

      label:
        'Seguridad'
    }

  ];


  const userFilters = [

    'Todos',

    'Administradores',

    'Recepción',

    'Activos',

    'Inactivos'

  ];


  // ======================================================
  // INPUT GENERAL
  // ======================================================

  const handleInputChange =
    (
      event
    ) => {

      const {
        name,
        value,
        type
      } =
        event.target;


      setSettings(
        previous => ({

          ...previous,

          [name]:
            type ===
            'number'
              ? (
                  value ===
                  ''
                    ? ''
                    : Number(
                        value
                      )
                )
              : value

        })
      );


      setShowSaveBar(
        true
      );

    };


  // ======================================================
  // RETENCIÓN
  // ======================================================

  const handleRetentionChange = (
    key,
    value
  ) => {

    setSettings(
      previous => ({

        ...previous,

        retention: {

          ...(previous.retention || {}),

          [key]:
            value

        }

      })
    );


    setShowSaveBar(
      true
    );

  };


  // ======================================================
  // TOGGLE PRINCIPAL
  // ======================================================

  const handleToggle = (
    key
  ) => {

    setSettings(
      previous => ({

        ...previous,

        [key]:
          !previous[
            key
          ]

      })
    );


    setShowSaveBar(
      true
    );

  };


  // ======================================================
  // PUBLIC INFO
  // ======================================================

  const handlePublicInfoToggle = (
    key
  ) => {

    setSettings(
      previous => ({

        ...previous,

        publicInfo: {

          ...previous.publicInfo,

          [key]:
            !previous
              .publicInfo[
                key
              ]

        }

      })
    );


    setShowSaveBar(
      true
    );

  };


  // ======================================================
  // SONIDOS
  // ======================================================

  const handleSoundToggle = (
    key
  ) => {

    setSettings(
      previous => ({

        ...previous,

        sounds: {

          ...previous.sounds,

          [key]:
            !previous
              .sounds[
                key
              ]

        }

      })
    );


    setShowSaveBar(
      true
    );

  };


  const handleVolumeChange =
    (
      event
    ) => {

      setSettings(
        previous => ({

          ...previous,

          sounds: {

            ...previous.sounds,

            volume:
              Number(
                event.target.value
              )

          }

        })
      );


      setShowSaveBar(
        true
      );

    };


  // ======================================================
  // MÉTODOS DE PAGO
  // ======================================================

  const handlePaymentMethodToggle = (
    method
  ) => {

    setSettings(
      previous => ({

        ...previous,

        paymentMethods: {

          ...previous.paymentMethods,

          [method]:
            !previous
              .paymentMethods[
                method
              ]

        }

      })
    );


    setShowSaveBar(
      true
    );

  };


  // ======================================================
  // HORARIOS
  // ======================================================

  const handleDayToggle = (
    day
  ) => {

    setSettings(
      previous => ({

        ...previous,

        hours: {

          ...previous.hours,

          [day]: {

            ...previous
              .hours[
                day
              ],

            open:
              !previous
                .hours[
                  day
                ]
                .open

          }

        }

      })
    );


    setShowSaveBar(
      true
    );

  };


  const handleDayTimeChange = (
    day,
    field,
    value
  ) => {

    setSettings(
      previous => ({

        ...previous,

        hours: {

          ...previous.hours,

          [day]: {

            ...previous
              .hours[
                day
              ],

            [field]:
              value

          }

        }

      })
    );


    setShowSaveBar(
      true
    );

  };


  // ======================================================
  // LOGO
  // ======================================================

  const handleLogoChange =
    (
      event
    ) => {

      const file =
        event.target.files?.[0];


      if (!file) {
        return;
      }


      if (
        file.size >
        1.5 *
        1024 *
        1024
      ) {

        alert(
          'El logo es demasiado grande. Utiliza una imagen menor a 1.5 MB.'
        );

        return;

      }


      const reader =
        new FileReader();


      reader.onload =
        (
          loadEvent
        ) => {

          setSettings(
            previous => ({

              ...previous,

              logo:
                loadEvent
                  .target
                  .result

            })
          );


          setShowSaveBar(
            true
          );

        };


      reader.readAsDataURL(
        file
      );

    };


  const handleRemoveLogo =
    () => {

      setSettings(
        previous => ({

          ...previous,

          logo:
            null

        })
      );


      setShowSaveBar(
        true
      );

    };


  // ======================================================
  // GUARDAR CONFIGURACIÓN
  // ======================================================

  const handleSave =
    () => {

      if (
        !String(
          settings.gymName ||
          ''
        ).trim()
      ) {

        alert(
          'Debes ingresar el nombre del gimnasio.'
        );

        setActiveTab(
          'general'
        );

        return;

      }


      if (
        Number(
          settings.subscriptionPrice
        ) <
        0
      ) {

        alert(
          'El precio de la suscripción no puede ser negativo.'
        );

        return;

      }


      if (
        Number(
          settings.subscriptionDuration
        ) <=
        0
      ) {

        alert(
          'La duración de la suscripción debe ser mayor a 0.'
        );

        return;

      }


      if (
        Number(
          settings.capacity
        ) <
        0
      ) {

        alert(
          'La capacidad no puede ser negativa.'
        );

        return;

      }


      setShowConfirmModal(
        true
      );

    };


  const handleConfirmSave =
    () => {

      const normalized = {

        ...settings,

        currency:
          settings.currency === 'USD'
            ? 'USD'
            : 'MXN',

        gymName:
          String(
            settings.gymName ||
            ''
          ).trim(),

        shortName:
          String(
            settings.shortName ||
            settings.gymName ||
            'GYM CONTROL'
          ).trim(),

        subscriptionPlans: {

  sevenDays: {
    ...settings.subscriptionPlans.sevenDays,
    price:
      Number(
        settings.subscriptionPlans.sevenDays.price ||
        0
      ),
    days:
      Number(
        settings.subscriptionPlans.sevenDays.days ||
        7
      )
  },

  fifteenDays: {
    ...settings.subscriptionPlans.fifteenDays,
    price:
      Number(
        settings.subscriptionPlans.fifteenDays.price ||
        0
      ),
    days:
      Number(
        settings.subscriptionPlans.fifteenDays.days ||
        15
      )
  },

  monthly: {
    ...settings.subscriptionPlans.monthly,
    price:
      Number(
        settings.subscriptionPlans.monthly.price ||
        0
      ),
    days:
      Number(
        settings.subscriptionPlans.monthly.days ||
        30
      )
  },

  annual: {
    ...settings.subscriptionPlans.annual,
    price:
      Number(
        settings.subscriptionPlans.annual.price ||
        0
      ),
    days:
      Number(
        settings.subscriptionPlans.annual.days ||
        365
      )
  }

},

        warningDays:
          Number(
            settings.warningDays ||
            0
          ),

        scanInterval:
          Number(
            settings.scanInterval ||
            0
          ),

        resultDisplayTime:
          Number(
            settings.resultDisplayTime ||
            1
          ),

        capacity:
          Number(
            settings.capacity ||
            0
          ),

        capacityWarning:
          Number(
            settings.capacityWarning ||
            0
          ),

        capacityCritical:
          Number(
            settings.capacityCritical ||
            0
          )

      };


      const saved =
        updateSettings(
          normalized
        );


      setSettings(
        cloneData(
          saved
        )
      );


      setOriginalSettings(
        cloneData(
          saved
        )
      );


      setShowConfirmModal(
        false
      );


      setShowSaveBar(
        false
      );


      setShowSuccessToast(
        true
      );


      setTimeout(
        () =>
          setShowSuccessToast(
            false
          ),
        3000
      );

    };


  // ======================================================
  // DESCARTAR
  // ======================================================

  const handleDiscard =
    () => {

      setSettings(
        cloneData(
          originalSettings
        )
      );


      setShowSaveBar(
        false
      );

  };


  // ======================================================
  // CÁMARA
  // ======================================================

  const handleTestCamera =
    async () => {

      try {

        setCameraStatus(
          'testing'
        );


        const constraints = {

          video:
            settings.cameraDevice ===
            'front'
              ? {
                  facingMode:
                    'user'
                }
              : settings.cameraDevice ===
                'back'
                ? {
                    facingMode:
                      'environment'
                  }
                : true,

          audio:
            false

        };


        const stream =
          await navigator
            .mediaDevices
            .getUserMedia(
              constraints
            );


        stream
          .getTracks()
          .forEach(
            track =>
              track.stop()
          );


        setCameraStatus(
          'available'
        );

      } catch (error) {

        console.error(
          'Error probando cámara:',
          error
        );


        setCameraStatus(
          'error'
        );

      }

    };


  // ======================================================
  // CAPACIDAD ACTUAL
  // ======================================================

  const currentInside =
    useMemo(
      () => {

        return attendance.filter(
          record =>
            record.status ===
              'inside' &&
            !record.exitAt
        ).length;

      },
      [attendance]
    );


  const occupancyPercentage =
    useMemo(
      () => {

        const capacity =
          Number(
            settings.capacity ||
            0
          );


        if (
          capacity <=
          0
        ) {

          return 0;

        }


        return Math.min(
          100,
          Math.round(
            (
              currentInside /
              capacity
            ) *
            100
          )
        );

      },
      [
        currentInside,
        settings.capacity
      ]
    );


  const occupancyColor =
    occupancyPercentage >=
    Number(
      settings.capacityCritical
    )
      ? 'bg-red-500'
      : occupancyPercentage >=
        Number(
          settings.capacityWarning
        )
        ? 'bg-yellow-500'
        : 'bg-[#00ff88]';


  // ======================================================
  // NUEVO / EDITAR USUARIO
  // ======================================================

  const resetUserForm =
    () => {

      setEditingUser(
        null
      );


      setUserForm({

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


      setUserErrors({});


      setShowPassword(
        true
      );

    };


  const openUserDrawer =
    () => {

      resetUserForm();


      setShowUserDrawer(
        true
      );

    };


  const openEditUserDrawer = (
    user
  ) => {

    setEditingUser(
      user
    );


    const role =
      user.role ||
      'reception';


    setUserForm({

      name:
        user.name ||
        '',

      email:
        user.email ||
        '',

      password:
        '',

      role,

      permissions:
        normalizePermissions(
          role,
          user.permissions
        )

    });


    setUserErrors({});


    setShowPassword(
      false
    );


    setShowUserDrawer(
      true
    );

  };


  // ======================================================
  // CAMBIAR ROL
  // ======================================================

  const handleUserRoleChange = (
    role
  ) => {

    if (
      editingUser?.role ===
      'owner'
    ) {

      return;

    }


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
  // ACTIVAR / DESACTIVAR PERMISO
  // ======================================================

  const handleUserPermissionToggle = (
    permission
  ) => {

    if (
      userForm.role ===
        'admin' ||
      userForm.role ===
        'owner'
    ) {

      return;

    }


    setUserForm(
      previous => {

        const exists =
          previous.permissions.includes(
            permission
          );


        let nextPermissions =
          [...previous.permissions];


        if (exists) {

          nextPermissions =
            nextPermissions.filter(
              item =>
                item !==
                permission
            );


          // Si se quita Productos, también quitamos los permisos
          // que dependen de entrar a /sales/products.
          if (
            permission ===
              'products'
          ) {

            nextPermissions =
              nextPermissions.filter(
                item =>
                  ![
                    'inventory',
                    'inventory_history',
                    'product_analytics'
                  ].includes(
                    item
                  )
              );

          }

        } else {

          nextPermissions.push(
            permission
          );


          // Inventario, historial y analítica se muestran dentro
          // del módulo Productos, por lo que Productos se agrega
          // automáticamente como permiso base.
          if (
            [
              'inventory',
              'inventory_history',
              'product_analytics'
            ].includes(
              permission
            ) &&
            !nextPermissions.includes(
              'products'
            )
          ) {

            nextPermissions.push(
              'products'
            );

          }

        }


        return {

          ...previous,

          permissions:
            [...new Set(
              nextPermissions
            )]

        };

      }
    );


    setUserErrors(
      previous => ({
        ...previous,
        permissions:
          ''
      })
    );

  };


  // ======================================================
  // GUARDAR USUARIO
  // ======================================================

  const handleSaveUser =
    async () => {

      const newErrors = {};


      if (
        !userForm.name.trim()
      ) {

        newErrors.name =
          'Ingresa el nombre.';

      }


      if (
        !userForm.email.trim() ||
        !userForm.email.includes(
          '@'
        )
      ) {

        newErrors.email =
          'Ingresa un correo válido.';

      }


      const emailExists =
        users.some(
          user =>
            user.id !==
              editingUser?.id &&
            String(
              user.email
            )
              .toLowerCase() ===
            userForm.email
              .trim()
              .toLowerCase()
        );


      if (
        emailExists
      ) {

        newErrors.email =
          'Este correo ya está registrado.';

      }


      if (
        !editingUser &&
        userForm.password.length <
        6
      ) {

        newErrors.password =
          'La contraseña debe tener al menos 6 caracteres.';

      }


      if (
        editingUser &&
        userForm.password &&
        userForm.password.length <
        6
      ) {

        newErrors.password =
          'La contraseña debe tener al menos 6 caracteres.';

      }


      if (
        userForm.role ===
          'reception' &&
        userForm.permissions.length ===
          0
      ) {

        newErrors.permissions =
          'Selecciona al menos un apartado para este usuario.';

      }


      if (
        Object.keys(
          newErrors
        ).length >
        0
      ) {

        setUserErrors(
          newErrors
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
          userForm.password
        ) {

          passwordHash =
            await hashValue(
              userForm.password
            );

        }


        const role =
          editingUser?.role ===
            'owner'
            ? 'owner'
            : userForm.role;


        const permissions =
          normalizePermissions(
            role,
            userForm.permissions
          );


        const userData = {

          ...(editingUser ||
            {}),

          id:
            editingUser?.id ||
            createGymUserId(),

          name:
            userForm.name.trim(),

          email:
            userForm.email
              .trim()
              .toLowerCase(),

          passwordHash,

          role,

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


        saveGymUsers(
          updatedUsers
        );


        setUsers(
          updatedUsers
        );


        setShowUserDrawer(
          false
        );


        setEditingUser(
          null
        );


        setUserErrors({});


        refreshCurrentSession();


        window.dispatchEvent(
          new Event(
            'gym-storage-update'
          )
        );


        setShowSuccessToast(
          true
        );


        setTimeout(
          () =>
            setShowSuccessToast(
              false
            ),
          2500
        );

      } catch (error) {

        console.error(
          'Error guardando usuario:',
          error
        );


        alert(
          'No se pudo guardar el usuario.'
        );

      }

    };


  // ======================================================
  // ACTIVAR / DESACTIVAR USUARIO
  // ======================================================

  const handleToggleUserStatus = (
    user
  ) => {

    if (
      user.role ===
      'owner'
    ) {

      alert(
        'El usuario principal no puede desactivarse.'
      );


      return;

    }


    const updatedUsers =
      users.map(
        item => {

          if (
            item.id !==
            user.id
          ) {

            return item;

          }


          return {

            ...item,

            status:
              item.status ===
              'active'
                ? 'inactive'
                : 'active',

            updatedAt:
              new Date()
                .toISOString()

          };

        }
      );


    saveGymUsers(
      updatedUsers
    );


    setUsers(
      updatedUsers
    );


    refreshCurrentSession();


    window.dispatchEvent(
      new Event(
        'gym-storage-update'
      )
    );

  };


  // ======================================================
  // ELIMINAR USUARIO
  // ======================================================

  const requestDeleteUser = (
    user
  ) => {

    if (
      user.role ===
      'owner'
    ) {

      alert(
        'El usuario principal no puede eliminarse.'
      );


      return;

    }


    setSelectedUser(
      user
    );


    setShowDeleteUserModal(
      true
    );

  };


  const confirmDeleteUser =
    () => {

      if (
        !selectedUser
      ) {

        return;

      }


      if (
        selectedUser.role ===
        'owner'
      ) {

        setSelectedUser(
          null
        );


        setShowDeleteUserModal(
          false
        );


        return;

      }


      const updatedUsers =
        users.filter(
          user =>
            user.id !==
            selectedUser.id
        );


      saveGymUsers(
        updatedUsers
      );


      setUsers(
        updatedUsers
      );


      setSelectedUser(
        null
      );


      setShowDeleteUserModal(
        false
      );


      refreshCurrentSession();


      window.dispatchEvent(
        new Event(
          'gym-storage-update'
        )
      );

  };


  // ======================================================
  // USUARIOS FILTRADOS
  // ======================================================

  const filteredUsers =
    useMemo(
      () => {

        const term =
          searchTerm
            .trim()
            .toLowerCase();


        return users.filter(
          user => {

            const matchesSearch =
              !term ||
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
                );


            let matchesFilter =
              true;


            if (
              userFilter ===
              'Administradores'
            ) {

              matchesFilter =
                user.role ===
                  'admin' ||
                user.role ===
                  'owner';

            }


            if (
              userFilter ===
              'Recepción'
            ) {

              matchesFilter =
                user.role ===
                'reception';

            }


            if (
              userFilter ===
              'Activos'
            ) {

              matchesFilter =
                user.status ===
                'active';

            }


            if (
              userFilter ===
              'Inactivos'
            ) {

              matchesFilter =
                user.status ===
                'inactive';

            }


            return (
              matchesSearch &&
              matchesFilter
            );

          }
        );

      },
      [
        users,
        searchTerm,
        userFilter
      ]
    );


  const userStats =
    useMemo(
      () => {

        return {

          total:
            users.length,

          admins:
            users.filter(
              user =>
                user.role ===
                  'admin' ||
                user.role ===
                  'owner'
            ).length,

          reception:
            users.filter(
              user =>
                user.role ===
                'reception'
            ).length,

          active:
            users.filter(
              user =>
                user.status ===
                'active'
            ).length

        };

      },
      [users]
    );


  // ======================================================
  // TOGGLE VISUAL
  // ======================================================

  const Toggle = ({
    enabled,
    onClick
  }) => (

    <button
      type="button"
      onClick={
        onClick
      }
      className={`
        relative
        w-12
        h-6
        rounded-full
        transition-all

        ${
          enabled
            ? 'bg-[#00ff88]'
            : 'bg-[#2a2a2a]'
        }
      `}
    >

      <div
        className={`
          absolute
          top-0.5

          w-5
          h-5

          rounded-full
          bg-white

          transition-all

          ${
            enabled
              ? 'left-6'
              : 'left-0.5'
          }
        `}
      />

    </button>

  );


  // ======================================================
  // GENERAL
  // ======================================================

  const renderGeneralTab =
    () => (

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <div className="xl:col-span-2 space-y-6">


          {/* LOGO */}

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

            <h3 className="text-white font-bold mb-4">
              Logo del gimnasio
            </h3>


            <div className="flex flex-col sm:flex-row items-center gap-6">

              <div className="w-32 h-32 bg-[#1a1a1a] border-2 border-[#2a2a2a] rounded-xl flex items-center justify-center overflow-hidden">

                {
                  settings.logo
                    ? (

                      <img
                        src={
                          settings.logo
                        }
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />

                    )
                    : (

                      <Building
                        size={48}
                        className="text-gray-500"
                      />

                    )
                }

              </div>


              <div>

                <input
                  ref={
                    logoInputRef
                  }
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={
                    handleLogoChange
                  }
                  className="hidden"
                />


                <div className="flex gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      logoInputRef
                        .current
                        ?.click()
                    }
                    className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] flex items-center gap-2"
                  >

                    <Upload
                      size={16}
                    />

                    Cambiar logo

                  </button>


                  {
                    settings.logo &&
                    (

                      <button
                        type="button"
                        onClick={
                          handleRemoveLogo
                        }
                        className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20"
                      >

                        <Trash2
                          size={16}
                        />

                      </button>

                    )
                  }

                </div>


                <p className="text-gray-500 text-xs mt-2">
                  PNG, JPG, WEBP o SVG · Máximo recomendado 1.5 MB.
                </p>

              </div>

            </div>

          </div>


          {/* IDENTIDAD */}

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

            <h3 className="text-white font-bold mb-4">
              Identidad
            </h3>


            <div className="space-y-4">

              <div>

                <label className="text-white text-sm font-medium mb-1 block">
                  Nombre del gimnasio
                </label>


                <input
                  type="text"
                  name="gymName"
                  value={
                    settings.gymName
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Ej. Gorilla Fitness"
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none"
                />

              </div>


              <div>

                <label className="text-white text-sm font-medium mb-1 block">
                  Nombre corto
                </label>


                <input
                  type="text"
                  name="shortName"
                  value={
                    settings.shortName
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Ej. GORILLA"
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none"
                />


                <p className="text-gray-500 text-xs mt-1">
                  Se utilizará en terminal, recibos y otras partes del sistema.
                </p>

              </div>

            </div>

          </div>


          {/* CONTACTO */}

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

            <h3 className="text-white font-bold mb-4">
              Información de contacto
            </h3>


            <div className="space-y-4">

              <div>

                <label className="text-white text-sm font-medium mb-1 block">
                  Teléfono
                </label>


                <div className="relative">

                  <Phone
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />


                  <input
                    type="text"
                    name="phone"
                    value={
                      settings.phone
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="+52 961 123 4567"
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none"
                  />

                </div>

              </div>


              <div>

                <label className="text-white text-sm font-medium mb-1 block">
                  Correo electrónico
                </label>


                <div className="relative">

                  <Mail
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />


                  <input
                    type="email"
                    name="email"
                    value={
                      settings.email
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="contacto@gimnasio.com"
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none"
                  />

                </div>

              </div>


              <div>

                <label className="text-white text-sm font-medium mb-1 block">
                  WhatsApp
                </label>


                <div className="relative">

                  <Phone
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />


                  <input
                    type="text"
                    name="whatsapp"
                    value={
                      settings.whatsapp
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="+52 961 123 4567"
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none"
                  />

                </div>

              </div>

            </div>

          </div>


          {/* DIRECCIÓN */}

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

            <h3 className="text-white font-bold mb-4">
              Dirección
            </h3>


            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="sm:col-span-2">

                <label className="text-white text-sm font-medium mb-1 block">
                  Dirección
                </label>


                <input
                  type="text"
                  name="address"
                  value={
                    settings.address
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Av. Central Norte 125"
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none"
                />

              </div>


              {[
                [
                  'colony',
                  'Colonia',
                  'Centro'
                ],

                [
                  'city',
                  'Ciudad',
                  'Tuxtla Gutiérrez'
                ],

                [
                  'state',
                  'Estado',
                  'Chiapas'
                ],

                [
                  'postalCode',
                  'Código postal',
                  '29000'
                ]

              ].map(
                (
                  [
                    name,
                    label,
                    placeholder
                  ]
                ) => (

                  <div
                    key={
                      name
                    }
                  >

                    <label className="text-white text-sm font-medium mb-1 block">
                      {label}
                    </label>


                    <input
                      type="text"
                      name={
                        name
                      }
                      value={
                        settings[
                          name
                        ]
                      }
                      onChange={
                        handleInputChange
                      }
                      placeholder={
                        placeholder
                      }
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none"
                    />

                  </div>

                )
              )}

            </div>

          </div>

        </div>


        {/* PREVIEW */}

        <div className="xl:col-span-1">

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 sticky top-6">

            <h3 className="text-white font-bold mb-4">
              Vista previa
            </h3>


            <div className="space-y-4">

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 text-center">

                <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-[#0d0d0d] overflow-hidden flex items-center justify-center">

                  {
                    settings.logo
                      ? (

                        <img
                          src={
                            settings.logo
                          }
                          alt=""
                          className="w-full h-full object-contain"
                        />

                      )
                      : (

                        <Building
                          size={28}
                          className="text-[#00ff88]"
                        />

                      )
                  }

                </div>


                <p className="text-white font-bold">
                  {
                    settings.shortName ||
                    'GYM CONTROL'
                  }
                </p>


                <p className="text-gray-400 text-xs mt-1">
                  {
                    settings.gymName ||
                    'Nombre del gimnasio'
                  }
                </p>

              </div>


              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 text-center">

                <p className="text-white font-bold text-sm">
                  {
                    settings.shortName ||
                    'GYM CONTROL'
                  }
                </p>

                <p className="text-gray-400 text-xs">
                  {
                    settings.address ||
                    'Dirección'
                  }
                </p>

                <p className="text-gray-400 text-xs">
                  {
                    settings.phone ||
                    'Teléfono'
                  }
                </p>

                <p className="text-gray-500 text-[10px] mt-2">
                  Recibo
                </p>

              </div>


              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 text-center">

                <p className="text-white font-bold text-sm">
                  {
                    settings.shortName ||
                    'GYM CONTROL'
                  }
                </p>

                <p className="text-gray-400 text-xs">
                  Bienvenido
                </p>

                <p className="text-gray-500 text-xs">
                  Escanea tu código QR
                </p>

                <p className="text-gray-600 text-[10px] mt-1">
                  Terminal de acceso
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

    );


  // ======================================================
  // SUSCRIPCIONES
  // ======================================================

const renderSuscripcionesTab =
  () => (

    <div className="space-y-6">

      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

        <h3 className="text-white font-bold mb-1">
          Planes de suscripción
        </h3>

        <p className="text-gray-400 text-sm mb-6">
          Configura el precio y la duración de cada plan.
        </p>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {[
            {
              key: 'sevenDays',
              title: 'Plan 7 días'
            },
            {
              key: 'fifteenDays',
              title: 'Plan 15 días'
            },
            {
              key: 'monthly',
              title: 'Plan mensual'
            },
            {
              key: 'annual',
              title: 'Plan anual'
            }
          ].map(
            item => {

              const plan =
                settings.subscriptionPlans[
                  item.key
                ];


              return (

                <div
                  key={item.key}
                  className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5"
                >

                  <h4 className="text-white font-bold mb-4">
                    {item.title}
                  </h4>


                  <div className="grid grid-cols-2 gap-3">

                    <div>

                      <label className="text-gray-400 text-xs block mb-1">
                        Precio
                      </label>


                      <div className="relative">

                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          $
                        </span>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={plan.price}
                          onChange={
                            event => {

                              const value =
                                Number(
                                  event.target.value
                                );


                              setSettings(
                                previous => ({

                                  ...previous,

                                  subscriptionPlans: {

                                    ...previous.subscriptionPlans,

                                    [item.key]: {

                                      ...previous.subscriptionPlans[
                                        item.key
                                      ],

                                      price:
                                        value

                                    }

                                  }

                                })
                              );


                              setShowSaveBar(
                                true
                              );

                            }
                          }
                          className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl pl-8 pr-3 py-2.5 text-white focus:border-[#00ff88] focus:outline-none"
                        />

                      </div>

                    </div>


                    <div>

                      <label className="text-gray-400 text-xs block mb-1">
                        Duración
                      </label>


                      <div className="flex items-center gap-2">

                        <input
                          type="number"
                          min="1"
                          value={plan.days}
                          onChange={
                            event => {

                              const value =
                                Number(
                                  event.target.value
                                );


                              setSettings(
                                previous => ({

                                  ...previous,

                                  subscriptionPlans: {

                                    ...previous.subscriptionPlans,

                                    [item.key]: {

                                      ...previous.subscriptionPlans[
                                        item.key
                                      ],

                                      days:
                                        value

                                    }

                                  }

                                })
                              );


                              setShowSaveBar(
                                true
                              );

                            }
                          }
                          className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-white focus:border-[#00ff88] focus:outline-none"
                        />

                        <span className="text-gray-500 text-sm">
                          días
                        </span>

                      </div>

                    </div>

                  </div>


                  <div className="mt-4 p-3 bg-[#0d0d0d] rounded-lg">

                    <div className="flex items-center justify-between">

                      <span className="text-gray-400 text-sm">
                        Vista previa
                      </span>

                      <span className="text-[#00ff88] font-bold">
                        ${Number(
                          plan.price || 0
                        ).toFixed(2)} {settings.currency}
                      </span>

                    </div>


                    <p className="text-gray-500 text-xs mt-1">
                      {plan.days} días de acceso
                    </p>

                  </div>

                </div>

              );

            }
          )}

        </div>

      </div>


      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

        <h3 className="text-white font-bold mb-4">
          Advertencia de vencimiento
        </h3>


        <div className="flex items-center gap-2">

          <input
            type="number"
            name="warningDays"
            value={settings.warningDays}
            onChange={handleInputChange}
            min="0"
            className="w-28 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none"
          />

          <span className="text-gray-400">
            días
          </span>

        </div>


        <p className="text-gray-500 text-xs mt-2">
          Los miembros aparecerán como "Por vencer" cuando resten {settings.warningDays} días o menos.
        </p>

      </div>


      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

        <div className="flex items-center justify-between gap-4">

          <div>

            <h3 className="text-white font-bold">
              Conservar días restantes
            </h3>

            <p className="text-gray-400 text-sm mt-1">
              Si el miembro renueva antes de vencer, la nueva suscripción comenzará después del vencimiento actual.
            </p>

          </div>


          <Toggle
            enabled={settings.renewalConserveDays}
            onClick={() =>
              handleToggle(
                'renewalConserveDays'
              )
            }
          />

        </div>

      </div>

    </div>

  );

  // ======================================================
  // PROMOCIONES Y DESCUENTOS
  // ======================================================

  const renderPromocionesTab =
    () => {

      const promotionItems = [

        {
          key: 'student',
          title: 'Estudiante',
          description:
            'Descuento especial para estudiantes.'
        },

        {
          key: 'couple',
          title: 'Pareja',
          description:
            'El precio especial de Pareja representa el TOTAL a cobrar por las dos personas.'
        },

        {
          key: 'agreement',
          title: 'Convenio',
          description:
            'Beneficios para empresas, escuelas o instituciones.'
        },

        {
          key: 'courtesy',
          title: 'Cortesía',
          description:
            'Permite activar una suscripción sin cobro.'
        }

      ];


      const planItems = [

        {
          key: '7dias',
          label: '7 días'
        },

        {
          key: '15dias',
          label: '15 días'
        },

        {
          key: 'mensual',
          label: 'Mensual'
        },

        {
          key: 'anual',
          label: 'Anual'
        }

      ];


      const updatePromotion = (
        promotionKey,
        changes
      ) => {

        setSettings(
          previous => ({

            ...previous,

            promotions: {

              ...previous.promotions,

              [promotionKey]: {

                ...previous.promotions[
                  promotionKey
                ],

                ...changes

              }

            }

          })
        );


        setShowSaveBar(
          true
        );

      };


      const updatePromotionPlan = (
        promotionKey,
        planId,
        changes
      ) => {

        setSettings(
          previous => ({

            ...previous,

            promotions: {

              ...previous.promotions,

              [promotionKey]: {

                ...previous.promotions[
                  promotionKey
                ],

                plans: {

                  ...previous.promotions[
                    promotionKey
                  ].plans,

                  [planId]: {

                    ...previous.promotions[
                      promotionKey
                    ].plans[
                      planId
                    ],

                    ...changes

                  }

                }

              }

            }

          })
        );


        setShowSaveBar(
          true
        );

      };


      return (

        <div className="space-y-6">

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

              <div>

                <h3 className="text-white font-bold">
                  Promociones y descuentos
                </h3>

                <p className="text-gray-400 text-sm mt-1 max-w-2xl">
                  Configura los beneficios comerciales que estarán disponibles al registrar o renovar una suscripción.
                </p>

              </div>


              <div className="px-4 py-2 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20">

                <p className="text-[#00ff88] text-xs font-bold uppercase tracking-wider">
                  Precios administrados desde configuración
                </p>

              </div>

            </div>

          </div>


          {
            promotionItems.map(
              item => {

                const promotion =
                  settings.promotions?.[
                    item.key
                  ];


                if (!promotion) {
                  return null;
                }


                return (

                  <div
                    key={item.key}
                    className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden"
                  >

                    <div className="p-6 border-b border-[#1a1a1a] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                      <div>

                        <div className="flex items-center gap-3">

                          <div className="w-10 h-10 rounded-xl bg-[#00ff88]/10 flex items-center justify-center">

                            <DollarSign
                              size={19}
                              className="text-[#00ff88]"
                            />

                          </div>


                          <div>

                            <h4 className="text-white font-bold">
                              {item.title}
                            </h4>

                            <p className="text-gray-500 text-xs mt-0.5">
                              {item.description}
                            </p>

                          </div>

                        </div>

                      </div>


                      <div className="flex items-center gap-3">

                        <span
                          className={`
                            text-xs
                            font-bold
                            ${
                              promotion.enabled
                                ? 'text-[#00ff88]'
                                : 'text-gray-500'
                            }
                          `}
                        >
                          {
                            promotion.enabled
                              ? 'ACTIVA'
                              : 'INACTIVA'
                          }
                        </span>


                        <Toggle
                          enabled={
                            promotion.enabled
                          }
                          onClick={() =>
                            updatePromotion(
                              item.key,
                              {
                                enabled:
                                  !promotion.enabled
                              }
                            )
                          }
                        />

                      </div>

                    </div>


                    <div className="p-6">

                      {
                        (
                          item.key ===
                            'agreement' ||
                          item.key ===
                            'courtesy'
                        ) &&
                        (

                          <div className="mb-5 p-4 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">

                            <div className="flex items-center justify-between gap-4">

                              <div>

                                <p className="text-white text-sm font-medium">
                                  Solicitar referencia o autorización
                                </p>

                                <p className="text-gray-500 text-xs mt-1">
                                  {
                                    item.key ===
                                      'agreement'
                                      ? 'Al aplicar el convenio se solicitará el nombre de la empresa, escuela o institución.'
                                      : 'Al aplicar una cortesía se solicitará el motivo o la persona que la autorizó.'
                                  }
                                </p>

                              </div>


                              <Toggle
                                enabled={
                                  promotion.referenceRequired
                                }
                                onClick={() =>
                                  updatePromotion(
                                    item.key,
                                    {
                                      referenceRequired:
                                        !promotion.referenceRequired
                                    }
                                  )
                                }
                              />

                            </div>

                          </div>

                        )
                      }


                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

                        {
                          planItems.map(
                            planItem => {

                              const planConfig =
                                promotion.plans?.[
                                  planItem.key
                                ] || {
                                  enabled: false,
                                  type: 'percentage',
                                  value: 0
                                };


                              return (

                                <div
                                  key={planItem.key}
                                  className={`
                                    rounded-xl
                                    border
                                    p-4
                                    ${
                                      planConfig.enabled
                                        ? 'bg-[#1a1a1a] border-[#00ff88]/20'
                                        : 'bg-[#0d0d0d] border-[#2a2a2a] opacity-70'
                                    }
                                  `}
                                >

                                  <div className="flex items-center justify-between gap-3 mb-4">

                                    <div>

                                      <p className="text-white font-semibold text-sm">
                                        {planItem.label}
                                      </p>

                                      <p className="text-gray-500 text-xs">
                                        {
                                          planConfig.enabled
                                            ? 'Promoción disponible'
                                            : 'No aplica a este plan'
                                        }
                                      </p>

                                    </div>


                                    <Toggle
                                      enabled={
                                        planConfig.enabled
                                      }
                                      onClick={() =>
                                        updatePromotionPlan(
                                          item.key,
                                          planItem.key,
                                          {
                                            enabled:
                                              !planConfig.enabled
                                          }
                                        )
                                      }
                                    />

                                  </div>


                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                                    <div>

                                      <label className="text-gray-400 text-xs block mb-1">
                                        Tipo
                                      </label>

                                      <select
                                        disabled={
                                          !planConfig.enabled ||
                                          item.key ===
                                            'courtesy'
                                        }
                                        value={
                                          item.key ===
                                            'courtesy'
                                            ? 'fixed_price'
                                            : planConfig.type
                                        }
                                        onChange={
                                          event =>
                                            updatePromotionPlan(
                                              item.key,
                                              planItem.key,
                                              {
                                                type:
                                                  event.target.value
                                              }
                                            )
                                        }
                                        className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-white disabled:opacity-50 focus:border-[#00ff88] focus:outline-none"
                                      >

                                        <option value="percentage">
                                          Descuento %
                                        </option>

                                        <option value="fixed_price">
                                          Precio especial
                                        </option>

                                      </select>

                                    </div>


                                    <div>

                                      <label className="text-gray-400 text-xs block mb-1">

                                        {
                                          item.key ===
                                            'courtesy'
                                            ? 'Precio final'
                                            : planConfig.type ===
                                                'percentage'
                                              ? 'Porcentaje'
                                              : item.key ===
                                                  'couple'
                                                ? 'Total por la pareja'
                                                : 'Precio final'
                                        }

                                      </label>


                                      <div className="relative">

                                        {
                                          planConfig.type ===
                                            'fixed_price' ||
                                          item.key ===
                                            'courtesy'
                                            ? (

                                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                                $
                                              </span>

                                            )
                                            : null
                                        }


                                        <input
                                          type="number"
                                          min="0"
                                          max={
                                            planConfig.type ===
                                              'percentage'
                                              ? '100'
                                              : undefined
                                          }
                                          step={
                                            planConfig.type ===
                                              'percentage'
                                              ? '1'
                                              : '0.01'
                                          }
                                          disabled={
                                            !planConfig.enabled ||
                                            item.key ===
                                              'courtesy'
                                          }
                                          value={
                                            item.key ===
                                              'courtesy'
                                              ? 0
                                              : planConfig.value
                                          }
                                          onChange={
                                            event =>
                                              updatePromotionPlan(
                                                item.key,
                                                planItem.key,
                                                {
                                                  value:
                                                    Number(
                                                      event.target.value ||
                                                      0
                                                    )
                                                }
                                              )
                                          }
                                          className={`
                                            w-full
                                            bg-[#0d0d0d]
                                            border
                                            border-[#2a2a2a]
                                            rounded-xl
                                            py-2.5
                                            text-white
                                            disabled:opacity-50
                                            focus:border-[#00ff88]
                                            focus:outline-none
                                            ${
                                              planConfig.type ===
                                                'fixed_price' ||
                                              item.key ===
                                                'courtesy'
                                                ? 'pl-8 pr-3'
                                                : 'px-3'
                                            }
                                          `}
                                        />

                                      </div>

                                    </div>

                                  </div>


                                  <div className="mt-3 pt-3 border-t border-[#2a2a2a]">

                                    <p className="text-gray-500 text-[11px]">

                                      {
                                        item.key ===
                                          'courtesy'
                                          ? 'La suscripción quedará activa con total $0.00 y se registrará la cortesía.'
                                          : planConfig.type ===
                                              'percentage'
                                            ? item.key ===
                                                'couple'
                                              ? `Se descontará ${Number(planConfig.value || 0)}% sobre el precio normal de las dos personas.`
                                              : `Se descontará ${Number(planConfig.value || 0)}% del precio normal.`
                                            : item.key ===
                                                'couple'
                                              ? `El TOTAL a cobrar por las dos personas será $${Number(planConfig.value || 0).toFixed(2)} ${settings.currency}.`
                                              : `El precio final será $${Number(planConfig.value || 0).toFixed(2)} ${settings.currency}.`
                                      }

                                    </p>

                                  </div>

                                </div>

                              );

                            }
                          )
                        }

                      </div>

                    </div>

                  </div>

                );

              }
            )
          }


          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-5">

            <div className="flex gap-3">

              <AlertCircle
                size={20}
                className="text-yellow-500 shrink-0 mt-0.5"
              />

              <div>

                <p className="text-yellow-500 font-semibold text-sm">
                  Los descuentos no cambian el precio base del plan
                </p>

                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                  El precio normal continúa definido en Suscripciones. Al registrar o renovar, el sistema guarda el precio original, el descuento aplicado y el total realmente cobrado.
                </p>

              </div>

            </div>

          </div>

        </div>

      );

    };


  // ======================================================
  // ACCESO
  // ======================================================

  const renderAccesoTab =
    () => (

      <div className="space-y-6">


        {[
          {
            key:
              'qrPermanent',

            title:
              'QR permanente',

            description:
              'Cada miembro utiliza el mismo código QR mientras permanezca registrado.'
          },

          {
            key:
              'autoEntryExit',

            title:
              'Entrada y salida automática',

            description:
              'Si el miembro está fuera se registra entrada; si está dentro se registra salida.'
          },

          {
            key:
              'doubleScanProtection',

            title:
              'Protección contra doble escaneo',

            description:
              'Evita registrar una salida accidental inmediatamente después de una entrada.'
          },

          {
            key:
              'showPhotoAfterScan',

            title:
              'Mostrar fotografía',

            description:
              'Muestra la fotografía del miembro después de identificarlo.'
          }

        ].map(
          item => (

            <div
              key={
                item.key
              }
              className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6"
            >

              <div className="flex items-center justify-between gap-5">

                <div>

                  <p className="text-white font-medium">
                    {item.title}
                  </p>

                  <p className="text-gray-400 text-sm mt-1">
                    {item.description}
                  </p>

                </div>


                <Toggle
                  enabled={
                    settings[
                      item.key
                    ]
                  }
                  onClick={() =>
                    handleToggle(
                      item.key
                    )
                  }
                />

              </div>

            </div>

          )
        )}


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

            <label className="text-white font-bold block mb-3">
              Tiempo mínimo entre escaneos
            </label>


            <div className="flex items-center gap-2">

              <input
                type="number"
                name="scanInterval"
                value={
                  settings.scanInterval
                }
                onChange={
                  handleInputChange
                }
                min="0"
                className="w-28 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none"
              />

              <span className="text-gray-400">
                segundos
              </span>

            </div>

          </div>


          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

            <label className="text-white font-bold block mb-3">
              Tiempo de resultado
            </label>


            <div className="flex items-center gap-2">

              <input
                type="number"
                name="resultDisplayTime"
                value={
                  settings.resultDisplayTime
                }
                onChange={
                  handleInputChange
                }
                min="1"
                className="w-28 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none"
              />

              <span className="text-gray-400">
                segundos
              </span>

            </div>

          </div>

        </div>


        {/* INFORMACIÓN PÚBLICA */}

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

          <h3 className="text-white font-bold mb-4">
            Información visible en la terminal
          </h3>


          <div className="space-y-3">

            {[
              [
                'name',
                'Nombre del miembro'
              ],

              [
                'photo',
                'Fotografía'
              ],

              [
                'accessStatus',
                'Estado del acceso'
              ],

              [
                'entryTime',
                'Hora de entrada/salida'
              ],

              [
                'expiryWarning',
                'Aviso de vencimiento'
              ]

            ].map(
              (
                [
                  key,
                  label
                ]
              ) => (

                <div
                  key={
                    key
                  }
                  className="flex items-center justify-between"
                >

                  <span className="text-gray-300 text-sm">
                    {label}
                  </span>


                  <Toggle
                    enabled={
                      settings
                        .publicInfo[
                          key
                        ]
                    }
                    onClick={() =>
                      handlePublicInfoToggle(
                        key
                      )
                    }
                  />

                </div>

              )
            )}

          </div>


          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">

            <p className="text-yellow-500 text-xs">
              ⚠️ Protección de privacidad
            </p>

            <p className="text-gray-400 text-xs mt-1">
              Teléfono, correo, pagos y notas administrativas no se mostrarán en la terminal.
            </p>

          </div>

        </div>


        {/* SONIDO Y CÁMARA */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

            <h3 className="text-white font-bold mb-4">
              Sonidos
            </h3>


            <div className="space-y-4">

              <div className="flex justify-between items-center">

                <span className="text-gray-300 text-sm">
                  Acceso permitido
                </span>


                <Toggle
                  enabled={
                    settings.sounds.allowed
                  }
                  onClick={() =>
                    handleSoundToggle(
                      'allowed'
                    )
                  }
                />

              </div>


              <div className="flex justify-between items-center">

                <span className="text-gray-300 text-sm">
                  Acceso denegado
                </span>


                <Toggle
                  enabled={
                    settings.sounds.denied
                  }
                  onClick={() =>
                    handleSoundToggle(
                      'denied'
                    )
                  }
                />

              </div>


              <div>

                <div className="flex justify-between">

                  <span className="text-gray-300 text-sm">
                    Volumen
                  </span>

                  <span className="text-[#00ff88] text-sm">
                    {settings.sounds.volume}%
                  </span>

                </div>


                <input
                  type="range"
                  min="0"
                  max="100"
                  value={
                    settings.sounds.volume
                  }
                  onChange={
                    handleVolumeChange
                  }
                  className="w-full accent-[#00ff88] mt-2"
                />

              </div>

            </div>

          </div>


          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

            <h3 className="text-white font-bold mb-4">
              Cámara
            </h3>


            <select
              value={
                settings.cameraDevice
              }
              onChange={
                event => {

                  setSettings(
                    previous => ({

                      ...previous,

                      cameraDevice:
                        event.target.value

                    })
                  );


                  setShowSaveBar(
                    true
                  );

                }
              }
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none"
            >

              <option value="default">
                Cámara predeterminada
              </option>

              <option value="back">
                Cámara trasera
              </option>

              <option value="front">
                Cámara frontal
              </option>

            </select>


            <button
              type="button"
              onClick={
                handleTestCamera
              }
              className="mt-4 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white hover:border-[#00ff88] flex items-center gap-2"
            >

              <Camera
                size={16}
              />

              Probar cámara

            </button>


            <div className="flex items-center gap-2 mt-4">

              <span
                className={`
                  w-2
                  h-2
                  rounded-full

                  ${
                    cameraStatus ===
                    'available'
                      ? 'bg-[#00ff88]'
                      : cameraStatus ===
                        'error'
                        ? 'bg-red-500'
                        : 'bg-gray-500'
                  }
                `}
              />


              <span
                className="text-sm text-gray-400"
              >

                {
                  cameraStatus ===
                    'available'
                    ? 'Cámara disponible'
                    : cameraStatus ===
                      'error'
                      ? 'No se pudo acceder a la cámara'
                      : cameraStatus ===
                        'testing'
                        ? 'Probando cámara...'
                        : 'Sin probar'
                }

              </span>

            </div>

          </div>

        </div>


        {/* PREVIEW */}

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

          <h3 className="text-white font-bold mb-4">
            Vista previa del control de acceso
          </h3>


          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 max-w-sm mx-auto text-center">

            {
              settings.logo &&
              (

                <img
                  src={
                    settings.logo
                  }
                  alt=""
                  className="w-12 h-12 object-contain mx-auto mb-2"
                />

              )
            }


            <p className="text-white font-bold">
              {
                settings.shortName ||
                'GYM CONTROL'
              }
            </p>

            <p className="text-gray-400 text-xs">
              Bienvenido
            </p>

            <p className="text-gray-500 text-xs">
              Escanea tu código QR
            </p>


            <div className="w-20 h-20 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl mx-auto mt-3 flex items-center justify-center">

              <div className="w-12 h-12 border-2 border-[#00ff88] rounded" />

            </div>

          </div>


          <button
            type="button"
            onClick={() =>
              navigate(
                '/access'
              )
            }
            className="mt-4 text-[#00ff88] text-sm hover:underline"
          >
            Abrir control de acceso
          </button>

        </div>

      </div>

    );


  // ======================================================
  // HORARIOS
  // ======================================================

  // ======================================================
  // RETENCIÓN
  // ======================================================

  const renderRetencionTab =
    () => {

      const retention =
        settings.retention || {
          enabled: true,
          followUpDays: 7,
          riskDays: 15,
          inactiveDays: 30,
          includeNeverAttended: true
        };


      const followUpDays =
        Number(
          retention.followUpDays ||
          7
        );

      const riskDays =
        Number(
          retention.riskDays ||
          15
        );

      const inactiveDays =
        Number(
          retention.inactiveDays ||
          30
        );


      const validOrder =
        followUpDays <
          riskDays &&
        riskDays <
          inactiveDays;


      return (

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          <div className="xl:col-span-2 space-y-6">

            <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

              <div className="flex items-start justify-between gap-4">

                <div>

                  <div className="flex items-center gap-2">

                    <Activity
                      size={18}
                      className="text-[#00ff88]"
                    />

                    <h3 className="text-white font-bold">
                      Seguimiento de clientes inactivos
                    </h3>

                  </div>

                  <p className="text-gray-500 text-sm mt-2 max-w-2xl">
                    El sistema analizará miembros con suscripción activa y calculará automáticamente cuántos días llevan sin registrar una entrada.
                  </p>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    handleRetentionChange(
                      'enabled',
                      !retention.enabled
                    )
                  }
                  className={`
                    relative
                    w-12
                    h-7
                    rounded-full
                    transition-colors
                    shrink-0

                    ${
                      retention.enabled
                        ? 'bg-[#00ff88]'
                        : 'bg-[#2a2a2a]'
                    }
                  `}
                >

                  <span
                    className={`
                      absolute
                      top-1
                      w-5
                      h-5
                      rounded-full
                      bg-black
                      transition-all

                      ${
                        retention.enabled
                          ? 'left-6'
                          : 'left-1'
                      }
                    `}
                  />

                </button>

              </div>

            </div>


            <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

              <h3 className="text-white font-bold">
                Límites de inactividad
              </h3>

              <p className="text-gray-500 text-sm mt-1 mb-5">
                Estos valores controlan la clasificación en Dashboard y en el módulo Retención.
              </p>


              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div>

                  <label className="text-white text-sm font-medium block mb-2">
                    Iniciar seguimiento
                  </label>

                  <div className="relative">

                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={
                        followUpDays
                      }
                      onChange={
                        event =>
                          handleRetentionChange(
                            'followUpDays',
                            Math.max(
                              1,
                              Number(
                                event.target.value ||
                                1
                              )
                            )
                          )
                      }
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 pr-14 text-white focus:outline-none focus:border-[#00ff88]"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                      días
                    </span>

                  </div>

                  <p className="text-yellow-400/70 text-[10px] mt-2">
                    Desde aquí aparece para seguimiento.
                  </p>

                </div>


                <div>

                  <label className="text-white text-sm font-medium block mb-2">
                    Riesgo de abandono
                  </label>

                  <div className="relative">

                    <input
                      type="number"
                      min="2"
                      max="365"
                      value={
                        riskDays
                      }
                      onChange={
                        event =>
                          handleRetentionChange(
                            'riskDays',
                            Math.max(
                              2,
                              Number(
                                event.target.value ||
                                2
                              )
                            )
                          )
                      }
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 pr-14 text-white focus:outline-none focus:border-[#00ff88]"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                      días
                    </span>

                  </div>

                  <p className="text-orange-400/70 text-[10px] mt-2">
                    Requiere contacto más urgente.
                  </p>

                </div>


                <div>

                  <label className="text-white text-sm font-medium block mb-2">
                    Considerar inactivo
                  </label>

                  <div className="relative">

                    <input
                      type="number"
                      min="3"
                      max="365"
                      value={
                        inactiveDays
                      }
                      onChange={
                        event =>
                          handleRetentionChange(
                            'inactiveDays',
                            Math.max(
                              3,
                              Number(
                                event.target.value ||
                                3
                              )
                            )
                          )
                      }
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 pr-14 text-white focus:outline-none focus:border-[#00ff88]"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                      días
                    </span>

                  </div>

                  <p className="text-red-400/70 text-[10px] mt-2">
                    Nivel más alto de inactividad.
                  </p>

                </div>

              </div>


              {
                !validOrder &&
                (

                  <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">

                    <AlertCircle
                      size={18}
                      className="text-red-400 shrink-0 mt-0.5"
                    />

                    <p className="text-red-300 text-sm">
                      Los días deben estar en orden: seguimiento &lt; riesgo &lt; inactivo.
                    </p>

                  </div>

                )
              }

            </div>


            <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

              <div className="flex items-center justify-between gap-4">

                <div>

                  <h3 className="text-white font-bold">
                    Miembros que nunca han asistido
                  </h3>

                  <p className="text-gray-500 text-sm mt-1">
                    Si un miembro tiene suscripción activa pero todavía no registra entradas, usar su fecha de registro para calcular la inactividad.
                  </p>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    handleRetentionChange(
                      'includeNeverAttended',
                      !retention.includeNeverAttended
                    )
                  }
                  className={`
                    relative
                    w-12
                    h-7
                    rounded-full
                    transition-colors
                    shrink-0

                    ${
                      retention.includeNeverAttended
                        ? 'bg-[#00ff88]'
                        : 'bg-[#2a2a2a]'
                    }
                  `}
                >

                  <span
                    className={`
                      absolute
                      top-1
                      w-5
                      h-5
                      rounded-full
                      bg-black
                      transition-all

                      ${
                        retention.includeNeverAttended
                          ? 'left-6'
                          : 'left-1'
                      }
                    `}
                  />

                </button>

              </div>

            </div>

          </div>


          <div className="space-y-4">

            <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

              <h3 className="text-white font-bold">
                Clasificación actual
              </h3>


              <div className="space-y-3 mt-5">

                <div className="p-3 rounded-xl bg-[#00ff88]/5 border border-[#00ff88]/10">

                  <p className="text-[#00ff88] text-xs font-bold">
                    Frecuente
                  </p>

                  <p className="text-gray-500 text-xs mt-1">
                    0 a {Math.max(0, followUpDays - 1)} días
                  </p>

                </div>


                <div className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10">

                  <p className="text-yellow-400 text-xs font-bold">
                    Seguimiento
                  </p>

                  <p className="text-gray-500 text-xs mt-1">
                    {followUpDays} a {Math.max(followUpDays, riskDays - 1)} días
                  </p>

                </div>


                <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">

                  <p className="text-orange-400 text-xs font-bold">
                    Riesgo de abandono
                  </p>

                  <p className="text-gray-500 text-xs mt-1">
                    {riskDays} a {Math.max(riskDays, inactiveDays - 1)} días
                  </p>

                </div>


                <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">

                  <p className="text-red-400 text-xs font-bold">
                    Inactivo
                  </p>

                  <p className="text-gray-500 text-xs mt-1">
                    {inactiveDays}+ días
                  </p>

                </div>

              </div>

            </div>


            <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

              <UserMinus
                size={22}
                className="text-[#00ff88]"
              />

              <p className="text-white font-semibold mt-3">
                No afecta la suscripción
              </p>

              <p className="text-gray-500 text-xs mt-2 leading-5">
                “Inactivo” en este módulo significa que dejó de asistir. No bloquea su QR, PIN o rostro y no cambia el estado de su membresía.
              </p>

            </div>

          </div>

        </div>

      );

    };


  const renderHorariosTab =
    () => (

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

          <h3 className="text-white font-bold mb-4">
            Horario del gimnasio
          </h3>


          <div className="space-y-3">

            {DAYS.map(
              day => {

                const dayData =
                  settings.hours[
                    day.key
                  ];


                return (

                  <div
                    key={
                      day.key
                    }
                    className="p-3 bg-[#1a1a1a] rounded-xl"
                  >

                    <div className="flex items-center gap-3">

                      <Toggle
                        enabled={
                          dayData.open
                        }
                        onClick={() =>
                          handleDayToggle(
                            day.key
                          )
                        }
                      />


                      <span className="text-white text-sm w-24">
                        {day.label}
                      </span>


                      {
                        dayData.open
                          ? (

                            <div className="flex items-center gap-2 ml-auto">

                              <input
                                type="time"
                                value={
                                  dayData.start
                                }
                                onChange={
                                  event =>
                                    handleDayTimeChange(
                                      day.key,
                                      'start',
                                      event.target.value
                                    )
                                }
                                className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-2 py-1 text-white text-sm"
                              />

                              <span className="text-gray-500">
                                —
                              </span>

                              <input
                                type="time"
                                value={
                                  dayData.end
                                }
                                onChange={
                                  event =>
                                    handleDayTimeChange(
                                      day.key,
                                      'end',
                                      event.target.value
                                    )
                                }
                                className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-2 py-1 text-white text-sm"
                              />

                            </div>

                          )
                          : (

                            <span className="text-red-400 text-xs ml-auto">
                              Cerrado
                            </span>

                          )
                      }

                    </div>

                  </div>

                );

              }
            )}

          </div>

        </div>


        <div className="space-y-6">

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

            <h3 className="text-white font-bold mb-4">
              Capacidad
            </h3>


            <label className="text-white text-sm font-medium mb-1 block">
              Capacidad máxima
            </label>


            <div className="flex items-center gap-2">

              <input
                type="number"
                name="capacity"
                value={
                  settings.capacity
                }
                onChange={
                  handleInputChange
                }
                min="0"
                className="w-28 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none"
              />

              <span className="text-gray-400">
                personas
              </span>

            </div>

          </div>


          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

            <h3 className="text-white font-bold mb-4">
              Alertas de capacidad
            </h3>


            <div className="grid grid-cols-2 gap-4">

              <div>

                <label className="text-gray-400 text-sm block mb-1">
                  Advertencia
                </label>


                <div className="flex items-center gap-2">

                  <input
                    type="number"
                    name="capacityWarning"
                    value={
                      settings.capacityWarning
                    }
                    onChange={
                      handleInputChange
                    }
                    min="0"
                    max="100"
                    className="w-24 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white"
                  />

                  <span className="text-gray-400">
                    %
                  </span>

                </div>

              </div>


              <div>

                <label className="text-gray-400 text-sm block mb-1">
                  Crítico
                </label>


                <div className="flex items-center gap-2">

                  <input
                    type="number"
                    name="capacityCritical"
                    value={
                      settings.capacityCritical
                    }
                    onChange={
                      handleInputChange
                    }
                    min="0"
                    max="100"
                    className="w-24 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white"
                  />

                  <span className="text-gray-400">
                    %
                  </span>

                </div>

              </div>

            </div>


            <div className="mt-6 bg-[#1a1a1a] rounded-xl p-4">

              <div className="flex justify-between text-sm">

                <span className="text-gray-400">
                  {currentInside} / {settings.capacity || 0}
                </span>

                <span className="text-gray-400">
                  {occupancyPercentage}% ocupado
                </span>

              </div>


              <div className="mt-2 h-2 bg-[#0d0d0d] rounded-full overflow-hidden">

                <div
                  className={`h-full rounded-full transition-all ${occupancyColor}`}
                  style={{
                    width:
                      `${occupancyPercentage}%`
                  }}
                />

              </div>

            </div>

          </div>

        </div>

      </div>

    );


  // ======================================================
  // RECIBOS
  // ======================================================

  const renderRecibosTab =
    () => (

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="space-y-6">

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

            <h3 className="text-white font-bold mb-4">
              Moneda
            </h3>


            <select
              value={
                settings.currency
              }
              onChange={
                event => {

                  setSettings(
                    previous => ({

                      ...previous,

                      currency:
                        event.target.value

                    })
                  );

                  setShowSaveBar(
                    true
                  );

                }
              }
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white"
            >

              <option value="MXN">
                MXN — Peso mexicano
              </option>

              <option value="USD">
                USD — Dólar americano
              </option>


            </select>

          </div>


          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

            <h3 className="text-white font-bold mb-4">
              Métodos de pago
            </h3>


            <div className="space-y-3">

              {[
                [
                  'efectivo',
                  'Efectivo'
                ],

                [
                  'transferencia',
                  'Transferencia'
                ],

                [
                  'tarjeta',
                  'Tarjeta'
                ],

                [
                  'otro',
                  'Otro'
                ]

              ].map(
                (
                  [
                    key,
                    label
                  ]
                ) => (

                  <div
                    key={
                      key
                    }
                    className="flex items-center justify-between"
                  >

                    <span className="text-gray-300 text-sm">
                      {label}
                    </span>


                    <Toggle
                      enabled={
                        settings
                          .paymentMethods[
                            key
                          ]
                      }
                      onClick={() =>
                        handlePaymentMethodToggle(
                          key
                        )
                      }
                    />

                  </div>

                )
              )}

            </div>

          </div>


          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

            <h3 className="text-white font-bold mb-4">
              Información para recibos
            </h3>


            <div className="space-y-4">

              <div>

                <label className="text-white text-sm block mb-1">
                  Nombre comercial
                </label>

                <input
                  type="text"
                  name="gymName"
                  value={
                    settings.gymName
                  }
                  onChange={
                    handleInputChange
                  }
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white"
                />

              </div>


              <div>

                <label className="text-white text-sm block mb-1">
                  Teléfono
                </label>

                <input
                  type="text"
                  name="phone"
                  value={
                    settings.phone
                  }
                  onChange={
                    handleInputChange
                  }
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white"
                />

              </div>


              <div>

                <label className="text-white text-sm block mb-1">
                  Dirección
                </label>

                <input
                  type="text"
                  name="address"
                  value={
                    settings.address
                  }
                  onChange={
                    handleInputChange
                  }
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white"
                />

              </div>


              <div>

                <label className="text-white text-sm block mb-1">
                  Mensaje final
                </label>

                <textarea
                  name="receiptMessage"
                  value={
                    settings.receiptMessage
                  }
                  onChange={
                    handleInputChange
                  }
                  rows="3"
                  placeholder="Gracias por entrenar con nosotros."
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white resize-none"
                />

              </div>

            </div>

          </div>

        </div>


        <div className="space-y-6">

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

            <h3 className="text-white font-bold mb-4">
              Folios
            </h3>


            <div className="space-y-4">

              <div>

                <label className="text-white text-sm block mb-1">
                  Prefijo de pagos
                </label>

                <input
                  type="text"
                  name="receiptPrefix"
                  value={
                    settings.receiptPrefix
                  }
                  onChange={
                    handleInputChange
                  }
                  maxLength="8"
                  className="w-32 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white uppercase"
                />

              </div>


              <div>

                <label className="text-white text-sm block mb-1">
                  Prefijo de miembros
                </label>

                <input
                  type="text"
                  name="memberPrefix"
                  value={
                    settings.memberPrefix
                  }
                  onChange={
                    handleInputChange
                  }
                  maxLength="8"
                  className="w-32 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white uppercase"
                />

              </div>


              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">

                <p className="text-yellow-500 text-xs">
                  ⚠️ Los prefijos nuevos solo deben aplicarse a registros futuros. No cambies IDs históricos.
                </p>

              </div>

            </div>

          </div>


          {/* PREVIEW RECIBO */}

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">

            <h3 className="text-white font-bold mb-4">
              Vista previa del recibo
            </h3>


            <div className="flex justify-center overflow-x-auto pb-2">

              <div className="w-full max-w-[430px]">

                <PaymentReceipt
                  settings={settings}
                  payment={{
                    id: `${settings.receiptPrefix || 'PAY'}-00001`,
                    memberName: 'Miembro de ejemplo',
                    plan: 'mensual',
                    planLabel: 'Mensual',
                    amount: Number(
                      settings.subscriptionPlans?.monthly?.price ||
                      0
                    ).toFixed(2),
                    paymentMethod: 'efectivo',
                    method: 'efectivo',
                    currency: settings.currency === 'USD' ? 'USD' : 'MXN',
                    status: 'completed',
                    createdAt: new Date().toISOString(),
                    date: new Date().toISOString()
                  }}
                  member={{
                    firstName: 'Miembro',
                    lastName: 'de ejemplo'
                  }}
                  subscription={{
                    plan: 'mensual',
                    planLabel: 'Mensual',
                    startDate: formatDateForReceiptPreview(
                      new Date()
                    ),
                    endDate: formatDateForReceiptPreview(
                      addCalendarMonth(
                        new Date()
                      )
                    )
                  }}
                />

              </div>

            </div>

          </div>

        </div>

      </div>

    );


  // ======================================================
  // SEGURIDAD ADMINISTRATIVA
  // ======================================================

  const renderSeguridadTab =
    () => {

      const canManageSecurity =
        currentSession?.role ===
          'owner' ||
        currentSession?.role ===
          'admin';


      const protectionItems = [
        {
          id: 'member_deactivate',
          label: 'Dar de baja miembros',
          description: 'Solicita la contraseña antes de desactivar un miembro.'
        },
        {
          id: 'blacklist_clear',
          label: 'Quitar de lista negra',
          description: 'Protege el retiro de antecedentes activos.'
        },
        {
          id: 'blacklist_reactivate',
          label: 'Reactivar alertas de lista negra',
          description: 'Protege la reactivación de antecedentes retirados.'
        },
        {
          id: 'regenerate_qr',
          label: 'Regenerar código QR',
          description: 'Evita cambiar el QR de un miembro sin autorización.'
        },
        {
          id: 'regenerate_pin',
          label: 'Regenerar PIN',
          description: 'Evita generar un PIN nuevo sin autorización.'
        },
        {
          id: 'payment_delete',
          label: 'Eliminar pagos',
          description: 'Solicita autorización antes de eliminar un registro de pago.'
        }
      ];


      const handleProtectionToggle =
        action => {

          if (
            !canManageSecurity
          ) {
            return;
          }


          const nextProtections = {
            ...adminSecurity.protections,

            [action]:
              adminSecurity.protections?.[action] ===
                false
                ? true
                : false
          };


          const next =
            updateAdminProtectionSettings({
              protections:
                nextProtections,

              actor:
                currentSession
            });


          setAdminSecurity(
            next
          );


          setSecurityMessage({
            type:
              'success',

            text:
              'Protecciones actualizadas.'
          });

        };


      const handleSaveSecurityPassword =
        async () => {

          if (
            !canManageSecurity
          ) {

            setSecurityMessage({
              type:
                'error',

              text:
                'Solo el dueño o un administrador puede cambiar esta contraseña.'
            });

            return;

          }


          if (
            adminPassword.length <
              4
          ) {

            setSecurityMessage({
              type:
                'error',

              text:
                'La contraseña debe tener al menos 4 caracteres.'
            });

            return;

          }


          if (
            adminPassword !==
            adminPasswordConfirm
          ) {

            setSecurityMessage({
              type:
                'error',

              text:
                'Las contraseñas no coinciden.'
            });

            return;

          }


          setSecuritySaving(
            true
          );

          setSecurityMessage({
            type: '',
            text: ''
          });


          try {

            const next =
              await setAdminAuthorizationPassword({
                password:
                  adminPassword,

                actor:
                  currentSession,

                protections:
                  adminSecurity.protections
              });


            setAdminSecurity(
              next
            );

            setAdminPassword(
              ''
            );

            setAdminPasswordConfirm(
              ''
            );

            setSecurityMessage({
              type:
                'success',

              text:
                adminSecurity.configured
                  ? 'Contraseña administrativa actualizada correctamente.'
                  : 'Contraseña administrativa configurada correctamente.'
            });

          } catch (
            error
          ) {

            setSecurityMessage({
              type:
                'error',

              text:
                error?.message ||
                'No se pudo guardar la contraseña administrativa.'
            });

          } finally {

            setSecuritySaving(
              false
            );

          }

        };


      return (

        <div className="space-y-6">

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-6">

            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">

              <div className="flex items-start gap-4">

                <div className="w-12 h-12 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center shrink-0">

                  <Shield
                    size={24}
                    className="text-[#00ff88]"
                  />

                </div>


                <div>

                  <h2 className="text-white text-xl font-black">
                    Autorización administrativa
                  </h2>

                  <p className="text-gray-400 text-sm mt-1 max-w-2xl">
                    Crea una contraseña independiente para confirmar acciones delicadas. Los encargados pueden trabajar normalmente, pero no podrán ejecutar las operaciones protegidas sin autorización.
                  </p>

                </div>

              </div>


              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
                adminSecurity.configured
                  ? 'bg-[#00ff88]/10 text-[#00ff88]'
                  : 'bg-yellow-500/10 text-yellow-500'
              }`}>

                <span className={`w-2 h-2 rounded-full ${
                  adminSecurity.configured
                    ? 'bg-[#00ff88]'
                    : 'bg-yellow-500'
                }`}
                />

                {
                  adminSecurity.configured
                    ? 'CONFIGURADA'
                    : 'PENDIENTE'
                }

              </span>

            </div>


            {
              !canManageSecurity &&
              (

                <div className="mt-5 rounded-xl bg-yellow-500/5 border border-yellow-500/20 p-4">

                  <p className="text-yellow-500 text-sm font-bold">
                    Solo lectura
                  </p>

                  <p className="text-gray-400 text-xs mt-1">
                    Solo el dueño o un administrador puede cambiar la contraseña y las protecciones.
                  </p>

                </div>

              )
            }


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">

              <div>

                <label className="text-white text-sm font-medium block mb-2">
                  {
                    adminSecurity.configured
                      ? 'Nueva contraseña administrativa'
                      : 'Contraseña administrativa'
                  }
                </label>


                <div className="relative">

                  <input
                    type={
                      showAdminPassword
                        ? 'text'
                        : 'password'
                    }
                    value={
                      adminPassword
                    }
                    disabled={
                      !canManageSecurity ||
                      securitySaving
                    }
                    onChange={
                      event => {

                        setAdminPassword(
                          event.target.value
                        );

                        setSecurityMessage({
                          type: '',
                          text: ''
                        });

                      }
                    }
                    placeholder="Mínimo 4 caracteres"
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 pr-11 py-3 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none disabled:opacity-50"
                  />


                  <button
                    type="button"
                    onClick={() =>
                      setShowAdminPassword(
                        previous =>
                          !previous
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    {
                      showAdminPassword
                        ? <EyeOff size={18} />
                        : <Eye size={18} />
                    }
                  </button>

                </div>

              </div>


              <div>

                <label className="text-white text-sm font-medium block mb-2">
                  Confirmar contraseña
                </label>

                <input
                  type={
                    showAdminPassword
                      ? 'text'
                      : 'password'
                  }
                  value={
                    adminPasswordConfirm
                  }
                  disabled={
                    !canManageSecurity ||
                    securitySaving
                  }
                  onChange={
                    event => {

                      setAdminPasswordConfirm(
                        event.target.value
                      );

                      setSecurityMessage({
                        type: '',
                        text: ''
                      });

                    }
                  }
                  placeholder="Repite la contraseña"
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none disabled:opacity-50"
                />

              </div>

            </div>


            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

              <div>

                {
                  securityMessage.text &&
                  (

                    <p className={`text-sm ${
                      securityMessage.type ===
                        'success'
                        ? 'text-[#00ff88]'
                        : 'text-red-400'
                    }`}>
                      {securityMessage.text}
                    </p>

                  )
                }

                {
                  adminSecurity.updatedAt &&
                  (

                    <p className="text-gray-600 text-xs mt-1">
                      Último cambio: {
                        new Intl.DateTimeFormat(
                          'es-MX',
                          {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }
                        ).format(
                          new Date(
                            adminSecurity.updatedAt
                          )
                        )
                      }
                      {
                        adminSecurity.updatedBy?.name
                          ? ` · ${adminSecurity.updatedBy.name}`
                          : ''
                      }
                    </p>

                  )
                }

              </div>


              <button
                type="button"
                disabled={
                  !canManageSecurity ||
                  securitySaving
                }
                onClick={
                  handleSaveSecurityPassword
                }
                className="px-5 py-2.5 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] disabled:opacity-40 flex items-center justify-center gap-2"
              >

                <Save
                  size={17}
                />

                {
                  securitySaving
                    ? 'Guardando...'
                    : adminSecurity.configured
                      ? 'Cambiar contraseña'
                      : 'Crear contraseña'
                }

              </button>

            </div>

          </div>


          <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl overflow-hidden">

            <div className="p-6 border-b border-[#1a1a1a]">

              <h3 className="text-white font-black">
                Acciones protegidas
              </h3>

              <p className="text-gray-500 text-sm mt-1">
                Elige qué operaciones exigirán la contraseña administrativa antes de ejecutarse.
              </p>

            </div>


            <div className="divide-y divide-[#1a1a1a]">

              {
                protectionItems.map(
                  item => {

                    const enabled =
                      adminSecurity.protections?.[item.id] !==
                      false;


                    return (

                      <div
                        key={
                          item.id
                        }
                        className="p-5 flex items-center justify-between gap-5"
                      >

                        <div>

                          <p className="text-white font-semibold text-sm">
                            {item.label}
                          </p>

                          <p className="text-gray-500 text-xs mt-1">
                            {item.description}
                          </p>

                        </div>


                        <button
                          type="button"
                          disabled={
                            !canManageSecurity
                          }
                          onClick={() =>
                            handleProtectionToggle(
                              item.id
                            )
                          }
                          className={`relative w-12 h-7 rounded-full transition-colors shrink-0 disabled:opacity-40 ${
                            enabled
                              ? 'bg-[#00ff88]'
                              : 'bg-[#2a2a2a]'
                          }`}
                        >

                          <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                            enabled
                              ? 'translate-x-6'
                              : 'translate-x-1'
                          }`}
                          />

                        </button>

                      </div>

                    );

                  }
                )
              }

            </div>

          </div>


          <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl overflow-hidden">

            <div className="p-6 border-b border-[#1a1a1a] flex items-center justify-between gap-4">

              <div>

                <h3 className="text-white font-black">
                  Historial de autorizaciones
                </h3>

                <p className="text-gray-500 text-sm mt-1">
                  Últimos intentos y operaciones protegidas.
                </p>

              </div>


              <span className="text-gray-500 text-xs">
                {
                  securityAudit.length
                } eventos
              </span>

            </div>


            {
              securityAudit.length >
                0
                ? (

                  <div className="divide-y divide-[#1a1a1a]">

                    {
                      securityAudit
                        .slice(
                          0,
                          12
                        )
                        .map(
                          event => {

                            const successful =
                              event.result ===
                                'authorized' ||
                              event.result ===
                                'success';


                            return (

                              <div
                                key={
                                  event.id
                                }
                                className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                              >

                                <div className="flex items-start gap-3">

                                  <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                                    successful
                                      ? 'bg-[#00ff88]'
                                      : 'bg-red-500'
                                  }`}
                                  />


                                  <div>

                                    <p className="text-white text-sm font-semibold">
                                      {
                                        ADMIN_SECURITY_ACTIONS[
                                          event.action
                                        ] ||
                                        (
                                          event.action ===
                                            'security_password_updated'
                                            ? 'Contraseña de seguridad actualizada'
                                            : event.action ===
                                                'security_protections_updated'
                                              ? 'Protecciones actualizadas'
                                              : event.action
                                        )
                                      }
                                    </p>


                                    <p className="text-gray-500 text-xs mt-1">
                                      {
                                        event.target?.label ||
                                        event.target?.id ||
                                        'Configuración del sistema'
                                      }
                                    </p>

                                  </div>

                                </div>


                                <div className="md:text-right">

                                  <p className={`text-xs font-bold ${
                                    successful
                                      ? 'text-[#00ff88]'
                                      : 'text-red-400'
                                  }`}>
                                    {
                                      event.result ===
                                        'denied'
                                        ? 'AUTORIZACIÓN RECHAZADA'
                                        : 'AUTORIZADO'
                                    }
                                  </p>


                                  <p className="text-gray-500 text-xs mt-1">
                                    {
                                      event.actor?.name ||
                                      'Sistema'
                                    }
                                    {' · '}
                                    {
                                      new Intl.DateTimeFormat(
                                        'es-MX',
                                        {
                                          day: '2-digit',
                                          month: 'short',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        }
                                      ).format(
                                        new Date(
                                          event.createdAt
                                        )
                                      )
                                    }
                                  </p>

                                </div>

                              </div>

                            );

                          }
                        )
                    }

                  </div>

                )
                : (

                  <div className="p-8 text-center">

                    <Shield
                      size={32}
                      className="text-gray-700 mx-auto"
                    />

                    <p className="text-gray-500 text-sm mt-2">
                      Aún no existen eventos de autorización.
                    </p>

                  </div>

                )
            }

          </div>


          <div className="rounded-2xl bg-blue-500/5 border border-blue-500/20 p-5">

            <p className="text-blue-400 font-bold text-sm">
              Importante
            </p>

            <p className="text-gray-400 text-xs mt-1 leading-relaxed">
              La contraseña se guarda como un derivado PBKDF2 con salt aleatorio; no se almacena en texto visible. Mientras el sistema funcione únicamente con localStorage, esta protección sirve para el control operativo de recepción, pero cuando GYM CONTROL migre a backend la validación deberá realizarse en el servidor.
            </p>

          </div>

        </div>

      );

    };


  // ======================================================
  // USUARIOS
  // ======================================================

  const renderUsuariosTab =
    () => (

      <div className="space-y-6">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

          <SettingsStatCard
            title="Usuarios"
            value={
              userStats.total
            }
            icon={
              Users
            }
            color="gray"
          />

          <SettingsStatCard
            title="Administradores"
            value={
              userStats.admins
            }
            icon={
              UserCog
            }
            color="green"
          />

          <SettingsStatCard
            title="Recepcionistas"
            value={
              userStats.reception
            }
            icon={
              UserCheck
            }
            color="green"
          />

          <SettingsStatCard
            title="Usuarios activos"
            value={
              userStats.active
            }
            icon={
              CircleDot
            }
            color="green"
          />

        </div>


        <div className="flex flex-col xl:flex-row gap-3">

          <div className="flex-1 relative">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />

            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={
                searchTerm
              }
              onChange={
                event =>
                  setSearchTerm(
                    event.target.value
                  )
              }
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none"
            />

          </div>


          <div className="flex flex-wrap gap-2">

            {userFilters.map(
              filter => (

                <button
                  type="button"
                  key={
                    filter
                  }
                  onClick={() =>
                    setUserFilter(
                      filter
                    )
                  }
                  className={`
                    px-3
                    py-2
                    rounded-full
                    text-xs

                    ${
                      userFilter ===
                      filter
                        ? 'bg-[#00ff88] text-black font-bold'
                        : 'bg-[#1a1a1a] text-gray-400'
                    }
                  `}
                >
                  {filter}
                </button>

              )
            )}


            <button
              type="button"
              onClick={
                openUserDrawer
              }
              className="px-4 py-2 bg-[#00ff88] text-black rounded-xl font-bold flex items-center gap-2"
            >

              <Plus
                size={18}
              />

              Agregar usuario

            </button>

          </div>

        </div>


        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">

          {
            filteredUsers.length ===
            0
              ? (

                <div className="text-center py-16">

                  <Users
                    size={48}
                    className="text-gray-600 mx-auto mb-4"
                  />

                  <h3 className="text-white text-xl font-bold">
                    No hay usuarios
                  </h3>

                  <p className="text-gray-400 text-sm mt-2">
                    Agrega usuarios administradores o de recepción.
                  </p>

                </div>

              )
              : (

                <div className="overflow-x-auto">

                  <table className="w-full">

                    <thead className="bg-[#0d0d0d] border-b border-[#1a1a1a]">

                      <tr>

                        <th className="text-left py-3 px-4 text-gray-400 text-xs uppercase">
                          Usuario
                        </th>

                        <th className="text-left py-3 px-4 text-gray-400 text-xs uppercase">
                          Rol
                        </th>

                        <th className="text-left py-3 px-4 text-gray-400 text-xs uppercase">
                          Correo
                        </th>

                        <th className="text-left py-3 px-4 text-gray-400 text-xs uppercase">
                          Permisos
                        </th>

                        <th className="text-left py-3 px-4 text-gray-400 text-xs uppercase">
                          Estado
                        </th>

                        <th className="text-left py-3 px-4 text-gray-400 text-xs uppercase">
                          Último acceso
                        </th>

                        <th className="text-left py-3 px-4 text-gray-400 text-xs uppercase">
                          Acciones
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {filteredUsers.map(
                        user => {

                          const permissions =
                            normalizePermissions(
                              user.role ||
                                'reception',
                              user.permissions
                            );


                          return (

                            <tr
                              key={
                                user.id
                              }
                              className="border-b border-[#1a1a1a] last:border-0"
                            >

                              <td className="py-4 px-4">

                                <div className="flex items-center gap-3">

                                  <div className="w-9 h-9 rounded-full bg-[#00ff88]/10 flex items-center justify-center">

                                    <UserCog
                                      size={17}
                                      className="text-[#00ff88]"
                                    />

                                  </div>


                                  <div>

                                    <p className="text-white text-sm font-medium">
                                      {user.name}
                                    </p>

                                    <p className="text-gray-500 text-xs">
                                      {user.id}
                                    </p>

                                  </div>

                                </div>

                              </td>


                              <td className="py-4 px-4">

                                <span className="text-gray-300 text-sm">
                                  {
                                    getRoleLabel(
                                      user.role
                                    )
                                  }
                                </span>

                              </td>


                              <td className="py-4 px-4 text-gray-300 text-sm">
                                {user.email}
                              </td>


                              <td className="py-4 px-4">

                                <div className="flex flex-wrap gap-1.5 max-w-[320px]">

                                  {permissions
                                    .slice(
                                      0,
                                      3
                                    )
                                    .map(
                                      permission => {

                                        const labels = {
                                          dashboard: 'Dashboard',
                                          members: 'Miembros',
                                          subscriptions: 'Suscripciones',
                                          access: 'Acceso',
                                          attendance: 'Asistencias',
                                          visits: 'Visitas',
                                          payments: 'Pagos',
                                          reports: 'Reportes',
                                          settings: 'Configuración'
                                        };


                                        return (

                                          <span
                                            key={
                                              permission
                                            }
                                            className="px-2 py-1 rounded-md bg-[#1a1a1a] text-gray-400 text-[9px]"
                                          >
                                            {
                                              labels[
                                                permission
                                              ] ||
                                              permission
                                            }
                                          </span>

                                        );

                                      }
                                    )}


                                  {
                                    permissions.length >
                                    3 &&
                                    (

                                      <span className="px-2 py-1 rounded-md bg-[#00ff88]/10 text-[#00ff88] text-[9px]">
                                        +{permissions.length - 3}
                                      </span>

                                    )
                                  }

                                </div>

                              </td>


                              <td className="py-4 px-4">

                                <span
                                  className={`
                                    px-2
                                    py-1
                                    rounded-full
                                    text-xs

                                    ${
                                      user.status ===
                                      'active'
                                        ? 'bg-[#00ff88]/10 text-[#00ff88]'
                                        : 'bg-red-500/10 text-red-400'
                                    }
                                  `}
                                >

                                  {
                                    user.status ===
                                    'active'
                                      ? 'Activo'
                                      : 'Inactivo'
                                  }

                                </span>

                              </td>


                              <td className="py-4 px-4 text-gray-500 text-sm">

                                {
                                  user.lastAccessAt
                                    ? new Date(
                                        user.lastAccessAt
                                      ).toLocaleString(
                                        'es-MX'
                                      )
                                    : 'Nunca'
                                }

                              </td>


                              <td className="py-4 px-4">

                                <div className="flex flex-wrap gap-2">

                                  <button
                                    type="button"
                                    onClick={() =>
                                      openEditUserDrawer(
                                        user
                                      )
                                    }
                                    className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-gray-300 text-xs hover:border-[#00ff88]"
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
                                          handleToggleUserStatus(
                                            user
                                          )
                                        }
                                        className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-gray-300 text-xs hover:border-[#00ff88]"
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
                                          requestDeleteUser(
                                            user
                                          )
                                        }
                                        className="w-8 h-8 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center text-red-400"
                                      >

                                        <Trash2
                                          size={15}
                                        />

                                      </button>

                                    )
                                  }

                                </div>

                              </td>

                            </tr>

                          );

                        }
                      )}

                    </tbody>

                  </table>

                </div>

              )
          }

        </div>

      </div>

    );


  // ======================================================
  // RENDER
  // ======================================================

  return (

    <div className="min-h-screen bg-[#0a0a0a] flex">

      <Sidebar
        activePage="Configuración"
      />


      <div className="flex-1 lg:ml-0 min-w-0">

        <Header />


        <main className="p-6 space-y-6 max-w-full pb-28">


          {/* HEADER */}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div>

              <h1 className="text-2xl font-bold text-white">
                Configuración
              </h1>

              <p className="text-gray-400">
                Administra la información, reglas y usuarios del sistema.
              </p>

            </div>


            <button
              type="button"
              onClick={
                handleSave
              }
              className="px-4 py-2.5 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a] flex items-center gap-2"
            >

              <Save
                size={18}
              />

              Guardar cambios

            </button>

          </div>


          {/* TABS */}

          <div className="border-b border-[#1a1a1a] overflow-x-auto">

            <div className="flex flex-nowrap gap-1">

              {tabs.map(
                tab => (

                  <button
                    type="button"
                    key={
                      tab.id
                    }
                    onClick={() =>
                      setActiveTab(
                        tab.id
                      )
                    }
                    className={`
                      px-4
                      py-2.5
                      text-sm
                      font-medium
                      border-b-2
                      whitespace-nowrap

                      ${
                        activeTab ===
                        tab.id
                          ? 'text-[#00ff88] border-[#00ff88]'
                          : 'text-gray-400 border-transparent hover:text-white'
                      }
                    `}
                  >

                    {tab.label}

                  </button>

                )
              )}

            </div>

          </div>


          {/* CONTENIDO */}

          <div>

            {
              activeTab ===
                'general' &&
              renderGeneralTab()
            }

            {
              activeTab ===
                'suscripciones' &&
              renderSuscripcionesTab()
            }

            {
              activeTab ===
                'promociones' &&
              renderPromocionesTab()
            }

            {
              activeTab ===
                'retencion' &&
              renderRetencionTab()
            }

            {
              activeTab ===
                'acceso' &&
              renderAccesoTab()
            }

            {
              activeTab ===
                'horarios' &&
              renderHorariosTab()
            }

            {
              activeTab ===
                'recibos' &&
              renderRecibosTab()
            }

            {
              activeTab ===
                'whatsapp' &&
              (
                <WhatsAppSettingsPanel
                  settings={
                    settings
                  }
                  onChange={
                    nextSettings => {

                      setSettings(
                        nextSettings
                      );

                      setShowSaveBar(
                        true
                      );

                    }
                  }
                />
              )
            }


            {
              activeTab ===
                'usuarios' &&
              renderUsuariosTab()
            }


            {
              activeTab ===
                'seguridad' &&
              renderSeguridadTab()
            }

          </div>

        </main>

      </div>


      {/* ================================================= */}
      {/* BARRA CAMBIOS */}
      {/* ================================================= */}

      {
        showSaveBar &&
        (

          <div className="fixed bottom-0 left-0 right-0 bg-[#0d0d0d] border-t border-[#1a1a1a] p-4 z-40 lg:ml-72">

            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">

              <div className="flex items-center gap-3">

                <AlertCircle
                  size={20}
                  className="text-yellow-500"
                />

                <span className="text-white font-medium">
                  Tienes cambios sin guardar
                </span>

              </div>


              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={
                    handleDiscard
                  }
                  className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-gray-400 hover:border-red-500 hover:text-red-400"
                >
                  Descartar
                </button>


                <button
                  type="button"
                  onClick={
                    handleSave
                  }
                  className="px-6 py-2 bg-[#00ff88] text-black rounded-xl font-bold flex items-center gap-2"
                >

                  <Save
                    size={18}
                  />

                  Guardar cambios

                </button>

              </div>

            </div>

          </div>

        )
      }


      {/* ================================================= */}
      {/* NUEVO / EDITAR USUARIO */}
      {/* ================================================= */}

      {
        showUserDrawer &&
        (

          <div className="fixed inset-0 z-50 flex justify-end">

            <div
              className="absolute inset-0 bg-black/70"
              onClick={() =>
                setShowUserDrawer(
                  false
                )
              }
            />


            <div className="relative w-full max-w-xl h-full bg-[#111111] border-l border-[#1a1a1a] shadow-2xl overflow-y-auto">

              <div className="p-6">

                <div className="flex items-center justify-between mb-6">

                  <div>

                    <h2 className="text-xl font-bold text-white">
                      {
                        editingUser
                          ? 'Editar usuario'
                          : 'Nuevo usuario'
                      }
                    </h2>

                    <p className="text-gray-400 text-sm">
                      {
                        editingUser
                          ? 'Actualiza sus datos, rol y permisos.'
                          : 'Agrega un correo autorizado y define sus permisos.'
                      }
                    </p>

                  </div>


                  <button
                    type="button"
                    onClick={() =>
                      setShowUserDrawer(
                        false
                      )
                    }
                    className="p-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-gray-400"
                  >

                    <X
                      size={20}
                    />

                  </button>

                </div>


                <div className="space-y-5">

                  {/* NOMBRE */}

                  <div>

                    <label className="text-white text-sm font-medium mb-1 block">
                      Nombre
                    </label>

                    <input
                      type="text"
                      value={
                        userForm.name
                      }
                      onChange={
                        event =>
                          setUserForm(
                            previous => ({

                              ...previous,

                              name:
                                event.target.value

                            })
                          )
                      }
                      placeholder="Ej. María López"
                      className={`w-full bg-[#1a1a1a] border ${
                        userErrors.name
                          ? 'border-red-500'
                          : 'border-[#2a2a2a]'
                      } rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00ff88]`}
                    />

                    {
                      userErrors.name &&
                      (

                        <p className="text-red-400 text-xs mt-1">
                          {userErrors.name}
                        </p>

                      )
                    }

                  </div>


                  {/* EMAIL */}

                  <div>

                    <label className="text-white text-sm font-medium mb-1 block">
                      Correo autorizado
                    </label>

                    <input
                      type="email"
                      value={
                        userForm.email
                      }
                      onChange={
                        event =>
                          setUserForm(
                            previous => ({

                              ...previous,

                              email:
                                event.target.value

                            })
                          )
                      }
                      placeholder="maria@gimnasio.com"
                      className={`w-full bg-[#1a1a1a] border ${
                        userErrors.email
                          ? 'border-red-500'
                          : 'border-[#2a2a2a]'
                      } rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00ff88]`}
                    />

                    <p className="text-gray-500 text-xs mt-1">
                      Solo este correo podrá utilizar estas credenciales.
                    </p>

                    {
                      userErrors.email &&
                      (

                        <p className="text-red-400 text-xs mt-1">
                          {userErrors.email}
                        </p>

                      )
                    }

                  </div>


                  {/* PASSWORD */}

                  <div>

                    <label className="text-white text-sm font-medium mb-1 block">
                      {
                        editingUser
                          ? 'Nueva contraseña'
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
                            userForm.password
                          }
                          onChange={
                            event =>
                              setUserForm(
                                previous => ({

                                  ...previous,

                                  password:
                                    event.target.value

                                })
                              )
                          }
                          placeholder={
                            editingUser
                              ? 'Déjala vacía para conservar la actual'
                              : ''
                          }
                          className={`w-full bg-[#1a1a1a] border ${
                            userErrors.password
                              ? 'border-red-500'
                              : 'border-[#2a2a2a]'
                          } rounded-xl px-4 pr-10 py-2.5 text-white focus:outline-none focus:border-[#00ff88]`}
                        />


                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              previous =>
                                !previous
                            )
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >

                          {
                            showPassword
                              ? (
                                  <EyeOff
                                    size={17}
                                  />
                                )
                              : (
                                  <Eye
                                    size={17}
                                  />
                                )
                          }

                        </button>

                      </div>


                      <button
                        type="button"
                        onClick={() =>
                          setUserForm(
                            previous => ({

                              ...previous,

                              password:
                                generateTemporaryPassword()

                            })
                          )
                        }
                        className="px-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white"
                      >

                        <RefreshCw
                          size={18}
                        />

                      </button>

                    </div>


                    {
                      editingUser &&
                      (

                        <p className="text-gray-500 text-xs mt-1">
                          Si no deseas cambiar la contraseña, deja este campo vacío.
                        </p>

                      )
                    }


                    {
                      userErrors.password &&
                      (

                        <p className="text-red-400 text-xs mt-1">
                          {userErrors.password}
                        </p>

                      )
                    }

                  </div>


                  {/* ROL */}

                  <div>

                    <label className="text-white text-sm font-medium mb-2 block">
                      Rol
                    </label>


                    {
                      editingUser?.role ===
                      'owner'
                        ? (

                          <div className="p-4 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-xl">

                            <p className="text-white font-bold">
                              Dueño
                            </p>

                            <p className="text-gray-400 text-xs mt-1">
                              Usuario principal con acceso total. Este rol no puede modificarse.
                            </p>

                          </div>

                        )
                        : (

                          <div className="grid grid-cols-2 gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                handleUserRoleChange(
                                  'admin'
                                )
                              }
                              className={`
                                p-4
                                bg-[#1a1a1a]
                                border-2
                                rounded-xl

                                ${
                                  userForm.role ===
                                  'admin'
                                    ? 'border-[#00ff88] text-white'
                                    : 'border-[#2a2a2a] text-gray-400'
                                }
                              `}
                            >

                              <p className="font-bold">
                                Administrador
                              </p>

                              <p className="text-gray-500 text-xs mt-1">
                                Acceso completo
                              </p>

                            </button>


                            <button
                              type="button"
                              onClick={() =>
                                handleUserRoleChange(
                                  'reception'
                                )
                              }
                              className={`
                                p-4
                                bg-[#1a1a1a]
                                border-2
                                rounded-xl

                                ${
                                  userForm.role ===
                                  'reception'
                                    ? 'border-[#00ff88] text-white'
                                    : 'border-[#2a2a2a] text-gray-400'
                                }
                              `}
                            >

                              <p className="font-bold">
                                Encargado / Recepción
                              </p>

                              <p className="text-gray-500 text-xs mt-1">
                                Permisos personalizados
                              </p>

                            </button>

                          </div>

                        )
                    }

                  </div>



                    {/* PERMISOS */}

                    <div>

                      <div className="flex items-center justify-between mb-3">

                        <div>

                          <label className="text-white text-sm font-medium block">
                            Permisos de acceso
                          </label>

                          <p className="text-gray-500 text-xs mt-1">
                            Selecciona los apartados que podrá utilizar este usuario.
                          </p>

                        </div>


                        <Shield
                          size={20}
                          className="text-[#00ff88]"
                        />

                      </div>


                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

                        {PERMISSION_OPTIONS.map(
                          permission => {

                            const checked =
                              userForm.role ===
                                'admin' ||
                              userForm.role ===
                                'owner' ||
                              userForm.permissions.includes(
                                permission.id
                              );


                            return (

                              <button
                                key={
                                  permission.id
                                }
                                type="button"
                                disabled={
                                  userForm.role ===
                                    'admin' ||
                                  userForm.role ===
                                    'owner'
                                }
                                onClick={() =>
                                  handleUserPermissionToggle(
                                    permission.id
                                  )
                                }
                                className={`
                                  flex
                                  items-center
                                  justify-between
                                  gap-3
                                  px-4
                                  py-3
                                  rounded-xl
                                  border
                                  transition-all

                                  ${
                                    checked
                                      ? 'bg-[#00ff88]/10 border-[#00ff88]/30 text-white'
                                      : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-500'
                                  }

                                  ${
                                    userForm.role ===
                                      'admin' ||
                                    userForm.role ===
                                      'owner'
                                      ? 'cursor-not-allowed opacity-70'
                                      : 'hover:border-[#00ff88]'
                                  }
                                `}
                              >

                                <div className="text-left min-w-0">

                                  <span className="text-sm font-medium block">
                                    {permission.label}
                                  </span>

                                  <span className="text-[10px] text-gray-500 block mt-0.5 leading-4">
                                    {permission.description}
                                  </span>

                                </div>


                                <div
                                  className={`
                                    w-5
                                    h-5
                                    rounded-md
                                    flex
                                    items-center
                                    justify-center
                                    border

                                    ${
                                      checked
                                        ? 'bg-[#00ff88] border-[#00ff88]'
                                        : 'bg-transparent border-[#444]'
                                    }
                                  `}
                                >

                                  {
                                    checked &&
                                    (

                                      <Check
                                        size={14}
                                        className="text-black"
                                      />

                                    )
                                  }

                                </div>

                              </button>

                            );

                          }
                        )}

                      </div>


                      {
                        userErrors.permissions &&
                        (

                          <p className="text-red-400 text-xs mt-2">
                            {userErrors.permissions}
                          </p>

                        )
                      }

                    </div>


                  <div className="p-4 bg-[#1a1a1a] rounded-xl">

                    <div className="flex gap-3">

                      <Shield
                        size={18}
                        className="text-[#00ff88] shrink-0 mt-0.5"
                      />

                      <p className="text-gray-400 text-sm">

                        {
                          userForm.role ===
                            'reception'
                            ? 'Para un encargado recomendamos Dashboard y Control de acceso. Puedes habilitar otros apartados cuando sea necesario.'
                            : 'Este usuario tendrá acceso completo a todos los apartados del sistema.'
                        }

                      </p>

                    </div>

                  </div>


                  <button
                    type="button"
                    onClick={
                      handleSaveUser
                    }
                    className="w-full py-3 bg-[#00ff88] text-black rounded-xl font-bold hover:bg-[#00cc6a]"
                  >
                    {
                      editingUser
                        ? 'Guardar cambios'
                        : 'Crear usuario'
                    }
                  </button>

                </div>

              </div>

            </div>

          </div>

        )
      }


      {/* ================================================= */}
      {/* CONFIRMAR CONFIG */}
      {/* ================================================= */}

      {
        showConfirmModal &&
        (

          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">

            <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-8 max-w-md w-full mx-4">

              <div className="text-center">

                <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">

                  <AlertCircle
                    size={32}
                    className="text-yellow-500"
                  />

                </div>


                <h2 className="text-white text-xl font-bold mb-2">
                  Guardar configuración
                </h2>


                <p className="text-gray-400 text-sm mb-6">
                  Los cambios se guardarán localmente y estarán disponibles para todo el sistema.
                </p>


                <div className="flex gap-3">

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmModal(
                        false
                      )
                    }
                    className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white"
                  >
                    Cancelar
                  </button>


                  <button
                    type="button"
                    onClick={
                      handleConfirmSave
                    }
                    className="flex-1 px-4 py-2 bg-[#00ff88] text-black rounded-xl font-bold"
                  >
                    Guardar
                  </button>

                </div>

              </div>

            </div>

          </div>

        )
      }


      {/* ================================================= */}
      {/* ELIMINAR USUARIO */}
      {/* ================================================= */}

      {
        showDeleteUserModal &&
        selectedUser &&
        (

          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70]">

            <div className="bg-[#111111] border border-red-500/20 rounded-2xl p-8 max-w-md w-full mx-4 text-center">

              <Trash2
                size={38}
                className="text-red-400 mx-auto mb-4"
              />


              <h2 className="text-white text-xl font-bold">
                Eliminar usuario
              </h2>


              <p className="text-gray-400 text-sm mt-2 mb-6">

                ¿Deseas eliminar a{' '}

                <span className="text-white font-medium">
                  {selectedUser.name}
                </span>

                ?

              </p>


              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setShowDeleteUserModal(
                      false
                    )
                  }
                  className="flex-1 px-4 py-2 bg-[#1a1a1a] rounded-xl text-white"
                >
                  Cancelar
                </button>


                <button
                  type="button"
                  onClick={
                    confirmDeleteUser
                  }
                  className="flex-1 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl"
                >
                  Eliminar
                </button>

              </div>

            </div>

          </div>

        )
      }


      {/* ================================================= */}
      {/* TOAST */}
      {/* ================================================= */}

      {
        showSuccessToast &&
        (

          <div className="fixed top-20 right-4 bg-[#111111] border border-[#00ff88] rounded-xl p-4 shadow-2xl z-[80] max-w-sm">

            <div className="flex items-start gap-3">

              <div className="w-8 h-8 rounded-full bg-[#00ff88]/10 flex items-center justify-center">

                <Check
                  size={16}
                  className="text-[#00ff88]"
                />

              </div>


              <div>

                <p className="text-white font-bold">
                  Configuración actualizada
                </p>

                <p className="text-gray-400 text-sm">
                  Los cambios fueron guardados correctamente.
                </p>

              </div>

            </div>

          </div>

        )
      }

    </div>

  );

};

export default SettingsPage;