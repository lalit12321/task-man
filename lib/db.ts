import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'teamflow';

if (!uri) {
  throw new Error('MONGODB_URI is not set. Add it to .env.local');
}

// Re-use the connection across hot reloads in dev, and across requests in prod
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri).connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = new MongoClient(uri).connect();
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

// Document shapes as stored in MongoDB (server-side only)
export interface UserDoc {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  displayName: string;
  role?: 'admin' | 'member';
  createdAt: Date;
}

export interface TeamMemberDoc {
  userId: string;
  displayName: string;
  email: string;
  role: 'admin' | 'member';
  photoURL?: string | null;
}

export interface TeamDoc {
  _id: ObjectId;
  name: string;
  description: string;
  ownerId: string;
  members: TeamMemberDoc[];
  inviteCode: string;
  createdAt: Date;
}

export interface TaskDoc {
  _id: ObjectId;
  teamId: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assigneeId: string | null;
  assigneeName: string | null;
  dueDate: Date | null;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function users(): Promise<Collection<UserDoc>> {
  return (await getDb()).collection<UserDoc>('users');
}

export async function teams(): Promise<Collection<TeamDoc>> {
  return (await getDb()).collection<TeamDoc>('teams');
}

export async function tasks(): Promise<Collection<TaskDoc>> {
  return (await getDb()).collection<TaskDoc>('tasks');
}

// One-time index setup. Call from API routes; safe to call repeatedly.
let indexesEnsured = false;
export async function ensureIndexes(): Promise<void> {
  if (indexesEnsured) return;
  const u = await users();
  const t = await teams();
  const k = await tasks();
  await Promise.all([
    u.createIndex({ email: 1 }, { unique: true }),
    t.createIndex({ inviteCode: 1 }, { unique: true }),
    t.createIndex({ 'members.userId': 1 }),
    k.createIndex({ teamId: 1 }),
    k.createIndex({ assigneeId: 1 }),
  ]);
  indexesEnsured = true;
}

export { ObjectId };
