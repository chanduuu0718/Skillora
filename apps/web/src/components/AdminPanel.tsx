import { type FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, Check, Eye, FileImage, FileText, Globe2, ImagePlus, LockKeyhole, PackagePlus, Trash2, UploadCloud, Users, IndianRupee, ShoppingBag, ExternalLink } from 'lucide-react';
import { api, type AdminOverview, type Product } from '../lib/api';
import './AdminPanel.css';

export function AdminPanel({ onBack, onChanged }: { onBack: () => void; onChanged?: () => Promise<void> | void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [overview, setOverview] = useState<AdminOverview>({ products: 0, customers: 0, paidOrders: 0, revenuePaise: 0 });
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('199');
  const [coverUrl, setCoverUrl] = useState('');
  const [published, setPublished] = useState(true);
  const [status, setStatus] = useState('');
  const [busyId, setBusyId] = useState('');
  const [previewing, setPreviewing] = useState('');

  async function refresh() {
    const [items, stats] = await Promise.all([api.adminProducts(), api.adminOverview()]);
    setProducts(items);
    setOverview(stats);
  }

  useEffect(() => { refresh().catch((error) => setStatus(error.message)); }, []);

  function makeSlug(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }

  async function createProduct(event: FormEvent) {
    event.preventDefault();
    setStatus('Creating product…');
    try {
      await api.adminCreateProduct({ title: title.trim(), slug: makeSlug(slug || title), description: description.trim(), pricePaise: Math.round(Number(price) * 100), coverUrl: coverUrl.trim() || undefined, published });
      setTitle(''); setSlug(''); setDescription(''); setPrice('199'); setCoverUrl(''); setPublished(true);
      setStatus('Product created successfully.');
      await refresh(); await onChanged?.();
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Unable to create product.'); }
  }

  async function togglePublish(product: Product) {
    setBusyId(product.id);
    try {
      await api.adminUpdateProduct(product.id, { published: !product.published });
      setStatus(product.published ? 'Product unpublished.' : 'Product is now visible in the store.');
      await refresh(); await onChanged?.();
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not change publishing status.'); }
    finally { setBusyId(''); }
  }

  async function upload(productId: string, file?: File) {
    if (!file) return;
    setBusyId(productId); setStatus('Uploading PDF securely…');
    try { await api.adminUploadPdf(productId, file); setStatus('PDF uploaded securely.'); await refresh(); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Upload failed.'); }
    finally { setBusyId(''); }
  }

  async function deletePdf(product: Product) {
    if (!window.confirm(`Remove the PDF from “${product.title}”? The product itself will remain.`)) return;
    setBusyId(product.id); setStatus('Removing PDF…');
    try { await api.adminDeletePdf(product.id); setStatus('PDF removed.'); await refresh(); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Could not remove PDF.'); }
    finally { setBusyId(''); }
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm(`Delete “${product.title}”? This cannot be undone.`)) return;
    setBusyId(product.id); setStatus('Deleting product…');
    try { await api.adminDeleteProduct(product.id); setStatus('Product deleted.'); await refresh(); await onChanged?.(); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Could not delete product.'); }
    finally { setBusyId(''); }
  }

  async function preview(product: Product) {
    setPreviewing(product.id);
    try { const url = await api.adminPreviewResource(product.id); const tab = window.open(url, '_blank', 'noopener,noreferrer'); if (!tab) setStatus('Preview was blocked. Allow pop-ups for Skillora.'); setTimeout(() => URL.revokeObjectURL(url), 60000); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Preview failed.'); }
    finally { setPreviewing(''); }
  }

  async function saveCover(product: Product, value: string) {
    setBusyId(product.id);
    try { await api.adminUpdateProduct(product.id, { coverUrl: value.trim() || null }); setStatus('Product cover updated.'); await refresh(); await onChanged?.(); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Could not update cover.'); }
    finally { setBusyId(''); }
  }

  return <section className="admin-page">
    <div className="admin-header">
      <div><button className="admin-back" onClick={onBack}><ArrowLeft size={16} /> Store</button><div className="section-kicker">SKILLORA CONTROL ROOM</div><h1>Run your digital store.</h1><p>Track sales, manage resources, preview your PDFs and control exactly what customers can see.</p></div>
      <div className="admin-stat"><PackagePlus size={20} /><strong>{overview.products}</strong><span>resources</span></div>
    </div>

    <div className="admin-overview">
      <div className="overview-card"><ShoppingBag size={19} /><span>Paid orders</span><strong>{overview.paidOrders}</strong><small>completed purchases</small></div>
      <div className="overview-card"><IndianRupee size={19} /><span>Revenue</span><strong>₹{(overview.revenuePaise / 100).toLocaleString('en-IN')}</strong><small>from paid orders</small></div>
      <div className="overview-card"><Users size={19} /><span>Customers</span><strong>{overview.customers}</strong><small>registered customers</small></div>
      <div className="overview-card"><FileText size={19} /><span>Resources</span><strong>{overview.products}</strong><small>including drafts</small></div>
    </div>

    <div className="admin-layout">
      <form className="admin-form" onSubmit={createProduct}>
        <div className="admin-form-heading"><div className="admin-icon"><PackagePlus size={19} /></div><div><span>NEW RESOURCE</span><h2>Create product</h2></div></div>
        <label>Title<input value={title} onChange={(e) => { setTitle(e.target.value); if (!slug) setSlug(makeSlug(e.target.value)); }} placeholder="Java Interview Guide" required minLength={3} /></label>
        <label>Slug<input value={slug} onChange={(e) => setSlug(makeSlug(e.target.value))} placeholder="java-interview-guide" required /></label>
        <label>Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will the customer learn or get from this resource?" minLength={20} required /></label>
        <label>Price <span className="field-hint">INR</span><div className="price-input"><span>₹</span><input type="number" min="1" step="1" value={price} onChange={(e) => setPrice(e.target.value)} required /></div></label>
        <label>Product cover <span className="field-hint">Image URL</span><div className="cover-input"><ImagePlus size={16} /><input type="url" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://example.com/java-guide-cover.jpg" /></div></label>
        {coverUrl && <div className="cover-preview"><img src={coverUrl} alt="Product cover preview" onError={(e) => { e.currentTarget.style.display = 'none'; }} /><span>Cover preview</span></div>}
        <label className="publish-switch"><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /><span className="switch-track"><span /></span><span><strong>Publish immediately</strong><small>Show this product in the customer store after creation.</small></span></label>
        <button className="primary-button large" type="submit"><PackagePlus size={17} /> Create resource</button>
        {status && <div className="admin-notice">{status}</div>}
      </form>

      <div className="admin-products">
        <div className="admin-list-heading"><div><span className="section-kicker">CATALOG</span><h2>Your resources</h2></div><span>{products.length} total</span></div>
        {products.length ? products.map((product) => <article className="admin-product" key={product.id}>
          <div className="resource-thumb">{product.coverUrl ? <img src={product.coverUrl} alt="" /> : <><FileText size={24} /><span>PDF</span></>}</div>
          <div className="resource-main">
            <div className="resource-title"><h3>{product.title}</h3><span className={product.published ? 'status-live' : 'status-draft'}>{product.published ? <><Globe2 size={12} /> Live</> : <><LockKeyhole size={12} /> Draft</>}</span></div>
            <p>₹{(product.pricePaise / 100).toLocaleString('en-IN')} · {product.slug}</p>
            <small>{product.fileKey ? 'PDF attached and protected' : 'PDF not attached yet'}{product.coverUrl ? ' · Cover ready' : ' · No cover image'}</small>
            <div className="cover-editor"><FileImage size={14} /><input defaultValue={product.coverUrl ?? ''} placeholder="Add product cover image URL" onBlur={(e) => { if (e.currentTarget.value !== (product.coverUrl ?? '')) void saveCover(product, e.currentTarget.value); }} /><ExternalLink size={13} /></div>
          </div>
          <div className="resource-actions">
            {product.fileKey && <button type="button" className="preview-button" disabled={previewing === product.id} onClick={() => preview(product)}><Eye size={15} /> {previewing === product.id ? 'Opening…' : 'Preview PDF'}</button>}
            <button type="button" className={`status-button ${product.published ? 'live' : ''}`} disabled={busyId === product.id} onClick={() => togglePublish(product)}>{product.published ? <><Check size={15} /> Published</> : <><Globe2 size={15} /> Publish</>}</button>
            <label className="upload-button"><UploadCloud size={15} /> {product.fileKey ? 'Replace PDF' : 'Upload PDF'}<input type="file" accept="application/pdf" onChange={(e) => upload(product.id, e.target.files?.[0])} /></label>
            {product.fileKey && <button type="button" className="danger-button" disabled={busyId === product.id} onClick={() => deletePdf(product)}><Trash2 size={15} /> Delete PDF</button>}
            <button type="button" className="danger-button subtle" disabled={busyId === product.id} onClick={() => deleteProduct(product)}><Trash2 size={15} /> Delete product</button>
          </div>
        </article>) : <div className="admin-empty"><PackagePlus size={26} /><h3>Your catalog is empty.</h3><p>Create your first digital resource on the left.</p></div>}
      </div>
    </div>
  </section>;
}
