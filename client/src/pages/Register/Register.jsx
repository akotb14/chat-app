import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

import AuthShell from "../../components/ui/AuthShell";
import AuthCard from "../../components/ui/AuthCard";
import { register } from "../../utils/APIRoutes";

const Register = () => {
  const navigate = useNavigate();
  const fileInput = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");
  const [value, setvalue] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    image: "",
  });

  useEffect(() => {
    if (localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
      navigate("/");
    }
  });

  // Object URLs leak unless revoked; the effect ties the URL to the file and
  // survives StrictMode's double-invoke (useMemo would orphan one).
  useEffect(() => {
    if (!value.image) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(value.image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value.image]);

  const handleChange = (e) => {
    const fun = () => {
      if (e.target.name === "image") {
        return e.target.files[0];
      } else {
        return e.target.value;
      }
    };
    setError("");
    setvalue((prevDate) => {
      return {
        ...prevDate,
        [e.target.name]: fun(),
      };
    });
  };

  const handleSumbit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    let formData = new FormData();
    formData.append("username", value.username);
    formData.append("email", value.email);
    formData.append("password", value.password);
    formData.append("confirmPassword", value.confirmPassword);
    // Omit rather than send an empty field — the server falls back to its
    // default avatar whenever req.file is absent.
    if (value.image) formData.append("image", value.image);

    try {
      const { data } = await axios.post(register, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.status === false) {
        setError(data.message);
      } else {
        localStorage.setItem(
          process.env.REACT_APP_LOCALHOST_KEY,
          JSON.stringify(data.user)
        );
        setvalue({
          username: "",
          email: "",
          password: "",
          confirmPassword: "",
          image: "",
        });
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

  // Mirrors the server's rules so the user is not round-tripped to learn them.
  const mismatch =
    value.confirmPassword.length > 0 && value.password !== value.confirmPassword;
  const strength = [
    value.password.length >= 6,
    value.password.length >= 10,
    /[A-Z]/.test(value.password),
    /[0-9!@#$%^&*]/.test(value.password),
  ].filter(Boolean).length;
  const strengthMeta = [
    { label: "Too short", bar: "bg-rose-500", text: "text-rose-400" },
    { label: "Weak", bar: "bg-rose-500", text: "text-rose-400" },
    { label: "Fair", bar: "bg-amber-400", text: "text-amber-300" },
    { label: "Good", bar: "bg-lime-400", text: "text-lime-300" },
    { label: "Strong", bar: "bg-emerald-400", text: "text-emerald-300" },
  ][value.password ? strength : 0];

  return (
    <AuthShell>
      <AuthCard>
        <h2 className="text-[26px] font-bold tracking-tight text-fg">
          Create your account
        </h2>
        <p className="mt-1.5 text-[15px] text-fg-muted">
          Free, and takes about a minute.
        </p>

        <form onSubmit={handleSumbit} className="mt-7">
          {/* Avatar picker */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/[0.1] bg-night-800/80 shadow-rim transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-500/50 hover:shadow-glow"
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Selected avatar preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="material-symbols-rounded flex h-full w-full items-center justify-center text-[24px] text-fg-faint transition-colors group-hover:text-accent-400">
                  add_a_photo
                </span>
              )}
            </button>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-fg">Profile photo</p>
              <p className="truncate text-[13px] text-fg-muted">
                {value.image ? value.image.name : "Optional — PNG or JPG"}
              </p>
              {value.image && (
                <button
                  type="button"
                  onClick={() => {
                    setvalue((p) => ({ ...p, image: "" }));
                    if (fileInput.current) fileInput.current.value = "";
                  }}
                  className="mt-0.5 text-[13px] font-medium text-rose-400 underline-offset-2 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              onChange={(e) => handleChange(e)}
              name="image"
              className="hidden"
            />
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label htmlFor="reg-username" className="label">
                Username
              </label>
              <input
                id="reg-username"
                type="text"
                placeholder="3–20 characters"
                name="username"
                autoComplete="username"
                onChange={(e) => handleChange(e)}
                value={value.username}
                className="field"
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="label">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                placeholder="you@example.com"
                name="email"
                autoComplete="email"
                onChange={(e) => handleChange(e)}
                value={value.email}
                className="field"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  name="password"
                  autoComplete="new-password"
                  onChange={(e) => handleChange(e)}
                  value={value.password}
                  className="field pr-12"
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
              {value.password && (
                <div className="mt-2.5 flex items-center gap-2.5">
                  <div className="flex h-1 flex-1 gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={`h-full flex-1 rounded-full transition-colors duration-300 ${
                          i < strength ? strengthMeta.bar : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                  <span
                    className={`w-[62px] text-right text-[12px] font-medium ${strengthMeta.text}`}
                  >
                    {strengthMeta.label}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="reg-confirm" className="label">
                Confirm password
              </label>
              <input
                id="reg-confirm"
                type={showPassword ? "text" : "password"}
                placeholder="Repeat your password"
                name="confirmPassword"
                autoComplete="new-password"
                onChange={(e) => handleChange(e)}
                value={value.confirmPassword}
                className={`field ${mismatch ? "field-invalid" : ""}`}
              />
              {mismatch && (
                <p className="mt-1.5 text-[13px] text-rose-400">
                  Passwords do not match.
                </p>
              )}
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
                Creating account…
              </>
            ) : (
              <>
                Create account
                <span className="material-symbols-rounded text-[19px]">
                  arrow_forward
                </span>
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-fg-muted">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-accent-400 underline-offset-4 transition-colors hover:text-aqua-300 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
};

export default Register;
