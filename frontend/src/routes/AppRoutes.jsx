import {
  Routes,
  Route,
  useNavigate,
  Link,
  Navigate
} from "react-router-dom";

import {
  useState,
  useEffect
} from "react";

import axios from "axios";

function RutaProtegida({ children }) {

  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" />;
  }

  return children;
}

function Login() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const iniciarSesion = async () => {

    try {

      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password
        }
      );

      localStorage.setItem(
        "token",
        response.data.token
      );

      localStorage.setItem(
        "usuario",
        JSON.stringify(response.data.usuario)
      );

      alert("Login exitoso");

      navigate("/dashboard");

    } catch (error) {

      alert("Credenciales incorrectas");

      console.log(error);

    }

  };

  return (
    <div className="bg-blue-900 h-screen flex items-center justify-center">

      <div className="bg-white p-10 rounded-xl shadow-xl w-96">

        <h1 className="text-3xl font-bold text-blue-900 text-center">
          CMAC Del Santa
        </h1>

        <p className="text-gray-500 text-center mt-2">
          Sistema Home Banking
        </p>

        <div className="mt-6">

          <input
            type="email"
            placeholder="Correo electrónico"
            className="w-full border p-3 rounded mb-4"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Contraseña"
            className="w-full border p-3 rounded mb-4"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={iniciarSesion}
            className="w-full bg-sky-500 text-white p-3 rounded"
          >
            Ingresar
          </button>

          <Link
            to="/register"
            className="block text-center mt-4 text-sky-600"
          >
            Crear cuenta
          </Link>

        </div>

      </div>

    </div>
  );
}

function Register() {

  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const registrarUsuario = async () => {

    try {

      await axios.post(
        "http://localhost:5000/api/auth/register",
        {
          nombre,
          email,
          password
        }
      );

      alert("Usuario registrado");

      navigate("/");

    } catch (error) {

      alert("Error al registrar");

      console.log(error);

    }

  };

  return (
    <div className="bg-gray-100 h-screen flex items-center justify-center">

      <div className="bg-white p-10 rounded-xl shadow-xl w-96">

        <h1 className="text-3xl font-bold text-blue-900 text-center">
          Registro
        </h1>

        <div className="mt-6">

          <input
            type="text"
            placeholder="Nombre"
            className="w-full border p-3 rounded mb-4"
            onChange={(e) => setNombre(e.target.value)}
          />

          <input
            type="email"
            placeholder="Correo"
            className="w-full border p-3 rounded mb-4"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Contraseña"
            className="w-full border p-3 rounded mb-4"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={registrarUsuario}
            className="w-full bg-blue-900 text-white p-3 rounded"
          >
            Registrarse
          </button>

          <Link
            to="/"
            className="block text-center mt-4 text-sky-600"
          >
            Volver al login
          </Link>

        </div>

      </div>

    </div>
  );
}

function Dashboard() {

  const usuario = JSON.parse(
    localStorage.getItem("usuario")
  );

  const navigate = useNavigate();

  const [transferencias, setTransferencias] = useState([]);

  useEffect(() => {

    obtenerTransferencias();

  }, []);

  const obtenerTransferencias = async () => {

    try {

      const response = await axios.get(
        "http://localhost:5000/api/transfers"
      );

      setTransferencias(response.data);

    } catch (error) {

      console.log(error);

    }

  };

  const cerrarSesion = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    navigate("/");

  };

  return (
    <div className="flex h-screen">

      <div className="w-64 bg-blue-900 text-white p-5">

        <h1 className="text-2xl font-bold mb-10">
          CMAC Del Santa
        </h1>

        <ul className="space-y-4">

          <li>Dashboard</li>
          <li>Ahorros</li>
          <li>Créditos</li>
          <li>Transferencias</li>
          <li>Pagos</li>
          <li>Perfil</li>

        </ul>

        <button
          onClick={cerrarSesion}
          className="mt-10 bg-red-500 px-4 py-2 rounded"
        >
          Cerrar Sesión
        </button>

      </div>

      <div className="flex-1 bg-gray-100 p-10 overflow-auto">

        <h1 className="text-4xl font-bold text-blue-900">
          Bienvenido {usuario?.nombre}
        </h1>

        <div className="grid grid-cols-3 gap-6 mt-10">

          <div className="bg-white p-6 rounded-xl shadow">

            <h2 className="text-gray-500">
              Saldo Disponible
            </h2>

            <p className="text-3xl font-bold text-green-600 mt-2">
              S/ {usuario?.saldo || 0}
            </p>

          </div>

          <div className="bg-white p-6 rounded-xl shadow">

            <h2 className="text-gray-500">
              Créditos Activos
            </h2>

            <p className="text-3xl font-bold text-blue-600 mt-2">
              2
            </p>

          </div>

          <div className="bg-white p-6 rounded-xl shadow">

            <h2 className="text-gray-500">
              Transferencias
            </h2>

            <p className="text-3xl font-bold text-sky-600 mt-2">
              {transferencias.length}
            </p>

          </div>

        </div>

        <div className="bg-white mt-10 p-6 rounded-xl shadow">

          <h2 className="text-2xl font-bold text-blue-900 mb-6">
            Últimas Transferencias
          </h2>

          <table className="w-full">

            <thead>

              <tr className="text-left border-b">

                <th className="p-2">Emisor</th>
                <th className="p-2">Receptor</th>
                <th className="p-2">Monto</th>

              </tr>

            </thead>

            <tbody>

              {transferencias.map((transferencia) => (

                <tr
                  key={transferencia._id}
                  className="border-b"
                >

                  <td className="p-2">
                    {transferencia.emisor}
                  </td>

                  <td className="p-2">
                    {transferencia.receptor}
                  </td>

                  <td className="p-2 text-green-600 font-bold">
                    S/ {transferencia.monto}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>

      <Route
        path="/"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/dashboard"
        element={
          <RutaProtegida>
            <Dashboard />
          </RutaProtegida>
        }
      />

    </Routes>
  );
}

export default AppRoutes;