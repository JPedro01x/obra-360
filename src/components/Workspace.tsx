import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Bell,
  ChevronRight,
  Database,
  Eye,
  EyeOff,
  FileText,
  FolderKanban,
  Layers3,
  LogOut,
  Menu,
  MessageCircle,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { ApiError, requestApi } from '../services/http';
import './workspace.css';
import './responsive.css';
import { modelRoles } from '../services/modelGeometry';
import { AppearanceProvider, AppearanceToggle, PublicAppearance } from './Appearance';
import './minimal-login.css';
import { LoginScene } from './LoginScene';
import type { DetailTarget } from './RecordDetails';
import { localCalendarDate, planningError } from '../utils/planningDates';
import { GoogleSignIn, PasswordRecoveryPanel } from './ConnectedAuth';
import { ProjectSetupWizard } from './ProjectSetupWizard';
import {
  createOperations,
  rowOperations,
  OperationDefinition,
  OperationForm,
  passwordOperation,
  downloadDocument,
  OperationalOverview,
} from './OperationForms';

const ModelEditor = React.lazy(() =>
  import('./ModelEditor').then((m) => ({ default: m.ModelEditor })),
);
import type { Row, Session, Page, Resource } from './workspace/types';
import { resources, privileged, internal, navigationGroups } from './workspace/resources';
import { canAccessWorkspacePage } from './workspace/access';
import { format } from './workspace/formatting';

const IntegrationHub = React.lazy(() => import('./IntegrationHub').then((m) => ({ default: m.IntegrationHub })));
const IfcInspector = React.lazy(() => import('./IntegrationHub').then((m) => ({ default: m.IfcInspector })));
const DataQuality = React.lazy(() => import('./DataQuality').then((m) => ({ default: m.DataQuality })));
const AccountCenter = React.lazy(() => import('./AccountCenter').then((m) => ({ default: m.AccountCenter })));
const HumanResources = React.lazy(() => import('./HumanResources').then((m) => ({ default: m.HumanResources })));
const SpreadsheetCadastros = React.lazy(() => import('./SpreadsheetCadastros'));
const EmployeePortal = React.lazy(() => import('./EmployeePortal').then((m) => ({ default: m.EmployeePortal })));
const QualityEvidence = React.lazy(() => import('./QualityEvidence').then((m) => ({ default: m.QualityEvidence })));
const RecordDetails = React.lazy(() => import('./RecordDetails').then((m) => ({ default: m.RecordDetails })));
const BusinessManagement = React.lazy(() => import('./BusinessManagement').then((m) => ({ default: m.BusinessManagement })));
const Notifications = React.lazy(() => import('./Notifications').then((m) => ({ default: m.Notifications })));
const ExternalPortal = React.lazy(() => import('./ExternalPortal').then((m) => ({ default: m.ExternalPortal })));
const AcceptInvitation = React.lazy(() => import('./UserInvitations').then((m) => ({ default: m.AcceptInvitation })));
const WorkspaceChat = React.lazy(() => import('./WorkspaceChat').then((m) => ({ default: m.WorkspaceChat })));
const PhysicalMeasurementWorkspace = React.lazy(() => import('./PhysicalMeasurementWorkspace').then((m) => ({ default: m.PhysicalMeasurementWorkspace })));
const NfeManagementWorkspace = React.lazy(() => import('./NfeManagementWorkspace').then((m) => ({ default: m.NfeManagementWorkspace })));

export function Workspace() {
  return (
    <AppearanceProvider>
      <React.Suspense fallback={<main className="ws ws-center" role="status">Carregando módulo…</main>}>
        <WorkspaceContent />
      </React.Suspense>
    </AppearanceProvider>
  );
}
function WorkspaceContent() {
  const [invitation, setInvitation] = useState(
    () => location.hash.match(/^#convite=([A-Za-z0-9_-]{43})$/)?.[1] || '',
  );
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [setup, setSetup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [active, updateActive] = useState('projetos');
  const [navigationOpen, setNavigationOpen] = useState(false);
  const navigationToggle = useRef<HTMLButtonElement>(null);
  const modelDirty = useRef(false);
  const onModelDirty = React.useCallback((dirty: boolean) => {
    modelDirty.current = dirty;
  }, []);
  const setActive = (next: string) => {
    if (session && !canAccessWorkspacePage(session.perfil, next)) return false;
    if (
      next !== active &&
      modelDirty.current &&
      !window.confirm(
        'Há alterações que ainda não foram salvas no banco. Deseja sair do modelador?',
      )
    )
      return false;
    updateActive(next);
    closeNavigation();
    return true;
  };
  function closeNavigation() {
    if (!navigationOpen) return;
    setNavigationOpen(false);
    navigationToggle.current?.focus({ preventScroll: true });
  }
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Page | null>(null);
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  const [search, setSearch] = useState('');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [creating, setCreating] = useState(false);
  const [setupProjectId, setSetupProjectId] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const [operation, setOperation] = useState<OperationDefinition | null>(null);
  const [evidenceId, setEvidenceId] = useState<string | null>(null);
  const [detailTarget, setDetailTarget] = useState<DetailTarget | null>(null);
  const [modelTarget, setModelTarget] = useState<{ project: string; model: number } | null>(null);
  const resource =
    resources.find((r) => r.id === active) || resources.find((r) => r.id === 'projetos')!;
  const [authConfiguration, setAuthConfiguration] = useState({
    googleClientId: '',
    emailRecovery: false,
  });
  const [googleLink, setGoogleLink] = useState(false);
  useEffect(() => {
    const detect = () => {
      const match = location.hash.match(/^#recuperar=([A-Za-z0-9_-]{43})$/);
      if (match || location.hash === '#recuperar') {
        setRecovery(match ? { token: match[1] } : {});
        history.replaceState(null, '', location.pathname + location.search);
      }
    };
    window.addEventListener('hashchange', detect);
    return () => window.removeEventListener('hashchange', detect);
  }, []);
  const [recovery, setRecovery] = useState<{ token?: string } | null>(() => {
    const match = location.hash.match(/^#recuperar=([A-Za-z0-9_-]{43})$/);
    return match ? { token: match[1] } : location.hash === '#recuperar' ? {} : null;
  });
  useEffect(() => {
    let current = true;
    requestApi<typeof authConfiguration>('/v1/auth/configuracao')
      .then((value) => {
        if (current) setAuthConfiguration(value);
      })
      .catch(() => {});
    if (location.hash.startsWith('#recuperar=') || location.hash === '#recuperar')
      history.replaceState(null, '', location.pathname + location.search);
    return () => {
      current = false;
    };
  }, []);

  const logout = async () => {
    if (
      modelDirty.current &&
      !window.confirm(
        'Há alterações que ainda não foram salvas no banco. Deseja sair da plataforma?',
      )
    )
      return;
    try {
      await requestApi('/v1/workspace/minhas-sessoes/sair', { method: 'POST' });
    } catch (e) {
      if (sessionStorage.getItem('obra360_access_token')) {
        setError('Não foi possível encerrar a sessão no servidor. Tente novamente.');
        return;
      }
    }
    sessionStorage.removeItem('obra360_access_token');
    setSession(null);
    setNavigationOpen(false);
    setPassword('');
    setShowPassword(false);
    setData(null);
    setError('');
    setCreating(false);
    setOperation(null);
    setEvidenceId(null);
    setDetailTarget(null);
    setModelTarget(null);
  };
  useEffect(() => {
    const expired = () => {
      setSession(null);
      setData(null);
      setCreating(false);
      setOperation(null);
      setEvidenceId(null);
      setDetailTarget(null);
      setModelTarget(null);
      setError('Sua sessão expirou. Entre novamente para continuar.');
    };
    window.addEventListener('obra360:session-expired', expired);
    if (sessionStorage.getItem('obra360_access_token')) {
      requestApi<Session>('/v1/workspace/sessao')
        .then(setSession)
        .catch((e) => setError(e.message))
        .finally(() => setChecking(false));
    } else
      requestApi<{ necessaria: boolean }>('/v1/instalacao')
        .then((result) => setSetup(result.necessaria))
        .catch((e) => setError(e.message))
        .finally(() => setChecking(false));
    return () => window.removeEventListener('obra360:session-expired', expired);
  }, []);

  useEffect(() => {
    if (
      !session ||
      session.exigeTrocaSenha ||
      !internal.includes(session.perfil) ||
      [
        'integracoes',
        'ifc',
        'rh',
        'planilhas',
        'modelador',
        'dados',
        'conta',
        'notificacoes',
        'financeiro',
        'pedidosmateriais',
        'chat',
        'medicoes',
        'notasfiscais',
      ].includes(active) ||
      session.perfil === 'RH'
    )
      return;
    const controller = new AbortController();
    let current = true;
    setLoading(true);
    setError('');
    setData(null);
    requestApi<Page>(`/v1/workspace/registros/${active}?page=${page}&size=25`, {
      signal: controller.signal,
    })
      .then((result) => {
        if (current) {
          setData(result);
          setUpdatedAt(new Date());
        }
      })
      .catch((e) => {
        if (current) setError(e.message);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
      controller.abort();
    };
  }, [session, active, page, revision]);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError('');
    setShowPassword(false);
    setBusy(true);
    try {
      const result = await requestApi<{ token: string }>('/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          senha: password,
        }),
      });
      sessionStorage.setItem('obra360_access_token', result.token);
      const user = await requestApi<Session>('/v1/workspace/sessao');
      setSession(user);
      setPassword('');
      setPage(0);
      setActive('projetos');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível entrar.');
    } finally {
      setBusy(false);
    }
  }

  if (recovery)
    return (
      <PublicAppearance>
        <PasswordRecoveryPanel
          key={recovery.token || 'request'}
          token={recovery.token}
          onBack={() => {
            setRecovery(null);
            logout();
          }}
        />
      </PublicAppearance>
    );
  if (checking)
    return (
      <PublicAppearance>
        <div className="ws ws-center" role="status">
          Verificando sessão…
        </div>
      </PublicAppearance>
    );
  if (setup)
    return (
      <PublicAppearance>
        <SetupForm
          onComplete={() => {
            setSetup(false);
            setNotice('Empresa configurada. Entre com a conta que você acabou de criar.');
          }}
        />
      </PublicAppearance>
    );
  if (invitation)
    return (
      <PublicAppearance>
        <AcceptInvitation
          token={invitation}
          onDone={() => {
            setInvitation('');
            setNotice('Entre com seu e-mail e senha para acessar a plataforma.');
          }}
        />
      </PublicAppearance>
    );
  if (!session)
    return (
      <main className="ws minimal-login">
        <div className="login-shell">
          <LoginScene />
          <section className="login-card" aria-labelledby="login-brand">
            <header className="login-card-header">
              <h1 id="login-brand">
                Obra<span>360</span>
              </h1>
              <AppearanceToggle />
            </header>
            <form onSubmit={login} className="login-form" aria-label="Entrar na Obra360">
              {error && (
                <div className="ws-alert" role="alert">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}
              {notice && (
                <div className="ws-notice" role="status">
                  {notice}
                </div>
              )}
              <label>
                E-mail corporativo
                <input
                  type="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  inputMode="email"
                  required
                  readOnly={busy}
                  maxLength={120}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                  placeholder="voce@empresa.com.br"
                />
              </label>
              <div className="login-password">
                <label>
                  Senha
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    readOnly={busy}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                    }}
                  />
                </label>
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                  disabled={busy}
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
              <button className="ws-primary" disabled={busy}>
                {busy ? 'Entrando…' : 'Entrar na plataforma'}
                <ArrowRight size={18} />
              </button>
              <div className="login-divider" aria-hidden="true">
                <span>ou</span>
              </div>
              {authConfiguration.googleClientId ? (
                <GoogleSignIn
                  clientId={authConfiguration.googleClientId}
                  onSuccess={async (token) => {
                    try {
                      sessionStorage.setItem('obra360_access_token', token);
                      const user = await requestApi<Session>('/v1/workspace/sessao');
                      setSession(user);
                      setPassword('');
                      setShowPassword(false);
                      setActive('projetos');
                      setPage(0);
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                />
              ) : (
                <div>
                  <button
                    type="button"
                    className="login-google"
                    disabled
                    title="Login Google ainda não configurado pelo administrador"
                  >
                    <svg
                      className="login-google-mark"
                      width="20"
                      height="20"
                      aria-hidden="true"
                      focusable="false"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    Fazer login com o Google
                  </button>
                </div>
              )}
            </form>
          </section>
        </div>
      </main>
    );

  if (session.exigeTrocaSenha)
    return (
      <PublicAppearance>
        <main className="ws ws-center">
          <section className="ws-service-panel">
            <h1>Troque a senha inicial</h1>
            <p>Defina uma senha pessoal para liberar seu acesso.</p>
          </section>
          <OperationForm
            definition={{ ...passwordOperation, title: 'Primeiro acesso: defina sua senha' }}
            onClose={() => {
              void logout();
            }}
            onSaved={() => {
              sessionStorage.removeItem('obra360_access_token');
              setSession(null);
              setPassword('');
              setShowPassword(false);
              setNotice('Senha definida. Entre novamente com sua senha pessoal.');
            }}
          />
        </main>
      </PublicAppearance>
    );
  const available = resources.filter((r) => canAccessWorkspacePage(session.perfil, r.id));
  const rows =
    data?.items.filter(
      (row) =>
        !search ||
        resource.columns.some(([key]) =>
          String(row[key] ?? '')
            .toLocaleLowerCase('pt-BR')
            .includes(search.toLocaleLowerCase('pt-BR')),
        ),
    ) || [];
  const isInternal = internal.includes(session.perfil);
  const hasNavigation = isInternal || session.perfil === 'COLABORADOR';
  const links = new Map<string, { title: string; icon: typeof Layers3 }>();
  if (isInternal && session.perfil !== 'RH') {
    for (const item of available) {
      const icon =
        item.id === 'projetos'
          ? FolderKanban
          : item.id === 'estoque'
            ? Package
            : item.id === 'documentos'
              ? FileText
              : Layers3;
      links.set(item.id, { title: item.title, icon });
    }
    links.set('integracoes', { title: 'Integrações', icon: Layers3 });
    if (privileged.includes(session.perfil))
      links.set('financeiro', { title: 'Orçamento e financeiro', icon: Building2 });
    if ([...privileged, 'ALMOXARIFE'].includes(session.perfil))
      links.set('pedidosmateriais', { title: 'Pedidos de materiais', icon: Package });
    links.set('ifc', { title: 'Leitor IFC', icon: Layers3 });
    if (modelRoles.includes(session.perfil))
      links.set('modelador', { title: 'Modelador 2D/3D', icon: Layers3 });
  }
  if (session.perfil === 'SUPER_ADMIN')
    links.set('dados', { title: 'Qualidade dos dados', icon: Database });
  if (['SUPER_ADMIN', 'RH'].includes(session.perfil))
    links.set('rh', { title: 'Recursos humanos', icon: Building2 });
  if (['SUPER_ADMIN', 'RH', 'GERENTE_OBRA', 'INCORPORADOR'].includes(session.perfil))
    links.set('planilhas', { title: 'Importar e exportar planilhas', icon: FileText });
  if (session.perfil === 'COLABORADOR')
    links.set('colaborador', { title: 'Meu cadastro', icon: Building2 });
  if (internal.includes(session.perfil) || session.perfil === 'COLABORADOR')
    links.set('chat', { title: 'Mensagens da equipe', icon: MessageCircle });
  if (['SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','FINANCEIRO','INCORPORADOR','AUDITOR'].includes(session.perfil))
    links.set('medicoes', { title: 'Medições físico-financeiras', icon: Building2 });
  const currentPage =
    !['conta', 'notificacoes', 'planilhas', 'chat'].includes(active) && session.perfil === 'RH'
      ? 'rh'
      : !['conta', 'notificacoes', 'chat'].includes(active) && session.perfil === 'COLABORADOR'
        ? 'colaborador'
        : active;
  const currentPageTitle =
    currentPage === 'conta'
      ? 'Conta e atendimento'
      : currentPage === 'notificacoes'
        ? 'Notificações'
        : links.get(currentPage)?.title;
  const mayCreate = ['SUPER_ADMIN', 'GERENTE_OBRA', 'INCORPORADOR'].includes(session.perfil);
  return (
    <div className="ws ws-shell">
      <aside
        className="ws-sidebar"
        onKeyDown={(event) => {
          if (event.key === 'Escape' && navigationOpen) closeNavigation();
        }}
      >
        <div className="ws-sidebar-heading">
          <div className="ws-brand">
            <span>360</span> Obra360
          </div>
          {hasNavigation && (
            <button
              type="button"
              className="ws-secondary ws-navigation-toggle"
              ref={navigationToggle}
              aria-expanded={navigationOpen}
              aria-controls="ws-navigation"
              onClick={() => setNavigationOpen((open) => !open)}
            >
              {navigationOpen ? (
                <X size={18} aria-hidden="true" />
              ) : (
                <Menu size={18} aria-hidden="true" />
              )}
              Menu
            </button>
          )}
        </div>
        {hasNavigation && currentPageTitle && <p className="ws-current-page">{currentPageTitle}</p>}
        <div
          id="ws-navigation"
          className={navigationOpen ? 'ws-navigation is-open' : 'ws-navigation'}
        >
          <nav aria-label="Módulos da empresa">
            {navigationGroups.map((group) => {
              const items = group.ids.filter((id) => links.has(id));
              if (!items.length) return null;
              return (
                <div className="ws-navigation-group" key={group.title}>
                  <p className="ws-nav-label">{group.title}</p>
                  {items.map((id) => {
                    const link = links.get(id)!;
                    const current = currentPage === id;
                    return (
                      <button
                        key={id}
                        aria-current={current ? 'page' : undefined}
                        onClick={() => {
                          if (!setActive(id)) return;
                          setPage(0);
                          setSearch('');
                          setNotice('');
                        }}
                      >
                        <link.icon size={18} aria-hidden="true" />
                        <span>{link.title}</span>
                        {current && <ChevronRight size={15} aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </div>
        <div className="ws-sidebar-footer">
          <ShieldCheck size={17} />
          <span>
            Dados da sua empresa
            <br />
            <small>Acesso por conta autenticada</small>
          </span>
        </div>
      </aside>
      <div className="ws-main">
        <header className="ws-header">
          <div>
            <Building2 size={19} />
            <strong>{session.empresa.nomeFantasia || session.empresa.razaoSocial}</strong>
          </div>
          <div>
            <span className="ws-account">
              {session.nome}
              <small>{session.perfil.replace(/_/g, ' ')}</small>
            </span>
            <AppearanceToggle />
            <button
              className="ws-icon-button"
              aria-label="Notificações"
              title="Notificações"
              onClick={() => setActive('notificacoes')}
            >
              <Bell size={19} />
            </button>
            <button className="ws-secondary" onClick={() => setOperation(passwordOperation)}>
              Minha senha
            </button>
            <button className="ws-secondary" onClick={() => setActive('conta')}>
              Conta e atendimento
            </button>
            {authConfiguration.googleClientId && (
              <button className="ws-secondary" onClick={() => setGoogleLink((v) => !v)}>
                Vincular Google
              </button>
            )}
            <button
              className="ws-icon-button"
              onClick={logout}
              aria-label="Sair da plataforma"
              title="Sair"
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>
        <main className="ws-content">
          {googleLink && authConfiguration.googleClientId && (
            <article className="ws-service-panel">
              <GoogleSignIn
                clientId={authConfiguration.googleClientId}
                link
                onSuccess={() => {
                  setGoogleLink(false);
                  setNotice('Conta Google vinculada com sucesso.');
                }}
              />
            </article>
          )}
          {active === 'notificacoes' ? (
            <Notifications />
          ) : active === 'conta' ? (
            <AccountCenter admin={session.perfil === 'SUPER_ADMIN'} />
          ) : active === 'chat' ? (
            <WorkspaceChat currentUserId={session.id} />
          ) : active === 'medicoes' ? (
            <PhysicalMeasurementWorkspace role={session.perfil} />
          ) : active === 'notasfiscais' ? (
            <NfeManagementWorkspace role={session.perfil} />
          ) : active === 'planilhas' ? (
            <SpreadsheetCadastros role={session.perfil} />
          ) : session.perfil === 'COLABORADOR' ? (
            <EmployeePortal />
          ) : session.perfil === 'RH' || (active === 'rh' && session.perfil === 'SUPER_ADMIN') ? (
            <HumanResources />
          ) : !internal.includes(session.perfil) ? (
            <ExternalPortal />
          ) : ['financeiro', 'pedidosmateriais'].includes(active) &&
            [...privileged, 'ALMOXARIFE'].includes(session.perfil) ? (
            <BusinessManagement
              key={active}
              role={session.perfil}
              ordersOnly={active === 'pedidosmateriais'}
            />
          ) : active === 'dados' && session.perfil === 'SUPER_ADMIN' ? (
            <DataQuality />
          ) : active === 'modelador' && modelRoles.includes(session.perfil) ? (
            <React.Suspense fallback={<p role="status">Carregando editor 2D/3D…</p>}>
              <ModelEditor
                role={session.perfil}
                initialTarget={modelTarget}
                draftScope={JSON.stringify([session.empresa.cnpj, session.email.toLowerCase()])}
                onDirtyChange={onModelDirty}
              />
            </React.Suspense>
          ) : active === 'integracoes' ? (
            <IntegrationHub role={session.perfil} />
          ) : active === 'ifc' ? (
            <IfcInspector />
          ) : (
            <>
              <div className="ws-breadcrumb">
                Sua empresa <ChevronRight size={14} /> {resource.title}
              </div>
              <div className="ws-title-row">
                <div>
                  <p className="ws-eyebrow">OPERAÇÃO</p>
                  <h1>{resource.title}</h1>
                  <p>{resource.description}</p>
                </div>
                {active === 'projetos' && mayCreate && (
                  <button className="ws-primary" onClick={() => setCreating(true)}>
                    <Plus size={18} />
                    Novo projeto
                  </button>
                )}
                {active === 'usuarios' && session.perfil === 'SUPER_ADMIN' && (
                  <p className="ws-help">
                    Cadastre funcionários em Recursos humanos para criar uma conta interna vinculada.
                    Convide clientes e parceiros em Conta e atendimento → Convidar usuários.
                  </p>
                )}
                {createOperations[active]?.roles.includes(session.perfil) && (
                  <button
                    className="ws-primary"
                    onClick={() => setOperation(createOperations[active])}
                  >
                    <Plus size={18} />
                    {createOperations[active].title}
                  </button>
                )}
              </div>
              {['ordens', 'estoque', 'movimentacoes', 'consumos'].includes(active) && (
                <OperationalOverview revision={revision} />
              )}
              <section className="ws-stat-row" aria-label="Resumo da consulta">
                <div>
                  <span>Registros cadastrados</span>
                  <strong>{data ? data.total.toLocaleString('pt-BR') : '—'}</strong>
                  <small>Na sua empresa</small>
                </div>
                <div>
                  <span>Última atualização</span>
                  <strong className="ws-stat-time">
                    {data && updatedAt
                      ? updatedAt.toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </strong>
                  <small>{data ? 'Consulta concluída' : 'Aguardando consulta'}</small>
                </div>
                <div className="ws-source">
                  <Database size={23} />
                  <div>
                    <strong>Base da empresa</strong>
                    <small>
                      {session.empresa.ambienteDados === 'HOMOLOGACAO'
                        ? 'Dados de teste persistidos no banco'
                        : 'Registros persistidos, sem dados de demonstração'}
                    </small>
                  </div>
                </div>
              </section>
              {notice && (
                <div className="ws-notice" role="status">
                  {notice}
                </div>
              )}
              {error && (
                <div className="ws-alert" role="alert">
                  <AlertCircle size={18} />
                  {error}
                  <button onClick={() => setRevision((v) => v + 1)}>Tentar novamente</button>
                </div>
              )}
              <section className="ws-table-card">
                <div className="ws-table-toolbar">
                  <h2>Todos os registros</h2>
                  <div>
                    <label className="ws-search">
                      <Search size={17} />
                      <input
                        aria-label="Buscar nesta página"
                        placeholder="Buscar nesta página…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </label>
                    <button
                      className="ws-icon-button"
                      aria-label="Atualizar registros"
                      title="Atualizar"
                      disabled={loading}
                      onClick={() => setRevision((v) => v + 1)}
                    >
                      <RefreshCw size={18} className={loading ? 'ws-spin' : ''} />
                    </button>
                  </div>
                </div>
                {loading ? (
                  <div className="ws-empty" role="status">
                    <RefreshCw className="ws-spin" size={26} />
                    <p>Consultando os registros…</p>
                  </div>
                ) : data && rows.length > 0 ? (
                  <div
                    className="ws-table-scroll"
                    tabIndex={0}
                    role="region"
                    aria-label="Tabela de registros"
                  >
                    <table>
                      <caption className="sr-only">{resource.title} da empresa</caption>
                      <thead>
                        <tr>
                          {resource.columns.map(([key, label]) => (
                            <th key={key} scope="col">
                              {label}
                            </th>
                          ))}
                          <th scope="col">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr key={String(row.id)}>
                            {resource.columns.map(([key, , type], i) => (
                              <td key={key} className={i === 0 ? 'ws-cell-title' : ''}>
                                {i === 0 ? (
                                  <button
                                    className="ws-record-link"
                                    onClick={() =>
                                      setDetailTarget({ resource: active, id: String(row.id) })
                                    }
                                  >
                                    {format(row[key], type)}
                                  </button>
                                ) : (
                                  format(row[key], type)
                                )}
                              </td>
                            ))}
                            <td>
                              <div className="ws-row-actions">
                                <button
                                  className="ws-secondary"
                                  onClick={() =>
                                    setDetailTarget({ resource: active, id: String(row.id) })
                                  }
                                >
                                  Ver detalhes
                                </button>
                                {active === 'qualidade' &&
                                  ['SUPER_ADMIN', 'GERENTE_OBRA', 'ENGENHEIRO', 'AUDITOR'].includes(
                                    session.perfil,
                                  ) && (
                                    <button
                                      className="ws-secondary"
                                      onClick={() => setEvidenceId(String(row.id))}
                                    >
                                      Ver evidências
                                    </button>
                                  )}
                                {active === 'projetos' && ['SUPER_ADMIN', 'GERENTE_OBRA', 'ENGENHEIRO', 'INCORPORADOR'].includes(session.perfil) && (
                                  <button className="ws-secondary" onClick={() => setSetupProjectId(Number(row.id))}>
                                    Configurar obra
                                  </button>
                                )}
                                {rowOperations(active, row, session.perfil).map((action) => (
                                  <button
                                    className="ws-secondary"
                                    key={action.title}
                                    onClick={() => setOperation(action)}
                                  >
                                    {action.title}
                                  </button>
                                ))}
                                {active === 'documentos' &&
                                  [
                                    'SUPER_ADMIN',
                                    'GERENTE_OBRA',
                                    'ENGENHEIRO',
                                    'ARQUITETO',
                                    'AUDITOR',
                                  ].includes(session.perfil) && (
                                    <button
                                      className="ws-secondary"
                                      onClick={() =>
                                        downloadDocument(
                                          String(row.id),
                                          String(row.nomeArquivo),
                                        ).catch((e) => setError(e.message))
                                      }
                                    >
                                      Baixar arquivo
                                    </button>
                                  )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="ws-empty">
                    <FolderKanban size={32} />
                    <h3>
                      {error
                        ? 'Consulta indisponível'
                        : search
                          ? 'Nenhum resultado nesta página'
                          : 'Nenhum registro cadastrado'}
                    </h3>
                    <p>
                      {error
                        ? 'Tente novamente para carregar as informações.'
                        : search
                          ? 'Experimente outro termo ou consulte as próximas páginas.'
                          : 'Os registros aparecerão aqui após o cadastro na sua empresa.'}
                    </p>
                  </div>
                )}
                <footer className="ws-table-footer">
                  <span>
                    {data
                      ? `${data.total} registro(s) · Página ${page + 1} de ${Math.max(1, Math.ceil(data.total / 25))}`
                      : 'Sem consulta concluída'}
                  </span>
                  <div>
                    <button
                      aria-label="Página anterior"
                      disabled={!data || page === 0 || loading}
                      onClick={() => setPage((v) => v - 1)}
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <button
                      aria-label="Próxima página"
                      disabled={!data || (page + 1) * 25 >= data.total || loading}
                      onClick={() => setPage((v) => v + 1)}
                    >
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </footer>
              </section>
              <p className="ws-footnote">
                Informações ausentes são exibidas como “Não informado”. As operações disponíveis
                dependem do seu perfil de acesso.
              </p>
            </>
          )}
        </main>
      </div>
      {creating && (
        <ProjectForm
          onClose={() => setCreating(false)}
          onSaved={(projectId) => {
            setCreating(false);
            setPage(0);
            setRevision((v) => v + 1);
            setNotice('Empreendimento cadastrado com sucesso.');
            setSetupProjectId(projectId);
          }}
        />
      )}
      {setupProjectId !== null && active === 'projetos' && (
        <ProjectSetupWizard
          projectId={setupProjectId}
          role={session.perfil}
          onClose={() => setSetupProjectId(null)}
          onChanged={() => setRevision((v) => v + 1)}
          onNavigate={(target) => {
            setSetupProjectId(null);
            setActive(target);
            setPage(0);
            setRevision((v) => v + 1);
          }}
          onOpenModeler={(projectId, modelId) => {
            setModelTarget({ project: String(projectId), model: modelId });
            setActive('modelador');
          }}
        />
      )}
      {operation && (
        <OperationForm
          definition={operation}
          onClose={() => setOperation(null)}
          onSaved={(message, reauth) => {
            setOperation(null);
            if (reauth) {
              logout();
              setNotice('Senha alterada. Entre novamente com a nova senha.');
            } else {
              setPage(0);
              setRevision((v) => v + 1);
              setNotice(message);
            }
          }}
        />
      )}
      {evidenceId && (
        <QualityEvidence key={evidenceId} id={evidenceId} onClose={() => setEvidenceId(null)} />
      )}
      {detailTarget && (
        <RecordDetails
          key={`${detailTarget.resource}-${detailTarget.id}`}
          target={detailTarget}
          definition={(id) => resources.find((r) => r.id === id)}
          onClose={() => setDetailTarget(null)}
          onDocument={downloadDocument}
          canDownload={[
            'SUPER_ADMIN',
            'GERENTE_OBRA',
            'ENGENHEIRO',
            'ARQUITETO',
            'AUDITOR',
          ].includes(session.perfil)}
          onModel={(project, model) => {
            setDetailTarget(null);
            setModelTarget({ project, model });
            setActive('modelador');
          }}
        />
      )}
    </div>
  );
}

function SetupForm({ onComplete }: { onComplete: () => void }) {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const fields = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (fields.senha !== fields.confirmacao) {
      setError('As senhas precisam ser iguais.');
      return;
    }
    delete fields.confirmacao;
    fields.cnpj = String(fields.cnpj)
      .replace(/[.\/\-\s]/g, '')
      .toUpperCase();
    if (!/^[A-Z0-9]{12}[0-9]{2}$/.test(String(fields.cnpj))) {
      setError('Informe o CNPJ completo, com 14 posições.');
      return;
    }
    setSaving(true);
    try {
      await requestApi('/v1/instalacao', { method: 'POST', body: JSON.stringify(fields) });
      onComplete();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <main className="ws ws-setup">
      <div className="ws-brand">
        <span>360</span>Obra360
      </div>
      <section className="ws-setup-card">
        <p className="ws-eyebrow">PRIMEIRO ACESSO</p>
        <h1>Configure sua empresa</h1>
        <p>
          Cadastre os dados reais da empresa e crie a primeira conta de administrador. As
          informações ficam salvas no banco desta instalação.
        </p>
        <form onSubmit={submit}>
          {error && (
            <div className="ws-alert" role="alert">
              {error}
            </div>
          )}
          <fieldset disabled={saving}>
            <legend>Dados da empresa</legend>
            <label>
              Nome fantasia
              <input name="nomeFantasia" maxLength={150} required autoComplete="organization" />
            </label>
            <label>
              Razão social
              <input name="razaoSocial" maxLength={150} required />
            </label>
            <label>
              CNPJ
              <input name="cnpj" maxLength={18} required />
            </label>
          </fieldset>
          <fieldset disabled={saving}>
            <legend>Conta de administrador</legend>
            <label>
              Seu nome
              <input name="nome" maxLength={100} required autoComplete="name" />
            </label>
            <label>
              E-mail
              <input name="email" type="email" maxLength={120} required autoComplete="username" />
            </label>
            <div className="ws-form-grid">
              <label>
                Senha (mínimo de 12 caracteres)
                <input
                  name="senha"
                  type="password"
                  minLength={12}
                  maxLength={72}
                  required
                  autoComplete="new-password"
                />
              </label>
              <label>
                Confirme a senha
                <input
                  name="confirmacao"
                  type="password"
                  minLength={12}
                  maxLength={72}
                  required
                  autoComplete="new-password"
                />
              </label>
            </div>
          </fieldset>
          <button className="ws-primary" disabled={saving}>
            {saving ? 'Configurando…' : 'Criar empresa e administrador'}
            <ArrowRight size={18} />
          </button>
          <p className="ws-help">
            O cadastro registra os dados informados. Ele não realiza consulta de situação cadastral
            na Receita Federal.
          </p>
        </form>
      </section>
    </main>
  );
}

function ProjectForm({ onClose, onSaved }: { onClose: () => void; onSaved: (projectId: number) => void }) {
  const [startDate, setStartDate] = useState('');
  const [engineers, setEngineers] = useState<{ id: number; nome: string }[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let current = true;
    requestApi<{ id: number; nome: string }[]>('/v1/workspace/engenheiros')
      .then((v) => {
        if (current) setEngineers(v);
      })
      .catch((e) => {
        if (current) setError(e.message);
      })
      .finally(() => {
        if (current) setReady(true);
      });
    return () => {
      current = false;
    };
  }, []);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.getElementById('ws-project-dialog')!;
    const focusable = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),select:not(:disabled)',
        ),
      );
    focusable()[0]?.focus();
    const keydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
      if (e.key === 'Tab') {
        const items = focusable();
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('keydown', keydown);
      previous?.focus();
    };
  }, [saving, onClose]);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fields = new FormData(e.currentTarget);
    const body = Object.fromEntries(fields.entries());
    const dateError = planningError(
      [
        { name: 'dataInicio', label: 'Data de início', type: 'date', futureOnly: true },
        { name: 'dataPrevisaoFim', label: 'Entrega prevista', type: 'date', futureOnly: true },
      ],
      body,
    );
    if (dateError) {
      setError(dateError);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const project = await requestApi<{ id: number }>('/v1/workspace/projetos', { method: 'POST', body: JSON.stringify(body) });
      onSaved(project.id);
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 400
          ? 'Confira os campos e o engenheiro responsável.'
          : (e as Error).message,
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="ws-modal-backdrop">
      <section
        id="ws-project-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ws-form-title"
        className="ws-modal"
      >
        <header>
          <div>
            <p className="ws-eyebrow">NOVO CADASTRO</p>
            <h2 id="ws-form-title">Novo projeto</h2>
          </div>
          <button
            className="ws-icon-button"
            aria-label="Fechar cadastro"
            disabled={saving}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        <form onSubmit={save}>
          {error && (
            <div className="ws-alert" role="alert">
              {error}
            </div>
          )}
          <label>
            Nome do empreendimento
            <input name="nome" required maxLength={150} />
          </label>
          <label>
            Engenheiro responsável
            <select name="engenheiroResponsavelId" required defaultValue="">
              <option value="" disabled>
                {ready ? 'Selecione um engenheiro' : 'Carregando…'}
              </option>
              {engineers.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </select>
          </label>
          {ready && !engineers.length && (
            <p className="ws-help">
              É necessário cadastrar um engenheiro ativo na empresa antes de criar uma obra.
            </p>
          )}
          <div className="ws-form-grid">
            <label>
              Área total (m²)
              <input
                name="areaTotalM2"
                type="number"
                min="0.01"
                max="9999999999.99"
                step="0.01"
                required
              />
            </label>
            <label>
              VGV estimado (R$)
              <input
                name="vgvEstimado"
                type="number"
                min="0"
                max="9999999999999.99"
                step="0.01"
                required
              />
            </label>
            <label>
              Data de início
              <input
                name="dataInicio"
                type="date"
                min={localCalendarDate()}
                onChange={(event) => setStartDate(event.target.value)}
                required
              />
            </label>
            <label>
              Entrega prevista
              <input
                name="dataPrevisaoFim"
                type="date"
                min={startDate > localCalendarDate() ? startDate : localCalendarDate()}
                required
              />
            </label>
          </div>
          <footer>
            <button type="button" className="ws-secondary" disabled={saving} onClick={onClose}>
              Cancelar
            </button>
            <button className="ws-primary" disabled={saving || !engineers.length}>
              {saving ? 'Salvando…' : 'Cadastrar empreendimento'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
