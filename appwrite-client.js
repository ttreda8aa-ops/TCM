/**
 * Appwrite Client Configuration & Service Helper
 * Direct cloud connection to:
 * - Endpoint: https://fra.cloud.appwrite.io/v1
 * - Project ID: 6ae4ef9d0002a2c51246
 * - Database ID: tablesdb
 */

const AppwriteConfig = {
  endpoint: 'https://fra.cloud.appwrite.io/v1',
  projectId: '6ae4ef9d0002a2c51246',
  databaseId: '6ae4f0b30034ed869dd8',
  collections: {
    lectures: '6ae4f3f00034b31697c2',
    exams: '6ae4f42b003b4dcb0195',
    assignments: '6ae4f437002e773f32ba',
    alerts: '6ae4f460003285df24b7',
    settings: '6ae4f46c000a9f2b50e0',
    representatives: 'representatives'
  }
};

let appwriteClient = null;
let appwriteDatabases = null;
let appwriteConnected = false;

try {
  if (typeof Appwrite !== 'undefined') {
    const { Client, Databases } = Appwrite;
    appwriteClient = new Client()
      .setEndpoint(AppwriteConfig.endpoint)
      .setProject(AppwriteConfig.projectId);

    appwriteDatabases = new Databases(appwriteClient);
    appwriteConnected = true;
    console.log('Appwrite Cloud Client initialized successfully.');
  } else {
    console.warn('Appwrite Web SDK not loaded yet.');
  }
} catch (err) {
  console.error('Failed to initialize Appwrite Client:', err);
}

window.AppwriteConfig = AppwriteConfig;
window.appwriteClient = appwriteClient;
window.appwriteDatabases = appwriteDatabases;
window.isAppwriteActive = () => appwriteConnected && !!appwriteDatabases;
