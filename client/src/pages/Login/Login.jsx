import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

import AuthShell from "../../components/ui/AuthShell";
import AuthCard from "../../components/ui/AuthCard";
import { login } from "../../utils/APIRoutes";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [value, setvalue] = useState({
    username: "",
    password: "",
  });

  useEffect(() => {
    if (localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
      navigate("/");
    }
  });

  const handleChange = (e) => {
    setError("");
    setvalue((prevDate) => {
      return {
        ...prevDate,
        [e.target.name]: e.target.value,
      };
    });
  };

  const handleSumbit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(login, {
        username: value.username,
        password: value.password,
      });
      if (data.status === false) {
        setError(data.message);
      } else {
        localStorage.setItem(
          process.env.REACT_APP_LOCALHOST_KEY,
          JSON.stringify(data.user)
        );
        setvalue({ username: "", password: "" });
        navigate("/");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not reach the server. Is it running on port 5000?"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <AuthCard>
        <h2 className="text-[26px] font-bold tracking-tight text-fg">
          Welcome back
        </h2>
        <p className="mt-1.5 text-[15px] text-fg-muted">
          Sign in to pick up where you left off.
        </p>

        <form onSubmit={handleSumbit} className="mt-7">
          <div className="space-y-5">
            <div>
              <label htmlFor="login-username" className="label">
                Username or email
              </label>
              <input
                id="login-username"
                type="text"
                placeholder="you@example.com"
                name="username"
                autoComplete="username"
                onChange={(e) => handleChange(e)}
                value={value.username}
                className={`field ${error ? "field-invalid" : ""}`}
              />
            </div>

            <div>
              <label htmlFor="login-password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  name="password"
                  autoComplete="current-password"
                  onChange={(e) => handleChange(e)}
                  value={value.password}
                  className={`field pr-12 ${error ? "field-invalid" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="material-symbols-rounded absolute right-1.5 top-1/2 flex h-8 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[20px] text-fg-faint transition-colors hover:text-fg"
                >
                  {showPassword ? "visibility_off" : "visibility"}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 flex animate-reveal-up items-start gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
            >
              <span className="material-symbols-rounded text-[18px] leading-5">
                error
              </span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-7 w-full py-3.5"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <span className="material-symbols-rounded text-[19px]">
                  arrow_forward
                </span>
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-fg-muted">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-accent-400 underline-offset-4 transition-colors hover:text-aqua-300 hover:underline"
          >
            Create one
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
};

export default Login;
