const mockGyms = [

  // ======================================================
  // POWER GYM
  // ======================================================

  {
    id: 'gym_001',

    gymCode: 'GYM-00001',

    name: 'Power Gym',

    phone: '9611112233',

    address: 'Av. Central 120',

    city: 'Tuxtla Gutiérrez',

    state: 'Chiapas',


    // ==================================================
    // PROPIETARIO
    // ==================================================

    owner: {
      name: 'Carlos Pérez',
      email: 'carlos@powergym.com',
      phone: '9611234567',
    },


    // ==================================================
    // ACCESO AL SISTEMA
    // ==================================================

    access: {
      email: 'powergym@nexgym.mx',

      temporaryPassword: 'PowerGym#2026',

      accountStatus: 'active',

      mustChangePassword: true,

      lastLoginAt: '2026-08-17T15:58:00',
    },


    // ==================================================
    // SUSCRIPCIÓN
    // ==================================================

    subscription: {
      price: 799,

      billingCycle: 'monthly',

      status: 'active',

      startDate: '2026-08-01',

      nextPaymentDate: '2026-09-01',

      discount: 0,

      finalPrice: 799,
    },


    // ==================================================
    // PRUEBA
    // ==================================================

    trial: {
      active: false,

      startDate: null,

      endDate: null,
    },


    // ==================================================
    // USO
    // ==================================================

    members: 342,

    users: 4,

    storageMB: 125,


    // ==================================================
    // CONEXIÓN
    // ==================================================

    lastConnectionAt: '2026-08-17T16:10:00',


    // ==================================================
    // REGISTRO
    // ==================================================

    createdAt: '2026-08-01T10:00:00',


    // ==================================================
    // PAGOS
    // ==================================================

    payments: [
      {
        id: 'payment_001',
        date: '2026-08-01',
        amount: 799,
        status: 'paid',
        method: 'Transferencia',
      },
      {
        id: 'payment_002',
        date: '2026-07-01',
        amount: 799,
        status: 'paid',
        method: 'Transferencia',
      },
    ],


    // ==================================================
    // NOTAS INTERNAS
    // ==================================================

    notes: [
      {
        id: 'note_001',
        date: '2026-08-10T13:30:00',
        author: 'Angel García',
        content:
          'Cliente solicita mantener la fecha de cobro el día primero de cada mes.',
      },
    ],
  },


  // ======================================================
  // TITAN FITNESS
  // ======================================================

  {
    id: 'gym_002',

    gymCode: 'GYM-00002',

    name: 'Titan Fitness',

    phone: '9612112233',

    address: 'Blvd. Belisario Domínguez 455',

    city: 'Tuxtla Gutiérrez',

    state: 'Chiapas',


    owner: {
      name: 'Juan López',
      email: 'juan@titanfitness.com',
      phone: '9612234567',
    },


    access: {
      email: 'titan@nexgym.mx',

      temporaryPassword: 'Titan#2026',

      accountStatus: 'active',

      mustChangePassword: true,

      lastLoginAt: '2026-08-17T15:40:00',
    },


    subscription: {
      price: 799,

      billingCycle: 'monthly',

      status: 'trial',

      startDate: null,

      nextPaymentDate: '2026-08-25',

      discount: 0,

      finalPrice: 799,
    },


    trial: {
      active: true,

      startDate: '2026-08-10',

      endDate: '2026-08-25',
    },


    members: 128,

    users: 2,

    storageMB: 80,


    lastConnectionAt: '2026-08-17T15:50:00',


    createdAt: '2026-08-10T09:00:00',


    payments: [],


    notes: [
      {
        id: 'note_002',
        date: '2026-08-10T09:10:00',
        author: 'Angel García',
        content:
          'Se otorgó periodo de prueba antes de iniciar la suscripción.',
      },
    ],
  },


  // ======================================================
  // EVOLUTION GYM
  // ======================================================

  {
    id: 'gym_003',

    gymCode: 'GYM-00003',

    name: 'Evolution Gym',

    phone: '9613112233',

    address: '5a Norte Poniente 230',

    city: 'Tuxtla Gutiérrez',

    state: 'Chiapas',


    owner: {
      name: 'Ana Ruiz',
      email: 'ana@evolutiongym.com',
      phone: '9613234567',
    },


    access: {
      email: 'evolution@nexgym.mx',

      temporaryPassword: 'Evolution#2026',

      accountStatus: 'active',

      mustChangePassword: false,

      lastLoginAt: '2026-08-17T13:10:00',
    },


    subscription: {
      price: 799,

      billingCycle: 'monthly',

      status: 'past_due',

      startDate: '2026-07-14',

      nextPaymentDate: '2026-08-14',

      discount: 0,

      finalPrice: 799,
    },


    trial: {
      active: false,

      startDate: null,

      endDate: null,
    },


    members: 487,

    users: 5,

    storageMB: 350,


    lastConnectionAt: '2026-08-17T13:20:00',


    createdAt: '2026-07-14T11:00:00',


    payments: [
      {
        id: 'payment_003',
        date: '2026-07-14',
        amount: 799,
        status: 'paid',
        method: 'Efectivo',
      },
    ],


    notes: [
      {
        id: 'note_003',
        date: '2026-08-15T12:00:00',
        author: 'Angel García',
        content:
          'Pago vencido. Pendiente contactar al propietario.',
      },
    ],
  },


  // ======================================================
  // IRON HOUSE
  // ======================================================

  {
    id: 'gym_004',

    gymCode: 'GYM-00004',

    name: 'Iron House',

    phone: '9614112233',

    address: '9a Sur Oriente 720',

    city: 'Tuxtla Gutiérrez',

    state: 'Chiapas',


    owner: {
      name: 'Miguel Torres',
      email: 'miguel@ironhouse.com',
      phone: '9614234567',
    },


    access: {
      email: 'ironhouse@nexgym.mx',

      temporaryPassword: 'IronHouse#2026',

      accountStatus: 'active',

      mustChangePassword: false,

      lastLoginAt: '2026-08-17T16:05:00',
    },


    subscription: {
      price: 799,

      billingCycle: 'monthly',

      status: 'active',

      startDate: '2026-07-28',

      nextPaymentDate: '2026-08-28',

      discount: 100,

      finalPrice: 699,
    },


    trial: {
      active: false,

      startDate: null,

      endDate: null,
    },


    members: 620,

    users: 8,

    storageMB: 540,


    lastConnectionAt: '2026-08-17T16:12:00',


    createdAt: '2026-07-28T13:00:00',


    payments: [
      {
        id: 'payment_004',
        date: '2026-07-28',
        amount: 699,
        status: 'paid',
        method: 'Transferencia',
      },
    ],


    notes: [
      {
        id: 'note_004',
        date: '2026-07-28T13:15:00',
        author: 'Angel García',
        content:
          'Se otorgó descuento especial de $100 MXN mensuales.',
      },
    ],
  },


  // ======================================================
  // STRONG CENTER
  // ======================================================

  {
    id: 'gym_005',

    gymCode: 'GYM-00005',

    name: 'Strong Center',

    phone: '9615112233',

    address: 'Calzada al Sumidero 890',

    city: 'Tuxtla Gutiérrez',

    state: 'Chiapas',


    owner: {
      name: 'Luis Hernández',
      email: 'luis@strongcenter.com',
      phone: '9615234567',
    },


    access: {
      email: 'strongcenter@nexgym.mx',

      temporaryPassword: 'Strong#2026',

      accountStatus: 'suspended',

      mustChangePassword: false,

      lastLoginAt: '2026-08-15T10:30:00',
    },


    subscription: {
      price: 799,

      billingCycle: 'monthly',

      status: 'suspended',

      startDate: '2026-07-10',

      nextPaymentDate: '2026-08-10',

      discount: 0,

      finalPrice: 799,
    },


    trial: {
      active: false,

      startDate: null,

      endDate: null,
    },


    members: 95,

    users: 1,

    storageMB: 45,


    lastConnectionAt: '2026-08-15T11:00:00',


    createdAt: '2026-07-10T15:00:00',


    payments: [
      {
        id: 'payment_005',
        date: '2026-07-10',
        amount: 799,
        status: 'paid',
        method: 'Efectivo',
      },
    ],


    notes: [
      {
        id: 'note_005',
        date: '2026-08-12T16:00:00',
        author: 'Angel García',
        content:
          'Servicio suspendido por falta de pago.',
      },
    ],
  },

];


export default mockGyms;