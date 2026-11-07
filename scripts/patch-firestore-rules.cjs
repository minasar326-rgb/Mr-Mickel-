const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'firestore.rules');
let content = fs.readFileSync(filePath, 'utf8');

const oldBlock = `      match /subscriptions/{subId} {
        allow read: if isOwner(userId) || isTeacher();
        allow write: if isTeacher();
      }
    }

    match /students/{userId} {
      allow read: if isOwner(userId) || isTeacher();
      allow create: if (isOwner(userId) && doesNotSetSensitiveFieldsOnCreate()) || isTeacher();
      allow update: if (isOwner(userId) && doesNotModifySensitiveFields()) || isTeacher();
      allow delete: if isTeacher();

      match /subscriptions/{subId} {
        allow read: if isOwner(userId) || isTeacher();
        allow write: if isTeacher();
      }
    }

    // ===============================================================
    // Subscriptions Collection (Top-Level)
    // ===============================================================

    match /subscriptions/{subId} {
      // Students can only read their own subscription documents
      allow read: if isAuthenticated() && (resource.data.userId == request.auth.uid || isTeacher());
      
      // Subscriptions can strictly be created or edited by Teacher / Backend service account
      allow write: if isTeacher();
    }

    // ===============================================================
    // Activation Codes (Completely Closed from Client Inspection)
    // ===============================================================

    match /codes/{codeId} {
      allow read, write: if isTeacher();
    }

    match /subscriptionCodes/{codeId} {
      allow read, write: if isTeacher();
    }`;

const newBlock = `      match /subscriptions/{subId} {
        allow read, write: if isOwner(userId) || isTeacher();
      }
    }

    match /students/{userId} {
      allow read: if isOwner(userId) || isTeacher();
      allow create: if (isOwner(userId) && doesNotSetSensitiveFieldsOnCreate()) || isTeacher();
      allow update: if (isOwner(userId) && doesNotModifySensitiveFields()) || isTeacher();
      allow delete: if isTeacher();

      match /subscriptions/{subId} {
        allow read, write: if isOwner(userId) || isTeacher();
      }
    }

    // ===============================================================
    // Subscriptions Collection (Top-Level)
    // ===============================================================

    match /subscriptions/{subId} {
      // Students can only read their own subscription documents
      allow read: if isAuthenticated() && (resource.data.userId == request.auth.uid || isTeacher());
      allow write: if (isAuthenticated() && request.resource.data.userId == request.auth.uid) || isTeacher();
    }

    // ===============================================================
    // Activation Codes (Single Lookup for Redemption, List for Teacher)
    // ===============================================================

    match /codes/{codeId} {
      allow get: if isAuthenticated();
      allow list: if isTeacher();
      allow update: if (isAuthenticated() && (resource.data.usedCount < resource.data.maxUses || resource.data.usedByUid == request.auth.uid)) || isTeacher();
      allow create, delete: if isTeacher();
    }

    match /subscriptionCodes/{codeId} {
      allow get: if isAuthenticated();
      allow list: if isTeacher();
      allow update: if (isAuthenticated() && (resource.data.usedCount < resource.data.maxUses || resource.data.usedByUid == request.auth.uid)) || isTeacher();
      allow create, delete: if isTeacher();
    }`;

const normContent = content.replace(/\r\n/g, '\n');
const normOld = oldBlock.replace(/\r\n/g, '\n');
const normNew = newBlock.replace(/\r\n/g, '\n');

if (normContent.includes(normOld)) {
  const updated = normContent.replace(normOld, normNew);
  fs.writeFileSync(filePath, updated, 'utf8');
  console.log('SUCCESS: firestore.rules updated successfully!');
} else {
  console.error('ERROR: oldBlock not found in firestore.rules');
}
