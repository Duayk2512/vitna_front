import {
  Component,
  signal,
  computed,
  OnInit,
  OnDestroy,
  effect,
  HostListener,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe, NgTemplateOutlet } from '@angular/common';
import { IconComponent } from './icon';
import { drawBarcode } from './barcode-renderer';
import { BarcodeComponent } from './barcode';
import { RevealDirective } from './reveal.directive';
interface Product {
  id: number;
  sku?: string;
  barcode?: string;
  name: string;
  category: string;
  presentation: string;
  description: string;
  price?: number;
  published?: boolean;
  availableStock?: number;
}
@Component({
  selector: 'app-root',
  imports: [
    FormsModule,
    CurrencyPipe,
    DatePipe,
    NgTemplateOutlet,
    RevealDirective,
    IconComponent,
    BarcodeComponent,
  ],
  templateUrl: './app.html',
  styleUrls: [
    './app.scss',
    './cinematic.scss',
    './dashboard.scss',
    './responsive.scss',
    './users-page.scss',
    './operations.scss',
    './roles.scss',
    './professional.scss',
  ],
})
export class App implements OnInit, OnDestroy {
  user = signal<any>(null);
  products = signal<Product[]>([]);
  records = signal<any[]>([]);
  page = signal('inicio');
  message = signal('');
  busy = signal(false);
  cart = signal<{ product: Product; quantity: number }[]>([]);
  productionReceipts = signal<any[]>([]);
  receiptError = signal('');
  formErrors = signal<Record<string, string>>({});
  loginError = signal('');
  noticeKind = signal('info');
  confirmation = signal<{ title: string; description: string; run: () => Promise<void> } | null>(
    null,
  );
  showOperationForm = false;
  recordPage = 1;
  pageSize = 6;
  loginDestination = '';
  private businessTime = signal(Date.now());
  private calendarFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' });
  private displayDateFormatter = new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeZone: 'America/Lima',
  });
  private calendarDay = computed(() =>
    this.calendarFormatter.format(new Date(this.businessTime())),
  );
  private displayDay = computed(() =>
    this.displayDateFormatter.format(new Date(this.businessTime())),
  );
  get currentDate() {
    return this.displayDay();
  }
  receivingCode = '';
  workers = signal<any[]>([]);
  workersError = signal('');
  assignments: Record<number, string> = {};
  producedDraft: Record<number, number> = {};
  qualityNotes: Record<number, string> = {};
  focusedId: number | null = null;
  dashboardProduction = signal<any[] | null>(null);
  dashboardOrders = signal<any[] | null>(null);
  dashboardUsers = signal<any[] | null>(null);
  dashboardLots = signal<any[] | null>(null);
  dashboardLoading = signal(false);
  dashboardError = signal(false);
  productSearch = '';
  productStatus = 'Todos';
  recordSearch = '';
  recordStatus = 'Todos';
  recordsLoading = signal(false);
  recordsError = signal('');
  private navigationId = 0;
  get today() {
    return this.calendarDay();
  }
  userSearch = '';
  userRoleFilter = 'Todos';
  userStatusFilter = 'Todos';
  showUserCreate = false;
  showUserPassword = false;
  private dateTimer?: ReturnType<typeof setInterval>;
  private noticeTimer?: ReturnType<typeof setTimeout>;
  private noticeEffect = effect(() => {
    const value = this.message();
    if (this.noticeTimer) clearTimeout(this.noticeTimer);
    if (value) this.noticeTimer = setTimeout(() => this.message.set(''), 6000);
  });
  ngOnDestroy() {
    if (this.noticeTimer) clearTimeout(this.noticeTimer);
    if (this.dateTimer) clearInterval(this.dateTimer);
  }
  email = '';
  password = '';
  address = '';
  whatsapp = '';
  filter = '';
  category = 'Todas';
  presentation = 'Todas';
  sort = 'name';
  sidebarCollapsed = false;
  sidebarOpen = false;
  menuOpen = false;
  scrolled = false;
  showPassword = false;
  productDialog = false;
  form: any = { role: 'CLIENTE', published: true, price: 0, warehouse: 'Productos terminados' };
  @HostListener('window:scroll') onScroll() {
    const y = window.scrollY;
    this.scrolled = y > 25;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    document.documentElement.style.setProperty(
      '--reading-progress',
      String(height > 0 ? y / height : 0),
    );
    document.documentElement.style.setProperty('--hero-shift', Math.min(y * 0.045, 28) + 'px');
  }
  @HostListener('document:keydown.escape') closeMenus() {
    this.sidebarOpen = false;
    this.menuOpen = false;
    this.productDialog = false;
    if (!this.busy()) this.confirmation.set(null);
  }
  scrollNext() {
    document.getElementById('collections')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  }
  chartColors = ['#cb9a45', '#b3a25c', '#628c75', '#6788b3', '#8b7eaf', '#3e7867', '#b87878'];
  lotColors = ['#cb9a45', '#628c75', '#b87878'];
  orderChartStatuses = [
    { code: 'PENDIENTE_REVISION', label: 'Por revisar' },
    { code: 'PENDIENTE_PAGO', label: 'Por pagar' },
    { code: 'CONFIRMADO', label: 'Confirmados' },
    { code: 'EN_PREPARACION', label: 'En preparación' },
    { code: 'DESPACHADO', label: 'Despachados' },
    { code: 'ENTREGADO', label: 'Entregados' },
    { code: 'CANCELADO', label: 'Cancelados' },
  ];
  lotChartStatuses = [
    { code: 'CUARENTENA', label: 'Cuarentena' },
    { code: 'APROBADO', label: 'Aprobados' },
    { code: 'RECHAZADO', label: 'Rechazados' },
  ];
  recentOrders() {
    return [...(this.dashboardOrders() || [])].sort((a, b) => b.id - a.id).slice(0, 4);
  }
  orderCount(status: string) {
    return this.dashboardOrders()?.filter((o) => o.status === status).length ?? 0;
  }
  orderPercent(status: string) {
    const total = this.dashboardOrders()?.length ?? 0;
    return total ? (this.orderCount(status) / total) * 100 : 0;
  }
  lotCount(status: string) {
    return this.dashboardLots()?.filter((o) => o.status === status).length ?? 0;
  }
  lotPercent(status: string) {
    const total = this.dashboardLots()?.length ?? 0;
    return total ? (this.lotCount(status) / total) * 100 : 0;
  }
  workspaceActive() {
    return !!this.user() && !['inicio', 'catalogo', 'login'].includes(this.page());
  }
  pendingOrders() {
    return this.dashboardOrders()?.filter((o) => o.status === 'PENDIENTE_REVISION').length ?? null;
  }
  clientCount() {
    return this.dashboardUsers()?.filter((u) => u.role === 'CLIENTE').length ?? null;
  }
  categoryCount(category: string) {
    return this.products().filter((p) => p.category === category).length;
  }
  publicationRate() {
    return this.products().length
      ? Math.round((this.publishedCount() / this.products().length) * 100)
      : 0;
  }
  async loadDashboard() {
    this.refreshBusinessDate();
    const actor = this.user();
    if (!actor) return;
    this.dashboardLoading.set(true);
    this.dashboardError.set(false);
    const jobs: { path: string; target: any }[] = [{ path: '/products', target: this.products }];
    if (this.can('ADMIN', 'CLIENTE', 'ALMACENERO'))
      jobs.push({ path: '/orders', target: this.dashboardOrders });
    if (this.can('ADMIN')) jobs.push({ path: '/users', target: this.dashboardUsers });
    if (this.can('ADMIN', 'ALMACENERO', 'JEFE_PRODUCCION', 'CALIDAD'))
      jobs.push({ path: '/lots', target: this.dashboardLots });
    if (this.can('ADMIN', 'JEFE_PRODUCCION', 'TRABAJADOR', 'CALIDAD'))
      jobs.push({ path: '/production', target: this.dashboardProduction });
    const results = await Promise.allSettled(jobs.map((j) => this.api(j.path)));
    if (actor.id !== this.user()?.id) return;
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') jobs[i].target.set(r.value);
      else {
        if (jobs[i].target !== this.products) jobs[i].target.set(null);
        this.dashboardError.set(true);
      }
    });
    this.dashboardLoading.set(false);
  }

  roleName(role: string) {
    return (
      (
        {
          ADMIN: 'Administrador',
          CLIENTE: 'Cliente',
          ALMACENERO: 'Almacén',
          JEFE_PRODUCCION: 'Jefe de producción',
          TRABAJADOR: 'Trabajador',
          CALIDAD: 'Control de calidad',
        } as Record<string, string>
      )[role] || role
    );
  }
  roleLabel() {
    return this.roleName(this.user()?.role) || 'Equipo VITNA';
  }
  roleDescription(role: string) {
    return (
      (
        {
          ADMIN: 'Administra las cuentas, el catálogo y los pedidos.',
          CLIENTE: 'Consulta productos, realiza pedidos y sigue su estado.',
          ALMACENERO: 'Registra lotes y prepara los despachos.',
          JEFE_PRODUCCION: 'Planifica fabricación, asigna trabajadores y supervisa el avance.',
          TRABAJADOR: 'Ejecuta tus órdenes asignadas y registra el avance de cada etapa.',
          CALIDAD: 'Revisa lotes y registra su estado de calidad.',
        } as Record<string, string>
      )[role] || ''
    );
  }
  filteredUsers() {
    const term = this.userSearch.trim().toLowerCase();
    return this.records()
      .filter(
        (u) =>
          (this.userRoleFilter === 'Todos' || u.role === this.userRoleFilter) &&
          (this.userStatusFilter === 'Todos' ||
            u.active === (this.userStatusFilter === 'Activos')) &&
          (u.name + ' ' + u.email).toLowerCase().includes(term),
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }
  usersCount(role?: string) {
    return role ? this.records().filter((u) => u.role === role).length : this.records().length;
  }
  activeUsersCount() {
    return this.records().filter((u) => u.active).length;
  }
  resetUserFilters() {
    this.userSearch = '';
    this.userRoleFilter = 'Todos';
    this.userStatusFilter = 'Todos';
  }
  openUserCreate() {
    this.form = {
      role: 'CLIENTE',
      name: '',
      email: '',
      phone: '',
      document: '',
      address: '',
      password: '',
    };
    this.showUserPassword = false;
    this.showUserCreate = true;
    setTimeout(() => document.getElementById('new-user-name')?.focus(), 0);
  }
  async editUser(account: any) {
    await this.action(async () => {
      this.form = await this.api('/users/' + account.id);
      this.showUserPassword = false;
      this.showUserCreate = true;
      setTimeout(() => document.getElementById('new-user-name')?.focus(), 0);
    });
  }
  async saveUser() {
    await this.action(async () => {
      const editing = !!this.form.id;
      const body = { ...this.form };
      if (editing) delete body.password;
      await this.api(editing ? '/users/' + this.form.id : '/users', body, editing ? 'PUT' : 'POST');
      await this.navigate('usuarios');
      this.message.set(editing ? 'Cuenta actualizada.' : 'Cuenta creada.');
    });
  }
  async toggleUser(account: any) {
    await this.action(async () => {
      await this.api('/users/' + account.id + '/status', { active: !account.active }, 'PATCH');
      this.records.set(await this.api('/users'));
      this.message.set(account.active ? 'Cuenta desactivada.' : 'Cuenta reactivada.');
    });
  }
  cancelUserCreate() {
    this.showUserCreate = false;
    this.form = { role: 'CLIENTE' };
    this.showUserPassword = false;
  }

  pageTitle() {
    return (
      (
        {
          panel: 'Vista general',
          usuarios: 'Usuarios y clientes',
          productos: 'Gestión de productos',
          comprar: 'Comprar productos',
          pedidos: this.can('CLIENTE')
            ? 'Mis pedidos'
            : this.can('ALMACENERO')
              ? 'Preparación y despachos'
              : 'Pedidos',
          inventario: 'Inventario y lotes',
          produccion: this.can('TRABAJADOR') ? 'Mis tareas de producción' : 'Producción',
          calidad: 'Control de calidad',
        } as Record<string, string>
      )[this.page()] || 'Tu espacio'
    );
  }
  publishedCount() {
    return this.products().filter((p) => p.published).length;
  }
  roles = ['ADMIN', 'CLIENTE', 'ALMACENERO', 'JEFE_PRODUCCION', 'TRABAJADOR', 'CALIDAD'];
  refreshBusinessDate() {
    this.businessTime.set(Date.now());
  }
  async ngOnInit() {
    this.refreshBusinessDate();
    this.dateTimer = setInterval(() => this.refreshBusinessDate(), 60000);
    const requested = this.readRoute();
    await this.loadPublic();
    try {
      this.user.set(await this.api('/me'));
      this.address = this.user().address || '';
      try {
        await this.loadProducts();
      } catch (e: any) {
        this.message.set(e.message);
      }
      const target = ['inicio', 'login'].includes(requested)
        ? 'panel'
        : this.pageAllowed(requested)
          ? requested
          : 'panel';
      await this.navigate(target, false);
      history.replaceState({}, '', '#/' + this.page());
    } catch {
      const publicPage = ['inicio', 'catalogo', 'login'].includes(requested);
      this.loginDestination = publicPage ? '' : requested;
      await this.navigate(publicPage ? requested : 'login', false);
    }
  }
  async api(path: string, body?: any, method = 'GET'): Promise<any> {
    const headers: Record<string, string> = {};
    if (method !== 'GET') {
      const csrf = await this.api('/csrf');
      headers[csrf.headerName] = csrf.token;
    }
    if (body) headers['Content-Type'] = 'application/json';
    let r: Response;
    try {
      r = await fetch('/api' + path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new Error(
        'No se pudo conectar con el servidor. Revisa la conexión y vuelve a intentarlo.',
      );
    }
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      if (r.status === 401 && this.user()) {
        this.loginDestination = this.page();
        this.clearLocalSession('login');
      }
      throw Object.assign(
        new Error(
          e.message ||
            (r.status === 401
              ? 'Tu sesión expiró. Ingresa de nuevo.'
              : 'No se pudo completar la operación. Revisa los datos.'),
        ),
        { fields: e.errors || {}, status: r.status },
      );
    }
    if (r.status === 204) return null;
    if (!r.headers.get('content-type')?.includes('application/json')) {
      throw new Error(
        'La API devolvió una página en lugar de datos. Revisa VITNA_BACKEND_URL y el proxy /api en Vercel; confirma que el backend Railway esté activo.',
      );
    }
    try {
      return await r.json();
    } catch {
      throw new Error('El servidor devolvió datos JSON incompletos o inválidos. Vuelve a intentarlo.');
    }
  }
  readRoute() {
    const route = window.location.hash.replace(/^#\/?/, '');
    return [
      'inicio',
      'catalogo',
      'login',
      'panel',
      'comprar',
      'usuarios',
      'productos',
      'pedidos',
      'inventario',
      'produccion',
      'calidad',
    ].includes(route)
      ? route
      : 'inicio';
  }
  @HostListener('window:popstate') async restoreRoute() {
    const requested = this.readRoute();
    if (!this.user() && !['inicio', 'catalogo', 'login'].includes(requested)) {
      this.loginDestination = requested;
      await this.navigate('login', false);
    } else await this.navigate(this.pageAllowed(requested) ? requested : 'panel', false);
  }
  clearLocalSession(target = 'inicio') {
    ++this.navigationId;
    this.user.set(null);
    this.dashboardOrders.set(null);
    this.dashboardUsers.set(null);
    this.dashboardLots.set(null);
    this.dashboardProduction.set(null);
    this.workers.set([]);
    this.productionReceipts.set([]);
    this.cart.set([]);
    this.records.set([]);
    this.address = '';
    this.page.set(target);
    history.replaceState({}, '', '#/' + target);
  }

  async loadPublic() {
    try {
      this.products.set(await this.api('/public/products'));
      this.whatsapp = (await this.api('/public/contact')).whatsapp;
    } catch {
      this.noticeKind.set('error');
      this.message.set('Inicia el backend para consultar el catálogo.');
    }
  }
  async loadProducts() {
    this.products.set(await this.api('/products'));
    this.cart.update((items) =>
      items.map((item) => ({
        ...item,
        product: this.products().find((p) => p.id === item.product.id) || item.product,
      })),
    );
  }
  can(...roles: string[]) {
    return roles.includes(this.user()?.role);
  }
  async login() {
    if (this.busy()) return;
    this.busy.set(true);
    this.loginError.set('');
    try {
      const csrf = await this.api('/csrf');
      const r = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          [csrf.headerName]: csrf.token,
        },
        body: new URLSearchParams({
          email: this.email.trim().toLowerCase(),
          password: this.password,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!r.ok)
        throw new Error(
          r.status === 401
            ? 'Correo o contraseña incorrectos.'
            : 'No se pudo iniciar sesión. Vuelve a intentarlo.',
        );
      this.user.set(await this.api('/me'));
      this.address = this.user().address || '';
      this.password = '';
      await this.loadProducts();
      const target =
        this.loginDestination && this.pageAllowed(this.loginDestination)
          ? this.loginDestination
          : 'panel';
      this.loginDestination = '';
      await this.navigate(target);
      this.noticeKind.set('success');
      this.message.set('Sesión iniciada.');
    } catch (e: any) {
      this.loginError.set(e.message);
      this.noticeKind.set('error');
      this.message.set(e.message);
    } finally {
      this.busy.set(false);
    }
  }
  async logout() {
    await this.action(async () => {
      await this.api('/logout', undefined, 'POST');
      this.clearLocalSession();
      this.message.set('');
      await this.loadPublic();
    });
  }

  async navigate(p: string, recordHistory = true) {
    this.refreshBusinessDate();
    if (p === 'catalogo' && this.can('CLIENTE')) p = 'comprar';
    if (!this.pageAllowed(p)) {
      this.message.set('Esta sección no está disponible para tu rol.');
      return;
    }
    this.focusedId = null;
    this.showOperationForm = false;
    this.recordPage = 1;
    this.formErrors.set({});
    this.receivingCode = '';
    this.assignments = {};
    this.qualityNotes = {};
    const token = ++this.navigationId;
    this.menuOpen = false;
    this.sidebarOpen = false;
    this.showUserCreate = false;
    this.showUserPassword = false;
    this.productDialog = false;
    this.page.set(p);
    if (recordHistory && window.location.hash !== '#/' + p) history.pushState({}, '', '#/' + p);
    window.scrollTo({ top: 0, behavior: 'instant' });
    this.records.set([]);
    this.recordsLoading.set(
      ['usuarios', 'pedidos', 'inventario', 'calidad', 'produccion'].includes(p),
    );
    this.recordsError.set('');
    this.recordSearch = '';
    this.recordStatus = p === 'calidad' ? 'CUARENTENA' : 'Todos';
    this.form = {
      role: 'CLIENTE',
      published: true,
      price: 0,
      productId: '',
      warehouse: 'Productos terminados',
    };
    this.message.set('');
    if (p === 'panel') await this.loadDashboard();
    if (p === 'comprar')
      try {
        await this.loadProducts();
      } catch (e: any) {
        this.message.set(e.message);
      }
    if (p === 'produccion' && this.can('JEFE_PRODUCCION')) await this.loadWorkers();
    if (p === 'inventario' && this.can('ADMIN', 'ALMACENERO')) await this.loadReceipts();
    if (token !== this.navigationId) return;
    const endpoints: Record<string, string> = {
      usuarios: '/users',
      pedidos: '/orders',
      inventario: '/lots',
      calidad: '/lots',
      produccion: '/production',
    };
    this.recordsLoading.set(!!endpoints[p]);
    if (endpoints[p])
      try {
        let rows = await this.api(endpoints[p]);
        if (p === 'pedidos' && this.can('ALMACENERO')) {
          const picks = await this.api('/orders/picking');
          rows = rows.map((o: any) => ({
            ...o,
            picking: picks.filter((lot: any) => lot.orderId === o.id),
          }));
        }
        if (token === this.navigationId) this.records.set(rows);
      } catch (e: any) {
        if (token === this.navigationId) this.recordsError.set(e.message);
      } finally {
        if (token === this.navigationId) this.recordsLoading.set(false);
      }
  }

  browse(category: string) {
    this.filter = '';
    this.category = category;
    this.navigate('catalogo');
  }
  categories() {
    return [...new Set(this.products().map((p) => p.category))].sort();
  }
  presentations() {
    return [
      ...new Set(
        this.products()
          .filter((p) => this.category === 'Todas' || p.category === this.category)
          .map((p) => p.presentation),
      ),
    ].sort();
  }
  resetFilters() {
    this.filter = '';
    this.category = 'Todas';
    this.presentation = 'Todas';
    this.sort = 'name';
  }
  visibleProducts() {
    return this.products()
      .filter(
        (p) =>
          (this.can('ADMIN') || p.published !== false) &&
          (this.category === 'Todas' || p.category === this.category) &&
          (this.presentation === 'Todas' || p.presentation === this.presentation) &&
          (
            p.name +
            ' ' +
            p.category +
            ' ' +
            p.description +
            ' ' +
            (p.sku || '') +
            ' ' +
            (p.barcode || '')
          )
            .toLowerCase()
            .includes(this.filter.toLowerCase()),
      )
      .sort((a, b) =>
        this.sort === 'price-asc'
          ? (a.price || 0) - (b.price || 0)
          : this.sort === 'price-desc'
            ? (b.price || 0) - (a.price || 0)
            : this.sort === 'newest'
              ? b.id - a.id
              : a.name.localeCompare(b.name, 'es'),
      );
  }
  async buyingGuide() {
    if (this.page() !== 'inicio') await this.navigate('inicio');
    setTimeout(
      () =>
        document.getElementById('como-comprar')?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'instant'
            : 'smooth',
        }),
      0,
    );
  }
  openProduct() {
    this.form = {
      sku: '',
      barcode: '',
      name: '',
      category: 'Cereales',
      presentation: '',
      description: '',
      price: 0,
      published: true,
    };
    this.productDialog = true;
    setTimeout(() => document.querySelector<HTMLInputElement>('.product-modal input')?.focus(), 0);
  }
  dialogKey(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.productDialog = false;
      this.confirmation.set(null);
      return;
    }
    if (event.key !== 'Tab') return;
    const dialog = event.currentTarget as HTMLElement;
    const elements = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]),input:not([disabled]),select,textarea,[tabindex="0"]',
      ),
    );
    const first = elements[0],
      last = elements.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
  async saveCatalogProduct() {
    const editing = !!this.form.id;
    await this.action(async () => {
      await this.api('/products', { ...this.form }, 'POST');
      await this.loadProducts();
      this.productDialog = false;
      this.message.set(
        editing ? 'Producto actualizado.' : 'Producto creado con su código de barras.',
      );
    });
  }
  contact(p: Product) {
    if (!/^\d{8,15}$/.test(this.whatsapp)) {
      this.message.set('El administrador debe configurar el WhatsApp comercial.');
      return;
    }
    window.open(
      'https://wa.me/' +
        this.whatsapp +
        '?text=' +
        encodeURIComponent(
          'Hola, me interesa ' +
            p.name +
            '. Quisiera más información y solicitar una cuenta para comprar.',
        ),
      '_blank',
      'noopener,noreferrer',
    );
  }
  add(p: Product) {
    if (!this.can('CLIENTE') || this.cartQuantity(p.id) + 1 > Math.floor(p.availableStock || 0)) {
      this.message.set('No hay más unidades disponibles de este producto.');
      return;
    }
    this.cart.update((items) => {
      const exists = items.find((i) => i.product.id === p.id);
      return exists
        ? items.map((i) => (i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...items, { product: p, quantity: 1 }];
    });
    this.message.set('Producto agregado al pedido.');
  }
  remove(id: number) {
    this.cart.update((items) => items.filter((i) => i.product.id !== id));
  }
  total() {
    return this.cart().reduce((s, i) => s + (i.product.price || 0) * i.quantity, 0);
  }
  async checkout() {
    if (!this.cart().length || !this.address.trim() || !this.cartAvailable()) {
      this.message.set('Revisa el stock y la dirección de entrega.');
      return;
    }
    await this.action(async () => {
      let r: any;
      try {
        r = await this.api(
          '/orders',
          {
            address: this.address,
            items: this.cart().map((i) => ({
              productId: i.product.id,
              quantity: i.quantity,
              expectedPrice: i.product.price,
            })),
          },
          'POST',
        );
      } catch (e: any) {
        if (e.status === 409) await this.loadProducts().catch(() => {});
        throw e;
      }
      this.cart.set([]);
      await this.navigate('pedidos');
      this.message.set('Pedido #' + r.id + ' enviado para revisión.');
    });
  }
  async action(fn: () => Promise<void>) {
    if (this.busy()) return;
    this.busy.set(true);
    this.formErrors.set({});
    this.noticeKind.set('info');
    try {
      await fn();
      if (this.noticeKind() !== 'error') this.noticeKind.set('success');
    } catch (e: any) {
      this.formErrors.set(e.fields || {});
      this.noticeKind.set('error');
      this.message.set(e.message);
    } finally {
      this.busy.set(false);
    }
  }
  async save() {
    await this.action(async () => {
      const endpoints: any = {
        usuarios: '/users',
        productos: '/products',
        inventario: '/lots',
        produccion: '/production',
      };
      const data = { ...this.form };
      if (data.productId) data.productId = Number(data.productId);
      if (data.workerId) data.workerId = Number(data.workerId);
      else delete data.workerId;
      if (data.productionId) data.productionId = Number(data.productionId);
      else delete data.productionId;
      await this.api(endpoints[this.page()], data, 'POST');
      const p = this.page();
      await this.loadProducts();
      await this.navigate(p);
      this.message.set('Registro guardado.');
    });
  }
  edit(p: Product) {
    this.form = { ...p };
    this.productDialog = true;
  }
  async generateBarcode() {
    await this.action(async () => {
      this.form.barcode = (await this.api('/products/barcode', {}, 'POST')).barcode;
    });
  }
  barcodeValid() {
    return !this.form.barcode || /^[\x21-\x7e]{4,48}$/.test(this.form.barcode);
  }
  async downloadBarcode(p: Product) {
    if (!p.barcode) return;
    await this.action(async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      await drawBarcode(svg, p.barcode!, 80);
      const url = URL.createObjectURL(
        new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }),
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vitna-' + p.sku + '-barcode.svg';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  filteredAdminProducts() {
    const term = this.productSearch.trim().toLowerCase();
    return this.products()
      .filter(
        (p) =>
          (this.productStatus === 'Todos' ||
            p.published === (this.productStatus === 'Publicados')) &&
          [p.name, p.sku, p.barcode, p.category, p.presentation]
            .join(' ')
            .toLowerCase()
            .includes(term),
      )
      .sort((a, b) => b.id - a.id);
  }
  recordResults() {
    const term = this.recordSearch.trim().toLowerCase();
    return this.records()
      .filter(
        (r) =>
          (this.focusedId === null || r.id === this.focusedId) &&
          (this.recordStatus === 'Todos' || r.status === this.recordStatus) &&
          [r.id, r.product?.name, r.product?.barcode, r.customer?.name, r.code, r.route, r.address]
            .join(' ')
            .toLowerCase()
            .includes(term),
      )
      .sort((a, b) =>
        ['inventario', 'calidad'].includes(this.page())
          ? a.expiry.localeCompare(b.expiry) || b.id - a.id
          : b.id - a.id,
      );
  }
  filteredRecords() {
    return this.recordResults().slice(
      (this.recordPage - 1) * this.pageSize,
      this.recordPage * this.pageSize,
    );
  }
  recordPageCount() {
    return Math.max(1, Math.ceil(this.recordResults().length / this.pageSize));
  }
  recordMetrics() {
    const rows = this.records();
    if (this.page() === 'pedidos')
      return [
        { label: 'Pedidos registrados', value: rows.length },
        {
          label: this.can('ALMACENERO') ? 'Por preparar' : 'En curso',
          value: rows.filter((r) =>
            this.can('ALMACENERO')
              ? r.status === 'CONFIRMADO'
              : !['ENTREGADO', 'CANCELADO'].includes(r.status),
          ).length,
        },
        { label: 'Entregados', value: rows.filter((r) => r.status === 'ENTREGADO').length },
      ];
    if (this.page() === 'produccion')
      return [
        { label: 'Órdenes registradas', value: rows.length },
        { label: 'En curso', value: rows.filter((r) => r.status === 'EN_CURSO').length },
        { label: 'Terminadas', value: rows.filter((r) => r.status === 'TERMINADA').length },
      ];
    return [
      { label: 'Lotes registrados', value: rows.length },
      { label: 'Por revisar', value: rows.filter((r) => r.status === 'CUARENTENA').length },
      {
        label: 'Vencidos con existencias',
        value: rows.filter((r) => this.expired(r) && r.quantity > 0).length,
      },
    ];
  }
  toggleOperationForm() {
    this.showOperationForm = !this.showOperationForm;
    if (this.showOperationForm)
      setTimeout(
        () =>
          document
            .querySelector<HTMLInputElement | HTMLSelectElement>(
              '.operation-form input,.operation-form select',
            )
            ?.focus(),
        0,
      );
  }
  routePreview() {
    return String(this.form.route || '')
      .split(/\s*(?:→|->|>|,)\s*/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  async loadReceipts() {
    this.receiptError.set('');
    try {
      this.productionReceipts.set(await this.api('/production/receipts'));
    } catch (e: any) {
      this.productionReceipts.set([]);
      this.receiptError.set(e.message);
    }
  }
  selectProductionReceipt() {
    const production = this.productionReceipts().find(
      (p) => p.id === Number(this.form.productionId),
    );
    if (production) {
      this.form.productId = String(production.product.id);
      this.form.quantity = production.quantity;
    } else {
      this.form.productId = '';
      this.form.quantity = null;
    }
  }
  async createAccountShortcut() {
    await this.navigate('usuarios');
    this.openUserCreate();
  }
  reviewCancellation(record: any, production = false) {
    this.confirmation.set({
      title: production ? 'Cancelar orden de producción' : 'Cancelar pedido',
      description:
        'Vas a cancelar ' +
        (production ? 'la orden de producción' : 'el pedido') +
        ' #' +
        record.id +
        '. Esta acción cierra el registro. Revisa que sea el correcto antes de confirmar.',
      run: () =>
        production
          ? this.cancelProduction(record.id)
          : this.can('CLIENTE')
            ? this.cancelOwnOrder(record.id)
            : this.orderStatus(record.id, 'CANCELADO'),
    });
    setTimeout(
      () => document.querySelector<HTMLButtonElement>('.confirmation-modal button')?.focus(),
      0,
    );
  }
  async confirmAction() {
    const pending = this.confirmation();
    if (!pending) return;
    this.confirmation.set(null);
    await pending.run();
  }
  fieldLabel(field: string) {
    return (
      (
        {
          name: 'Nombre',
          email: 'Correo',
          password: 'Contraseña',
          sku: 'SKU',
          barcode: 'Código de barras',
          category: 'Categoría',
          presentation: 'Presentación',
          description: 'Descripción',
          price: 'Precio',
          productId: 'Producto',
          quantity: 'Cantidad',
          planned: 'Cantidad planificada',
          produced: 'Cantidad obtenida',
          route: 'Etapas de producción',
          warehouse: 'Almacén',
          expiry: 'Vencimiento',
          code: 'Código de lote',
          address: 'Dirección',
          workerId: 'Trabajador',
        } as Record<string, string>
      )[field] || 'Datos del formulario'
    );
  }
  fieldErrors() {
    return Object.entries(this.formErrors());
  }
  recordStatuses() {
    return [
      ...new Set([
        ...this.records().map((r) => r.status),
        ...(this.page() === 'calidad' ? ['CUARENTENA', 'APROBADO', 'RECHAZADO'] : []),
      ]),
    ].sort();
  }
  statusLabel(status: string) {
    return (
      (
        {
          PENDIENTE_REVISION: 'Por revisar',
          PENDIENTE_PAGO: 'Por pagar',
          CONFIRMADO: 'Pago verificado',
          EN_PREPARACION: 'En preparación',
          DESPACHADO: 'Despachado',
          ENTREGADO: 'Entregado',
          CANCELADO: 'Cancelado',
          CUARENTENA: 'En cuarentena',
          APROBADO: 'Aprobado',
          RECHAZADO: 'Rechazado',
          PLANIFICADA: 'Planificada',
          PENDIENTE: 'Por iniciar',
          EN_CURSO: 'En curso',
          COMPLETADA: 'Completada',
          TERMINADA: 'Terminada',
          CANCELADA: 'Cancelada',
        } as Record<string, string>
      )[status] || status
    );
  }
  expired(r: any) {
    return !!r.expiry && r.expiry < this.today;
  }
  changeQuantity(id: number, delta: number) {
    this.cart.update((items) =>
      items.map((i) =>
        i.product.id === id
          ? {
              ...i,
              quantity: Math.max(
                1,
                Math.min(
                  Math.floor(this.products().find((p) => p.id === id)?.availableStock || 0),
                  i.quantity + delta,
                ),
              ),
            }
          : i,
      ),
    );
  }
  selectScannedProduct() {
    const code = this.receivingCode.trim();
    if (!code) return;
    const p = this.products().find(
      (p) => p.barcode === code || p.sku?.toUpperCase() === code.toUpperCase(),
    );
    if (!p) {
      this.message.set('No se encontró un producto con ese código.');
      return;
    }
    this.form.productId = String(p.id);
    this.message.set('Producto seleccionado: ' + p.name);
  }
  productStock(id: number) {
    return this.products().find((p) => p.id === id)?.availableStock || 0;
  }
  cartQuantity(id: number) {
    return this.cart().find((i) => i.product.id === id)?.quantity || 0;
  }
  cartAvailable() {
    return this.cart().every((i) => {
      const p = this.products().find((p) => p.id === i.product.id);
      return !!p && p.published !== false && i.quantity <= (p.availableStock || 0);
    });
  }
  pageAllowed(p: string) {
    const access: Record<string, string[]> = {
      panel: this.roles,
      usuarios: ['ADMIN'],
      productos: ['ADMIN'],
      comprar: ['CLIENTE'],
      pedidos: ['ADMIN', 'CLIENTE', 'ALMACENERO'],
      inventario: ['ADMIN', 'ALMACENERO', 'JEFE_PRODUCCION', 'CALIDAD'],
      produccion: ['ADMIN', 'JEFE_PRODUCCION', 'TRABAJADOR', 'CALIDAD'],
      calidad: ['CALIDAD'],
    };
    return ['inicio', 'catalogo', 'login'].includes(p) || !!access[p]?.includes(this.user()?.role);
  }
  roleHome() {
    return (
      (
        {
          CLIENTE: {
            title: 'Tus compras, en un solo lugar',
            detail: 'Elige productos y sigue cada paso de tus pedidos.',
            action: 'Comprar productos',
            page: 'comprar',
            icon: 'orders',
          },
          ALMACENERO: {
            title: 'Tu operación de almacén',
            detail: 'Recibe lotes, prepara pedidos y organiza los despachos.',
            action: 'Ver despachos',
            page: 'pedidos',
            icon: 'warehouse',
          },
          JEFE_PRODUCCION: {
            title: 'Planifica y coordina la producción',
            detail: 'Asigna órdenes al equipo y supervisa cada etapa.',
            action: 'Gestionar producción',
            page: 'produccion',
            icon: 'factory',
          },
          TRABAJADOR: {
            title: 'Tu trabajo, paso a paso',
            detail: 'Consulta tus órdenes asignadas y registra su avance.',
            action: 'Ver mis tareas',
            page: 'produccion',
            icon: 'factory',
          },
          CALIDAD: {
            title: 'Cada lote, bajo control',
            detail: 'Revisa cuarentenas y documenta tus decisiones.',
            action: 'Revisar lotes',
            page: 'calidad',
            icon: 'shield',
          },
        } as Record<string, any>
      )[this.user()?.role] || {}
    );
  }
  roleMetrics() {
    const orders = this.dashboardOrders(),
      lots = this.dashboardLots(),
      production = this.dashboardProduction();
    const count = (rows: any[] | null, states: string[]) =>
      rows === null ? '—' : rows.filter((r) => states.includes(r.status)).length;
    switch (this.user()?.role) {
      case 'CLIENTE':
        return [
          {
            label: 'Pedidos en curso',
            value: count(orders, [
              'PENDIENTE_REVISION',
              'PENDIENTE_PAGO',
              'CONFIRMADO',
              'EN_PREPARACION',
              'DESPACHADO',
            ]),
            icon: 'orders',
          },
          { label: 'Por pagar', value: count(orders, ['PENDIENTE_PAGO']), icon: 'clock' },
          { label: 'Entregados', value: count(orders, ['ENTREGADO']), icon: 'check' },
          {
            label: 'Productos disponibles',
            value: this.products().filter((p) => (p.availableStock || 0) >= 1).length,
            icon: 'box',
          },
        ];
      case 'ALMACENERO':
        return [
          { label: 'Por preparar', value: count(orders, ['CONFIRMADO']), icon: 'orders' },
          { label: 'En preparación', value: count(orders, ['EN_PREPARACION']), icon: 'box' },
          { label: 'Lotes aprobados', value: count(lots, ['APROBADO']), icon: 'check' },
          {
            label: 'Lotes vencidos',
            value: lots?.filter((l) => this.expired(l) && l.quantity > 0).length ?? '—',
            icon: 'clock',
          },
        ];
      case 'JEFE_PRODUCCION':
      case 'TRABAJADOR':
        return [
          { label: 'Planificadas', value: count(production, ['PLANIFICADA']), icon: 'clock' },
          { label: 'En curso', value: count(production, ['EN_CURSO']), icon: 'factory' },
          { label: 'Terminadas', value: count(production, ['TERMINADA']), icon: 'check' },
          {
            label: this.can('TRABAJADOR') ? 'Total de mis órdenes' : 'Sin asignar',
            value:
              production === null
                ? '—'
                : this.can('TRABAJADOR')
                  ? production.length
                  : production.filter((p) => !p.assignedTo && p.status === 'PLANIFICADA').length,
            icon: 'users',
          },
        ];
      default:
        return [
          { label: 'Por revisar', value: count(lots, ['CUARENTENA']), icon: 'clock' },
          { label: 'Aprobados', value: count(lots, ['APROBADO']), icon: 'check' },
          { label: 'Rechazados', value: count(lots, ['RECHAZADO']), icon: 'shield' },
          {
            label: 'Producciones terminadas',
            value: count(production, ['TERMINADA']),
            icon: 'factory',
          },
        ];
    }
  }
  roleTasks() {
    if (this.can('CLIENTE', 'ALMACENERO'))
      return (this.dashboardOrders() || [])
        .filter((o) =>
          this.can('CLIENTE')
            ? !['ENTREGADO', 'CANCELADO'].includes(o.status)
            : ['CONFIRMADO', 'EN_PREPARACION'].includes(o.status),
        )
        .sort((a, b) => a.id - b.id)
        .map((o) => ({
          id: o.id,
          title: 'Pedido #' + o.id,
          detail: this.can('CLIENTE') ? o.address : o.customer?.name,
          status: o.status,
          page: 'pedidos',
          icon: 'orders',
        }));
    if (this.can('JEFE_PRODUCCION', 'TRABAJADOR'))
      return (this.dashboardProduction() || [])
        .filter((p) => ['PLANIFICADA', 'EN_CURSO'].includes(p.status))
        .sort((a, b) => a.id - b.id)
        .map((p) => ({
          id: p.id,
          title: p.product?.name,
          detail: 'Orden #' + p.id + ' · ' + (p.assignedTo?.name || 'Sin asignar'),
          status: p.status,
          page: 'produccion',
          icon: 'factory',
        }));
    return (this.dashboardLots() || [])
      .filter((l) => l.status === 'CUARENTENA')
      .sort((a, b) => a.expiry.localeCompare(b.expiry))
      .map((l) => ({
        id: l.id,
        title: l.product?.name,
        detail: 'Lote ' + l.code + ' · ' + l.expiry,
        status: l.status,
        page: 'calidad',
        icon: 'shield',
      }));
  }
  async openTask(task: any) {
    await this.navigate(task.page);
    if (this.page() === task.page) {
      this.focusedId = task.id;
      this.recordStatus = 'Todos';
    }
  }
  pageDescription() {
    return (
      (
        {
          pedidos: this.can('CLIENTE')
            ? 'Consulta el detalle y el avance de tus pedidos.'
            : this.can('ALMACENERO')
              ? 'Prepara los lotes reservados por vencimiento y registra su despacho.'
              : 'Revisa los pedidos, confirma reservas y verifica los pagos.',
          inventario: 'Consulta existencias, reservas y vencimientos por lote.',
          produccion: this.can('TRABAJADOR')
            ? 'Solo aparecen las órdenes asignadas a tu cuenta. Completa cada etapa en orden.'
            : 'Planifica, asigna y supervisa las etapas de fabricación.',
          calidad: 'Libera lotes vigentes y registra las observaciones de cada revisión.',
        } as Record<string, string>
      )[this.page()] || ''
    );
  }
  async loadWorkers() {
    this.workersError.set('');
    try {
      this.workers.set(await this.api('/production/workers'));
    } catch (e: any) {
      this.workers.set([]);
      this.workersError.set(e.message);
    }
  }
  async assignProduction(r: any) {
    await this.action(async () => {
      await this.api(
        '/production/' + r.id + '/assignment',
        { workerId: Number(this.assignments[r.id]) },
        'PUT',
      );
      await this.navigate('produccion');
      this.message.set('Trabajador asignado.');
    });
  }
  currentStep(r: any) {
    return r.steps?.find((s: any) => s.status !== 'COMPLETADA');
  }
  productionProgress(r: any) {
    return r.steps?.length
      ? Math.round(
          (r.steps.filter((s: any) => s.status === 'COMPLETADA').length / r.steps.length) * 100,
        )
      : 0;
  }
  async advanceStep(r: any, step: any, action: string) {
    await this.action(async () => {
      await this.api(
        '/production/' + r.id + '/steps/' + step.id,
        {
          action,
          produced:
            action === 'COMPLETE' && step.position === r.steps.length
              ? this.producedDraft[r.id]
              : undefined,
        },
        'POST',
      );
      await this.navigate('produccion');
      this.message.set(action === 'START' ? 'Etapa iniciada.' : 'Etapa completada.');
    });
  }
  async cancelProduction(id: number) {
    await this.action(async () => {
      await this.api('/production/' + id + '/cancel', {}, 'POST');
      await this.navigate('produccion');
      this.message.set('Orden cancelada.');
    });
  }
  async cancelOwnOrder(id: number) {
    await this.action(async () => {
      await this.api('/orders/' + id + '/cancel', {}, 'POST');
      await this.navigate('pedidos');
      this.message.set('Pedido cancelado.');
    });
  }
  orderSteps = [
    'PENDIENTE_REVISION',
    'PENDIENTE_PAGO',
    'CONFIRMADO',
    'EN_PREPARACION',
    'DESPACHADO',
    'ENTREGADO',
  ];
  orderStepDone(r: any, status: string) {
    return (
      r.status !== 'CANCELADO' &&
      this.orderSteps.indexOf(status) <= this.orderSteps.indexOf(r.status)
    );
  }
  orderHelp(status: string) {
    return (
      (
        {
          PENDIENTE_REVISION:
            'Tu pedido está pendiente de revisión. Puedes cancelarlo antes de que sea confirmado.',
          PENDIENTE_PAGO:
            'Tu stock está reservado. Coordina el pago con VITNA; el administrador verificará su recepción.',
          CONFIRMADO: 'Pago verificado. Tu pedido está listo para entrar a preparación.',
          EN_PREPARACION: 'Almacén está preparando tu pedido.',
          DESPACHADO: 'Tu pedido fue despachado. Está pendiente de confirmación de entrega.',
          ENTREGADO: 'Entrega confirmada. Gracias por comprar en VITNA.',
          CANCELADO: 'Este pedido fue cancelado.',
        } as Record<string, string>
      )[status] || ''
    );
  }

  async orderStatus(id: number, status: string) {
    await this.action(async () => {
      await this.api('/orders/' + id + '/status', { status }, 'POST');
      await this.navigate('pedidos');
    });
  }
  async quality(id: number, status: string) {
    await this.action(async () => {
      await this.api(
        '/lots/' + id + '/quality',
        { status, note: this.qualityNotes[id] || '' },
        'POST',
      );
      await this.navigate('calidad');
      this.message.set('Revisión de calidad registrada.');
    });
  }
}
