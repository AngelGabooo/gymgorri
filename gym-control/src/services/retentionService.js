// src/services/retentionService.js

import {
  getAttendance,
  getMembers
} from './localDatabase';

import {
  getGymSettings
} from '../utils/gymSettings';


const MONTHS = {
  ene: 0,
  enero: 0,
  feb: 1,
  febrero: 1,
  mar: 2,
  marzo: 2,
  abr: 3,
  abril: 3,
  may: 4,
  mayo: 4,
  jun: 5,
  junio: 5,
  jul: 6,
  julio: 6,
  ago: 7,
  agosto: 7,
  sep: 8,
  sept: 8,
  septiembre: 8,
  oct: 9,
  octubre: 9,
  nov: 10,
  noviembre: 10,
  dic: 11,
  diciembre: 11
};


export const parseRetentionDate = (
  value
) => {

  if (!value) {
    return null;
  }


  if (
    value instanceof Date &&
    !Number.isNaN(
      value.getTime()
    )
  ) {
    return new Date(value);
  }


  const direct =
    new Date(
      value
    );


  if (
    !Number.isNaN(
      direct.getTime()
    )
  ) {
    return direct;
  }


  const parts =
    String(value)
      .trim()
      .toLowerCase()
      .replace(/\./g, '')
      .replace(/,/g, '')
      .split(/\s+/);


  if (
    parts.length !== 3
  ) {
    return null;
  }


  const day =
    Number(
      parts[0]
    );

  const month =
    MONTHS[
      parts[1]
    ];

  const year =
    Number(
      parts[2]
    );


  if (
    Number.isNaN(day) ||
    month === undefined ||
    Number.isNaN(year)
  ) {
    return null;
  }


  return new Date(
    year,
    month,
    day,
    12,
    0,
    0,
    0
  );

};


const startOfDay = (
  value
) => {

  const date =
    new Date(
      value
    );


  date.setHours(
    0,
    0,
    0,
    0
  );


  return date;

};


export const getDaysSince = (
  value,
  now = new Date()
) => {

  const date =
    parseRetentionDate(
      value
    );


  if (!date) {
    return null;
  }


  const current =
    startOfDay(
      now
    );

  const target =
    startOfDay(
      date
    );


  const difference =
    Math.floor(
      (
        current.getTime() -
        target.getTime()
      ) /
      86400000
    );


  return Math.max(
    0,
    difference
  );

};


export const isMemberSubscriptionActive = (
  member,
  now = new Date()
) => {

  if (
    !member ||
    member.status === 'inactive' ||
    member.accessBlocked === true
  ) {
    return false;
  }


  const subscription =
    member.subscription;


  if (
    !subscription ||
    !subscription.endDate
  ) {
    return false;
  }


  if (
    subscription.status &&
    String(
      subscription.status
    ).toLowerCase() !==
      'active'
  ) {
    return false;
  }


  const endDate =
    parseRetentionDate(
      subscription.endDate
    );


  if (!endDate) {
    return false;
  }


  endDate.setHours(
    23,
    59,
    59,
    999
  );


  return (
    endDate.getTime() >=
    now.getTime()
  );

};


export const getLastAttendanceForMember = (
  memberId,
  attendance = []
) => {

  return attendance
    .filter(
      record =>
        record?.memberId ===
        memberId &&
        Boolean(
          record?.entryAt ||
          record?.createdAt
        )
    )
    .sort(
      (
        first,
        second
      ) => {

        const firstDate =
          parseRetentionDate(
            first.entryAt ||
            first.createdAt
          );

        const secondDate =
          parseRetentionDate(
            second.entryAt ||
            second.createdAt
          );


        return (
          (
            secondDate?.getTime() ||
            0
          ) -
          (
            firstDate?.getTime() ||
            0
          )
        );

      }
    )[0] ||
    null;

};


export const normalizeRetentionSettings = (
  settings
) => {

  const source =
    settings?.retention ||
    settings ||
    {};


  const followUpDays =
    Math.max(
      1,
      Number(
        source.followUpDays ??
        7
      )
    );

  const riskDays =
    Math.max(
      followUpDays + 1,
      Number(
        source.riskDays ??
        15
      )
    );

  const inactiveDays =
    Math.max(
      riskDays + 1,
      Number(
        source.inactiveDays ??
        30
      )
    );


  return {
    enabled:
      source.enabled !==
      false,

    followUpDays,

    riskDays,

    inactiveDays,

    includeNeverAttended:
      source.includeNeverAttended !==
      false
  };

};


export const getRetentionLevel = (
  daysWithoutAttendance,
  retentionSettings
) => {

  const config =
    normalizeRetentionSettings(
      retentionSettings
    );


  if (
    daysWithoutAttendance >=
    config.inactiveDays
  ) {
    return 'inactive';
  }


  if (
    daysWithoutAttendance >=
    config.riskDays
  ) {
    return 'risk';
  }


  if (
    daysWithoutAttendance >=
    config.followUpDays
  ) {
    return 'followup';
  }


  return 'frequent';

};


export const getRetentionLabel = (
  level
) => {

  const labels = {
    frequent:
      'Frecuente',
    followup:
      'Seguimiento',
    risk:
      'Riesgo de abandono',
    inactive:
      'Inactivo'
  };


  return labels[level] ||
    'Sin clasificación';

};


export const buildRetentionMembers = ({
  members = getMembers(),
  attendance = getAttendance(),
  settings = getGymSettings(),
  now = new Date()
} = {}) => {

  const config =
    normalizeRetentionSettings(
      settings
    );


  if (
    !config.enabled
  ) {
    return [];
  }


  return members
    .filter(
      member =>
        isMemberSubscriptionActive(
          member,
          now
        )
    )
    .map(
      member => {

        const lastAttendance =
          getLastAttendanceForMember(
            member.id,
            attendance
          );


        const referenceDate =
          lastAttendance?.entryAt ||
          lastAttendance?.createdAt ||
          (
            config.includeNeverAttended
              ? (
                  member.registrationDate ||
                  member.createdAt
                )
              : null
          );


        if (!referenceDate) {
          return null;
        }


        const daysWithoutAttendance =
          getDaysSince(
            referenceDate,
            now
          );


        if (
          daysWithoutAttendance ===
          null
        ) {
          return null;
        }


        const level =
          getRetentionLevel(
            daysWithoutAttendance,
            config
          );


        return {

          ...member,

          retention: {
            level,
            label:
              getRetentionLabel(
                level
              ),

            daysWithoutAttendance,

            neverAttended:
              !lastAttendance,

            lastAttendanceAt:
              lastAttendance?.entryAt ||
              lastAttendance?.createdAt ||
              null,

            referenceDate,

            subscriptionEndDate:
              member
                ?.subscription
                ?.endDate ||
              null
          }

        };

      }
    )
    .filter(Boolean)
    .sort(
      (
        first,
        second
      ) =>
        second.retention.daysWithoutAttendance -
        first.retention.daysWithoutAttendance
    );

};


export const getRetentionCandidates = (
  options = {}
) => {

  const all =
    buildRetentionMembers(
      options
    );


  return all.filter(
    member =>
      member.retention.level !==
      'frequent'
  );

};


export const getRetentionStats = (
  options = {}
) => {

  const all =
    buildRetentionMembers(
      options
    );


  const stats = {
    activeSubscriptions:
      all.length,

    frequent:
      0,

    followup:
      0,

    risk:
      0,

    inactive:
      0,

    totalToContact:
      0
  };


  all.forEach(
    member => {

      const level =
        member.retention.level;


      if (
        Object.prototype.hasOwnProperty.call(
          stats,
          level
        )
      ) {
        stats[level] +=
          1;
      }


      if (
        level !==
        'frequent'
      ) {
        stats.totalToContact +=
          1;
      }

    }
  );


  return stats;

};


export const createRetentionWhatsAppUrl = (
  member,
  gymName = 'el gimnasio'
) => {

  const rawPhone =
    String(
      member?.phone ||
      ''
    )
      .replace(
        /\D/g,
        ''
      );


  if (!rawPhone) {
    return null;
  }


  const phone =
    rawPhone.length ===
    10
      ? `52${rawPhone}`
      : rawPhone;


  const firstName =
    member?.firstName ||
    '';


  const message =
    `Hola ${firstName || '👋'}, te saludamos de ${gymName}. ` +
    `Hace algunos días que no te vemos entrenando y tu membresía continúa activa. ` +
    `Esperamos verte pronto nuevamente 💪`;


  return (
    `https://wa.me/${phone}` +
    `?text=${encodeURIComponent(message)}`
  );

};
