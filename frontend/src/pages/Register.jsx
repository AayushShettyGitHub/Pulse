import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api/auth";
import { Lock, User, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }
    setLoading(true);
    setError("");
    try {
      await register(username, password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="login-card"
      >
        <div className="login-header">
          <div className="logo-icon">P</div>
          <h1>Create Account</h1>
          <p>Join the Pulse community</p>
        </div>

        {success ? (
          <div className="success-state">
            <CheckCircle className="success-icon" size={48} />
            <h2>Success!</h2>
            <p>Registration complete. Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            
            <div className="input-group">
              <User className="input-icon" size={18} />
              <input
                id="reg-username"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <Lock className="input-icon" size={18} />
              <input
                id="reg-password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <Lock className="input-icon" size={18} />
              <input
                id="confirm-password"
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="login-button">
              {loading ? <Loader2 className="animate-spin" /> : <>Register <ArrowRight size={18} /></>}
            </button>
          </form>
        )}

        {!success && (
          <div className="login-footer">
            Already have an account? <Link to="/login">Login</Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
