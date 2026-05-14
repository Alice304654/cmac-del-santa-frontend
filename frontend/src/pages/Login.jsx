function Login() {
  return (
    <div className="bg-blue-900 h-screen flex items-center justify-center">
      <div className="bg-white p-10 rounded-xl shadow-xl w-96">

        <h1 className="text-3xl font-bold text-blue-900 text-center">
          CMAC Del Santa
        </h1>

        <p className="text-gray-500 text-center mt-2">
          Sistema Home Banking
        </p>

        <form className="mt-6">

          <input
            type="email"
            placeholder="Correo electrónico"
            className="w-full border p-3 rounded mb-4"
          />

          <input
            type="password"
            placeholder="Contraseña"
            className="w-full border p-3 rounded mb-4"
          />

          <button
            className="w-full bg-sky-500 text-white p-3 rounded"
          >
            Ingresar
          </button>

        </form>

      </div>
    </div>
  );
}

export default Login;