import { type FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, Check, Eye, FileImage, FileText, Globe2, ImagePlus, LockKeyhole, PackagePlus, Trash2, UploadCloud, Users, IndianRupee, ShoppingBag, ExternalLink, BarChart3, RefreshCw, Search, ChevronRight } from 'lucide-react';
import { api, type AdminCustomer, type AdminOrder, type AdminOverview, type Product } from '../lib/api';
import './AdminPanel.css';

type Tab = 'overview' | 'catalog' | 'orders' | 'customers';

export function AdminPanel({ onBack, onChanged }: { onBack: () => void; onChanged?: () => Promise<void> | void }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [overview, setOverview] = useState<AdminOverview>({ products: 0, customers: 0, paidOrders: 0, revenuePaise: 0 });
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState(''); const [slug, setSlug] = useState(''); const [description, setDescription] = useState(''); const [price, setPrice] = useState('199'); const [coverUrl, setCoverUrl] = useState(''); const [published, setPublished] = useState(true);
  const [status, setStatus] = useState(''); const [busyId, setBusyId] = useState(''); const [previewing, setPreviewing] = useState(''); const [loadingTab, setLoadingTab] = useState(false);

  async function refresh() { const [items, stats] = await Promise.all([api.adminProducts(), api.adminOverview()]); setProducts(items); setOverview(stats); }
  useEffect(() => { refresh().catch((error) => setStatus(error.message)); }, []);
  useEffect(() => { if (tab === 'orders') { setLoadingTab(true); api.adminOrders().then(setOrders).catch((e) => setStatus(e.message)).finally(() => setLoadingTab(false)); } if (tab === 'customers') { setLoadingTab(true); api.adminCustomers().then(setCustomers).catch((e) => setStatus(e.message)).finally(() => setLoadingTab(false)); } }, [tab]);

  function makeSlug(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  async function createProduct(event: FormEvent) { event.preventDefault(); setStatus('Creating product…'); try { await api.adminCreateProduct({ title: title.trim(), slug: makeSlug(slug || title), description: description.trim(), pricePaise: Math.round(Number(price) * 100), coverUrl: coverUrl.trim() || undefined, published }); setTitle(''); setSlug(''); setDescription(''); setPrice('199'); setCoverUrl(''); setPublished(true); setStatus('Product created successfully.'); await refresh(); await onChanged?.(); } catch (error) { setStatus(error instanceof Error ? error.message : 'Unable to create product.'); } }
  async function togglePublish(product: Product) { setBusyId(product.id); try { await api.adminUpdateProduct(product.id, { published: !product.published }); setStatus(product.published ? 'Product unpublished.' : 'Product is now live.'); await refresh(); await onChanged?.(); } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not change publishing status.'); } finally { setBusyId(''); } }
  async function upload(productId: string, file?: File) { if (!file) return; setBusyId(productId); setStatus('Uploading PDF securely…'); try { await api.adminUploadPdf(productId, file); setStatus('PDF uploaded securely.'); await refresh(); } catch (error) { setStatus(error instanceof Error ? error.message : 'Upload failed.'); } finally { setBusyId(''); } }
  async function deletePdf(product: Product) { if (!window.confirm(`Remove the PDF from “${product.title}”? The product will remain.`)) return; setBusyId(product.id); try { await api.adminDeletePdf(product.id); setStatus('PDF removed.'); await refresh(); } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not remove PDF.'); } finally { setBusyId(''); } }
  async function deleteProduct(product: Product) { if (!window.confirm(`Delete “${product.title}”? This cannot be undone.`)) return; setBusyId(product.id); try { await api.adminDeleteProduct(product.id); setStatus('Product deleted.'); await refresh(); await onChanged?.(); } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not delete product.'); } finally { setBusyId(''); } }
  async function preview(product: Product) { setPreviewing(product.id); try { const url = await api.adminPreviewResource(product.id); const tabWindow = window.open(url, '_blank', 'noopener,noreferrer'); if (!tabWindow) setStatus('Preview was blocked. Allow pop-ups for Skillora.'); setTimeout(() => URL.revokeObjectURL(url), 60000); } catch (error) { setStatus(error instanceof Error ? error.message : 'Preview failed.'); } finally { setPreviewing(''); } }
  async function saveCover(product: Product, value: string) { if (value.trim() === (product.coverUrl ?? '')) return; setBusyId(product.id); try { await api.adminUpdateProduct(product.id, { coverUrl: value.trim() || null }); setStatus('Product cover updated.'); await refresh(); await onChanged?.(); } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not update cover.'); } finally { setBusyId(''); } }

  const filteredProducts = products.filter((p) => `${p.title} ${p.slug}`.toLowerCase().includes(query.toLowerCase()));
  const filteredCustomers = customers.filter((c) => `${c.name} ${c.email}`.toLowerCase().includes(query.toLowerCase()));

  return <section className="admin-page">
    <div className="admin-shell">
      <header className="admin-header admin-header-pro">
        <div><button className="admin-back" onClick={onBack}><ArrowLeft size={16} /> Store</button><div className="section-kicker">SKILLORA CONTROL ROOM</div><h1>Command your store.</h1><p>One place to manage products, sales, customers and protected digital resources.</p></div>
        <button className="admin-refresh" onClick={() => refresh()} title="Refresh dashboard"><RefreshCw size={17} /> Refresh</button>
      </header>

      <div className="admin-overview pro-stats">
        <div className="overview-card"><span>Revenue</span><strong>₹{(overview.revenuePaise / 100).toLocaleString('en-IN')}</strong><small><IndianRupee size={12} /> lifetime paid revenue</small></div>
        <div className="overview-card"><span>Paid orders</span><strong>{overview.paidOrders}</strong><small><ShoppingBag size={12} /> completed purchases</small></div>
        <div className="overview-card"><span>Customers</span><strong>{overview.customers}</strong><small><Users size={12} /> registered accounts</small></div>
        <div className="overview-card"><span>Resources</span><strong>{overview.products}</strong><small><FileText size={12} /> total catalog</small></div>
      </div>

      <nav className="admin-tabs" aria-label="Admin sections">
        {([['overview', 'Overview', BarChart3], ['catalog', 'Catalog', PackagePlus], ['orders', 'Orders', ShoppingBag], ['customers', 'Customers', Users]] as const).map(([key, label, Icon]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => { setTab(key); setQuery(''); }}><Icon size={16} />{label}{key === 'orders' && overview.paidOrders > 0 && <b>{overview.paidOrders}</b>}</button>)}
      </nav>

      {status && <div className="admin-notice pro-notice"><span>{status}</span><button onClick={() => setStatus('')}>Dismiss</button></div>}

      {tab === 'overview' && <div className="admin-overview-grid">
        <div className="admin-insight-card"><div className="insight-icon"><BarChart3 size={19} /></div><div><span>Store health</span><h2>Everything in one view</h2><p>Keep your catalog published, PDFs protected and payments flowing.</p></div><button onClick={() => setTab('catalog')}>Manage catalog <ChevronRight size={15} /></button></div>
        <div className="admin-quick-card"><span>QUICK ACTIONS</span><button onClick={() => setTab('catalog')}><PackagePlus size={17} /> Create a resource</button><button onClick={() => setTab('orders')}><ShoppingBag size={17} /> View paid orders</button><button onClick={() => setTab('customers')}><Users size={17} /> View customers</button></div>
      </div>}

      {tab === 'catalog' && <div className="admin-layout">
        <form className="admin-form" onSubmit={createProduct}>
          <div className="admin-form-heading"><div className="admin-icon"><PackagePlus size={19} /></div><div><span>NEW RESOURCE</span><h2>Create product</h2></div></div>
          <label>Title<input value={title} onChange={(e) => { setTitle(e.target.value); if (!slug) setSlug(makeSlug(e.target.value)); }} placeholder="Java Interview Guide" required minLength={3} /></label>
          <label>Slug<input value={slug} onChange={(e) => setSlug(makeSlug(e.target.value))} placeholder="java-interview-guide" required /></label>
          <label>Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will the customer learn or get?" minLength={20} required /></label>
          <label>Price <span className="field-hint">INR</span><div className="price-input"><span>₹</span><input type="number" min="1" step="1" value={price} onChange={(e) => setPrice(e.target.value)} required /></div></label>
          <label>Product cover <span className="field-hint">Image URL</span><div className="cover-input"><ImagePlus size={16} /><input type="url" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://example.com/cover.jpg" /></div></label>
          {coverUrl && <div className="cover-preview"><img src={coverUrl} alt="Product cover preview" onError={(e) => { e.currentTarget.style.display = 'none'; }} /><span>Cover preview</span></div>}
          <label className="publish-switch"><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /><span className="switch-track"><span /></span><span><strong>Publish immediately</strong><small>Make it visible in the customer store.</small></span></label>
          <button className="primary-button large" type="submit"><PackagePlus size={17} /> Create resource</button>
        </form>
        <div className="admin-products">
          <div className="admin-list-heading"><div><span className="section-kicker">CATALOG</span><h2>Your resources</h2></div><div className="catalog-tools"><div className="admin-search"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search resources" /></div><span>{filteredProducts.length} shown</span></div></div>
          {filteredProducts.length ? filteredProducts.map((product) => <article className="admin-product" key={product.id}>
            <div className="resource-thumb">{product.coverUrl ? <img src={product.coverUrl} alt="" /> : <><FileText size={24} /><span>PDF</span></>}</div>
            <div className="resource-main"><div className="resource-title"><h3>{product.title}</h3><span className={product.published ? 'status-live' : 'status-draft'}>{product.published ? <><Globe2 size={12} /> Live</> : <><LockKeyhole size={12} /> Draft</>}</span></div><p>₹{(product.pricePaise / 100).toLocaleString('en-IN')} · {product.slug}</p><small>{product.fileKey ? 'PDF attached and protected' : 'PDF not attached'}{product.coverUrl ? ' · Cover ready' : ' · No cover image'}</small><div className="cover-editor"><FileImage size={14} /><input defaultValue={product.coverUrl ?? ''} placeholder="Add product cover image URL" onBlur={(e) => { void saveCover(product, e.currentTarget.value); }} /><ExternalLink size={13} /></div></div>
            <div className="resource-actions">{product.fileKey && <button type="button" className="preview-button" disabled={previewing === product.id} onClick={() => preview(product)}><Eye size={15} /> {previewing === product.id ? 'Opening…' : 'Preview'}</button>}<button type="button" className={`status-button ${product.published ? 'live' : ''}`} disabled={busyId === product.id} onClick={() => togglePublish(product)}>{product.published ? <><Check size={15} /> Published</> : <><Globe2 size={15} /> Publish</>}</button><label className="upload-button"><UploadCloud size={15} /> {product.fileKey ? 'Replace PDF' : 'Upload PDF'}<input type="file" accept="application/pdf" onChange={(e) => upload(product.id, e.target.files?.[0])} /></label>{product.fileKey && <button type="button" className="danger-button" disabled={busyId === product.id} onClick={() => deletePdf(product)}><Trash2 size={15} /> Delete PDF</button>}<button type="button" className="danger-button subtle" disabled={busyId === product.id} onClick={() => deleteProduct(product)}><Trash2 size={15} /> Delete product</button></div>
          </article>) : <div className="admin-empty"><PackagePlus size={26} /><h3>No resources found.</h3><p>Try another search or create your first resource.</p></div>}
        </div>
      </div>}

      {tab === 'orders' && <section className="admin-data-card"><div className="data-heading"><div><span className="section-kicker">SALES</span><h2>Paid orders</h2><p>Every completed purchase, customer and resource in one place.</p></div><span>{orders.length} recent orders</span></div>{loadingTab ? <div className="admin-loading">Loading orders…</div> : orders.length ? <div className="data-table"><div className="data-row data-head"><span>Customer</span><span>Resource</span><span>Amount</span><span>Paid</span></div>{orders.map((order) => <div className="data-row" key={order.id}><span><strong>{order.user.name}</strong><small>{order.user.email}</small></span><span>{order.items.map((item) => item.product.title).join(', ')}</span><span className="money">₹{(order.amountPaise / 100).toLocaleString('en-IN')}</span><span>{new Date(order.paidAt ?? order.createdAt).toLocaleDateString('en-IN')}</span></div>)}</div> : <div className="admin-empty"><ShoppingBag size={26} /><h3>No paid orders yet.</h3><p>Completed Razorpay purchases will appear here.</p></div>}</section>}

      {tab === 'customers' && <section className="admin-data-card"><div className="data-heading"><div><span className="section-kicker">CUSTOMERS</span><h2>Customer directory</h2><p>Understand who is buying and how much content they own.</p></div><div className="admin-search"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customers" /></div></div>{loadingTab ? <div className="admin-loading">Loading customers…</div> : filteredCustomers.length ? <div className="data-table"><div className="data-row customer-row data-head"><span>Customer</span><span>Joined</span><span>Orders</span><span>Resources</span></div>{filteredCustomers.map((customer) => <div className="data-row customer-row" key={customer.id}><span><strong>{customer.name}</strong><small>{customer.email}</small></span><span>{new Date(customer.createdAt).toLocaleDateString('en-IN')}</span><span>{customer.orders}</span><span>{customer.resourcesOwned}</span></div>)}</div> : <div className="admin-empty"><Users size={26} /><h3>No customers found.</h3><p>Registered customers will appear here.</p></div>}</section>}
    </div>
  </section>;
}
