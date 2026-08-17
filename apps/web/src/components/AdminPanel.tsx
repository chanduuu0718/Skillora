import { useEffect, useState } from 'react';
import { api, type Product } from '../lib/api';

export function AdminPanel({ onBack }: { onBack: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [title, setTitle] = useState(''); const [slug, setSlug] = useState(''); const [description, setDescription] = useState(''); const [price, setPrice] = useState('199'); const [published, setPublished] = useState(true); const [status, setStatus] = useState('');

  async function refresh() { setProducts(await api.adminProducts()); }
  useEffect(() => { refresh().catch((error) => setStatus(error.message)); }, []);

  async function createProduct(event: React.FormEvent) {
    event.preventDefault(); setStatus('Creating…');
    try { await api.adminCreateProduct({ title, slug, description, pricePaise: Math.round(Number(price) * 100), published }); setTitle(''); setSlug(''); setDescription(''); setPrice('199'); setStatus('Product created.'); await refresh(); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Unable to create product.'); }
  }

  async function upload(productId: string, file?: File) {
    if (!file) return; setStatus('Uploading PDF…');
    try { await api.adminUploadPdf(productId, file); setStatus('PDF uploaded securely.'); await refresh(); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Upload failed.'); }
  }

  return <section className="admin-page"><div className="admin-header"><div><div className="section-kicker">ADMIN CONTROL CENTER</div><h1>Run your Skillora store.</h1><p>Create products, attach PDFs and publish resources.</p></div><button className="secondary-button" onClick={onBack}>Back to store</button></div><div className="admin-layout"><form className="admin-form" onSubmit={createProduct}><h2>Create product</h2><label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} required /></label><label>Slug<input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="java-interview-pack" required /></label><label>Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} minLength={20} required /></label><label>Price (₹)<input type="number" min="1" step="1" value={price} onChange={(e) => setPrice(e.target.value)} required /></label><label className="toggle-row"><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Publish immediately</label><button className="primary-button large">Create product</button>{status && <div className="notice">{status}</div>}</form><div className="admin-products"><h2>Products</h2>{products.map((product) => <article className="admin-product" key={product.id}><div><h3>{product.title}</h3><p>₹{(product.pricePaise / 100).toLocaleString('en-IN')} · {product.slug}</p></div><label className="upload-button">Upload PDF<input type="file" accept="application/pdf" onChange={(e) => upload(product.id, e.target.files?.[0])} /></label></article>)}</div></div></section>;
}
