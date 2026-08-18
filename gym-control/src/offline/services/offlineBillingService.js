// src/offline/services/offlineBillingService.js

import {
  saveOfflinePayment,
  deleteOfflinePayment
} from '../repositories/paymentRepository.js';

import {
  saveOfflineSubscription,
  deleteOfflineSubscription
} from '../repositories/subscriptionRepository.js';


// ======================================================
// RESOLVER GIMNASIO
// ======================================================

const resolveGymId = ({
  gymId = null,
  session = null,
  member = null,
  record = null
} = {}) => {

  return (
    gymId ||
    record?.gymId ||
    member?.gymId ||
    session?.gymId ||
    null
  );

};


// ======================================================
// PREPARAR PAGO
// ======================================================

export const preparePaymentForOffline = ({
  payment,
  gymId = null,
  session = null,
  member = null
}) => {

  if (!payment?.id) {

    throw new Error(
      'El pago no contiene un ID válido.'
    );

  }


  const resolvedGymId =
    resolveGymId({
      gymId,
      session,
      member,
      record:
        payment
    });


  if (!resolvedGymId) {

    throw new Error(
      'No se pudo determinar el gimnasio del pago.'
    );

  }


  return {

    ...payment,

    gymId:
      String(
        resolvedGymId
      ),

    memberId:
      payment.memberId ||
      member?.id ||
      null,

    updatedAt:
      payment.updatedAt ||
      payment.createdAt ||
      new Date()
        .toISOString()

  };

};


// ======================================================
// PREPARAR HISTORIAL DE SUSCRIPCIÓN
// ======================================================

export const prepareSubscriptionForOffline = ({
  subscription,
  gymId = null,
  session = null,
  member = null
}) => {

  if (!subscription?.id) {

    throw new Error(
      'El historial de suscripción no contiene ID.'
    );

  }


  const resolvedGymId =
    resolveGymId({
      gymId,
      session,
      member,
      record:
        subscription
    });


  if (!resolvedGymId) {

    throw new Error(
      'No se pudo determinar el gimnasio de la suscripción.'
    );

  }


  const memberId =
    subscription.memberId ||
    member?.id ||
    null;


  if (!memberId) {

    throw new Error(
      'El historial de suscripción no contiene memberId.'
    );

  }


  return {

    ...subscription,

    gymId:
      String(
        resolvedGymId
      ),

    memberId:
      String(
        memberId
      ),

    updatedAt:
      subscription.updatedAt ||
      subscription.createdAt ||
      new Date()
        .toISOString()

  };

};


// ======================================================
// RESPALDAR PAGO
// ======================================================

export const mirrorPaymentOffline =
  async ({
    payment,
    gymId = null,
    session = null,
    member = null
  }) => {

    try {

      const prepared =
        preparePaymentForOffline({
          payment,
          gymId,
          session,
          member
        });


      const result =
        await saveOfflinePayment(
          prepared
        );


      console.log(
        '✅ Pago respaldado en IndexedDB:',
        {
          gymId:
            result.gymId,

          paymentId:
            result.id,

          memberId:
            result.memberId,

          syncStatus:
            result.syncStatus
        }
      );


      return {

        success:
          true,

        payment:
          result

      };

    } catch (error) {

      console.error(
        '❌ No se pudo respaldar el pago en IndexedDB:',
        error
      );


      return {

        success:
          false,

        payment:
          null,

        error

      };

    }

  };


// ======================================================
// RESPALDAR SUSCRIPCIÓN
// ======================================================

export const mirrorSubscriptionOffline =
  async ({
    subscription,
    gymId = null,
    session = null,
    member = null
  }) => {

    try {

      const prepared =
        prepareSubscriptionForOffline({
          subscription,
          gymId,
          session,
          member
        });


      const result =
        await saveOfflineSubscription(
          prepared
        );


      console.log(
        '✅ Historial de suscripción respaldado en IndexedDB:',
        {
          gymId:
            result.gymId,

          subscriptionId:
            result.id,

          memberId:
            result.memberId,

          syncStatus:
            result.syncStatus
        }
      );


      return {

        success:
          true,

        subscription:
          result

      };

    } catch (error) {

      console.error(
        '❌ No se pudo respaldar la suscripción en IndexedDB:',
        error
      );


      return {

        success:
          false,

        subscription:
          null,

        error

      };

    }

  };


// ======================================================
// RESPALDAR PAGO + SUSCRIPCIÓN
// ======================================================

export const mirrorBillingOperationOffline =
  async ({
    payment = null,
    subscription = null,
    gymId = null,
    session = null,
    member = null
  }) => {

    const result = {

      payment:
        null,

      subscription:
        null

    };


    if (
      payment
    ) {

      result.payment =
        await mirrorPaymentOffline({
          payment,
          gymId,
          session,
          member
        });

    }


    if (
      subscription
    ) {

      result.subscription =
        await mirrorSubscriptionOffline({
          subscription,
          gymId,
          session,
          member
        });

    }


    return result;

  };


// ======================================================
// ELIMINAR PAGO OFFLINE
// ======================================================

export const mirrorPaymentDeletionOffline =
  async ({
    payment,
    gymId = null,
    session = null
  }) => {

    try {

      if (!payment?.id) {

        throw new Error(
          'No se recibió el pago que se eliminará.'
        );

      }


      const resolvedGymId =
        resolveGymId({
          gymId,
          session,
          record:
            payment
        });


      if (!resolvedGymId) {

        throw new Error(
          'No se pudo determinar el gimnasio del pago.'
        );

      }


      const result =
        await deleteOfflinePayment(
          resolvedGymId,
          payment.id
        );


      console.log(
        '🗑️ Eliminación de pago registrada offline:',
        payment.id
      );


      return {

        success:
          true,

        result

      };

    } catch (error) {

      console.error(
        '❌ No se pudo registrar la eliminación del pago offline:',
        error
      );


      return {

        success:
          false,

        error

      };

    }

  };


// ======================================================
// ELIMINAR HISTORIAL DE SUSCRIPCIÓN OFFLINE
// ======================================================

export const mirrorSubscriptionDeletionOffline =
  async ({
    subscription,
    gymId = null,
    session = null
  }) => {

    try {

      if (!subscription?.id) {

        throw new Error(
          'No se recibió el historial de suscripción.'
        );

      }


      const resolvedGymId =
        resolveGymId({
          gymId,
          session,
          record:
            subscription
        });


      if (!resolvedGymId) {

        throw new Error(
          'No se pudo determinar el gimnasio.'
        );

      }


      const result =
        await deleteOfflineSubscription(
          resolvedGymId,
          subscription.id
        );


      console.log(
        '🗑️ Eliminación de historial de suscripción registrada offline:',
        subscription.id
      );


      return {

        success:
          true,

        result

      };

    } catch (error) {

      console.error(
        '❌ No se pudo eliminar la suscripción de IndexedDB:',
        error
      );


      return {

        success:
          false,

        error

      };

    }

  };


// ======================================================
// EXPORT DEFAULT
// ======================================================

const offlineBillingService = {

  mirrorPayment:
    mirrorPaymentOffline,

  mirrorSubscription:
    mirrorSubscriptionOffline,

  mirrorBilling:
    mirrorBillingOperationOffline,

  deletePayment:
    mirrorPaymentDeletionOffline,

  deleteSubscription:
    mirrorSubscriptionDeletionOffline

};


export default offlineBillingService;