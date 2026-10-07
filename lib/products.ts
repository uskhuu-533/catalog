import { MongoClient } from "mongodb";

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  sizes: string[];
  color: string;
  description: string;
  imageUrl: string;
  imagePublicId: string;
  createdAt: string;
};

declare global {
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI тохируулаагүй байна.");
  if (!global.mongoClientPromise) {
    global.mongoClientPromise = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 }).connect()
      .catch((error) => {
        global.mongoClientPromise = undefined;
        throw error;
      });
  }
  return global.mongoClientPromise;
}

async function collection() {
  const client = await getClient();
  const dbName = process.env.MONGODB_DB || "huvtsas_catalog";
  return client.db(dbName).collection<Product>("products");
}

export async function getProducts(): Promise<Product[]> {
  return (await collection()).find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
}

export async function addProduct(product: Product): Promise<void> {
  await (await collection()).insertOne(product);
}
