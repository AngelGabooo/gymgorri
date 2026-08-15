// src/services/localDatabase.js

// ======================================================
// GYM CONTROL - BASE DE DATOS LOCAL
// ======================================================

const KEYS = {
  MEMBERS: 'gym_control_members',
  PAYMENTS: 'gym_control_payments',
  ATTENDANCE: 'gym_control_attendance',
  ACCESS_LOGS: 'gym_control_access_logs',
  SUBSCRIPTIONS: 'gym_control_subscriptions',
  USERS: 'gym_control_users',
  SETTINGS: 'gym_control_settings',
  VISITS: 'gym_control_visits',
  MEMBER_COUNTER: 'gym_control_member_counter',
};


// ======================================================
// FUNCIONES BASE
// ======================================================

const read = (key, fallback = []) => {
  try {
    const data = localStorage.getItem(key);

    if (!data) {
      return fallback;
    }

    return JSON.parse(data);
  } catch (error) {
    console.error(`Error leyendo ${key}:`, error);
    return fallback;
  }
};


const write = (key, value) => {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );

    // Avisar al sistema que hubo cambios
    window.dispatchEvent(
      new CustomEvent('gym-storage-update', {
        detail: {
          key,
          value,
        },
      })
    );

    return value;
  } catch (error) {
    console.error(`Error guardando ${key}:`, error);
    throw error;
  }
};


const generateId = (prefix) => {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()}`;
};


// ======================================================
// INICIALIZAR BASE LOCAL
// ======================================================

export const initializeLocalDatabase = () => {
  const defaults = {
    [KEYS.MEMBERS]: [],
    [KEYS.PAYMENTS]: [],
    [KEYS.ATTENDANCE]: [],
    [KEYS.ACCESS_LOGS]: [],
    [KEYS.SUBSCRIPTIONS]: [],
    [KEYS.USERS]: [],
    [KEYS.VISITS]: [],
  };

  Object.entries(defaults).forEach(
    ([key, defaultValue]) => {
      if (localStorage.getItem(key) === null) {
        write(key, defaultValue);
      }
    }
  );

  if (
    localStorage.getItem(KEYS.MEMBER_COUNTER) === null
  ) {
    localStorage.setItem(
      KEYS.MEMBER_COUNTER,
      '0'
    );
  }

  if (
    localStorage.getItem(KEYS.SETTINGS) === null
  ) {
    write(KEYS.SETTINGS, {
      gymName: 'GYM CONTROL',
      phone: '',
      email: '',
      address: '',
      currency: 'MXN',
      accessMode: 'automatic',
      warningDays: 5,
      updatedAt: new Date().toISOString(),
    });
  }
};


// ======================================================
// MIEMBROS
// ======================================================

export const getMembers = () => {
  return read(KEYS.MEMBERS, []);
};


export const getMemberById = (memberId) => {
  return getMembers().find(
    (member) => member.id === memberId
  ) || null;
};


export const getMemberByQRToken = (token) => {
  return getMembers().find(
    (member) =>
      member?.access?.qr?.token === token
  ) || null;
};


export const getMemberByFaceId = (faceId) => {
  return getMembers().find(
    (member) =>
      member?.access?.face?.faceId === faceId
  ) || null;
};


export const saveMember = (member) => {
  const members = getMembers();

  const index = members.findIndex(
    (item) => item.id === member.id
  );

  const data = {
    ...member,

    createdAt:
      member.createdAt ||
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString(),
  };

  if (index >= 0) {
    members[index] = {
      ...members[index],
      ...data,
    };
  } else {
    members.push(data);
  }

  write(KEYS.MEMBERS, members);

  return data;
};


export const updateMember = (
  memberId,
  changes
) => {
  const member = getMemberById(memberId);

  if (!member) {
    throw new Error(
      'El miembro no existe.'
    );
  }

  return saveMember({
    ...member,
    ...changes,
    id: memberId,
    updatedAt: new Date().toISOString(),
  });
};


export const deleteMember = (memberId) => {
  const members = getMembers().filter(
    (member) => member.id !== memberId
  );

  write(KEYS.MEMBERS, members);

  return true;
};


// ======================================================
// SUSCRIPCIONES
// ======================================================

export const getSubscriptions = () => {
  return read(KEYS.SUBSCRIPTIONS, []);
};


export const getMemberSubscriptions = (
  memberId
) => {
  return getSubscriptions()
    .filter(
      (subscription) =>
        subscription.memberId === memberId
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    );
};


export const saveSubscription = (
  subscription
) => {
  const subscriptions =
    getSubscriptions();

  const data = {
    id:
      subscription.id ||
      generateId('SUB'),

    ...subscription,

    createdAt:
      subscription.createdAt ||
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString(),
  };

  const index =
    subscriptions.findIndex(
      (item) => item.id === data.id
    );

  if (index >= 0) {
    subscriptions[index] = data;
  } else {
    subscriptions.push(data);
  }

  write(
    KEYS.SUBSCRIPTIONS,
    subscriptions
  );

  // Actualizar también la suscripción actual
  // dentro del miembro.
  const member = getMemberById(
    data.memberId
  );

  if (member) {
    saveMember({
      ...member,
      subscription: data,
    });
  }

  return data;
};


// ======================================================
// PAGOS
// ======================================================

export const getPayments = () => {
  return read(KEYS.PAYMENTS, []);
};


export const getMemberPayments = (
  memberId
) => {
  return getPayments().filter(
    (payment) =>
      payment.memberId === memberId
  );
};


export const savePayment = (payment) => {
  const payments = getPayments();

  const data = {
    id:
      payment.id ||
      generateId('PAY'),

    ...payment,

    status:
      payment.status ||
      'completed',

    createdAt:
      payment.createdAt ||
      new Date().toISOString(),
  };

  payments.unshift(data);

  write(KEYS.PAYMENTS, payments);

  return data;
};


// ======================================================
// ASISTENCIAS
// ======================================================

export const getAttendance = () => {
  return read(KEYS.ATTENDANCE, []);
};


export const getMemberAttendance = (
  memberId
) => {
  return getAttendance().filter(
    (attendance) =>
      attendance.memberId === memberId
  );
};


// ======================================================
// PERSONAS DENTRO DEL GIMNASIO
// ======================================================

export const getPeopleInside = () => {
  return getAttendance().filter(
    (attendance) =>
      attendance.status === 'inside'
  );
};


// ======================================================
// REGISTRAR ENTRADA
// ======================================================

export const registerEntry = ({
  memberId,
  method = 'qr',
}) => {
  const member = getMemberById(
    memberId
  );

  if (!member) {
    throw new Error(
      'Miembro no encontrado.'
    );
  }

  const attendance = getAttendance();

  const alreadyInside =
    attendance.find(
      (item) =>
        item.memberId === memberId &&
        item.status === 'inside'
    );

  if (alreadyInside) {
    return {
      success: false,
      reason: 'already_inside',
      attendance: alreadyInside,
    };
  }

  const record = {
    id: generateId('ATT'),

    memberId,

    memberName:
      `${member.firstName || ''} ${member.lastName || ''}`.trim(),

    profilePhoto:
      member.profilePhoto || null,

    method,

    entryAt:
      new Date().toISOString(),

    exitAt: null,

    status: 'inside',
  };

  attendance.unshift(record);

  write(
    KEYS.ATTENDANCE,
    attendance
  );

  registerAccessLog({
    memberId,
    method,
    result: 'allowed',
    action: 'entry',
  });

  return {
    success: true,
    attendance: record,
  };
};


// ======================================================
// REGISTRAR SALIDA
// ======================================================

export const registerExit = (
  memberId,
  method = 'manual'
) => {
  const attendance = getAttendance();

  const index = attendance.findIndex(
    (item) =>
      item.memberId === memberId &&
      item.status === 'inside'
  );

  if (index === -1) {
    return {
      success: false,
      reason: 'not_inside',
    };
  }

  attendance[index] = {
    ...attendance[index],

    exitAt:
      new Date().toISOString(),

    status: 'completed',
  };

  write(
    KEYS.ATTENDANCE,
    attendance
  );

  registerAccessLog({
    memberId,
    method,
    result: 'allowed',
    action: 'exit',
  });

  return {
    success: true,
    attendance: attendance[index],
  };
};


// ======================================================
// HISTORIAL DE ACCESOS
// ======================================================

export const getAccessLogs = () => {
  return read(KEYS.ACCESS_LOGS, []);
};


export const registerAccessLog = ({
  memberId = null,
  method = 'unknown',
  result = 'allowed',
  reason = '',
  action = 'entry',
}) => {
  const logs = getAccessLogs();

  const member = memberId
    ? getMemberById(memberId)
    : null;

  const log = {
    id: generateId('ACCESS'),

    memberId,

    memberName: member
      ? `${member.firstName || ''} ${member.lastName || ''}`.trim()
      : '',

    method,

    action,

    result,

    reason,

    createdAt:
      new Date().toISOString(),
  };

  logs.unshift(log);

  write(KEYS.ACCESS_LOGS, logs);

  return log;
};


// ======================================================
// VISITAS
// ======================================================

export const getVisits = () => {
  return read(KEYS.VISITS, []);
};


export const saveVisit = (visit) => {
  const visits = getVisits();

  const data = {
    id:
      visit.id ||
      generateId('VISIT'),

    ...visit,

    createdAt:
      visit.createdAt ||
      new Date().toISOString(),
  };

  visits.unshift(data);

  write(KEYS.VISITS, visits);

  return data;
};


// ======================================================
// CONFIGURACIÓN
// ======================================================

export const getSettings = () => {
  return read(
    KEYS.SETTINGS,
    {}
  );
};


export const saveSettings = (
  settings
) => {
  const current =
    getSettings();

  const data = {
    ...current,
    ...settings,

    updatedAt:
      new Date().toISOString(),
  };

  write(KEYS.SETTINGS, data);

  return data;
};


// ======================================================
// USUARIOS DEL SISTEMA
// ======================================================

export const getUsers = () => {
  return read(KEYS.USERS, []);
};


export const saveUser = (user) => {
  const users = getUsers();

  const data = {
    id:
      user.id ||
      generateId('USR'),

    ...user,

    createdAt:
      user.createdAt ||
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString(),
  };

  const index =
    users.findIndex(
      (item) => item.id === data.id
    );

  if (index >= 0) {
    users[index] = data;
  } else {
    users.push(data);
  }

  write(KEYS.USERS, users);

  return data;
};


// ======================================================
// ESTADÍSTICAS
// ======================================================

export const getMemberStats = () => {
  const members = getMembers();

  const now = new Date();

  let active = 0;
  let expiring = 0;
  let expired = 0;
  let blocked = 0;
  let withoutSubscription = 0;

  members.forEach((member) => {
    if (member.accessBlocked) {
      blocked++;
      return;
    }

    const subscription =
      member.subscription;

    if (
      !subscription ||
      !subscription.endDate
    ) {
      withoutSubscription++;
      return;
    }

    const end =
      new Date(subscription.endDate);

    if (Number.isNaN(end.getTime())) {
      if (
        subscription.status === 'active'
      ) {
        active++;
      } else {
        withoutSubscription++;
      }

      return;
    }

    const difference =
      Math.ceil(
        (end - now) /
          (1000 * 60 * 60 * 24)
      );

    if (difference < 0) {
      expired++;
    } else if (difference <= 5) {
      expiring++;
    } else {
      active++;
    }
  });

  return {
    total: members.length,
    active,
    expiring,
    expired,
    blocked,
    withoutSubscription,
  };
};


// ======================================================
// DASHBOARD
// ======================================================

export const getDashboardStats = () => {
  const members = getMembers();
  const payments = getPayments();
  const attendance = getAttendance();

  const today =
    new Date().toDateString();

  const todayAttendance =
    attendance.filter(
      (item) =>
        new Date(
          item.entryAt
        ).toDateString() === today
    );

  const todayPayments =
    payments.filter(
      (item) =>
        new Date(
          item.createdAt
        ).toDateString() === today
    );

  const incomeToday =
    todayPayments.reduce(
      (total, item) =>
        total +
        Number(
          item.amount || 0
        ),
      0
    );

  return {
    members:
      members.length,

    peopleInside:
      getPeopleInside().length,

    attendanceToday:
      todayAttendance.length,

    incomeToday,

    memberStats:
      getMemberStats(),
  };
};


// ======================================================
// LIMPIAR DATOS DE PRUEBA
// ======================================================

export const clearGymDatabase = () => {
  Object.values(KEYS).forEach(
    (key) => {
      localStorage.removeItem(key);
    }
  );

  initializeLocalDatabase();

  window.dispatchEvent(
    new Event('gym-storage-update')
  );
};


// ======================================================
// EXPORTAR BASE
// ======================================================

export const exportGymDatabase = () => {
  return {
    members: getMembers(),
    subscriptions:
      getSubscriptions(),
    payments: getPayments(),
    attendance: getAttendance(),
    accessLogs: getAccessLogs(),
    visits: getVisits(),
    users: getUsers(),
    settings: getSettings(),

    exportedAt:
      new Date().toISOString(),
  };
};


export { KEYS };