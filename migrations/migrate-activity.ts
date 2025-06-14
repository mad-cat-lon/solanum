import admin from 'firebase-admin';

async function initializeFirebase() {
  // Dynamically import the JSON file and access with .default if necessary
  const serviceAccount = (await import('./solanum-5865e-firebase-adminsdk-6p5ay-2e6f095706.json')).default as admin.ServiceAccount;

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
initializeFirebase().then(() => {
  const db = admin.firestore();

  async function migrateActivityToLog(userId: string) {
    try {
      const activityRef = db.collection(`/users/${userId}/activity`);
      const logRef = db.collection(`/users/${userId}/log`);

      const activitySnapshot = await activityRef.get();
      if (activitySnapshot.empty) {
        console.log(`No activities found for user ${userId}`);
        return;
      }

      const groupedActivities: { [date: string]: { activities: { type: string; timestamp: FirebaseFirestore.Timestamp }[]; date: FirebaseFirestore.Timestamp } } = {};

      activitySnapshot.forEach((doc) => {
        const { type, timestamp } = doc.data() as { type: string; timestamp: FirebaseFirestore.Timestamp };
        const dateStr = timestamp.toDate().toISOString().split('T')[0];

        if (!groupedActivities[dateStr]) {
          groupedActivities[dateStr] = {
            activities: [],
            date: timestamp,
          };
        }

        groupedActivities[dateStr].activities.push({ type, timestamp });
      });

      for (const [dateStr, logEntry] of Object.entries(groupedActivities)) {
        await logRef.doc(dateStr).set(logEntry);
        console.log(`Migrated activities for ${dateStr} to /users/${userId}/log`);
      }

      console.log(`Migration completed for user ${userId}`);
    } catch (error) {
      console.error(`Error migrating activities for user ${userId}: `, error);
    }
  }

  async function runMigration() {
    const usersSnapshot = await db.collection('/users').get();
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      await migrateActivityToLog(userId);
    }
  }

  runMigration()
    .then(() => {
      console.log('All user migrations completed');
    })
    .catch((error) => {
      console.error('Migration script error: ', error);
    });
});