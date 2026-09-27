import { IconArrowLeft } from "@/components/icons";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="role-login-page">
      <div className="role-login-scene" aria-hidden="true" />
      <main className="role-login-main">
        <div className="readiness-card notfound-card">
          <span className="readiness-eyebrow">Error 404</span>
          <h1>Page not found</h1>
          <p>
            Sorry, the page you are looking for doesn’t exist. It may have been
            moved or deleted.
          </p>
          <div className="readiness-actions notfound-actions">
            <button
              className="role-login-submit"
              onClick={() => setLocation("/")}
            >
              Back to SafeShift <IconArrowLeft />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
