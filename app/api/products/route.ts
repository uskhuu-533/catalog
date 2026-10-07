import { NextResponse } from "next/server";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { addProduct, getProducts, type Product } from "@/lib/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const imageTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function configureCloudinary() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud_name || !api_key || !api_secret) throw new Error("Cloudinary-ийн холболтын тохиргоо дутуу байна.");
  cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
}

function uploadImage(buffer: Buffer, publicId: string): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "huvtsas-catalog", public_id: publicId, resource_type: "image" },
      (error, result) => error || !result ? reject(error ?? new Error("Зураг оруулахад алдаа гарлаа.")) : resolve(result),
    ).end(buffer);
  });
}

function field(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  try {
    return NextResponse.json(await getProducts());
  } catch (error) {
    console.error("GET /api/products:", error);
    return NextResponse.json({ error: error instanceof Error && error.message.includes("MONGODB_URI") ? error.message : "Бараануудыг уншихад алдаа гарлаа. Atlas холболтоо шалгана уу." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const name = field(form, "name");
    const category = field(form, "category");
    const color = field(form, "color");
    const description = field(form, "description");
    const price = Number(field(form, "price"));
    const sizes = field(form, "sizes").split(",").map((size) => size.trim()).filter(Boolean);
    const image = form.get("image");

    if (!name || name.length > 120 || !category || !Number.isFinite(price) || price <= 0 || sizes.length === 0 || !image || !(image instanceof File) || image.size === 0) {
      return NextResponse.json({ error: "Нэр, ангилал, үнэ, размер, зураг бүгдийг зөв бөглөнө үү." }, { status: 400 });
    }
    if (color.length > 80 || description.length > 1000 || sizes.some((size) => size.length > 20)) {
      return NextResponse.json({ error: "Оруулсан мэдээлэл хэт урт байна." }, { status: 400 });
    }
    if (!imageTypes[image.type] || image.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "8 МБ-аас бага JPG, PNG, WebP эсвэл GIF зураг сонгоно уу." }, { status: 400 });
    }

    configureCloudinary();
    const id = crypto.randomUUID();
    const uploaded = await uploadImage(Buffer.from(await image.arrayBuffer()), id);

    const product: Product = {
      id,
      name,
      category,
      price,
      sizes: [...new Set(sizes)],
      color,
      description,
      imageUrl: uploaded.secure_url,
      imagePublicId: uploaded.public_id,
      createdAt: new Date().toISOString(),
    };
    try {
      await addProduct(product);
    } catch (error) {
      await cloudinary.uploader.destroy(uploaded.public_id).catch((cleanupError) => console.error("Cloudinary cleanup:", cleanupError));
      throw error;
    }
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("POST /api/products:", error);
    return NextResponse.json({ error: error instanceof Error && (error.message.includes("MONGODB_URI") || error.message.includes("Cloudinary-ийн холболтын")) ? error.message : "Бараа хадгалахад алдаа гарлаа. Atlas болон Cloudinary холболтоо шалгана уу." }, { status: 500 });
  }
}
