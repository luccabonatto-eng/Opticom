import { api } from '../../api/client.js';
import { useState } from 'react';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validar campos
    if (!email || !pass) {
      setError('Email e senha são obrigatórios');
      setLoading(false);
      return;
    }

    // Tentar login na API
    const result = await api.login(email, pass);

    if (result.success) {
      setTimeout(onLogin, 500);
    } else {
      setError(result.error || 'Erro ao fazer login');
      setLoading(false);
    }
  };
  return (
    <>
      <div className="min-h-screen flex">
        {/* Left panel — branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-950 via-blue-800 to-indigo-900 flex-col items-center justify-center p-12 relative overflow-hidden">
          {/* background circles */}
          <div className="absolute top-[-80px] left-[-80px] w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute bottom-[-60px] right-[-60px] w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full bg-blue-400/10" />
          {/* Logo mark */}
          <div className="relative mb-10 flex flex-col items-center">
            <img
              src="https://opticomservice.com.br/wp-content/uploads/2025/01/Logo-opticom-700.png"
              alt="Opticom"
              className="h-20 object-contain mb-6"
            />
          </div>
          <div className="text-center max-w-xs space-y-3">
            <p className="text-white/90 text-lg font-semibold leading-snug">
              Gestão integrada de serviços de energia e telecomunicações
            </p>
            <p className="text-blue-300 text-sm">OS · Contratos · Financeiro · Estoque · Aprovações</p>
          </div>
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6 text-blue-400 text-xs">
            <span>CNPJ 04.176.164/0001-25</span>
            <span>·</span>
            <span>Plano Professional</span>
          </div>
        </div>
        {/* Right panel — form */}
        <div className="flex-1 bg-white flex items-center justify-center p-8">
          <div className="w-full max-w-sm">
            {/* Mobile logo */}
            <div className="lg:hidden flex flex-col items-center mb-8">
              <img
                src="https://opticomservice.com.br/wp-content/uploads/2025/01/Logo-opticom-700.png"
                alt="Opticom"
                className="h-12 object-contain mb-3"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Bem-vindo de volta</h2>
            <p className="text-sm text-gray-400 mb-6">Faça login para acessar o sistema</p>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
                <input
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center justify-between text-sm pt-1">
                <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded accent-blue-600" />
                  Lembrar-me
                </label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-blue-600 hover:underline text-xs"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 text-sm mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Autenticando...
                  </span>
                ) : (
                  'Entrar no sistema'
                )}
              </button>
            </form>
            <p className="text-xs text-gray-300 text-center mt-8">© 2026 Opticom Telecom · CNPJ 04.176.164/0001-25</p>
          </div>
        </div>
      </div>
      {forgotOpen && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setForgotOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-gray-800">Redefinir Senha</h3>
            <p className="text-sm text-gray-600">
              Para redefinir sua senha, solicite ao administrador do sistema em{' '}
              <strong>Configurações → Usuários → Editar</strong>.
            </p>
            <p className="text-sm text-gray-500">
              O administrador pode definir uma nova senha diretamente pelo painel.
            </p>
            <button
              onClick={() => setForgotOpen(false)}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export { LoginPage };
