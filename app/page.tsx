"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownUp, ArrowLeft, ArrowRight, Check, ChevronDown, CircleHelp,
  ImagePlus, LayoutGrid, Package, Plus, Search, SlidersHorizontal,
  Sparkles, Tag, UploadCloud, X,
} from "lucide-react";
import type { Product } from "@/lib/products";

const categories = ["Бүгд", "Цамц", "Өмд", "Даашинз", "Гадуур хувцас", "Гутал", "Аксессуар", "Бусад"];
const productCategories = categories.slice(1);
const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL", "Free size"];
const money = (value: number) => new Intl.NumberFormat("mn-MN").format(value) + " ₮";

type FormState = {
  name: string;
  category: string;
  price: string;
  sizes: string[];
  color: string;
  description: string;
};

const emptyForm: FormState = { name: "", category: "", price: "", sizes: [], color: "", description: "" };

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Бүгд");
  const [size, setSize] = useState("Бүх размер");
  const [sort, setSort] = useState("newest");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef("");

  useEffect(() => {
    fetch("/api/products", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Бараануудыг ачаалж чадсангүй.");
        return response.json() as Promise<Product[]>;
      })
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);

  useEffect(() => {
    document.body.style.overflow = showForm || selected ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showForm, selected]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const list = products.filter((product) => {
      const matchesSearch = !query || [product.name, product.category, product.color, product.description, ...product.sizes]
        .some((item) => item.toLocaleLowerCase().includes(query));
      return matchesSearch && (category === "Бүгд" || product.category === category) &&
        (size === "Бүх размер" || product.sizes.includes(size));
    });
    if (sort === "priceAsc") list.sort((a, b) => a.price - b.price);
    if (sort === "priceDesc") list.sort((a, b) => b.price - a.price);
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name, "mn"));
    return list;
  }, [products, search, category, size, sort]);

  const totalValue = products.reduce((sum, product) => sum + product.price, 0);
  function closeForm() {
    if (saving) return;
    setShowForm(false);
    setError("");
  }

  function openForm() {
    setForm(emptyForm);
    setImage(null);
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = "";
    setPreview("");
    setError("");
    setShowForm(true);
  }

  function selectImage(file: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = file ? URL.createObjectURL(file) : "";
    setPreview(previewRef.current);
    setImage(file);
  }

  function toggleSize(value: string) {
    setForm((current) => ({
      ...current,
      sizes: current.sizes.includes(value) ? current.sizes.filter((item) => item !== value) : [...current.sizes, value],
    }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!image || !form.name.trim() || !form.category || !form.price || form.sizes.length === 0) {
      setError("Нэр, ангилал, үнэ, размер, зураг оруулна уу.");
      return;
    }
    setSaving(true);
    setError("");
    const data = new FormData();
    data.set("name", form.name);
    data.set("category", form.category);
    data.set("price", form.price);
    data.set("sizes", form.sizes.join(","));
    data.set("color", form.color);
    data.set("description", form.description);
    data.set("image", image);
    try {
      const response = await fetch("/api/products", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Бараа хадгалахад алдаа гарлаа.");
      setProducts((current) => [result as Product, ...current]);
      setCategory("Бүгд");
      setSize("Бүх размер");
      setSearch("");
      setShowForm(false);
      setNotice("Бараа амжилттай хадгалагдлаа");
      window.setTimeout(() => setNotice(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Бараа хадгалахад алдаа гарлаа.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">h<span>.</span></div><div><strong>HUVTSAS</strong><small>БАРААНЫ КАТАЛОГ</small></div></div>
        <div className="sidebar-label">УДИРДЛАГА</div>
        <div className="sidebar-link active"><LayoutGrid size={19} strokeWidth={1.8} /><span>Бүх бараа</span><span className="sidebar-count">{products.length}</span></div>
        <div className="sidebar-label sidebar-label-second">АНГИЛАЛ</div>
        <nav aria-label="Ангилал">
          {productCategories.map((item) => <button key={item} className={`sidebar-link ${category === item ? "chosen" : ""}`} onClick={() => setCategory(item)}><span className="category-dot" /><span>{item}</span><span className="sidebar-count muted">{products.filter((product) => product.category === item).length}</span></button>)}
        </nav>
        <div className="sidebar-bottom"><div className="sidebar-tip-icon"><Sparkles size={18} /></div><strong>Таны цуглуулга, нэг дор.</strong><p>Бараагаа бүртгэж, хэрэгтэй үедээ хялбархан олоорой.</p><button onClick={openForm}>Бараа нэмэх <ArrowRight size={15} /></button></div>
        <div className="sidebar-footer"><span className="avatar">H</span><div><strong>Миний дэлгүүр</strong><small>Каталогийн удирдлага</small></div><ChevronDown size={16} /></div>
      </aside>

      <div className="main-area">
        <header className="topbar"><div className="breadcrumb"><span>Миний дэлгүүр</span><span className="slash">/</span><strong>Барааны каталог</strong></div><div className="topbar-right"><span className="today">Өөрийн загварын орон зай</span><span className="topbar-avatar">H</span></div></header>
        <div className="content">
          <div className="mobile-brand"><div className="brand-mark">h<span>.</span></div><strong>HUVTSAS</strong><button className="mobile-add" aria-label="Шинэ бараа нэмэх" onClick={openForm}><Plus size={20} /></button></div>
          <section className="page-head"><div><div className="eyebrow"><span className="eyebrow-line" /> ТАНЫ БАРААНЫ САН</div><h1>Барааны каталог<span className="title-period">.</span></h1><p>Хувцсаа нэг дор цэгцэлж, хүссэнээ хормын дотор олоорой.</p></div><button className="primary-button head-add" onClick={openForm}><Plus size={19} strokeWidth={2} /> Шинэ бараа нэмэх</button></section>

          <section className="overview" aria-label="Ерөнхий мэдээлэл"><div className="overview-main"><div className="overview-icon"><Package size={22} strokeWidth={1.7} /></div><div><span>Нийт бараа</span><strong>{products.length.toString().padStart(2, "0")}</strong></div></div><div className="overview-divider" /><div className="overview-stat"><span>Ангилал</span><strong>{new Set(products.map((item) => item.category)).size.toString().padStart(2, "0")}</strong></div><div className="overview-divider" /><div className="overview-stat"><span>Нийт үнийн дүн</span><strong>{money(totalValue)}</strong></div><div className="overview-decoration"><span>H</span></div></section>

          <section className="catalog-section"><div className="section-heading"><div><span className="section-kicker">КАТАЛОГ</span><h2>Миний бараанууд <span>{filtered.length}</span></h2></div><div className="section-heading-right"><span>Бүх бараагаа эндээс удирдаарай</span></div></div>
            <div className="toolbar"><div className="search-box"><Search size={19} strokeWidth={1.9} /><input aria-label="Бараа хайх" placeholder="Нэр, өнгө, размер зэргээр хайх..." value={search} onChange={(event) => setSearch(event.target.value)} />{search && <button aria-label="Хайлтыг арилгах" onClick={() => setSearch("")}><X size={16} /></button>}<kbd>⌕</kbd></div><div className="toolbar-selects"><div className="select-wrap"><SlidersHorizontal size={17} /><select aria-label="Ангиллаар шүүх" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item} value={item}>{item === "Бүгд" ? "Бүх ангилал" : item}</option>)}</select><ChevronDown size={15} /></div><div className="select-wrap size-select"><select aria-label="Размераар шүүх" value={size} onChange={(event) => setSize(event.target.value)}><option>Бүх размер</option>{sizeOptions.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></div><div className="select-wrap sort-select"><ArrowDownUp size={16} /><select aria-label="Эрэмбэлэх" value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Шинэ эхэнд</option><option value="priceAsc">Үнэ: багаас их</option><option value="priceDesc">Үнэ: ихээс бага</option><option value="name">Нэрээр</option></select><ChevronDown size={15} /></div></div></div>

            {loading ? <div className="status-card"><div className="spinner" /><p>Бараануудыг ачаалж байна...</p></div> : products.length === 0 ? <div className="empty-card"><div className="empty-art"><div className="empty-orbit orbit-one" /><div className="empty-orbit orbit-two" /><div className="empty-hanger">✦</div><div className="empty-card-back" /><div className="empty-card-front"><Tag size={38} strokeWidth={1.3} /></div><span className="empty-sparkle sparkle-one">✦</span><span className="empty-sparkle sparkle-two">✳</span></div><div className="empty-text"><span>ЭХЛЭХЭД БЭЛЭН ҮҮ?</span><h3>Таны каталог эндээс эхэлнэ.</h3><p>Анхны бараагаа зураг, үнэ, размертай нь бүртгээд өөрийн цуглуулгаа үүсгээрэй.</p><button className="primary-button" onClick={openForm}><Plus size={18} /> Анхны бараагаа нэмэх</button></div></div> : filtered.length === 0 ? <div className="no-results"><Search size={26} /><h3>Илэрц олдсонгүй</h3><p>Хайх үг эсвэл шүүлтүүрээ өөрчлөөд дахин оролдоорой.</p><button onClick={() => { setSearch(""); setCategory("Бүгд"); setSize("Бүх размер"); }}>Шүүлтүүр арилгах <ArrowRight size={16} /></button></div> : <div className="product-grid">{filtered.map((product) => <button className="product-card" key={product.id} onClick={() => setSelected(product)}><div className="product-image"><img src={product.imageUrl} alt={product.name} /><span className="product-category">{product.category}</span></div><div className="product-info"><div><span>{product.color || product.category}</span><h3>{product.name}</h3></div><strong>{money(product.price)}</strong><div className="card-footer"><div>{product.sizes.map((item) => <span key={item}>{item}</span>)}</div><ArrowRight size={18} /></div></div></button>)}</div>}
            {products.length > 0 && <div className="catalog-bottom"><span>{filtered.length} бараа харагдаж байна</span><span>HUVTSAS © 2026</span></div>}
          </section>
        </div>
      </div>

      {notice && <div className="toast"><Check size={18} />{notice}</div>}
      {error && !showForm && <div className="toast error-toast"><CircleHelp size={18} />{error}<button onClick={() => setError("")}><X size={16} /></button></div>}

      {showForm && <div className="modal-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}><div className="drawer" role="dialog" aria-modal="true" aria-labelledby="form-title"><div className="drawer-header"><div><span className="drawer-kicker">БАРААНЫ БҮРТГЭЛ</span><h2 id="form-title">Шинэ бараа нэмэх<span>.</span></h2><p>Доорх мэдээллийг бөглөөд каталогоо баяжуулаарай.</p></div><button className="icon-button" aria-label="Хаах" onClick={closeForm}><X size={21} /></button></div><form onSubmit={submit} className="product-form"><div className="form-scroll"><label className="field-label">Барааны зураг <span>*</span></label><div className={`upload-area ${preview ? "has-preview" : ""}`} onClick={() => inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") inputRef.current?.click(); }}>{preview ? <><img src={preview} alt="Сонгосон зураг" /><div className="upload-change"><ImagePlus size={16} /> Зураг солих</div></> : <><div className="upload-icon"><UploadCloud size={25} strokeWidth={1.7} /></div><strong>Зургаа энд дарж сонгоно уу</strong><span>JPG, PNG, WebP эсвэл GIF · 8 МБ хүртэл</span></>}<input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(event) => selectImage(event.target.files?.[0] ?? null)} /></div><div className="form-row"><label><span className="field-label">Барааны нэр <em>*</em></span><input required maxLength={120} placeholder="Жишээ: Ноолууран цамц" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label><span className="field-label">Ангилал <em>*</em></span><select required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option value="" disabled>Ангилал сонгох</option>{productCategories.map((item) => <option key={item}>{item}</option>)}</select></label></div><div className="form-row"><label><span className="field-label">Үнэ <em>*</em></span><div className="price-input"><input required type="number" min="1" step="1" placeholder="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /><span>₮</span></div></label><label><span className="field-label">Өнгө</span><input maxLength={80} placeholder="Жишээ: Хар" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} /></label></div><div className="size-field"><span className="field-label">Размер <em>*</em></span><div className="size-buttons">{sizeOptions.map((item) => <button type="button" key={item} className={form.sizes.includes(item) ? "selected" : ""} onClick={() => toggleSize(item)}>{item}</button>)}</div><small>Нэгээс олон размер сонгож болно.</small></div><label className="description-field"><span className="field-label">Тайлбар <span className="optional">(заавал биш)</span></span><textarea maxLength={1000} placeholder="Материал, загвар болон бусад мэдээлэл..." rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>{error && <div className="form-error">{error}</div>}</div><div className="form-actions"><button type="button" className="secondary-button" onClick={closeForm}>Болих</button><button type="submit" className="primary-button" disabled={saving}>{saving ? "Хадгалж байна..." : <>Бараа хадгалах <ArrowRight size={17} /></>}</button></div></form></div></div>}

      {selected && <div className="modal-layer detail-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><div className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title"><button className="detail-close icon-button" aria-label="Хаах" onClick={() => setSelected(null)}><X size={21} /></button><div className="detail-image"><img src={selected.imageUrl} alt={selected.name} /></div><div className="detail-content"><button className="back-link" onClick={() => setSelected(null)}><ArrowLeft size={16} /> Каталог руу буцах</button><span className="detail-category">{selected.category}</span><h2 id="detail-title">{selected.name}</h2><div className="detail-price">{money(selected.price)}</div><div className="detail-rule" /><div className="detail-field"><span>Боломжтой размер</span><div className="detail-sizes">{selected.sizes.map((item) => <span key={item}>{item}</span>)}</div></div>{selected.color && <div className="detail-field"><span>Өнгө</span><strong>{selected.color}</strong></div>}{selected.description && <div className="detail-field"><span>Тайлбар</span><p>{selected.description}</p></div>}<div className="detail-meta">Бүртгэсэн: {new Date(selected.createdAt).toLocaleDateString("mn-MN")}</div></div></div></div>}
    </main>
  );
}
