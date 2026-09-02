import React, { useState } from 'react';
import { RoleId, ThemeMode, AuthUser, RegisteredAccount } from '../types';
import { USER_ROLES } from '../data/mockData';
import { 
  KeyRound, ShieldCheck, Lock, Mail, User, 
  ArrowRight, Sparkles, Building, CheckCircle2, Sun, Moon, Eye, EyeOff, Check, AlertTriangle, UserX 
} from 'lucide-react';

interface LoginViewProps {
  registeredAccounts: RegisteredAccount[];
  theme: ThemeMode;
  onToggleTheme: () => void;
  onLoginSuccess: (user: AuthUser, remember: boolean) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  registeredAccounts,
  theme,
  onToggleTheme,
  onLoginSuccess
}) => {
  const isDark = theme === 'dark';

  // Load remembered credentials if any
  const rememberedData = (() => {
    try {
      const saved = localStorage.getItem('obra360_remembered_credentials');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const initialRole: RoleId = (rememberedData?.role && USER_ROLES[rememberedData.role as RoleId]) 
    ? (rememberedData.role as RoleId) 
    : 'ENGENHEIRO';

  const [selectedRole, setSelectedRole] = useState<RoleId>(initialRole);

  const [email, setEmail] = useState<string>(
    rememberedData?.email || USER_ROLES[selectedRole]?.defaultEmail || 'carlos.engenheiro@obra360.com'
  );

  const [password, setPassword] = useState<string>('Obra360@2026');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(rememberedData ? true : true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const roleObj = USER_ROLES[selectedRole];

  const handleSelectQuickRole = (roleId: RoleId) => {
    setSelectedRole(roleId);
    setErrorMessage(null);

    const accountForRole = registeredAccounts.find((a) => a.role === roleId);
    if (accountForRole) {
      setEmail(accountForRole.email);
    } else {
      setEmail(USER_ROLES[roleId].defaultEmail);
    }
    setPassword('Obra360@2026');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const existingAccount = registeredAccounts.find(
      (acc) => acc.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!existingAccount) {
      setErrorMessage(
        `Acesso Negado: O e-mail "${email}" não possui cadastro ativo no sistema. Apenas usuários contratados/cadastrados pelo Gerente de Obras ou Admin podem fazer login.`
      );
      return;
    }

    if (existingAccount.status !== 'ATIVO') {
      setErrorMessage(`Acesso Bloqueado: A conta "${email}" está inativa ou suspensa.`);
      return;
    }

    setIsLoading(true);

    if (rememberMe) {
      localStorage.setItem(
        'obra360_remembered_credentials',
        JSON.stringify({ email: existingAccount.email, role: existingAccount.role })
      );
    } else {
      localStorage.removeItem('obra360_remembered_credentials');
    }

    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(
        {
          email: existingAccount.email,
          name: existingAccount.name,
          role: existingAccount.role,
          token: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(existingAccount.email)}`
        },
        rememberMe
      );
    }, 800);
  };

  const cardBg = isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-zinc-200';
  const innerBg = isDark ? 'bg-[#121214]' : 'bg-zinc-50';
  const textTitle = isDark ? 'text-white' : 'text-zinc-900';
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-500';

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center p-3 sm:p-6 lg:p-8 font-['Plus_Jakarta_Sans',sans-serif] transition-colors ${
      isDark ? 'bg-[#121214] text-zinc-100' : 'bg-slate-100 text-zinc-900'
    }`}>
      
      {/* Top Right Theme Toggle */}
      <div className="w-full max-w-4xl flex justify-end mb-3 sm:mb-0">
        <button
          onClick={onToggleTheme}
          className={`p-2 sm:p-2.5 rounded-2xl border flex items-center gap-1.5 sm:gap-2 text-xs font-bold transition ${
            isDark ? 'bg-[#18181b] border-[#27272a] text-amber-400 hover:bg-[#27272a]' : 'bg-white border-zinc-300 text-orange-600 hover:bg-zinc-100'
          }`}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-orange-600" />}
          <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
        </button>
      </div>

      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 my-auto">
        
        {/* Left Card: Branding & Quick Role Selector */}
        <div className={`border rounded-3xl p-5 sm:p-6 lg:p-8 flex flex-col justify-between shadow-2xl space-y-4 sm:space-y-6 ${cardBg}`}>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20 font-black text-xl sm:text-2xl text-white tracking-wider shrink-0">
                360
              </div>
              <div>
                <h1 className={`font-extrabold text-xl sm:text-2xl ${textTitle}`}>Obra360</h1>
                <p className="text-[11px] sm:text-xs text-orange-500 font-bold">Plataforma B2B/B2C da Construção & Imóveis</p>
              </div>
            </div>

            <p className={`text-xs leading-relaxed ${textMuted}`}>
              Acesso exclusivo para <strong>atores do ecossistema corporativo</strong> (Incorporadores, Arquitetos, Construtores, Fornecedores B2B, Corretores, Investidores e Clientes).
            </p>
          </div>

          {/* Quick Demo Role Selector Grid */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className={`text-xs font-bold flex items-center gap-1.5 ${textMuted}`}>
                <Sparkles className="w-3.5 h-3.5 text-orange-500" /> Contas do Ecossistema ({registeredAccounts.length}):
              </label>
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 max-h-[220px] sm:max-h-[260px] overflow-y-auto pr-1">
              {Object.values(USER_ROLES).map((role) => {
                const isSelected = selectedRole === role.id;
                const regAcc = registeredAccounts.find((a) => a.role === role.id);
                
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleSelectQuickRole(role.id as RoleId)}
                    className={`p-2.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-orange-600 text-white border-orange-500 shadow-md ring-2 ring-orange-500/40'
                        : isDark ? 'bg-[#121214] border-[#27272a] text-zinc-300 hover:border-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-800 hover:border-zinc-400'
                    }`}
                  >
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full w-fit mb-1 ${
                      isSelected ? 'bg-white/20 text-white' : role.badgeColor
                    }`}>
                      {role.level.split(' - ')[0]}
                    </span>
                    <span className="font-bold text-xs leading-snug">{role.title}</span>
                    {regAcc && (
                      <span className={`text-[10px] font-mono truncate pt-1 opacity-80 ${isSelected ? 'text-white' : textMuted}`}>
                        {regAcc.name.split(' ')[0]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`p-2.5 sm:p-3 rounded-2xl border text-[10px] sm:text-[11px] font-mono flex items-center gap-2 ${innerBg}`}>
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className={textMuted}>Autenticação restrita a usuários previamente cadastrados.</span>
          </div>
        </div>

        {/* Right Card: Login Form */}
        <div className={`border rounded-3xl p-5 sm:p-6 lg:p-8 flex flex-col justify-center shadow-2xl space-y-4 sm:space-y-6 ${cardBg}`}>
          
          <div className="space-y-1">
            <h2 className={`font-extrabold text-lg sm:text-xl ${textTitle}`}>Acessar Plataforma</h2>
            <p className={`text-xs ${textMuted}`}>Entre com um e-mail previamente cadastrado pelo Gerente de Obras</p>
          </div>

          {/* Error Alert Box when user is NOT registered */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5 animate-fadeIn">
              <UserX className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Acesso Não Autorizado</p>
                <p className="text-[11px] leading-relaxed opacity-90">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
            
            {/* Selected Role Info Box */}
            <div className={`p-3 rounded-2xl border space-y-1 ${innerBg}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-orange-500 uppercase font-mono">Perfil de Acesso:</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleObj.badgeColor}`}>
                  {roleObj.department}
                </span>
              </div>
              <p className={`font-bold text-xs ${textTitle}`}>{roleObj.title}</p>
              <p className={`text-[11px] ${textMuted}`}>{roleObj.level}</p>
            </div>

            {/* Email Field */}
            <div>
              <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>E-mail Cadastrado:</label>
              <div className="relative">
                <Mail className={`w-4 h-4 absolute left-3.5 top-3 ${textMuted}`} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage(null);
                  }}
                  required
                  placeholder="seu.email@obra360.com"
                  className={`w-full text-xs pl-10 pr-4 py-2.5 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono ${
                    isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                  }`}
                />
              </div>
            </div>

            {/* Password Field with Eye Toggle */}
            <div>
              <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>Senha Corporativa:</label>
              <div className="relative flex items-center">
                <Lock className={`w-4 h-4 absolute left-3.5 ${textMuted}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`w-full text-xs pl-10 pr-10 py-2.5 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono ${
                    isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 p-1 rounded-lg hover:bg-zinc-500/10 transition ${textMuted}`}
                  title={showPassword ? 'Ocultar Senha' : 'Visualizar Senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-orange-500" /> : <Eye className="w-4 h-4 text-zinc-400" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox Box */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <label
                onClick={() => setRememberMe(!rememberMe)}
                className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold select-none"
              >
                <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition shrink-0 ${
                  rememberMe
                    ? 'bg-orange-600 border-orange-500 text-white'
                    : isDark ? 'bg-[#121214] border-[#27272a]' : 'bg-zinc-100 border-zinc-300'
                }`}>
                  {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className={isDark ? 'text-zinc-300' : 'text-zinc-700'}>
                  Lembrar meus dados
                </span>
              </label>

              <span className={`text-[11px] hover:underline cursor-pointer ${textMuted}`}>
                Esqueceu a senha?
              </span>
            </div>

            {/* Primary Google Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 rounded-2xl border font-bold text-xs flex items-center justify-center gap-3 transition-all duration-300 shadow-md group mt-2 ${
                isDark 
                  ? 'bg-[#121214] text-white border-[#27272a] hover:bg-gradient-to-r hover:from-orange-600 hover:to-amber-500 hover:border-orange-500 hover:shadow-lg hover:shadow-orange-600/30' 
                  : 'bg-white text-zinc-800 border-zinc-300 shadow-zinc-200 hover:bg-gradient-to-r hover:from-orange-600 hover:to-amber-500 hover:border-orange-500 hover:text-white hover:shadow-lg hover:shadow-orange-600/30'
              }`}
            >
              {isLoading ? (
                <span>Validando Conta Cadastrada...</span>
              ) : (
                <>
                  <div className={`p-1 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    isDark ? 'bg-[#18181b]' : 'bg-white'
                  }`}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                  </div>
                  <span className="font-extrabold text-xs sm:text-sm transition-colors duration-300">Fazer login com o Google</span>
                </>
              )}
            </button>

          </form>

        </div>

      </div>

    </div>
  );
};
