import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  console.warn('Invalid/Missing environment variable: "MONGODB_URI". MongoDB features will be disabled.');
}

const uri = process.env.MONGODB_URI || "";
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  // FIX: Replaced Node-specific 'global' with 'globalThis' to resolve 'Cannot find name "global"' error and ensure compatibility across modern JS runtimes.
  let globalWithMongo = globalThis as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    if (uri) {
        client = new MongoClient(uri, options);
        globalWithMongo._mongoClientPromise = client.connect();
    } else {
        globalWithMongo._mongoClientPromise = Promise.reject("MongoDB URI missing");
    }
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  if (uri) {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  } else {
    clientPromise = Promise.reject("MongoDB URI missing");
  }
}

export default clientPromise;