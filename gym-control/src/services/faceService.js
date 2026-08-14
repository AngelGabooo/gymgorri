// src/services/faceService.js

import Human from '@vladmandic/human';

const config = {
  backend: 'webgl',

  modelBasePath:
    'https://cdn.jsdelivr.net/npm/@vladmandic/human/models/',

  cacheSensitivity: 0,

  face: {
    enabled: true,

    detector: {
      enabled: true,
      rotation: true,
      maxDetected: 2,
      minConfidence: 0.45,
    },

    mesh: {
      enabled: true,
    },

    iris: {
      enabled: false,
    },

    description: {
      enabled: true,
      minConfidence: 0.45,
    },

    emotion: {
      enabled: false,
    },

    age: {
      enabled: false,
    },

    gender: {
      enabled: false,
    },

    antispoof: {
      enabled: false,
    },

    liveness: {
      enabled: false,
    },
  },

  body: {
    enabled: false,
  },

  hand: {
    enabled: false,
  },

  object: {
    enabled: false,
  },

  segmentation: {
    enabled: false,
  },

  gesture: {
    enabled: false,
  },
};

const human = new Human(config);

let initPromise = null;

export const initializeFaceEngine = async () => {
  if (!initPromise) {
    initPromise = (async () => {
      console.log('🧠 Inicializando Human...');

      await human.load();

      console.log(
        '✅ Modelos:',
        human.models.loaded()
      );

      await human.warmup();

      console.log(
        '✅ Backend:',
        human.tf.getBackend()
      );

      return human;
    })().catch((error) => {
      initPromise = null;

      console.error(
        '❌ Error inicializando Human:',
        error
      );

      throw error;
    });
  }

  return initPromise;
};

export const detectFace = async (video) => {
  try {
    if (!video) {
      return {
        success: false,
        reason: 'NO_VIDEO',
        message: 'No existe el elemento de video.',
      };
    }

    if (video.readyState < 2) {
      return {
        success: false,
        reason: 'VIDEO_NOT_READY',
        message: 'La cámara todavía no está lista.',
      };
    }

    const engine =
      await initializeFaceEngine();

    console.log(
      '🔎 Ejecutando human.detect...',
      {
        readyState: video.readyState,
        width: video.videoWidth,
        height: video.videoHeight,
      }
    );

    const result =
      await engine.detect(video);

    console.log(
      '📦 Resultado Human:',
      {
        faces:
          result?.face?.length || 0,
        face:
          result?.face?.[0] || null,
      }
    );

    const faces =
      result?.face || [];

    if (faces.length === 0) {
      return {
        success: false,
        reason: 'NO_FACE',
        message:
          'No detecto tu rostro.',
        result,
      };
    }

    if (faces.length > 1) {
      return {
        success: false,
        reason: 'MULTIPLE_FACES',
        message:
          'Solo debe aparecer una persona.',
        result,
      };
    }

    const face =
      faces[0];

    const embedding =
      face?.embedding
        ? Array.from(
            face.embedding
          )
        : null;

    return {
      success: true,
      face,
      embedding,
      descriptor:
        embedding,
      result,
    };
  } catch (error) {
    console.error(
      '❌ human.detect falló:',
      error
    );

    return {
      success: false,
      reason: 'DETECTION_ERROR',
      message:
        error?.message ||
        'No se pudo analizar el rostro.',
      error,
    };
  }
};

export const compareEmbeddings = (
  embeddingA,
  embeddingB
) => {
  if (
    !Array.isArray(embeddingA) ||
    !Array.isArray(embeddingB) ||
    embeddingA.length !==
      embeddingB.length
  ) {
    return 0;
  }

  try {
    return human.match.similarity(
      embeddingA,
      embeddingB
    );
  } catch (error) {
    console.error(
      'Error comparando embeddings:',
      error
    );

    return 0;
  }
};

export const bestSimilarityBetweenSets = (
  setA = [],
  setB = []
) => {
  let best = 0;

  setA.forEach((first) => {
    setB.forEach((second) => {
      const similarity =
        compareEmbeddings(
          first,
          second
        );

      if (similarity > best) {
        best = similarity;
      }
    });
  });

  return best;
};

export const findDuplicateFace = (
  newEmbeddings,
  members,
  threshold = 0.75
) => {
  let bestMember = null;
  let bestSimilarity = 0;

  if (
    !Array.isArray(
      newEmbeddings
    ) ||
    !Array.isArray(members)
  ) {
    return {
      duplicate: false,
      member: null,
      similarity: 0,
    };
  }

  members.forEach((member) => {
    const stored =
      member?.access?.face?.embeddings;

    if (!Array.isArray(stored)) {
      return;
    }

    const similarity =
      bestSimilarityBetweenSets(
        newEmbeddings,
        stored
      );

    if (
      similarity >
      bestSimilarity
    ) {
      bestSimilarity =
        similarity;

      bestMember =
        member;
    }
  });

  return {
    duplicate:
      Boolean(
        bestMember &&
        bestSimilarity >=
          threshold
      ),

    member:
      bestMember,

    similarity:
      bestSimilarity,
  };
};

export const findBestMemberByFace = (
  embedding,
  members,
  threshold = 0.6
) => {
  let bestMember = null;
  let bestSimilarity = 0;

  if (
    !Array.isArray(embedding) ||
    !Array.isArray(members)
  ) {
    return {
      member: null,
      similarity: 0,
    };
  }

  members.forEach((member) => {
    if (
      member?.accessBlocked ||
      !member?.access?.face?.enabled
    ) {
      return;
    }

    const stored =
      member?.access?.face?.embeddings;

    if (!Array.isArray(stored)) {
      return;
    }

    stored.forEach((known) => {
      const similarity =
        compareEmbeddings(
          embedding,
          known
        );

      if (
        similarity >
        bestSimilarity
      ) {
        bestSimilarity =
          similarity;

        bestMember =
          member;
      }
    });
  });

  return {
    member:
      bestSimilarity >= threshold
        ? bestMember
        : null,

    similarity:
      bestSimilarity,
  };
};

export default human;